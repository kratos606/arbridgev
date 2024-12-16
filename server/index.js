const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https'); // HTTPS module for secure server
const http = require('http');
const bodyParser = require('body-parser');
const { NodeIO, Bounds } = require('@gltf-transform/core'); // Import Bounds from @gltf-transform/core
const crypto = require('crypto');

// Load SSL certificates
const privateKey = fs.readFileSync(path.resolve(__dirname, '.cert', 'privateKey.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, '.cert', 'certificate.crt'), 'utf8');
const ca = fs.readFileSync(path.resolve(__dirname, '.cert', 'ca_bundle.crt'), 'utf8');

// Define the SSL credentials
const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: './models',
  filename: function (req, file, cb) {
    cb(null, 'glb-' + Date.now() + path.extname(file.originalname));
  },
});

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100MB
}).single('model'); // The name of the form field containing the file

// Serve static files from the 'public' directory
app.use('/models', express.static('./models'));

app.post('/resize', async (req, res) => {
  try {
    const { modelName, scale } = req.body; // Expecting modelName and scale in the request body

    if (!modelName || !scale) {
      return res.status(400).json({ error: 'modelName and scale are required in the request body.' });
    }

    // Ensure modelName does not contain any path traversal characters
    if (modelName.includes('/') || modelName.includes('\\') || modelName.includes('..')) {
      return res.status(400).json({ error: 'Invalid modelName specified.' });
    }

    const modelPath = path.join(__dirname, 'models', `${modelName}.glb`);

    // Check if the model file exists in the 'models' directory
    if (!fs.existsSync(modelPath)) {
      return res.status(404).json({ error: 'Model file not found.' });
    }

    // Initialize desiredSize
    let desiredSize;
    if (typeof scale === 'number') {
      // Uniform scaling for all dimensions
      desiredSize = [scale, scale, scale];
    } else if (typeof scale === 'object' && scale !== null) {
      const { width, height, depth } = scale;
      if (
        typeof width !== 'number' ||
        typeof height !== 'number' ||
        typeof depth !== 'number'
      ) {
        return res.status(400).json({ error: 'Size object must have numeric width, height, and depth.' });
      }
      desiredSize = [width, height, depth];
    } else {
      return res.status(400).json({ error: 'Scale must be a number or an object with width, height, and depth.' });
    }

    // Generate a unique hash based on model name and scale factors
    const hash = crypto.createHash('md5').update(modelName + JSON.stringify(desiredSize)).digest('hex');
    const outputFilename = `${modelName}_${hash}.glb`;
    const outputPath = path.join(__dirname, 'models', 'resized', outputFilename);

    // Check if the model with the same scaling already exists
    if (fs.existsSync(outputPath)) {
      // If it exists, return the link
      const fileUrl = `/models/resized/${outputFilename}`;
      return res.json({ url: fileUrl });
    }

    // Read the GLTF file
    const io = new NodeIO();
    const document = await io.read(modelPath);

    // Iterate over each scene in the GLTF
    for (const scene of document.getRoot().listScenes()) {
      // Create a new parent node using document.createNode()
      const parent = document.createNode('parent');

      // Get all the children of the scene
      const children = scene.listChildren();

      // Remove all children from the scene and add them to the new parent node
      children.forEach((child) => {
        scene.removeChild(child);
        parent.addChild(child);
      });

      // Add the parent node to the scene
      scene.addChild(parent);

      // Set the scale to the parent node to resize the whole scene
      parent.setScale(desiredSize);
    }

    // Ensure the output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Write the updated GLTF file
    await io.write(outputPath, document);

    // Return the link to the resized model
    const fileUrl = `/models/resized/${outputFilename}`;
    res.json({ url: fileUrl });
  } catch (error) {
    console.error('Error processing GLTF:', error);
    res.status(500).json({ error: 'An error occurred while processing the model.' });
  }
});

// Create HTTPS server
const httpServer = https.createServer(credentials, app);

// Start the server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`started on port ${PORT}`));

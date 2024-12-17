const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser');
const { NodeIO } = require('@gltf-transform/core');
const { getBounds } = require('@gltf-transform/functions');
const crypto = require('crypto');

// Load SSL certificates
const privateKey = fs.readFileSync(path.resolve(__dirname, '.cert', 'privateKey.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, '.cert', 'certificate.crt'), 'utf8');
const ca = fs.readFileSync(path.resolve(__dirname, '.cert', 'ca_bundle.crt'), 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Modified storage to use original filename
const storage = multer.diskStorage({
  destination: './models',
  filename: function (req, file, cb) {
    // Just use the original filename
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('model');

app.use('/models', express.static('./models'));

// Check if model exists
app.get('/check-model/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'models', filename);
  
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, url: `/models/${filename}` });
  } else {
    res.json({ exists: false });
  }
});

// Upload route
app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: 'Multer error occurred: ' + err.message });
        } else if (err) {
            return res.status(500).json({ error: 'An unknown error occurred during file upload.' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileUrl = `/models/${req.file.filename}`;
        res.json({ message: 'File uploaded successfully', url: fileUrl });
    });
});

app.post('/resize', async (req, res) => {
    try {
        const { modelName, desiredSize } = req.body;

        if (!modelName || !desiredSize) {
            return res.status(400).json({ error: 'modelName and desiredSize are required in the request body.' });
        }

        if (modelName.includes('/') || modelName.includes('\\') || modelName.includes('..')) {
            return res.status(400).json({ error: 'Invalid modelName specified.' });
        }

        if (typeof desiredSize !== 'object' || desiredSize === null ||
            typeof desiredSize.width !== 'number' ||
            typeof desiredSize.height !== 'number' ||
            typeof desiredSize.depth !== 'number') {
            return res.status(400).json({ error: 'Desired size must be an object with numeric width, height, and depth.' });
        }

        const modelPath = path.join(__dirname, 'models', `${modelName}.glb`);

        if (!fs.existsSync(modelPath)) {
            return res.status(404).json({ error: 'Model file not found.' });
        }
        const io = new NodeIO();
        const document = await io.read(modelPath);


        let originalWidth, originalHeight, originalDepth;
        //We get the bounds by getting it from each scene
        for (const scene of document.getRoot().listScenes()) {
          const bbox = getBounds(scene);
             originalWidth = bbox.max[0] - bbox.min[0];
             originalHeight = bbox.max[1] - bbox.min[1];
             originalDepth = bbox.max[2] - bbox.min[2];
              break;
          }


        // Calculate the scale factors
        const scaleX = desiredSize.width / originalWidth;
        const scaleY = desiredSize.height / originalHeight;
        const scaleZ = desiredSize.depth / originalDepth;
        const calculatedScale = [scaleX, scaleY, scaleZ];


        // Generate a unique hash based on model name and desired dimensions
        const hash = crypto.createHash('md5').update(modelName + JSON.stringify(calculatedScale)).digest('hex');
        const outputFilename = `${modelName}_${hash}.glb`;
        const outputPath = path.join(__dirname, 'models', 'resized', outputFilename);

        if (fs.existsSync(outputPath)) {
            const fileUrl = `/models/resized/${outputFilename}`;
            return res.json({ url: fileUrl });
        }

        for (const scene of document.getRoot().listScenes()) {

            const parent = document.createNode('parent');
            const children = scene.listChildren();

            children.forEach((child) => {
                scene.removeChild(child);
                parent.addChild(child);
            });

            scene.addChild(parent);

            parent.setScale(calculatedScale);
        }


        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        await io.write(outputPath, document);
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

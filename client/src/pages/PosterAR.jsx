import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as THREE from 'three';
import '@google/model-viewer';

export default function PosterAR() {
  const { image } = useParams();
  const navigate = useNavigate();
  const rootContainerRef = useRef(null);
  const modelViewerRef = useRef(null);
  const arButtonRef = useRef(null);
  const [modelURL, setModelURL] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect non-mobile users to the standard poster view
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(
      navigator.userAgent
    );
    if (!isMobile) {
      navigate(`/poster/${image}`);
    }
  }, [image, navigate]);

  useEffect(() => {
    // Set initial AR status
    if (rootContainerRef.current) {
      rootContainerRef.current.setAttribute('data-ar-status', 'pending');
    }
  }, []);

  useEffect(() => {
    // Load the image, create GLB, upload to server, and get the model URL
    async function processImage() {
      setIsProcessing(true);
      try {
        // Load the image
        const imageURL = `/images/${image}`;
        const texture = await loadTexture(imageURL);

        // Create GLB model
        const glb = await createGLBModel(texture);

        // Upload GLB to server
        const uploadResult = await uploadGLB(glb, `${image}.glb`);

        // Set the model URL
        setModelURL(uploadResult.url);
      } catch (error) {
        console.error('Error processing image:', error);
      } finally {
        setIsProcessing(false);
      }
    }

    processImage();
  }, [image]);

  // Function to load texture
  function loadTexture(url) {
    return new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(
        url,
        (texture) => {
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  function createGLBModel(texture) {
    return new Promise((resolve, reject) => {
      const scene = new THREE.Scene();

      const aspectRatio = texture.image.width / texture.image.height;
      const planeHeight = 0.3; // Adjust as needed
      const planeWidth = planeHeight * aspectRatio;

      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);

      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (result) => {
          // Success callback
          const output = result instanceof ArrayBuffer ? result : new Uint8Array(result);
          resolve(output);
        },
        (error) => {
          // Error callback
          console.error('An error occurred during GLTF export:', error);
          reject(error);
        },
        { binary: true } // Correct placement of options
      );
    });
  }

  // Function to upload GLB to the server
  async function uploadGLB(glbData, filename) {
    const formData = new FormData();
    const blob = new Blob([glbData], { type: 'application/octet-stream' });
    console.log(blob);
    formData.append('model', blob, filename);

    try {
      const response = await fetch('https://ardisplay.ddns.net:3000/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const modelUrl = `${result.url}`;
      console.log({ url: modelUrl });
      return { url: modelUrl };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload GLB model: ' + error.message);
    }
  }

  const handleARClick = () => {
    if (arButtonRef.current) {
      arButtonRef.current.click();
    }
  };

  return (
    <div
      className="mobile-view h-screen overflow-hidden"
      data-ar-status="pending"
      ref={rootContainerRef}
    >
      <div className="w-screen h-full model-preview">
        <div className="h-full w-screen flex bg-purple-950 flex-col justify-around items-center">
          <a rel="noreferrer" title="The Creatiiives" target="_blank">
            <img
              className="top-0 left-1/3 h-10 w-auto object-contain m-2 max-w-[140px]"
              src="/client-logo.png"
              alt="provided by AR Display"
            />
          </a>
          <img
            className="w-[85%] h-auto max-w-xl m-auto object-contain rounded-lg"
            src={'/bridge-img.gif'}
            alt="model"
          />
	  <button
            onClick={handleARClick}
            disabled={!modelURL || isProcessing}
            className="mb-6 bg-slate-400 px-3 py-2 rounded-full text-white text-sm flex justify-between items-center z-50"
          >
            <img className="w-8 h-8 mr-1" src="/ar.png" alt="ar" />{' '}
            {isProcessing ? 'Processing...' : 'View in your space'}
          </button>
          {/* Remove the custom button here */}
          <div className="bg-slate-400 w-full flex justify-center items-center">
            <span className="text-white text-sm font-light">Powered by</span>
            <a
              rel="noreferrer"
              href="https://ardisplay.io/"
              title="AR Display"
              target="_blank"
            >
              <img
                className="top-0 left-1/3 h-10 w-auto object-contain m-2"
                src="/logo.png"
                alt="provided by AR Display"
              />
            </a>
          </div>
        </div>
        <div className="h-screen w-screen">
          <div
            className="absolute top-0 left-0 right-0 bottom-0 z-50 bg-white text-black h-full w-full hidden"
            id="error"
          >
            Can't display AR
          </div>
          <model-viewer
            ref={modelViewerRef}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
	      opacity: 0,
              pointerEvents: 'none',
            }}
            src={modelURL}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            environment-image="/brown_photostudio_02_2k.hdr"
            skybox-image="/brown_photostudio_02_2k.hdr"
            shadow-intensity="1"
            shadow-softness="1"
            exposure="1"
            auto-rotate
            interaction-prompt="auto"
            auto-rotate-delay="0"
            rotation-per-second="30deg"
            field-of-view="30deg"
            min-camera-orbit="auto auto auto"
            max-camera-orbit="auto auto auto"
            min-field-of-view="10deg"
            max-field-of-view="45deg"
            bounds="tight"
            ar-placement="wall"
            placement-mode="automatic"
            shadow-root-opacity="0.8"
            environment-intensity="1"
            tone-mapping="commerce"
            onARStatus={(event) => {
              const status = event.detail.status;
              if (status === 'failed') {
                // Handle AR failure
                document.getElementById('error').style.display = 'block';
              }
            }}
          >
            <button
              slot="ar-button"
              ref={arButtonRef}
	      disabled={!modelURL || isProcessing}
              className="mb-6 bg-slate-400 px-3 py-2 rounded-full text-white text-sm flex justify-between items-center z-50"
            >
            </button>
          </model-viewer>
        </div>
      </div>
    </div>
  );
}

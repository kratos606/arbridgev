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
        async function processImage() {
            setIsProcessing(true);
            try {
                // First, check if the model already exists
                const checkResponse = await fetch(`https://ardisplay.ddns.net:3000/check-model/${image}.glb`);
                const checkResult = await checkResponse.json();

                if (checkResult.exists) {
                    // If model exists, just use the existing URL
                    setModelURL('https://ardisplay.ddns.net:3000' + checkResult.url);
                } else {
                    // If model doesn't exist, create and upload it
                    const imageURL = `/images/${image}`;
                    const texture = await loadTexture(imageURL);
                    const glb = await createGLBModel(texture);
                    const uploadResult = await uploadGLB(glb, `${image}.glb`);
                    setModelURL(uploadResult.url);
                }
            } catch (error) {
                console.error('Error processing image:', error);
            } finally {
                setIsProcessing(false);
            }
        }

        processImage();
    }, [image]);


  // Function to load texture (unchanged)
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
      const planeHeight = 1; // Adjust as needed
      const planeWidth = planeHeight * aspectRatio;

      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
      });

      const plane = new THREE.Mesh(geometry, material);
      scene.add(plane);

      const exporter = new GLTFExporter();
      exporter.parse(
          scene,
          (result) => {
              const output =
                  result instanceof ArrayBuffer ? result : new Uint8Array(result);
              resolve(output);
          },
          (error) => {
            console.error('An error occurred during GLTF export:', error);
            reject(error);
          },
          { binary: true }
      );
    });
  }


  // Function to upload GLB to the server
  async function uploadGLB(glbData, filename) {
    const formData = new FormData();
    const blob = new Blob([glbData], { type: 'application/octet-stream' });
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
            const errorText = await response.text(); // Get the error message
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }


      const result = await response.json();
      const modelUrl = `${result.url}`;
      return { url: 'https://ardisplay.ddns.net:3000' + modelUrl };
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

  const handleResetClick = () => {
      if (modelViewerRef.current) {
          modelViewerRef.current.resetCamera();
      }
  };

  return (
    <div
      className="h-screen overflow-hidden bg-[#f8f8f8]"
      data-ar-status="pending"
      ref={rootContainerRef}
    >
        <model-viewer
            ref={modelViewerRef}
            src={modelURL}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            environment-image="/brown_photostudio_02_1k.hdr"
            skybox-image="/brown_photostudio_02_1k.hdr"
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
            style={{
                width: '100%',
                height: '100%',
            }}
             onARStatus={(event) => {
                const status = event.detail.status;
                if (status === 'failed') {
                    document.getElementById('error').style.display = 'block';
                 } else {
                   document.getElementById('error').style.display = 'none';
                }
             }}
        >
            <div className="progress-bar" slot="progress-bar">
                <div className="update-bar"></div>
            </div>
            <button
                slot="ar-button"
                ref={arButtonRef}
                className="ar-button"
                disabled={!modelURL || isProcessing}
                onClick={handleARClick}
            >
              AR View
            </button>
        </model-viewer>
      <div className="controls">
            <button onClick={handleResetClick}>Reset</button>
      </div>
      <div className="absolute top-0 left-0 right-0 bottom-0 z-50 bg-white text-black h-full w-full hidden" id="error" > Can't display AR </div>

    </div>
  );
}

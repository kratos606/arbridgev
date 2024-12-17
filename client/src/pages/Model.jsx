import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { models } from '../models/index.js';
import '@google/model-viewer';

function Model() {
    const modelViewerRef = useRef(null);
    const [modelURL, setModelURL] = useState(null);
    const navigate = useNavigate();
    const { model } = useParams();

    useEffect(() => {
       const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
        if (!isMobileDevice) {
            navigate(`/models/${model}`);
        }
    }, [model, navigate]);


    const modelConfig = models.find((m) => m.model === model);

    useEffect(() => {
        const fetchModel = async () => {
          if (!modelConfig) {
              // This should never happen
                return;
            }
            if (!modelConfig.sizes) {
                 console.log('no resize is needed')
                setModelURL(`https://ardisplay.ddns.net:3000/models/${model}.glb`);
                return;
            }
            try {
               let resizeConfig;
                 if (typeof modelConfig.sizes === 'object' && modelConfig.sizes !== null &&
                     typeof modelConfig.sizes.width === 'number' &&
                     typeof modelConfig.sizes.height === 'number' &&
                     typeof modelConfig.sizes.depth === 'number')
                    {
                       resizeConfig= {desiredSize : modelConfig.sizes} ;

                    } else {
                        console.warn('Invalid modelConfig.sizes, using default size', modelConfig.sizes);
                         resizeConfig = {desiredSize : {width: 1, height: 1, depth : 1}}
                    }
                const response = await fetch('https://ardisplay.ddns.net:3000/resize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ modelName: model, ...resizeConfig }),
                });
                if (!response.ok) {
                    console.error('Failed to resize model', response.statusText);
                    return;
                }
                const data = await response.json();
               console.log("Model URL", 'https://ardisplay.ddns.net:3000' + data.url)
                setModelURL('https://ardisplay.ddns.net:3000' + data.url);
            } catch (error) {
                console.error('Error fetching resized model:', error);
            }
        };

        fetchModel();
    }, [model, modelConfig]);

    const handleModelProgress = (event) => {
        if (modelViewerRef.current) {
             const progressBar = modelViewerRef.current.shadowRoot.querySelector('.progress-bar');
             const updateBar = modelViewerRef.current.shadowRoot.querySelector('.update-bar');
            const progress = event.detail.progress;
            if (progressBar && updateBar) {
                updateBar.style.width = `${progress * 100}%`;
            }
        }
    };

    const handleResetPosition = () => {
        if (modelViewerRef.current) {
            modelViewerRef.current.cameraOrbit = '0deg 90deg 1m';
        }
    }

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            {modelURL && <model-viewer
                 ref={modelViewerRef}
                src={modelURL}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                environment-image={"/brown_photostudio_02_1k.hdr"}
                skybox-image={"/brown_photostudio_02_1k.hdr"}
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
                ar-placement="floor"
                placement-mode="automatic"
                shadow-root-opacity="0.8"
                environment-intensity="1"
                ar-scale="fixed"
                 tone-mapping="commerce"
                style={{ backgroundColor: '#f8f8f8', width: '100%', height: '100%' }}
                onProgress={handleModelProgress}
                >
                <div className="progress-bar" slot="progress-bar">
                    <div className="update-bar"></div>
                </div>
                <button slot="ar-button" className="ar-button">AR View</button>
            </model-viewer>}
            <div className="controls">
              <button id="resetPosition" onClick={handleResetPosition}>Reset</button>
            </div>
        </div>
    );
}

export default Model;

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { models } from '../models/index.js';
import '@google/model-viewer';

function Model() {
    const modelViewerRef = useRef(null);
    const rootContainerRef = useRef(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [modelURL, setModelURL] = useState(null); // Store the modified URL
    const navigate = useNavigate();
    const { model } = useParams();

    useEffect(() => {
        // Redirect to the standard model page if not on a mobile device
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
        if (!isMobileDevice) {
            navigate(`/models/${model}`);
        }
    }, [model, navigate]);

    useEffect(() => {
        // Set initial AR status
        if (rootContainerRef.current) {
            rootContainerRef.current.setAttribute('data-ar-status', 'pending');
        }
    }, []);


    const modelConfig = models.find((m) => m.model === model);

    useEffect(() => {
        const fetchResizedModel = async () => {
            if (!modelConfig) return;
            try {
                const resizeConfig = {};

                  if (modelConfig.sizes) {

                    if (typeof modelConfig.sizes === 'number') {
                        resizeConfig.scale = modelConfig.sizes
                        console.log('here')
                    }else{
                         resizeConfig.scale = modelConfig.sizes;
                        console.log('there')
                    }


                  }else{

                    resizeConfig.scale = 1
                  }

                const response = await fetch('https://ardisplay.ddns.net:3000/resize', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ modelName: model,  ...resizeConfig}),
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

        fetchResizedModel();
    }, [model, modelConfig]);


    const handleModelLoad = () => {
        setModelLoaded(true);
    };


    return (
        <div className="mobile-view" ref={rootContainerRef} data-ar-status="pending">
            <div className="w-screen h-full model-preview">
                <div className="h-full w-screen flex bg-purple-950 flex-col justify-around items-center">
                    <a rel="noreferrer" title="The Creatiiives" target="_blank" href="https://thecreatiives.io">
                        <img className="top-0 left-1/3 h-10 w-auto object-contain m-2 max-w-[140px]" src="/client-logo.png" alt="provided by AR Display" />
                    </a>
                    <img className="w-[85%] h-auto max-w-xl m-auto object-contain rounded-lg" src="/bridge-img.gif" alt="model" />
                    <div className="bg-slate-400 w-full flex justify-center items-center">
                        <span className="text-white text-sm font-light">Powered by</span>
                        <a rel="noreferrer" href="https://ardisplay.io/" title="AR Display" target="_blank" >
                            <img className="top-0 left-1/3 h-10 w-auto object-contain m-2" src="/logo.png" alt="provided by AR Display" />
                        </a>
                    </div>
                </div>
                <div className="h-screen w-screen">
                    <div className="absolute top-0 left-0 right-0 bottom-0 z-50 bg-white text-black h-full w-full hidden" id="error" >
                        Can't display AR
                    </div>
                    {modelURL && <model-viewer
                        ref={modelViewerRef}
                        style={{ width: '100%', height: '100%', }}
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
                        ar-placement="floor"
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
                        onLoad={handleModelLoad}
                    >
                        <button slot="ar-button" className="mb-6 bg-slate-400 px-3 py-2 rounded-full text-white text-sm flex justify-between items-center z-50" >
                            <img className="w-8 h-8 mr-1" src="/ar.png" alt="ar" />
                            View in your space
                        </button>
                    </model-viewer>}
                </div>
            </div>
        </div>
    );
}

export default Model;

import './App.css';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { config } from "./config/model.config";
import QrCode from './QrCode';

export default function App() {
  const navigate = useNavigate();
  const { model } = useParams();
  const [res, setRes] = useState();
  useEffect(() => {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)
    ) {
      return navigate(`/model/${model}/view`);
    }
  }, [model, navigate]);

  const loadModel = async () => {
    if (model.includes('model-')) {
      const modelLink = model.replace('model-', '');
      const iosModelLink = modelLink.replace(".glb", ".usdz");
      const ModelPoster = modelLink.replace(".glb", ".png");
      console.log(modelLink, iosModelLink, ModelPoster);
      setRes({
        model: `${window.location.protocol}//${window.location.host}/models/${modelLink}`,
        iosmodel: `${window.location.protocol}//${window.location.host}/models/${iosModelLink}`,
        image: `${window.location.protocol}//${window.location.host}/models/${ModelPoster}`,
        url: "https://the-creatiiives.myshopify.com/products/the-3p-fulfilled-snowboard",
      });
    } else {
      try {
        const res = await axios
          .get(`${config.apiUrl}/api/3d-models/single/${model}`)
          .catch((error) => {
            console.log(error);
          });
        if ("data" in res) {
          setRes(res?.data?.model);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  useEffect(() => {
    loadModel();
  }, []);

  return (
    <>
      {res && (
        <div className="flex flex-col justify-stretch items-center h-screen w-screen p-3 bg-slate-400 overflow-hidden">
          <a
            rel="noreferrer"
            href={res.url}
            title="The Creatiiives"
            target="_blank"
          >
            {res.url && (
              <img
                className="h-10 w-auto max-w-[140px] object-contain"
                src="/client-logo.png"
                alt="Client logo"
              />
            )}
          </a>
          <div className="max-w-5xl w-full h-[80%] md:m-auto flex justify-around items-center bg-white rounded-xl p-3 m-3">
            <div className="md:flex md:flex-col md:items-center md:justify-center m-auto md:h-fit h-full">
              <h1 className="text-[#482dfa] font-bold text-3xl md:text-4xl max-w-[300px] mb-3 text-center m-auto">
                Afficher sur votre mur
              </h1>
              <p className="max-w-[300px] text-gray-800 text-xs md:text-sm text-center mb-2 m-auto">
                Pour voir le portrait sur votre mur, scannez ce QR Code avec
                votre téléphone.
              </p>
              <div className="flex justify-center h-44">
                <QrCode url={`${window.location.href}/view`} />
              </div>
            </div>
            <div className="m-auto h-full flex justify-center items-center md:mt-0 mt-3">
              {res.image && (
                <img
                  className="max-h-[75%] w-auto m-auto object-contain"
                  src={res.image}
                  alt="model"
                />
              )}
            </div>
          </div>
          {/* footer */}
          <div className="">
            <span className="inline-block font-normal text-sm text-gray-600 mr-2">
              Powered by
            </span>
            <a
              rel="noreferrer"
              href="https://ardisplay.io/"
              title="AR Display"
              target="_blank"
            >
              <img
                className="inline-block h-8 w-auto"
                src="/logo.png"
                alt="Client logo"
              />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
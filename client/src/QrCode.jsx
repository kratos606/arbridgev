import { useState, useRef, useEffect } from "react";
import QRCodeStyling from "qr-code-styling";

function QrCode({ url}) {
  const [options, setOptions] = useState({
    width: 200,
    height: 200,
    type: "svg",
    data: url,
    image: "/favicon.png",
    margin: 10,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
      errorCorrectionLevel: "Q",
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.5,
      margin: 2,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      color: "#222",
      type: "rounded",
    },
    backgroundOptions: {
      color: "transparent",
    },
    cornersSquareOptions: {
      color: "#3b37ff",
      type: "extra-rounded",
    },
    cornersDotOptions: {
      color: "#3b37ff",
      type: "dot",
    },
  });
  const [qrCode] = useState(new QRCodeStyling(options));

  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  }, [qrCode, ref]);

  useEffect(() => {
    if (!qrCode) return;
    qrCode.update(options);
  }, [qrCode, options]);

  return <div ref={ref} className="h-full"></div>;
}

export default QrCode;
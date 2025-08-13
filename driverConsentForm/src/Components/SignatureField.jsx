import React, { useRef } from "react";
import SignaturePad from "react-signature-canvas";

export default function SignatureField({ value, onChange }) {
  const sigCanvas = useRef();

  const clear = () => {
    sigCanvas.current.clear();
    onChange(""); // Use empty string instead of null
  };

  const save = () => {
    // Always save the canvas data, even if it appears empty
    const base64 = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    console.log("Signature saved:", base64 ? "Has signature data" : "Empty");
    console.log("isEmpty check:", sigCanvas.current.isEmpty());
    onChange(base64);
  };

  return (
    <div>
      <SignaturePad
        ref={sigCanvas}
        canvasProps={{
          width: 300,
          height: 150,
          className: "sigCanvas",
          style: { border: "1px solid #000" }
        }}
        onEnd={save}
      />
      <button type="button" onClick={clear} style={{ marginTop: "5px" }}>
        Clear
      </button>
      {/* Debug info */}
      <div style={{ fontSize: "12px", color: "gray", marginTop: "5px" }}>
        Signature status: {value ? "Present" : "Empty"}
      </div>
    </div>
  );
}
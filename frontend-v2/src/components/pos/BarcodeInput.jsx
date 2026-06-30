import { useRef, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { inputStyle, buttonStyle, secondaryBtn } from "../../styles/styles";

/**
 * BarcodeInput – barcode text field + camera scanner trigger.
 * @param {string}   barcode
 * @param {Function} onBarcodeChange  – (value: string) => void
 * @param {Function} onAdd            – called when Enter is pressed or Add clicked
 * @param {boolean}  scannerOpen
 * @param {Function} onStartScanner   – opens the camera scanner
 */
export default function BarcodeInput({
  barcode,
  onBarcodeChange,
  onAdd,
  scannerOpen,
  onStartScanner
}) {
  const barcodeRef = useRef(null);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!scannerOpen) return;

    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "scanner",
        {
          fps: 10,
          qrbox: 250,
          videoConstraints: { facingMode: { exact: "environment" } }
        },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          onAdd(decodedText.trim());
        },
        () => {}
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [scannerOpen, onAdd]);

  return (
    <div>
      <input
        ref={barcodeRef}
        placeholder="Scan Barcode"
        value={barcode}
        onChange={(e) => onBarcodeChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()}
        style={inputStyle}
      />
      <button onClick={() => onAdd()} style={buttonStyle}>Add</button>
      <button onClick={onStartScanner} style={{ ...secondaryBtn, marginLeft: "8px" }}>
        Scan with Camera
      </button>

      {scannerOpen && (
        <div
          id="scanner"
          style={{
            width: "300px",
            marginTop: "20px",
            background: "white",
            padding: "10px"
          }}
        ></div>
      )}
    </div>
  );
}

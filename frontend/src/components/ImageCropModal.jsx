import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AUTH_BG } from "../assets/cdn.js";

function ImageCropModal({ imageSrc, onClose, onCrop, isUploading }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);

  const canvasRef = useRef(null);
  const viewportSize = 260; // size of circular crop viewport in px

  // Load image element when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw image on canvas preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate aspect scale to cover circular viewport
    const scale = Math.max(viewportSize / imgElement.width, viewportSize / imgElement.height) * zoom;
    const drawWidth = imgElement.width * scale;
    const drawHeight = imgElement.height * scale;

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;

    ctx.save();
    ctx.drawImage(
      imgElement,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();
  }, [imgElement, zoom, offset]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse / Touch drag handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Generate cropped output Blob on Save
  const handleSaveCrop = () => {
    if (!imgElement) return;

    const outputCanvas = document.createElement("canvas");
    const outputSize = 300; // high res avatar output
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext("2d");

    // Clip to circle
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Map crop coordinates from preview canvas to output canvas
    const scaleFactor = outputSize / viewportSize;
    const scale = Math.max(viewportSize / imgElement.width, viewportSize / imgElement.height) * zoom * scaleFactor;
    const drawWidth = imgElement.width * scale;
    const drawHeight = imgElement.height * scale;

    const centerX = outputSize / 2 + offset.x * scaleFactor;
    const centerY = outputSize / 2 + offset.y * scaleFactor;

    ctx.drawImage(
      imgElement,
      centerX - drawWidth / 2,
      centerY - drawHeight / 2,
      drawWidth,
      drawHeight
    );

    outputCanvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob);
        }
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div
      className="bp2-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(14px) saturate(160%)",
        WebkitBackdropFilter: "blur(14px) saturate(160%)",
        padding: 16,
      }}
    >
      <motion.div
        className="bp2-modal__card"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          borderRadius: 20,
          border: "1px solid rgba(255, 255, 255, 0.14)",
          background: "rgba(18, 20, 32, 0.88)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          padding: 24,
          overflow: "hidden",
          color: "#ffffff",
        }}
      >
        <div className="bp2-modal__card-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
        <div className="bp2-modal__card-overlay" aria-hidden="true" />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#ffffff" }}>Crop Profile Photo</h3>
            <button
              onClick={onClose}
              disabled={isUploading}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
            Drag to reposition your image and use the zoom slider to adjust the crop area.
          </p>

          {/* Canvas Crop Viewport */}
          <div
            style={{
              position: "relative",
              width: viewportSize,
              height: viewportSize,
              margin: "0 auto 16px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid #8b6ff2",
              boxShadow: "0 0 25px rgba(139, 111, 242, 0.4)",
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none",
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <canvas
              ref={canvasRef}
              width={viewportSize}
              height={viewportSize}
              style={{ display: "block", width: "100%", height: "100%" }}
            />
          </div>

          {/* Zoom Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={isUploading}
              style={{
                flex: 1,
                accentColor: "#8b6ff2",
                cursor: "pointer",
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1", width: 36, textAlign: "right" }}>
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="settings-btn settings-btn--ghost"
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={isUploading}
              style={{
                padding: "8px 20px",
                borderRadius: 10,
                border: "none",
                background: "#8b6ff2",
                color: "#ffffff",
                cursor: isUploading ? "not-allowed" : "pointer",
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(139, 111, 242, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isUploading ? (
                "Saving…"
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Crop & Save
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ImageCropModal;

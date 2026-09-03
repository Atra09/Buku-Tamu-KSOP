import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Video } from 'lucide-react';

const WebcamCapture = ({ onCapture, currentPhoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(currentPhoto || null);

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
        });
      } catch (e) {
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setIsStreaming(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setError('Kamera tidak terdeteksi atau izin ditolak browser.');
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      if (onCapture) {
        onCapture(dataUrl);
      }
      stopCamera();
    }
  };

  const resetPhoto = () => {
    setCapturedImage(null);
    if (onCapture) onCapture(null);
    startCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
        if (onCapture) onCapture(reader.result);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-between min-h-[380px]">
      <div className="relative w-full flex-1 min-h-[310px] bg-slate-900 rounded-xl overflow-hidden shadow-md border-2 border-sky-200 flex items-center justify-center">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Foto Tamu"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform -scale-x-100 ${isStreaming ? 'block' : 'hidden'}`}
            />
            {!isStreaming && (
              <div className="flex flex-col items-center justify-center p-4 text-center text-slate-300 space-y-2">
                <AlertCircle className="w-9 h-9 text-amber-400" />
                <p className="text-xs font-semibold text-slate-200">{error || 'Memuat Kamera...'}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    Coba Kamera Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih File Foto
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />

        {/* Live Camera Badge */}
        {isStreaming && !capturedImage && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            LIVE CAMERA
          </div>
        )}

        {capturedImage && (
          <div className="absolute top-2 right-2 bg-sky-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            Foto Terambil
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Action Controls */}
      <div className="w-full mt-3 flex items-center justify-between gap-2">
        {capturedImage ? (
          <button
            type="button"
            onClick={resetPhoto}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Foto Ulang
          </button>
        ) : (
          <button
            type="button"
            onClick={takeSnapshot}
            disabled={!isStreaming}
            className={`w-full py-3 px-4 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isStreaming
                ? 'bg-sky-500 hover:bg-sky-600 active:scale-[0.98]'
                : 'bg-slate-300 cursor-not-allowed text-slate-500'
            }`}
          >
            <Camera className="w-4 h-4" />
            Ambil Foto
          </button>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/80 text-xs font-bold py-3 px-4 rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
        >
          <Upload className="w-4 h-4 text-sky-600" />
          <span>Upload</span>
        </button>
      </div>
    </div>
  );
};

export default WebcamCapture;

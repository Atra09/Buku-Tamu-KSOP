import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Video } from 'lucide-react';

if (typeof window !== 'undefined' && !window.__ACTIVE_WEBCAM_STREAMS__) {
  window.__ACTIVE_WEBCAM_STREAMS__ = new Set();
}

export const stopAllGlobalWebcamStreams = () => {
  if (typeof window !== 'undefined' && window.__ACTIVE_WEBCAM_STREAMS__) {
    window.__ACTIVE_WEBCAM_STREAMS__.forEach(stream => {
      try {
        if (stream && typeof stream.getTracks === 'function') {
          const tracks = stream.getTracks();
          tracks.forEach(track => {
            try {
              track.enabled = false;
              track.stop();
              if (typeof stream.removeTrack === 'function') {
                stream.removeTrack(track);
              }
            } catch (e) {}
          });
        }
      } catch (e) {}
    });
    window.__ACTIVE_WEBCAM_STREAMS__.clear();
  }
};

const WebcamCapture = ({ onCapture, currentPhoto }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);
  const shouldCameraBeOnRef = useRef(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(currentPhoto || null);

  useEffect(() => {
    isMountedRef.current = true;
    if (!capturedImage) {
      startCamera();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (!capturedImage && isMountedRef.current) {
        startCamera();
      }
    };

    window.addEventListener('popstate', stopCamera);
    window.addEventListener('beforeunload', stopCamera);
    window.addEventListener('pagehide', stopCamera);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMountedRef.current = false;
      shouldCameraBeOnRef.current = false;
      window.removeEventListener('popstate', stopCamera);
      window.removeEventListener('beforeunload', stopCamera);
      window.removeEventListener('pagehide', stopCamera);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopCamera();
    };
  }, []);

  const killStreamTracks = (streamToKill) => {
    if (!streamToKill) return;
    try {
      const tracks = typeof streamToKill.getTracks === 'function' ? streamToKill.getTracks() : [];
      tracks.forEach(track => {
        try {
          track.enabled = false;
          track.stop();
          if (typeof streamToKill.removeTrack === 'function') {
            streamToKill.removeTrack(track);
          }
        } catch (e) {}
      });
    } catch (e) {
      console.warn('Error killing tracks:', e);
    }
  };

  const stopCamera = () => {
    // 1. Matikan izin kamera seketika
    shouldCameraBeOnRef.current = false;

    // 2. Tangkap stream dari streamRef & videoRef.srcObject
    const activeStream = streamRef.current;
    const videoStream = videoRef.current ? videoRef.current.srcObject : null;

    // 3. Hentikan elemen video & lepas ikatan srcObject
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      } catch (e) {}
    }

    // 4. Matikan seluruh track lokal & global secara fisik
    killStreamTracks(activeStream);
    killStreamTracks(videoStream);
    stopAllGlobalWebcamStreams();

    streamRef.current = null;

    if (isMountedRef.current) {
      setIsStreaming(false);
    }
  };

  const startCamera = async () => {
    setError(null);
    shouldCameraBeOnRef.current = true;

    // Bersihkan seluruh stream lama di tingkat global
    stopAllGlobalWebcamStreams();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser tidak mendukung akses kamera langsung');
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      // Daftarkan stream baru ke daftar aktif global
      if (stream && window.__ACTIVE_WEBCAM_STREAMS__) {
        window.__ACTIVE_WEBCAM_STREAMS__.add(stream);
      }

      // CRITICAL GUARD: Jika kamera di-stop saat getUserMedia sedang diproses (pending)
      if (!shouldCameraBeOnRef.current || !isMountedRef.current) {
        stopAllGlobalWebcamStreams();
        return;
      }

      streamRef.current = stream;

      if (videoRef.current && shouldCameraBeOnRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        if (isMountedRef.current && shouldCameraBeOnRef.current) {
          setIsStreaming(true);
        }
      }
    } catch (err) {
      if (isMountedRef.current && shouldCameraBeOnRef.current) {
        console.warn('Camera access error:', err);
        setError('Kamera tidak terdeteksi atau izin ditolak browser.');
        setIsStreaming(false);
      }
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');

      // Cermin horizontal canvas agar HASIL FOTO SAMA PERSIS dengan PRATINJAU KAMERA LIVE (-scale-x-100)
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      // KUNCI: Matikan hardware kamera DULUAN sebelum React menghapus elemen <video> dari DOM!
      stopCamera();

      setCapturedImage(dataUrl);
      if (onCapture) {
        onCapture(dataUrl);
      }
    }
  };

  const resetPhoto = () => {
    stopCamera();
    setCapturedImage(null);
    if (onCapture) onCapture(null);
    setTimeout(() => {
      if (isMountedRef.current) {
        startCamera();
      }
    }, 50);
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
      </div>
    </div>
  );
};

export default WebcamCapture;

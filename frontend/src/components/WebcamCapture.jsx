import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Upload, Video, MapPin } from 'lucide-react';

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

const WebcamCapture = ({ onCapture, currentPhoto, onLocationChange }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);
  const shouldCameraBeOnRef = useRef(false);
  const onLocationChangeRef = useRef(onLocationChange);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(currentPhoto || null);
  const [locationText, setLocationText] = useState('Mendeteksi Lokasi...');
  const locationTextRef = useRef(locationText);

  useEffect(() => {
    locationTextRef.current = locationText;
  }, [locationText]);

  useEffect(() => {
    isMountedRef.current = true;
    detectUserLocation();

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

  const fallbackIpLocation = async () => {
    try {
      const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=id');
      if (res.ok) {
        const data = await res.json();
        let desa = '';
        let kecamatan = data.locality || '';
        let kabupaten = data.city || data.principalSubdivision || '';

        if (data.localityInfo && data.localityInfo.administrative) {
          const admin = data.localityInfo.administrative;
          const lvl7 = admin.find(a => a.adminLevel === 7 || a.adminLevel === 8);
          if (lvl7) desa = lvl7.name;
          const lvl6 = admin.find(a => a.adminLevel === 6);
          if (lvl6) kecamatan = lvl6.name;
          const lvl5 = admin.find(a => a.adminLevel === 5);
          if (lvl5) kabupaten = lvl5.name;
        }

        const parts = [];
        if (desa) parts.push(desa.toLowerCase().startsWith('desa') || desa.toLowerCase().startsWith('kel') ? desa : `Desa ${desa}`);
        if (kecamatan) parts.push(`Kec. ${kecamatan.replace(/^Kecamatan\s+/i, '')}`);
        if (kabupaten) parts.push(`Kab. ${kabupaten.replace(/^Kabupaten\s+/i, '')}`);

        const fullLoc = parts.length > 0 ? parts.join(', ') : 'Lokasi Tidak Terdeteksi';
        if (isMountedRef.current) {
          setLocationText(fullLoc);
          if (onLocationChangeRef.current) onLocationChangeRef.current(fullLoc);
        }
        return;
      }
    } catch (e) {
      console.error('IP Geolocation fallback error:', e);
    }

    if (isMountedRef.current) {
      setLocationText('Lokasi Tidak Terdeteksi');
      if (onLocationChangeRef.current) onLocationChangeRef.current('Lokasi Tidak Terdeteksi');
    }
  };

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      fallbackIpLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // 1. Fetch BigDataCloud API
          let bdcData = null;
          try {
            const bdcRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
            );
            if (bdcRes.ok) {
              bdcData = await bdcRes.json();
            }
          } catch (e) {}

          // 2. Fetch OpenStreetMap Nominatim API (Zoom 18 for street/building + Zoom 14 for village/subdistrict)
          let nomData = null;
          let nomDataVillage = null;
          try {
            const [nomRes, nomResVillage] = await Promise.all([
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18`,
                { headers: { 'Accept-Language': 'id', 'User-Agent': 'SiTamuApp/1.0' } }
              ),
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
                { headers: { 'Accept-Language': 'id', 'User-Agent': 'SiTamuApp/1.0' } }
              )
            ]);
            if (nomRes.ok) nomData = await nomRes.json();
            if (nomResVillage && nomResVillage.ok) nomDataVillage = await nomResVillage.json();
          } catch (e) {}

          const nomAddress = (nomData && nomData.address) || {};
          const nomAddressVillage = (nomDataVillage && nomDataVillage.address) || {};

          let gedung = nomAddress.building ||
                       nomAddress.office ||
                       nomAddress.amenity ||
                       nomAddress.government ||
                       nomAddress.public_building ||
                       nomAddress.commercial ||
                       nomAddress.industrial ||
                       nomAddress.shop ||
                       nomAddress.tourism ||
                       nomAddress.historic || '';
          if (/^\d+[-\d\s]*$/.test(gedung) || gedung.length < 3) gedung = '';

          let jalan = (nomAddress.road || nomAddress.pedestrian || nomAddress.street || '').trim();
          if (/^\d+[-\d\s]*$/.test(jalan) || jalan.length <= 3) {
            jalan = '';
          } else if (!jalan.toLowerCase().startsWith('jl') && !jalan.toLowerCase().startsWith('jalan') && !jalan.toLowerCase().startsWith('gang') && !jalan.toLowerCase().startsWith('gg')) {
            jalan = `Jl. ${jalan}`;
          }

          let desa = nomAddress.village ||
                     nomAddress.suburb ||
                     nomAddress.neighbourhood ||
                     nomAddress.hamlet ||
                     nomAddress.quarter ||
                     nomAddress.residential ||
                     nomAddressVillage.village ||
                     nomAddressVillage.suburb ||
                     nomAddressVillage.neighbourhood ||
                     nomAddressVillage.hamlet ||
                     nomAddressVillage.town || '';

          if (!desa && bdcData && bdcData.localityInfo && bdcData.localityInfo.administrative) {
            const admin = bdcData.localityInfo.administrative;
            const lvl8 = admin.find(a => a.adminLevel === 8);
            if (lvl8) desa = lvl8.name;
          }

          let kecamatan = nomAddress.subdistrict || nomAddress.district || nomAddress.city_district || nomAddressVillage.subdistrict || nomAddressVillage.district || '';
          if (!kecamatan && bdcData && bdcData.localityInfo && bdcData.localityInfo.administrative) {
            const admin = bdcData.localityInfo.administrative;
            const lvl7 = admin.find(a => a.adminLevel === 7);
            if (lvl7) kecamatan = lvl7.name;
            else if (bdcData.locality) kecamatan = bdcData.locality;
          }

          let kabupaten = nomAddress.regency || nomAddress.county || nomAddress.city || nomAddress.town || nomAddress.municipality || '';
          if (!kabupaten && bdcData) {
            if (bdcData.localityInfo && bdcData.localityInfo.administrative) {
              const admin = bdcData.localityInfo.administrative;
              const lvl5or6 = admin.find(a => a.adminLevel === 5 || a.adminLevel === 6);
              if (lvl5or6) kabupaten = lvl5or6.name;
            }
            if (!kabupaten && bdcData.city) kabupaten = bdcData.city;
          }

          // Fallback parsing from display_name (filtering out street names, buildings, districts)
          const displayParts = (nomData && nomData.display_name ? nomData.display_name : '').split(',').map(s => s.trim());
          const cleanDisplayParts = displayParts.filter(p => {
            if (!p) return false;
            const l = p.toLowerCase();
            if (l === 'indonesia' || l === 'jawa timur' || l === 'east java' || /^\d{5}$/.test(p) || /^\d+[-\d\s]*$/.test(p)) return false;
            return true;
          });

          if (!desa && cleanDisplayParts.length > 0) {
            const candidate = cleanDisplayParts.find(p => {
              const l = p.toLowerCase();
              if (l.startsWith('jl') || l.startsWith('jalan') || l.startsWith('gang') || l.startsWith('gg')) return false;
              if (jalan && (l.includes(jalan.toLowerCase()) || jalan.toLowerCase().includes(l))) return false;
              if (gedung && (l.includes(gedung.toLowerCase()) || gedung.toLowerCase().includes(l))) return false;
              if (kecamatan && (l.includes(kecamatan.toLowerCase()) || kecamatan.toLowerCase().includes(l))) return false;
              if (kabupaten && (l.includes(kabupaten.toLowerCase()) || kabupaten.toLowerCase().includes(l))) return false;
              return true;
            });
            if (candidate) desa = candidate;
          }

          // Build ordered address hierarchy: [Gedung], [Jalan], [Desa], [Kecamatan], [Kabupaten]
          const parts = [];

          // 1. Gedung / Tempat
          if (gedung) {
            parts.push(gedung);
          }

          // 2. Jalan
          if (jalan && (!gedung || !gedung.toLowerCase().includes(jalan.toLowerCase()))) {
            parts.push(jalan);
          }

          // 3. Desa / Kelurahan
          if (desa) {
            const lowerDesa = desa.toLowerCase();
            const isStreetName = lowerDesa.startsWith('jl') || lowerDesa.startsWith('jalan') || lowerDesa.startsWith('gang') || lowerDesa.startsWith('gg');
            if (!isStreetName && (!jalan || !lowerDesa.includes(jalan.toLowerCase()))) {
              const desaClean = desa.replace(/^(desa|kelurahan|kel\.)\s+/i, '');
              parts.push(lowerDesa.startsWith('kel') ? `Kel. ${desaClean}` : `Desa ${desaClean}`);
            }
          }

          // 4. Kecamatan
          if (kecamatan) {
            const kecClean = kecamatan.replace(/^(kecamatan|kec\.)\s+/i, '');
            if (!desa || !desa.toLowerCase().includes(kecClean.toLowerCase())) {
              parts.push(`Kec. ${kecClean}`);
            }
          }

          // 5. Kabupaten / Kota
          if (kabupaten) {
            const kabClean = kabupaten.replace(/^(kabupaten|kab\.|kota)\s+/i, '');
            if (!kecamatan || !kecamatan.toLowerCase().includes(kabClean.toLowerCase())) {
              const kabFormatted = kabupaten.toLowerCase().startsWith('kota') ? `Kota ${kabClean}` : `Kab. ${kabClean}`;
              parts.push(kabFormatted);
            }
          }

          const fullLoc = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          if (isMountedRef.current) {
            setLocationText(fullLoc);
            if (onLocationChangeRef.current) onLocationChangeRef.current(fullLoc);
          }
        } catch (e) {
          fallbackIpLocation();
        }
      },
      (err) => {
        console.warn('Geolocation error, falling back to IP Geolocation:', err);
        fallbackIpLocation();
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

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
    shouldCameraBeOnRef.current = false;
    const activeStream = streamRef.current;
    const videoStream = videoRef.current ? videoRef.current.srcObject : null;

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.load();
      } catch (e) {}
    }

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

      if (stream && window.__ACTIVE_WEBCAM_STREAMS__) {
        window.__ACTIVE_WEBCAM_STREAMS__.add(stream);
      }

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

      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

      stopCamera();

      setCapturedImage(dataUrl);
      if (onCapture) {
        onCapture(dataUrl, locationTextRef.current);
      }
    }
  };

  const resetPhoto = () => {
    stopCamera();
    setCapturedImage(null);
    if (onCapture) onCapture(null, locationTextRef.current);
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
        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = img.width || 640;
            canvas.height = img.height || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setCapturedImage(cleanDataUrl);
            if (onCapture) onCapture(cleanDataUrl, locationTextRef.current);
            stopCamera();
          }
        };
        img.src = reader.result;
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

        {/* Location Overlay Indicator */}
        {isStreaming && !capturedImage && (
          <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-xs text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-sky-500/30 shadow-md max-w-[90%] truncate">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="truncate">{locationText}</span>
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

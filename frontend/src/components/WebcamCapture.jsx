import React, { useRef, useState, useEffect, memo } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Video, MapPin } from 'lucide-react';

// Registry global stream webcam untuk memastikan tidak ada hardware camera leak di background
if (typeof window !== 'undefined' && !window.__ACTIVE_WEBCAM_STREAMS__) {
  window.__ACTIVE_WEBCAM_STREAMS__ = new Set();
}

export const stopAllGlobalWebcamStreams = () => {
  if (typeof window !== 'undefined' && window.__ACTIVE_WEBCAM_STREAMS__) {
    window.__ACTIVE_WEBCAM_STREAMS__.forEach(stream => {
      try {
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach(track => {
            try {
              track.enabled = false;
              track.stop();
              if (typeof stream.removeTrack === 'function') {
                stream.removeTrack(track);
              }
            } catch (e) { }
          });
        }
      } catch (e) { }
    });
    window.__ACTIVE_WEBCAM_STREAMS__.clear();
  }
};


/**
 * Helper murni di luar komponen: Reverse geocode koordinat GPS menjadi teks hierarki resmi
 */
const fetchLocationFromCoords = async (latitude, longitude) => {
  try {
    // 1. Fetch BigDataCloud API
    let bdcData = null;
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
      );
      if (bdcRes.ok) bdcData = await bdcRes.json();
    } catch (e) { }

    // 2. Fetch OpenStreetMap Nominatim API (Zoom 18 & Zoom 14 secara paralel)
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
    } catch (e) { }

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

    // Fallback parsing from display_name
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

    const parts = [];
    if (gedung) parts.push(gedung);
    if (jalan && (!gedung || !gedung.toLowerCase().includes(jalan.toLowerCase()))) parts.push(jalan);
    if (desa) {
      const lowerDesa = desa.toLowerCase();
      const isStreetName = lowerDesa.startsWith('jl') || lowerDesa.startsWith('jalan') || lowerDesa.startsWith('gang') || lowerDesa.startsWith('gg');
      if (!isStreetName && (!jalan || !lowerDesa.includes(jalan.toLowerCase()))) {
        const desaClean = desa.replace(/^(desa|kelurahan|kel\.)\s+/i, '');
        parts.push(lowerDesa.startsWith('kel') ? `Kel. ${desaClean}` : `Desa ${desaClean}`);
      }
    }
    if (kecamatan) {
      const kecClean = kecamatan.replace(/^(kecamatan|kec\.)\s+/i, '');
      if (!desa || !desa.toLowerCase().includes(kecClean.toLowerCase())) {
        parts.push(`Kec. ${kecClean}`);
      }
    }
    if (kabupaten) {
      const kabClean = kabupaten.replace(/^(kabupaten|kab\.|kota)\s+/i, '');
      if (!kecamatan || !kecamatan.toLowerCase().includes(kabClean.toLowerCase())) {
        const kabFormatted = kabupaten.toLowerCase().startsWith('kota') ? `Kota ${kabClean}` : `Kab. ${kabClean}`;
        parts.push(kabFormatted);
      }
    }

    const addressText = parts.length > 0 ? parts.join(', ') : '';
    if (addressText) {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${addressText})`;
    }
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  } catch (e) {
    return 'Lokasi Tidak Terdeteksi';
  }
};

/**
 * Komponen WebcamCapture (Ultra Lightweight & Responsive)
 * Dilengkapi GPU hardware compositing, memoized pure render, dan zero re-render overhead.
 */
const WebcamCapture = ({ onCapture, currentPhoto, onLocationChange }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isStartingRef = useRef(false);
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
    setCapturedImage(currentPhoto || null);
    if (!currentPhoto && isMountedRef.current && !streamRef.current?.active) {
      startCamera();
    }
  }, [currentPhoto]);

  useEffect(() => {
    isMountedRef.current = true;
    detectUserLocation();

    if (!capturedImage && !streamRef.current?.active) {
      startCamera();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      } else if (!capturedImage && isMountedRef.current && !streamRef.current?.active) {
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

  const detectUserLocation = () => {
    if (isMountedRef.current) {
      setLocationText('Mendeteksi Lokasi...');
    }

    // Dengarkan perubahan status izin lokasi secara reaktif jika browser sedang menampilkan prompt
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') {
            detectUserLocation();
          }
        };
      }).catch(() => {});
    }

    if (!navigator.geolocation) {
      if (isMountedRef.current) {
        setLocationText('Perangkat tidak mendukung GPS Geolocation');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const fullLoc = await fetchLocationFromCoords(latitude, longitude);
        if (isMountedRef.current) {
          setLocationText(fullLoc);
          if (onLocationChangeRef.current) onLocationChangeRef.current(fullLoc);
        }
      },
      async (err) => {
        console.warn('Geolocation detection status:', err);
        if (isMountedRef.current) {
          let errorText = 'Gagal mendeteksi lokasi GPS (Klik untuk coba lagi)';
          if (err.code === 1) {
            errorText = 'Akses Lokasi Ditolak (Aktifkan Izin GPS Browser)';
          } else if (err.code === 3) {
            errorText = 'Waktu Deteksi GPS Habis (Klik untuk coba lagi)';
          }
          setLocationText(errorText);
          if (onLocationChangeRef.current) onLocationChangeRef.current(errorText);
        }
      },
      { timeout: 15000, maximumAge: 10000, enableHighAccuracy: true }
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
        } catch (e) { }
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
      } catch (e) { }
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
    if (isStartingRef.current) return;
    if (streamRef.current && streamRef.current.active && isStreaming) return;

    isStartingRef.current = true;
    setError(null);
    shouldCameraBeOnRef.current = true;

    stopAllGlobalWebcamStreams();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser memblokir izin kamera otomatis pada HTTP IP. Klik tombol di bawah untuk meminta izin.');
      }

      const idealConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
      } catch (e) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', frameRate: { ideal: 30 } },
            audio: false
          });
        } catch (e2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
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
        await videoRef.current.play().catch(() => { });
        if (isMountedRef.current && shouldCameraBeOnRef.current) {
          setIsStreaming(true);
        }
      }
    } catch (err) {
      if (isMountedRef.current && shouldCameraBeOnRef.current) {
        console.warn('Camera access error:', err);
        setError('Kamera belum diizinkan. Klik tombol "Minta Izin Kamera" di bawah.');
        setIsStreaming(false);
      }
    } finally {
      isStartingRef.current = false;
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });

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
              webkit-playsinline="true"
              muted
              disablePictureInPicture
              className={`w-full h-full object-cover will-change-transform ${isStreaming ? 'block' : 'hidden'}`}
              style={{
                transform: 'scaleX(-1) translateZ(0)',
                WebkitTransform: 'scaleX(-1) translateZ(0)'
              }}
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

        {/* Location Overlay Indicator (Bisa diklik untuk deteksi ulang GPS) */}
        {isStreaming && !capturedImage && (
          <div
            onClick={detectUserLocation}
            title="Klik untuk mendeteksi ulang lokasi GPS"
            className="absolute bottom-2.5 left-2.5 bg-slate-950/90 text-sky-300 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-sky-500/40 shadow-md max-w-[92%] truncate cursor-pointer hover:bg-slate-900 hover:border-sky-400 active:scale-95 transition-all select-none"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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
            className={`w-full py-3 px-4 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isStreaming
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

export default memo(WebcamCapture);

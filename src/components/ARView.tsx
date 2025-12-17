import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Navigation, MapPin, AlertCircle, Compass, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CampusLocation {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

interface ARViewProps {
  locations: CampusLocation[];
  userLocation: [number, number] | null;
  onClose: () => void;
}

const categoryColors: Record<string, string> = {
  academic: '#3b82f6',
  administrative: '#8b5cf6',
  library: '#10b981',
  canteen: '#f59e0b',
  sports: '#ef4444',
  hostel: '#ec4899',
  parking: '#6b7280',
  other: '#64748b',
};

// Calculate distance between two coordinates in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Calculate bearing between two coordinates
const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
};

const ARView = ({ locations, userLocation, onClose }: ARViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [simulatedAngle, setSimulatedAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastX = useRef(0);

  // Simulated user location for demo (MITS campus center)
  const effectiveUserLocation = userLocation || [26.2124, 78.1772] as [number, number];

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraAvailable(true);
    } catch (err) {
      console.log('Camera not available, using simulated mode');
      setCameraAvailable(false);
    }
  }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceOrientation(event.alpha);
      }
    };

    const requestOrientationPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (err) {
          console.log('Orientation not available');
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    startCamera();
    requestOrientationPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera, stream]);

  // Mouse/touch drag for simulated view
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    lastX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const delta = e.clientX - lastX.current;
    setSimulatedAngle(prev => (prev - delta * 0.5 + 360) % 360);
    lastX.current = e.clientX;
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Use device orientation when available, otherwise use simulated angle
  const currentAngle = cameraAvailable ? deviceOrientation : simulatedAngle;

  // Calculate marker positions
  const getMarkerPosition = (location: CampusLocation) => {
    const bearing = getBearing(effectiveUserLocation[0], effectiveUserLocation[1], location.latitude, location.longitude);
    const distance = getDistance(effectiveUserLocation[0], effectiveUserLocation[1], location.latitude, location.longitude);

    let relativeAngle = bearing - currentAngle;
    if (relativeAngle < -180) relativeAngle += 360;
    if (relativeAngle > 180) relativeAngle -= 360;

    // Show markers within ~90 degrees for better demo
    if (Math.abs(relativeAngle) > 90) return null;

    const xPercent = 50 + (relativeAngle / 90) * 45;
    const maxDistance = 2000;
    const yPercent = Math.max(15, Math.min(75, 25 + (distance / maxDistance) * 45));

    return { x: xPercent, y: yPercent, distance, bearing };
  };

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-50 overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Camera feed or simulated background */}
      {cameraAvailable ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full relative">
          {/* Simulated AR background with animated gradient */}
          <div 
            className="absolute inset-0 transition-transform duration-100"
            style={{
              background: `linear-gradient(${currentAngle}deg, 
                hsl(220 30% 15%) 0%, 
                hsl(200 40% 20%) 25%,
                hsl(180 35% 18%) 50%,
                hsl(240 30% 16%) 75%,
                hsl(220 30% 15%) 100%
              )`,
            }}
          />
          {/* Simulated stars/grid */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${((i * 37 + currentAngle) % 100)}%`,
                  top: `${(i * 13) % 100}%`,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
              />
            ))}
          </div>
          {/* Horizon line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20" />
        </div>
      )}

      {/* AR Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Eye className="w-5 h-5 text-primary" />
              <span className="font-semibold">AR Campus Navigator</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${cameraAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <p className="text-white/70 text-sm">
              {cameraAvailable ? 'Camera Active' : 'Simulation Mode'} • {Math.round(currentAngle)}° 
              {!cameraAvailable && ' • Drag to look around'}
            </p>
          </div>
        </div>

        {/* Location markers */}
        {locations.map(location => {
          const position = getMarkerPosition(location);
          if (!position) return null;

          const color = categoryColors[location.category] || categoryColors.other;
          const scale = Math.max(0.5, 1.2 - position.distance / 1500);
          const distanceText = position.distance >= 1000 
            ? `${(position.distance / 1000).toFixed(1)}km` 
            : `${Math.round(position.distance)}m`;

          return (
            <div
              key={location.id}
              className="absolute pointer-events-auto transition-all duration-200"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                zIndex: Math.round(1000 - position.distance),
              }}
            >
              <div className="flex flex-col items-center">
                {/* Direction indicator */}
                <div className="w-0.5 h-6 bg-gradient-to-b from-white/60 to-transparent mb-1" />
                
                {/* Marker pin */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-2 border-white/30 backdrop-blur-sm"
                  style={{ backgroundColor: `${color}dd` }}
                >
                  <MapPin className="w-7 h-7 text-white drop-shadow-lg" />
                </div>
                
                {/* Label */}
                <div className="mt-2 bg-black/80 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10 shadow-xl">
                  <p className="text-white text-sm font-semibold text-center">{location.name}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <Navigation className="w-3 h-3 text-primary" />
                    <p className="text-primary text-xs font-medium">{distanceText}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Compass overlay */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-md rounded-full p-4 border border-white/20 shadow-xl">
            <div
              className="w-20 h-20 rounded-full border-2 border-white/40 relative flex items-center justify-center"
              style={{ transform: `rotate(${-currentAngle}deg)` }}
            >
              {/* Cardinal directions */}
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-red-500 text-xs font-bold">N</span>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-white/60 text-xs font-bold">S</span>
              <span className="absolute top-1/2 -left-1 -translate-y-1/2 text-white/60 text-xs font-bold">W</span>
              <span className="absolute top-1/2 -right-1 -translate-y-1/2 text-white/60 text-xs font-bold">E</span>
              
              {/* North indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[14px] border-b-red-500" />
              
              {/* Center dot */}
              <div className="w-3 h-3 rounded-full bg-primary shadow-lg" />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-center gap-3">
              <Compass className="w-5 h-5 text-primary" />
              <p className="text-white text-sm">
                {cameraAvailable 
                  ? 'Point your camera around to discover campus locations'
                  : 'Drag left/right to explore the virtual campus view'
                }
              </p>
            </div>
            {locations.length === 0 && (
              <p className="text-yellow-400 text-xs text-center mt-2">
                No locations found. Add some campus locations to see them here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARView;
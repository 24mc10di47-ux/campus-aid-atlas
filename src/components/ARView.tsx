import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Navigation, MapPin, AlertCircle } from 'lucide-react';
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
  const R = 6371e3; // Earth radius in meters
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
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPermissionGranted(true);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please allow camera permissions.');
    }
  }, []);

  const requestOrientationPermission = useCallback(async () => {
    // Check if DeviceOrientationEvent needs permission (iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          return true;
        }
      } catch (err) {
        console.error('Orientation permission error:', err);
      }
      return false;
    }
    return true; // No permission needed
  }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        // alpha is the compass direction the device is facing
        setDeviceOrientation(event.alpha);
      }
    };

    const init = async () => {
      await startCamera();
      const hasOrientationPermission = await requestOrientationPermission();
      if (hasOrientationPermission) {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    init();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera, requestOrientationPermission, stream]);

  // Calculate marker positions based on bearing and device orientation
  const getMarkerPosition = (location: CampusLocation) => {
    if (!userLocation) return null;

    const bearing = getBearing(userLocation[0], userLocation[1], location.latitude, location.longitude);
    const distance = getDistance(userLocation[0], userLocation[1], location.latitude, location.longitude);

    // Calculate relative angle to device orientation
    let relativeAngle = bearing - deviceOrientation;
    if (relativeAngle < -180) relativeAngle += 360;
    if (relativeAngle > 180) relativeAngle -= 360;

    // Only show markers within ~60 degrees of view
    if (Math.abs(relativeAngle) > 60) return null;

    // Convert angle to screen position (center is 50%)
    const xPercent = 50 + (relativeAngle / 60) * 40;

    // Vertical position based on distance (closer = lower on screen)
    const maxDistance = 500; // meters
    const yPercent = Math.max(20, Math.min(80, 30 + (distance / maxDistance) * 40));

    return { x: xPercent, y: yPercent, distance };
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <p className="text-center text-muted-foreground mb-4">{error}</p>
        <Button onClick={onClose}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* AR Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Navigation className="w-5 h-5" />
              <span className="font-medium">AR Campus View</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-6 h-6" />
            </Button>
          </div>
          {!userLocation && (
            <p className="text-white/70 text-sm mt-2">Getting your location...</p>
          )}
          {userLocation && (
            <p className="text-white/70 text-sm mt-2">
              Compass: {Math.round(deviceOrientation)}° • Point camera at campus
            </p>
          )}
        </div>

        {/* Location markers */}
        {userLocation && locations.map(location => {
          const position = getMarkerPosition(location);
          if (!position) return null;

          const color = categoryColors[location.category] || categoryColors.other;
          const scale = Math.max(0.6, 1 - position.distance / 500);

          return (
            <div
              key={location.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            >
              <div className="flex flex-col items-center animate-pulse">
                {/* Marker pin */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: color }}
                >
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                {/* Label */}
                <div className="mt-2 bg-black/80 rounded-lg px-3 py-1.5 max-w-[150px]">
                  <p className="text-white text-xs font-medium text-center truncate">{location.name}</p>
                  <p className="text-white/70 text-[10px] text-center">{Math.round(position.distance)}m away</p>
                </div>
                {/* Direction line */}
                <div className="w-0.5 h-8 bg-white/50 mt-1" />
              </div>
            </div>
          );
        })}

        {/* Compass overlay */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <div className="bg-black/60 rounded-full p-3">
            <div
              className="w-16 h-16 rounded-full border-2 border-white/50 relative"
              style={{ transform: `rotate(${-deviceOrientation}deg)` }}
            >
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-red-500" />
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold">N</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/60 rounded-xl p-3 text-center">
            <p className="text-white text-sm">
              Move your phone around to discover campus locations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARView;

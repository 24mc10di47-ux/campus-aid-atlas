import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Navigation, MapPin, Building, BookOpen, Coffee, Dumbbell, Home, Car, GraduationCap, Compass, Target, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ARView from '@/components/ARView';

// Fix leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const userIcon = L.divIcon({
  className: 'user-marker',
  html: `<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 3px rgba(59,130,246,0.3), 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// MITS Gwalior coordinates (approximate)
const CAMPUS_CENTER: [number, number] = [26.2124, 78.1772];

interface CampusLocation {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  description: string | null;
  floor_info: string | null;
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

const categoryIcons: Record<string, React.ElementType> = {
  academic: Building,
  administrative: GraduationCap,
  library: BookOpen,
  canteen: Coffee,
  sports: Dumbbell,
  hostel: Home,
  parking: Car,
  other: MapPin,
};

const purposes = [
  { id: 'admission', name: 'Admission', icon: GraduationCap, category: 'administrative' },
  { id: 'library', name: 'Library', icon: BookOpen, category: 'library' },
  { id: 'canteen', name: 'Canteen', icon: Coffee, category: 'canteen' },
  { id: 'sports', name: 'Sports', icon: Dumbbell, category: 'sports' },
  { id: 'hostel', name: 'Hostel', icon: Home, category: 'hostel' },
];

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const Maps = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<CampusLocation | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(CAMPUS_CENTER);
  const [mapZoom, setMapZoom] = useState(16);
  const [campusLocations, setCampusLocations] = useState<CampusLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAR, setShowAR] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('campus_locations')
        .select('*')
        .order('name');
      
      if (data && !error) {
        setCampusLocations(data);
      }
      setLoading(false);
    };
    fetchLocations();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
        },
        (error) => {
          console.log('Error getting location:', error);
          setUserLocation(CAMPUS_CENTER);
        }
      );
    }
  };

  const handlePurposeSelect = (purposeId: string) => {
    setSelectedPurpose(purposeId);
    const purpose = purposes.find(p => p.id === purposeId);
    if (purpose) {
      const location = campusLocations.find(l => l.category === purpose.category);
      if (location) {
        setSelectedDestination(location);
        setMapCenter([location.latitude, location.longitude]);
        setMapZoom(18);
      }
    }
  };

  const handleLocationSelect = (location: CampusLocation) => {
    setSelectedDestination(location);
    setMapCenter([location.latitude, location.longitude]);
    setMapZoom(18);
    setSelectedPurpose(null);
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading map...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold">Campus Maps</h1>
                  <p className="text-muted-foreground text-xs">Navigate MITS Campus</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAR(true)} className="mr-2">
              <Camera className="w-4 h-4 mr-2" />
              AR View
            </Button>
            <Button variant="outline" size="sm" onClick={getUserLocation}>
              <Navigation className="w-4 h-4 mr-2" />
              My Location
            </Button>
          </div>
        </div>
      </header>

      {/* AR View */}
      {showAR && (
        <ARView
          locations={campusLocations}
          userLocation={userLocation}
          onClose={() => setShowAR(false)}
        />
      )}

      <div className="flex flex-col lg:flex-row h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-card border-b lg:border-b-0 lg:border-r border-border overflow-y-auto">
          {/* Purpose Selector */}
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-primary" />
              What's your purpose?
            </h3>
            <div className="grid grid-cols-5 lg:grid-cols-3 gap-2">
              {purposes.map((purpose) => (
                <button
                  key={purpose.id}
                  onClick={() => handlePurposeSelect(purpose.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    selectedPurpose === purpose.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <purpose.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{purpose.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Locations List */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Campus Locations
            </h3>
            {campusLocations.length === 0 ? (
              <p className="text-muted-foreground text-sm">No locations added yet.</p>
            ) : (
              <div className="space-y-2">
                {campusLocations.map((location) => {
                  const CategoryIcon = categoryIcons[location.category] || MapPin;
                  return (
                    <button
                      key={location.id}
                      onClick={() => handleLocationSelect(location)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                        selectedDestination?.id === location.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${categoryColors[location.category] || categoryColors.other}20` }}
                      >
                        <CategoryIcon
                          className="w-5 h-5"
                          style={{ color: categoryColors[location.category] || categoryColors.other }}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground text-sm">{location.name}</h4>
                        <p className="text-xs text-muted-foreground">{location.description || location.category}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={CAMPUS_CENTER}
            zoom={16}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* User Location Marker */}
            {userLocation && (
              <Marker position={userLocation} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>Your Location</strong>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Campus Location Markers */}
            {campusLocations.map((location) => (
              <Marker
                key={location.id}
                position={[location.latitude, location.longitude]}
                icon={createCustomIcon(categoryColors[location.category] || categoryColors.other)}
              >
                <Popup>
                  <div className="text-center">
                    <strong className="block mb-1">{location.name}</strong>
                    <span className="text-sm text-muted-foreground">{location.description}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Selected Destination Card */}
          {selectedDestination && (
            <div className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 bg-card rounded-xl shadow-lg border border-border p-4 animate-slide-up">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${categoryColors[selectedDestination.category] || categoryColors.other}20` }}
                >
                  {(() => {
                    const CategoryIcon = categoryIcons[selectedDestination.category] || MapPin;
                    return (
                      <CategoryIcon
                        className="w-6 h-6"
                        style={{ color: categoryColors[selectedDestination.category] || categoryColors.other }}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className="font-display font-semibold text-foreground">{selectedDestination.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{selectedDestination.description}</p>
                  <Button size="sm" className="w-full" onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedDestination.latitude},${selectedDestination.longitude}`;
                    window.open(url, '_blank');
                  }}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maps;

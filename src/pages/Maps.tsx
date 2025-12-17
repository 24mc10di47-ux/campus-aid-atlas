import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, MapPin, Building, BookOpen, Coffee, Dumbbell, Home, GraduationCap, Compass, Target, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ARView from '@/components/ARView';

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
  other: MapPin,
};

const purposes = [
  { id: 'admission', name: 'Admission', icon: GraduationCap, category: 'administrative' },
  { id: 'library', name: 'Library', icon: BookOpen, category: 'library' },
  { id: 'canteen', name: 'Canteen', icon: Coffee, category: 'canteen' },
  { id: 'sports', name: 'Sports', icon: Dumbbell, category: 'sports' },
  { id: 'hostel', name: 'Hostel', icon: Home, category: 'hostel' },
];

const Maps = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<CampusLocation | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
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
      }
    }
  };

  const handleLocationSelect = (location: CampusLocation) => {
    setSelectedDestination(location);
    setSelectedPurpose(null);
  };

  const launchAR = () => {
    getUserLocation();
    setShowAR(true);
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* AR View */}
      {showAR && (
        <ARView
          locations={campusLocations}
          userLocation={userLocation}
          onClose={() => setShowAR(false)}
        />
      )}

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Eye className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold">AR Campus Navigator</h1>
                  <p className="text-muted-foreground text-xs">Explore MITS in Augmented Reality</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Launch AR Button */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl p-8 text-center border border-primary/20">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Augmented Reality View</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Point your camera or drag to explore campus locations in an immersive AR experience
            </p>
            <Button size="lg" onClick={launchAR} className="gap-2">
              <Eye className="w-5 h-5" />
              Launch AR Navigator
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Purpose Selector */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              What's your purpose?
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {purposes.map((purpose) => (
                <button
                  key={purpose.id}
                  onClick={() => handlePurposeSelect(purpose.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    selectedPurpose === purpose.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <purpose.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{purpose.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Destination */}
          {selectedDestination && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Selected Destination
              </h3>
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${categoryColors[selectedDestination.category] || categoryColors.other}20` }}
                >
                  {(() => {
                    const CategoryIcon = categoryIcons[selectedDestination.category] || MapPin;
                    return (
                      <CategoryIcon
                        className="w-7 h-7"
                        style={{ color: categoryColors[selectedDestination.category] || categoryColors.other }}
                      />
                    );
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{selectedDestination.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{selectedDestination.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={launchAR} className="gap-1">
                      <Eye className="w-4 h-4" />
                      View in AR
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedDestination.latitude},${selectedDestination.longitude}`;
                      window.open(url, '_blank');
                    }}>
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Locations List */}
        <div className="mt-6 bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            All Campus Locations
          </h3>
          {campusLocations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No locations added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {campusLocations.map((location) => {
                const CategoryIcon = categoryIcons[location.category] || MapPin;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleLocationSelect(location)}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
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
                    <div className="min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">{location.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{location.description || location.category}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Maps;
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';

interface AddLocationDialogProps {
  onLocationAdded: () => void;
}

const categories = [
  { value: 'academic', label: 'Academic' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'library', label: 'Library' },
  { value: 'canteen', label: 'Canteen' },
  { value: 'sports', label: 'Sports' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'parking', label: 'Parking' },
  { value: 'other', label: 'Other' },
];

const AddLocationDialog = ({ onLocationAdded }: AddLocationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [floorInfo, setFloorInfo] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          toast({ title: 'Location captured', description: 'Your current coordinates have been filled in.' });
        },
        () => {
          toast({ title: 'Error', description: 'Could not get your location', variant: 'destructive' });
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !latitude || !longitude) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('campus_locations').insert({
        name,
        category,
        description: description || null,
        floor_info: floorInfo || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        image_url: imageUrl,
      });

      if (error) throw error;

      toast({ title: 'Success', description: 'Location added successfully!' });
      setOpen(false);
      resetForm();
      onLocationAdded();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('');
    setDescription('');
    setFloorInfo('');
    setLatitude('');
    setLongitude('');
    setImageUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Location
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Campus Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Library"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this location"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="floorInfo">Floor Info</Label>
            <Input
              id="floorInfo"
              value={floorInfo}
              onChange={(e) => setFloorInfo(e.target.value)}
              placeholder="e.g., Ground Floor, Room 101"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="26.2124"
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="78.1772"
                required
              />
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} className="w-full">
            Use My Current Location
          </Button>

          <div>
            <Label>Image</Label>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              folder="locations"
              className="mt-1"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Add Location
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLocationDialog;

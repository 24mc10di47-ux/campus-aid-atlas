import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingBag, Clock, MapPin, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';

interface Shop { 
  id: string; 
  name: string; 
  description: string | null; 
  category: string; 
  location: string | null; 
  opening_time: string | null; 
  closing_time: string | null; 
  contact: string | null;
  image_url: string | null;
}
interface ShopItem { id: string; name: string; price: number; category: string | null; is_available: boolean | null; }

const Shops = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Record<string, ShopItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    opening_time: '',
    closing_time: '',
    contact: '',
    image_url: null as string | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: shopsData } = await supabase.from('shops').select('*').order('name');
      const { data: itemsData } = await supabase.from('shop_items').select('*');
      if (shopsData) setShops(shopsData);
      if (itemsData) {
        const grouped: Record<string, ShopItem[]> = {};
        itemsData.forEach(item => { grouped[item.shop_id] = [...(grouped[item.shop_id] || []), item]; });
        setItems(grouped);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please sign in', description: 'You must be logged in to add a shop.', variant: 'destructive' });
      return;
    }
    if (!formData.name || !formData.category) {
      toast({ title: 'Missing fields', description: 'Name and category are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase
        .from('shops')
        .insert({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          location: formData.location || null,
          opening_time: formData.opening_time || null,
          closing_time: formData.closing_time || null,
          contact: formData.contact || null,
          image_url: formData.image_url,
          status: 'approved',
          submitted_by: user.id,
        });

      if (insertError) throw insertError;

      toast({ title: 'Shop added!', description: 'Your shop has been added successfully.' });
      setDialogOpen(false);
      setFormData({ name: '', description: '', category: '', location: '', opening_time: '', closing_time: '', contact: '', image_url: null });
      
      const { data: shopsData } = await supabase.from('shops').select('*').order('name');
      if (shopsData) setShops(shopsData);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to add shop', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-lg font-bold">Campus Shops</h1>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Shop</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Shop</DialogTitle>
                  <DialogDescription>Fill in the details to add a new campus shop.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Shop Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter shop name" /></div>
                  <div><Label>Category *</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Food & Beverages</SelectItem>
                        <SelectItem value="stationery">Stationery</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the shop" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Opening Time</Label><Input type="time" value={formData.opening_time} onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })} /></div>
                    <div><Label>Closing Time</Label><Input type="time" value={formData.closing_time} onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })} /></div>
                  </div>
                  <div><Label>Location</Label><Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., Near Main Gate" /></div>
                  <div><Label>Contact</Label><Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} placeholder="Phone number" /></div>
                  <div><Label>Shop Image</Label><ImageUpload value={formData.image_url} onChange={(url) => setFormData({ ...formData, image_url: url })} /></div>
                  <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Adding...' : <><Plus className="w-4 h-4 mr-2" />Add Shop</>}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {shops.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No shops registered yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {shops.map(shop => (
              <div key={shop.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                {shop.image_url ? <img src={shop.image_url} alt={shop.name} className="w-full h-48 object-cover" /> : <div className="w-full h-48 bg-primary/10 flex items-center justify-center"><ShoppingBag className="w-16 h-16 text-primary/40" /></div>}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-display text-xl font-semibold">{shop.name}</h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full capitalize">{shop.category}</span>
                  </div>
                  {shop.description && <p className="text-sm text-muted-foreground mb-4">{shop.description}</p>}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {shop.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />{shop.location}</p>}
                    {(shop.opening_time || shop.closing_time) && <p className="flex items-center gap-2"><Clock className="w-4 h-4" />{shop.opening_time} - {shop.closing_time}</p>}
                    {shop.contact && <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{shop.contact}</p>}
                  </div>
                </div>
                {items[shop.id]?.length > 0 && (
                  <div className="border-t border-border p-4 bg-muted/30">
                    <h4 className="font-medium text-sm mb-3">Menu / Items</h4>
                    <div className="space-y-2">{items[shop.id].slice(0, 5).map(item => <div key={item.id} className="flex justify-between text-sm"><span>{item.name}</span><span className="font-medium">₹{item.price}</span></div>)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shops;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, MapPin, Phone, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ImageUpload from '@/components/ImageUpload';

interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  description: string;
  image_url: string | null;
  location: string | null;
  contact_info: string | null;
  status: string;
  created_at: string;
  user_id?: string;
}

const LostFound = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [userItems, setUserItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'lost' | 'found'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost' as 'lost' | 'found',
    title: '',
    description: '',
    location: '',
    contact_info: '',
    image_url: null as string | null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?mode=login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    // Fetch public browsing view (no contact info)
    const { data: publicData } = await supabase
      .from('browse_lost_found_items' as any)
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch user's own items (with full contact info)
    const { data: ownData } = await supabase
      .from('lost_found_items')
      .select('*')
      .eq('user_id', user?.id || '')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (ownData) {
      setUserItems(ownData as LostFoundItem[]);
    }

    // Merge: replace public items with user's own items where applicable
    if (publicData) {
      const userItemIds = new Set(ownData?.map(i => i.id) || []);
      const mergedItems = publicData.map((item: any) => {
        if (userItemIds.has(item.id)) {
          return ownData?.find(i => i.id === item.id) || item;
        }
        return { ...item, contact_info: null };
      });
      setItems(mergedItems as LostFoundItem[]);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('lost_found_items').insert({
      ...formData,
      user_id: user.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Item posted successfully!' });
      setIsDialogOpen(false);
      setFormData({ type: 'lost', title: '', description: '', location: '', contact_info: '', image_url: null });
      fetchItems();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('lost_found_items').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Deleted', description: 'Item removed successfully.' });
      fetchItems();
    }
  };

  const filteredItems = filter === 'all' ? items : items.filter(item => item.type === filter);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="font-display text-lg font-bold">Lost & Found</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Post Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Post Lost/Found Item</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Button type="button" variant={formData.type === 'lost' ? 'default' : 'outline'} onClick={() => setFormData({...formData, type: 'lost'})} className="flex-1">Lost</Button>
                  <Button type="button" variant={formData.type === 'found' ? 'default' : 'outline'} onClick={() => setFormData({...formData, type: 'found'})} className="flex-1">Found</Button>
                </div>
                <ImageUpload 
                  value={formData.image_url} 
                  onChange={(url) => setFormData({...formData, image_url: url})}
                  folder="lost-found"
                />
                <Input placeholder="Item title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                <Textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                <Input placeholder="Location (optional)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                <Input placeholder="Contact info" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} required />
                <Button type="submit" className="w-full">Post Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {(['all', 'lost', 'found'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
              {item.image_url && (
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.type === 'lost' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                    {item.type.toUpperCase()}
                  </span>
                  {item.user_id === user?.id && (
                    <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                  )}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                {item.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{item.location}</p>}
                {item.contact_info ? (
                  <p className="text-xs text-primary flex items-center gap-1"><Phone className="w-3 h-3" />{item.contact_info}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Contact info hidden for privacy</p>
                )}
              </div>
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && <p className="text-center text-muted-foreground py-12">No items found.</p>}
      </main>
    </div>
  );
};

export default LostFound;

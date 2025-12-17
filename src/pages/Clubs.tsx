import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Mail, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ImageUpload from '@/components/ImageUpload';

interface Club { 
  id: string; 
  name: string; 
  description: string | null; 
  faculty_coordinator: string; 
  faculty_email: string | null; 
  recruitment_open: boolean | null; 
  recruitment_info: string | null;
  logo_url: string | null;
  status?: string;
}

const Clubs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    faculty_coordinator: '',
    faculty_email: '',
    recruitment_info: '',
    logo_url: null as string | null,
    approval_faculty_email: '',
  });

  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase.from('clubs').select('*').order('name');
      if (data) setClubs(data);
      setLoading(false);
    };
    fetchClubs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Please sign in', description: 'You must be logged in to submit a club.', variant: 'destructive' });
      return;
    }
    if (!formData.name || !formData.faculty_coordinator || !formData.approval_faculty_email) {
      toast({ title: 'Missing fields', description: 'Name, faculty coordinator, and approval email are required.', variant: 'destructive' });
      return;
    }
    if (!formData.approval_faculty_email.endsWith('@mitsgwalior.in')) {
      toast({ title: 'Invalid email', description: 'Approval email must end with @mitsgwalior.in', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: club, error: insertError } = await supabase
        .from('clubs')
        .insert({
          name: formData.name,
          description: formData.description || null,
          faculty_coordinator: formData.faculty_coordinator,
          faculty_email: formData.faculty_email || null,
          recruitment_info: formData.recruitment_info || null,
          logo_url: formData.logo_url,
          status: 'pending',
          submitted_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).single();

      await supabase.functions.invoke('send-approval-email', {
        body: {
          itemType: 'club',
          itemId: club.id,
          itemName: formData.name,
          submitterName: profile?.full_name || 'User',
          submitterEmail: profile?.email || user.email,
          facultyEmail: formData.approval_faculty_email,
          description: formData.description,
        },
      });

      toast({ title: 'Club submitted!', description: 'A faculty member will review your submission.' });
      setDialogOpen(false);
      setFormData({ name: '', description: '', faculty_coordinator: '', faculty_email: '', recruitment_info: '', logo_url: null, approval_faculty_email: '' });
      
      const { data: clubsData } = await supabase.from('clubs').select('*').order('name');
      if (clubsData) setClubs(clubsData);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit club', variant: 'destructive' });
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
            <h1 className="font-display text-lg font-bold">Club Information</h1>
          </div>
          {user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Club</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submit New Club</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Club Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter club name" /></div>
                  <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the club" /></div>
                  <div><Label>Faculty Coordinator *</Label><Input value={formData.faculty_coordinator} onChange={(e) => setFormData({ ...formData, faculty_coordinator: e.target.value })} placeholder="Prof. Name" /></div>
                  <div><Label>Faculty Email</Label><Input value={formData.faculty_email} onChange={(e) => setFormData({ ...formData, faculty_email: e.target.value })} placeholder="faculty@mitsgwalior.in" type="email" /></div>
                  <div><Label>Recruitment Info</Label><Textarea value={formData.recruitment_info} onChange={(e) => setFormData({ ...formData, recruitment_info: e.target.value })} placeholder="How to join, requirements, etc." /></div>
                  <div><Label>Club Logo</Label><ImageUpload value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url })} /></div>
                  <div className="border-t border-border pt-4">
                    <Label>Faculty Email for Approval *</Label>
                    <Input value={formData.approval_faculty_email} onChange={(e) => setFormData({ ...formData, approval_faculty_email: e.target.value })} placeholder="approver@mitsgwalior.in" type="email" />
                    <p className="text-xs text-muted-foreground mt-1">Must be a @mitsgwalior.in email</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Submitting...' : <><Send className="w-4 h-4 mr-2" />Submit for Approval</>}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {clubs.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No clubs registered yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map(club => (
              <div key={club.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow relative">
                {club.status === 'pending' && <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full z-10">Pending</div>}
                {club.logo_url ? <img src={club.logo_url} alt={club.name} className="w-full h-40 object-cover" /> : <div className="w-full h-40 bg-primary/10 flex items-center justify-center"><Users className="w-16 h-16 text-primary/40" /></div>}
                <div className="p-6">
                  <h3 className="font-display text-xl font-semibold mb-2">{club.name}</h3>
                  {club.description && <p className="text-sm text-muted-foreground mb-4">{club.description}</p>}
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Faculty: {club.faculty_coordinator}</p>
                    {club.faculty_email && <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />{club.faculty_email}</p>}
                    {club.recruitment_open && <span className="inline-block px-3 py-1 bg-green-500/10 text-green-600 text-xs rounded-full">Recruiting</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Clubs;

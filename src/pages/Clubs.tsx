import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, Mail, Plus, Send, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  approval_token?: string | null;
}

const Clubs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalLinks, setApprovalLinks] = useState<{ approve: string; reject: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<'approve' | 'reject' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    faculty_coordinator: '',
    faculty_email: '',
    recruitment_info: '',
    logo_url: null as string | null,
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
    if (!formData.name || !formData.faculty_coordinator) {
      toast({ title: 'Missing fields', description: 'Name and faculty coordinator are required.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Generate approval token
      const approvalToken = crypto.randomUUID();
      
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
          approval_token: approvalToken,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Store pending approval record
      await supabase.from('pending_approvals').insert({
        item_type: 'club',
        item_id: club.id,
        submitted_by: user.id,
        faculty_email: formData.faculty_email || 'pending',
        approval_token: approvalToken,
      });

      // Generate approval links
      const baseUrl = window.location.origin;
      const approveUrl = `${baseUrl}/approve?token=${approvalToken}&action=approve`;
      const rejectUrl = `${baseUrl}/approve?token=${approvalToken}&action=reject`;

      setApprovalLinks({ approve: approveUrl, reject: rejectUrl });
      setDialogOpen(false);
      setApprovalDialogOpen(true);
      setFormData({ name: '', description: '', faculty_coordinator: '', faculty_email: '', recruitment_info: '', logo_url: null });
      
      const { data: clubsData } = await supabase.from('clubs').select('*').order('name');
      if (clubsData) setClubs(clubsData);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to submit club', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (link: string, type: 'approve' | 'reject') => {
    await navigator.clipboard.writeText(link);
    setCopiedLink(type);
    toast({ title: 'Copied!', description: 'Link copied to clipboard.' });
    setTimeout(() => setCopiedLink(null), 2000);
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
                  <DialogDescription>Fill in the details. You'll receive approval links to share with faculty.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Club Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter club name" /></div>
                  <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the club" /></div>
                  <div><Label>Faculty Coordinator *</Label><Input value={formData.faculty_coordinator} onChange={(e) => setFormData({ ...formData, faculty_coordinator: e.target.value })} placeholder="Prof. Name" /></div>
                  <div><Label>Faculty Email</Label><Input value={formData.faculty_email} onChange={(e) => setFormData({ ...formData, faculty_email: e.target.value })} placeholder="faculty@mitsgwalior.in" type="email" /></div>
                  <div><Label>Recruitment Info</Label><Textarea value={formData.recruitment_info} onChange={(e) => setFormData({ ...formData, recruitment_info: e.target.value })} placeholder="How to join, requirements, etc." /></div>
                  <div><Label>Club Logo</Label><ImageUpload value={formData.logo_url} onChange={(url) => setFormData({ ...formData, logo_url: url })} /></div>
                  <Button type="submit" className="w-full" disabled={submitting}>{submitting ? 'Submitting...' : <><Send className="w-4 h-4 mr-2" />Submit for Approval</>}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      {/* Approval Links Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Club Submitted Successfully!
            </DialogTitle>
            <DialogDescription>
              Share these links with the faculty coordinator for approval. The club will be visible once approved.
            </DialogDescription>
          </DialogHeader>
          {approvalLinks && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-green-600 font-medium">Approval Link</Label>
                <div className="flex gap-2">
                  <Input value={approvalLinks.approve} readOnly className="text-xs" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(approvalLinks.approve, 'approve')}>
                    {copiedLink === 'approve' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-red-600 font-medium">Rejection Link</Label>
                <div className="flex gap-2">
                  <Input value={approvalLinks.reject} readOnly className="text-xs" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(approvalLinks.reject, 'reject')}>
                    {copiedLink === 'reject' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Send the approval link to the faculty coordinator. They can click it to approve or reject the club.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
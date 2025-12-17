import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Approve = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const processApproval = async () => {
      const token = searchParams.get('token');
      const action = searchParams.get('action');

      if (!token || !action) {
        setStatus('error');
        setMessage('Invalid approval link');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('process-approval', {
          body: { token, action },
        });

        if (error) throw error;

        setStatus('success');
        setMessage(data.message || `Item has been ${action === 'approve' ? 'approved' : 'rejected'}`);
      } catch (err: any) {
        console.error('Approval error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to process approval');
      }
    };

    processApproval();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="font-display text-2xl font-bold mb-2">Processing...</h1>
            <p className="text-muted-foreground">Please wait while we process your request.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Success!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold mb-2">Error</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link to="/">
              <Button variant="outline">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Approve;

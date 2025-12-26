import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  token: string;
  action: 'approve' | 'reject';
}

// Simple in-memory rate limiter (resets on function cold start)
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const requests = rateLimiter.get(ip) || [];
  const recentRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimiter.set(ip, recentRequests);
  return true;
};

// Input validation
const validateInput = (token: unknown, action: unknown): { valid: boolean; error?: string } => {
  if (typeof token !== 'string' || token.length === 0 || token.length > 100) {
    return { valid: false, error: 'Invalid request' };
  }
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return { valid: false, error: 'Invalid request' };
  }
  if (action !== 'approve' && action !== 'reject') {
    return { valid: false, error: 'Invalid request' };
  }
  return { valid: true };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { token, action } = body;
    
    // Validate inputs
    const validation = validateInput(token, action);
    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing approval request from IP:", clientIp);

    // Find the pending approval (with expiration check - 30 days)
    const { data: approval, error: findError } = await supabase
      .from("pending_approvals")
      .select("*")
      .eq("approval_token", token)
      .eq("status", "pending")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 days expiry
      .maybeSingle();

    if (findError) {
      console.error("Error finding approval:", findError);
      return new Response(JSON.stringify({ error: "Processing failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!approval) {
      return new Response(JSON.stringify({ error: "This approval link is invalid, expired, or already processed." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the approval status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateApprovalError } = await supabase
      .from("pending_approvals")
      .update({ status: newStatus })
      .eq("id", approval.id);

    if (updateApprovalError) {
      console.error("Error updating approval:", updateApprovalError);
      return new Response(JSON.stringify({ error: "Processing failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the actual item status
    const tableName = approval.item_type === 'shop' ? 'shops' : 'clubs';
    const { error: updateItemError } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq("id", approval.item_id);

    if (updateItemError) {
      console.error("Error updating item:", updateItemError);
      return new Response(JSON.stringify({ error: "Processing failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully ${action}ed ${approval.item_type} ${approval.item_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${approval.item_type === 'shop' ? 'Shop' : 'Club'} has been ${newStatus}` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in process-approval function:", error);
    return new Response(
      JSON.stringify({ error: "Processing failed. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

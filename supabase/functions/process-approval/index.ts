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

// Input validation
const validateInput = (token: unknown, action: unknown): { valid: boolean; error?: string } => {
  if (typeof token !== 'string' || token.length === 0 || token.length > 100) {
    return { valid: false, error: 'Invalid token format' };
  }
  // UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(token)) {
    return { valid: false, error: 'Invalid token format' };
  }
  if (action !== 'approve' && action !== 'reject') {
    return { valid: false, error: 'Invalid action - must be "approve" or "reject"' };
  }
  return { valid: true };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log("Processing approval:", { token, action });

    // Find the pending approval
    const { data: approval, error: findError } = await supabase
      .from("pending_approvals")
      .select("*")
      .eq("approval_token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (findError) {
      console.error("Error finding approval:", findError);
      throw findError;
    }

    if (!approval) {
      return new Response(JSON.stringify({ error: "Invalid or already processed approval token" }), {
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
      throw updateApprovalError;
    }

    // Update the actual item status
    const tableName = approval.item_type === 'shop' ? 'shops' : 'clubs';
    const { error: updateItemError } = await supabase
      .from(tableName)
      .update({ status: newStatus })
      .eq("id", approval.item_id);

    if (updateItemError) {
      console.error("Error updating item:", updateItemError);
      throw updateItemError;
    }

    console.log(`Successfully ${action}ed ${approval.item_type} ${approval.item_id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${approval.item_type === 'shop' ? 'Shop' : 'Club'} has been ${newStatus}` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in process-approval function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

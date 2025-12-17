import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  itemType: 'shop' | 'club';
  itemId: string;
  itemName: string;
  submitterName: string;
  submitterEmail: string;
  facultyEmail: string;
  description?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { itemType, itemId, itemName, submitterName, submitterEmail, facultyEmail, description }: ApprovalEmailRequest = await req.json();

    console.log("Received approval request:", { itemType, itemId, itemName, facultyEmail });

    // Generate approval token
    const approvalToken = crypto.randomUUID();

    // Get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    let userId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store pending approval
    const { error: approvalError } = await supabase
      .from("pending_approvals")
      .insert({
        item_type: itemType,
        item_id: itemId,
        submitted_by: userId,
        faculty_email: facultyEmail,
        approval_token: approvalToken,
      });

    if (approvalError) {
      console.error("Error creating approval record:", approvalError);
      throw approvalError;
    }

    // Update the item with approval token
    const tableName = itemType === 'shop' ? 'shops' : 'clubs';
    const { error: updateError } = await supabase
      .from(tableName)
      .update({ approval_token: approvalToken, submitted_by: userId })
      .eq('id', itemId);

    if (updateError) {
      console.error("Error updating item:", updateError);
    }

    // Create approval URL
    const baseUrl = req.headers.get("origin") || "https://36014776-bc14-4ae2-985e-9ec7a851b4ba.lovableproject.com";
    const approveUrl = `${baseUrl}/approve?token=${approvalToken}&action=approve`;
    const rejectUrl = `${baseUrl}/approve?token=${approvalToken}&action=reject`;

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MITS Campus Portal <onboarding@resend.dev>",
        to: [facultyEmail],
        subject: `Approval Request: New ${itemType === 'shop' ? 'Shop' : 'Club'} - ${itemName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a365d;">New ${itemType === 'shop' ? 'Shop' : 'Club'} Submission</h1>
            <p>Dear Faculty,</p>
            <p>A new ${itemType} has been submitted for approval on the MITS Campus Portal.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #2d3748;">${itemName}</h2>
              <p><strong>Submitted by:</strong> ${submitterName} (${submitterEmail})</p>
              ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
            </div>
            
            <p>Please review and take action:</p>
            
            <div style="margin: 30px 0;">
              <a href="${approveUrl}" style="background: #38a169; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">
                ✓ Approve
              </a>
              <a href="${rejectUrl}" style="background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                ✗ Reject
              </a>
            </div>
            
            <p style="color: #718096; font-size: 14px;">
              If the buttons don't work, copy and paste these links:<br>
              Approve: ${approveUrl}<br>
              Reject: ${rejectUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #a0aec0; font-size: 12px;">MITS Campus Portal - Madhav Institute of Technology & Science, Gwalior</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent:", emailResult);

    return new Response(JSON.stringify({ success: true, approvalToken }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
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

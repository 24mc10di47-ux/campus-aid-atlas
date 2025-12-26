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

// Input validation
const validateApprovalEmailInput = (data: unknown): { valid: boolean; error?: string; data?: ApprovalEmailRequest } => {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request data' };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Validate itemType
  if (obj.itemType !== 'shop' && obj.itemType !== 'club') {
    return { valid: false, error: 'Invalid item type' };
  }
  
  // Validate itemId (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof obj.itemId !== 'string' || !uuidRegex.test(obj.itemId)) {
    return { valid: false, error: 'Invalid item ID' };
  }
  
  // Validate itemName (required, max 200 chars)
  if (typeof obj.itemName !== 'string' || obj.itemName.length === 0 || obj.itemName.length > 200) {
    return { valid: false, error: 'Invalid item name' };
  }
  
  // Validate submitterName (required, max 200 chars)
  if (typeof obj.submitterName !== 'string' || obj.submitterName.length === 0 || obj.submitterName.length > 200) {
    return { valid: false, error: 'Invalid submitter name' };
  }
  
  // Validate emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof obj.submitterEmail !== 'string' || !emailRegex.test(obj.submitterEmail) || obj.submitterEmail.length > 255) {
    return { valid: false, error: 'Invalid submitter email' };
  }
  if (typeof obj.facultyEmail !== 'string' || !emailRegex.test(obj.facultyEmail) || obj.facultyEmail.length > 255) {
    return { valid: false, error: 'Invalid faculty email' };
  }
  
  // Validate description (optional, max 2000 chars)
  if (obj.description !== undefined && obj.description !== null) {
    if (typeof obj.description !== 'string' || obj.description.length > 2000) {
      return { valid: false, error: 'Invalid description' };
    }
  }
  
  return { 
    valid: true, 
    data: {
      itemType: obj.itemType as 'shop' | 'club',
      itemId: obj.itemId as string,
      itemName: obj.itemName as string,
      submitterName: obj.submitterName as string,
      submitterEmail: obj.submitterEmail as string,
      facultyEmail: obj.facultyEmail as string,
      description: obj.description as string | undefined,
    }
  };
};

// Sanitize string for HTML output to prevent XSS
const sanitizeForHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawBody = await req.json();
    
    // Validate input
    const validation = validateApprovalEmailInput(rawBody);
    if (!validation.valid || !validation.data) {
      console.error("Validation failed:", validation.error);
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { itemType, itemId, itemName, submitterName, submitterEmail, facultyEmail, description } = validation.data;

    console.log("Received approval request:", { itemType, itemId });

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
      return new Response(JSON.stringify({ error: "Failed to process request. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Sanitize user inputs for HTML email
    const safeItemName = sanitizeForHtml(itemName);
    const safeSubmitterName = sanitizeForHtml(submitterName);
    const safeSubmitterEmail = sanitizeForHtml(submitterEmail);
    const safeDescription = description ? sanitizeForHtml(description) : '';

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
        subject: `Approval Request: New ${itemType === 'shop' ? 'Shop' : 'Club'} - ${safeItemName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a365d;">New ${itemType === 'shop' ? 'Shop' : 'Club'} Submission</h1>
            <p>Dear Faculty,</p>
            <p>A new ${itemType} has been submitted for approval on the MITS Campus Portal.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #2d3748;">${safeItemName}</h2>
              <p><strong>Submitted by:</strong> ${safeSubmitterName} (${safeSubmitterEmail})</p>
              ${safeDescription ? `<p><strong>Description:</strong> ${safeDescription}</p>` : ''}
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
            
            <p style="color: #a0aec0; font-size: 12px; margin-top: 20px;">
              This approval link will expire in 30 days.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #a0aec0; font-size: 12px;">MITS Campus Portal - Madhav Institute of Technology & Science, Gwalior</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-approval-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send approval email. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

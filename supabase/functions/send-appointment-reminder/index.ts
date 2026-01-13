import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Step 1: Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Create client with user's JWT to validate the token
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Step 3: Get the authenticated user
    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      console.error("Invalid token:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Step 4: Verify user has doctor or admin role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData) {
      console.error("Failed to fetch user role:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden - Unable to verify permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["doctor", "admin"].includes(roleData.role)) {
      console.error(`User ${user.id} has insufficient role: ${roleData.role}`);
      return new Response(
        JSON.stringify({ error: "Forbidden - Insufficient permissions" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} has role: ${roleData.role}`);

    // Step 5: Parse request body
    const { appointmentId, reminderType } = await req.json();

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: "Bad Request - appointmentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing reminder for appointment ${appointmentId}, type: ${reminderType}`);

    // Step 6: Fetch appointment details with patient info
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        patients:patient_id (
          full_name,
          phone,
          email
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      console.error("Failed to fetch appointment:", fetchError);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 7: For doctors, verify they have access to this appointment
    if (roleData.role === "doctor" && appointment.doctor_id !== user.id) {
      console.error(`Doctor ${user.id} does not have access to appointment ${appointmentId}`);
      return new Response(
        JSON.stringify({ error: "Forbidden - You can only send reminders for your own appointments" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const patient = appointment.patients as any;
    const scheduledAt = new Date(appointment.scheduled_at);
    const formattedDate = scheduledAt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = scheduledAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Create reminder message
    const message = `
      Hello ${patient.full_name},
      
      This is a reminder for your upcoming appointment:
      
      📅 Date: ${formattedDate}
      ⏰ Time: ${formattedTime}
      📋 Reason: ${appointment.reason || "General Consultation"}
      
      Please arrive 10 minutes early. If you need to reschedule, contact us as soon as possible.
      
      - CareTag Medical Team
    `.trim();

    console.log("Reminder message prepared for patient:", patient.full_name);

    // Log the reminder for tracking (in production, integrate with SMS/Email service)
    const { error: logError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        action: "REMINDER_SENT",
        entity_type: "appointment",
        entity_id: appointmentId,
        user_id: user.id,
        details: {
          reminder_type: reminderType,
          patient_name: patient.full_name,
          scheduled_at: appointment.scheduled_at,
          sent_by_role: roleData.role,
        },
      });

    if (logError) {
      console.error("Failed to log reminder:", logError);
    }

    // In production, integrate with:
    // - Twilio for SMS
    // - SendGrid/Mailgun for Email
    // - Firebase Cloud Messaging for push notifications

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reminder processed successfully",
        details: {
          appointmentId,
          patientName: patient.full_name,
          scheduledAt: appointment.scheduled_at,
          reminderType,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing reminder:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

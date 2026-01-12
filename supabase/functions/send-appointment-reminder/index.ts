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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointmentId, reminderType } = await req.json();

    console.log(`Processing reminder for appointment ${appointmentId}, type: ${reminderType}`);

    // Fetch appointment details with patient info
    const { data: appointment, error: fetchError } = await supabase
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

    console.log("Reminder message prepared:", message);

    // Log the reminder for tracking (in production, integrate with SMS/Email service)
    const { error: logError } = await supabase
      .from("audit_logs")
      .insert({
        action: "REMINDER_SENT",
        entity_type: "appointment",
        entity_id: appointmentId,
        details: {
          reminder_type: reminderType,
          patient_name: patient.full_name,
          patient_phone: patient.phone,
          patient_email: patient.email,
          scheduled_at: appointment.scheduled_at,
          message: message,
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

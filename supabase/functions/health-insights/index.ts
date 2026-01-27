import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's auth context to validate token
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate the JWT token using getUser
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Create admin client for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check user role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      console.error('Failed to fetch user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - No role assigned' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userRole = roleData.role;

    // Only doctors and admins can access health insights
    if (userRole !== 'doctor' && userRole !== 'admin') {
      console.error('User does not have required role:', userRole);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { patientId } = await req.json();

    if (!patientId) {
      return new Response(
        JSON.stringify({ error: 'Patient ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for admins (full access). For doctors, use the user-scoped client so
    // Row-Level Security (RLS) stays the source of truth and matches what the UI can access.
    const db = userRole === 'admin' ? supabaseAdmin : supabaseUserClient;

    console.log(`User ${userId} (${userRole}) requesting health insights for patient ${patientId}`);

    // Fetch patient data using selected client
    const [patientResult, vitalsResult, prescriptionsResult, recordsResult] = await Promise.all([
      db.from('patients').select('*').eq('id', patientId).maybeSingle(),
      db.from('vitals').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }).limit(20),
      db.from('prescriptions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10),
      db.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10)
    ]);

    const firstError = patientResult.error || vitalsResult.error || prescriptionsResult.error || recordsResult.error;
    if (firstError) {
      console.error('Failed to fetch patient context for insights:', firstError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch patient data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const patient = patientResult.data;
    const vitals = vitalsResult.data || [];
    const prescriptions = prescriptionsResult.data || [];
    const records = recordsResult.data || [];

    // If doctors can't see the patient due to RLS, treat it as forbidden.
    if (!patient) {
      return new Response(
        JSON.stringify({
          error: userRole === 'admin'
            ? 'Patient not found'
            : 'Forbidden - No access to this patient'
        }),
        { status: userRole === 'admin' ? 404 : 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating health insights for patient: ${patient.full_name}`);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context for AI
    const patientContext = `
Patient Information:
- Name: ${patient.full_name}
- Age: ${calculateAge(patient.date_of_birth)} years
- Gender: ${patient.gender}
- Blood Group: ${patient.blood_group || 'Unknown'}
- Allergies: ${patient.allergies?.join(', ') || 'None recorded'}
- Chronic Conditions: ${patient.chronic_conditions?.join(', ') || 'None recorded'}
- Current Medications: ${patient.current_medications?.join(', ') || 'None recorded'}

Recent Vitals (last 20 readings):
${vitals.map(v => `- ${v.recorded_at}: HR=${v.heart_rate || 'N/A'}, BP=${v.blood_pressure_systolic || 'N/A'}/${v.blood_pressure_diastolic || 'N/A'}, SpO2=${v.spo2 || 'N/A'}%, Temp=${v.temperature || 'N/A'}°C`).join('\n')}

Recent Medical History:
${records.map(r => `- ${r.created_at}: ${r.record_type} - ${r.diagnosis || 'No diagnosis'}`).join('\n')}

Active Prescriptions:
${prescriptions.filter(p => p.status === 'active').map(p => `- ${p.diagnosis}: ${JSON.stringify(p.medications)}`).join('\n')}
`;

    const prompt = `You are an AI health analyst for a medical application. Based on the patient data provided, generate actionable health insights.

${patientContext}

Analyze this patient data and provide:
1. Key health risks or concerns (based on vitals trends, conditions, medications)
2. Recommended screenings or tests
3. Lifestyle recommendations
4. Any medication considerations or potential interactions
5. A brief overall health summary

Respond in valid JSON format only:
{
  "overallStatus": "good|moderate|concerning|critical",
  "summary": "Brief overall health summary",
  "risks": [
    { "title": "Risk title", "severity": "low|medium|high", "description": "Details" }
  ],
  "recommendations": [
    { "category": "screening|lifestyle|medication|followup", "title": "Recommendation", "priority": "low|medium|high", "details": "Details" }
  ],
  "vitalsTrend": {
    "heartRate": "stable|increasing|decreasing|fluctuating",
    "bloodPressure": "normal|elevated|low|fluctuating",
    "oxygenation": "normal|low|concerning"
  },
  "nextSteps": ["Step 1", "Step 2", "Step 3"]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a clinical AI assistant providing health insights. Always respond with valid JSON only. Be medically accurate but note you are providing decision support, not diagnoses.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    console.log('AI response received');

    // Parse the JSON response
    let result;
    try {
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
      if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
      if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
      result = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = {
        overallStatus: 'moderate',
        summary: 'Unable to generate detailed insights. Please review patient data manually.',
        risks: [],
        recommendations: [],
        vitalsTrend: { heartRate: 'stable', bloodPressure: 'normal', oxygenation: 'normal' },
        nextSteps: ['Review patient vitals', 'Schedule follow-up appointment']
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error generating health insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate health insights';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

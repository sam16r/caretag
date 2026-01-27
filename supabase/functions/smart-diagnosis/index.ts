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

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Invalid token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    if (roleData.role !== 'doctor' && roleData.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { patientId, symptoms, chiefComplaint, duration, severity } = await req.json();

    if (!patientId) {
      return new Response(
        JSON.stringify({ error: 'Patient ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Smart Diagnosis request for patient ${patientId} by user ${userId}`);

    const db = roleData.role === 'admin' ? supabaseAdmin : supabaseUserClient;

    // Fetch comprehensive patient data
    const [patientResult, vitalsResult, prescriptionsResult, recordsResult, labsResult] = await Promise.all([
      db.from('patients').select('*').eq('id', patientId).maybeSingle(),
      db.from('vitals').select('*').eq('patient_id', patientId).order('recorded_at', { ascending: false }).limit(5),
      db.from('prescriptions').select('*').eq('patient_id', patientId).eq('status', 'active'),
      db.from('medical_records').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(15),
      db.from('lab_results').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10)
    ]);

    const firstError = patientResult.error || vitalsResult.error || prescriptionsResult.error || recordsResult.error || labsResult.error;
    if (firstError) {
      console.error('Failed to fetch patient data:', firstError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch patient data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const patient = patientResult.data;
    if (!patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vitals = vitalsResult.data || [];
    const prescriptions = prescriptionsResult.data || [];
    const records = recordsResult.data || [];
    const labs = labsResult.data || [];

    console.log(`Generating differential diagnosis for: ${patient.full_name}`);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build comprehensive clinical context
    const latestVitals = vitals[0];
    const patientAge = calculateAge(patient.date_of_birth);

    const clinicalContext = `
PATIENT DEMOGRAPHICS:
- Name: ${patient.full_name}
- Age: ${patientAge} years
- Gender: ${patient.gender}
- Blood Group: ${patient.blood_group || 'Unknown'}

KNOWN ALLERGIES: ${patient.allergies?.length ? patient.allergies.join(', ') : 'None documented'}

CHRONIC CONDITIONS: ${patient.chronic_conditions?.length ? patient.chronic_conditions.join(', ') : 'None documented'}

CURRENT MEDICATIONS:
${prescriptions.length ? prescriptions.map(p => {
  const meds = Array.isArray(p.medications) ? p.medications : [];
  return meds.map((m: any) => `- ${m.name || 'Unknown'} ${m.dosage || ''} (${m.frequency || 'unknown frequency'})`).join('\n');
}).join('\n') : 'None documented'}

LATEST VITALS (${latestVitals ? new Date(latestVitals.recorded_at).toLocaleDateString() : 'No recent vitals'}):
${latestVitals ? `
- Heart Rate: ${latestVitals.heart_rate || 'N/A'} bpm
- Blood Pressure: ${latestVitals.blood_pressure_systolic || 'N/A'}/${latestVitals.blood_pressure_diastolic || 'N/A'} mmHg
- SpO2: ${latestVitals.spo2 || 'N/A'}%
- Temperature: ${latestVitals.temperature || 'N/A'}°C
- Respiratory Rate: ${latestVitals.respiratory_rate || 'N/A'}/min
` : 'No recent vitals recorded'}

RECENT LAB RESULTS:
${labs.length ? labs.slice(0, 5).map(l => `- ${l.test_name}: ${l.result_value} ${l.result_unit || ''} (Ref: ${l.reference_min || '?'}-${l.reference_max || '?'})`).join('\n') : 'No recent lab results'}

MEDICAL HISTORY (Recent Records):
${records.slice(0, 10).map(r => `- [${new Date(r.created_at).toLocaleDateString()}] ${r.record_type}: ${r.diagnosis || r.notes || 'No details'}`).join('\n') || 'No recent records'}

---
CURRENT PRESENTATION:
- Chief Complaint: ${chiefComplaint || 'Not specified'}
- Symptoms: ${symptoms?.length ? symptoms.join(', ') : 'Not specified'}
- Duration: ${duration || 'Not specified'}
- Severity: ${severity || 'Not specified'}
`;

    const systemPrompt = `You are an advanced clinical decision support AI assisting physicians with differential diagnosis. Your role is to:
1. Analyze patient data and presenting symptoms
2. Generate a prioritized list of differential diagnoses
3. Suggest relevant investigations and tests
4. Provide clinical reasoning for each diagnosis
5. Highlight red flags or urgent conditions

IMPORTANT DISCLAIMERS:
- This is decision support only, NOT a definitive diagnosis
- The physician must use clinical judgment
- Always consider life-threatening conditions first
- Recommend specialist referral when appropriate

Respond in valid JSON format only.`;

    const userPrompt = `Based on the following clinical data, provide a differential diagnosis analysis:

${clinicalContext}

Generate a comprehensive differential diagnosis with the following structure:
{
  "chiefComplaint": "Summarized chief complaint",
  "clinicalImpression": "Brief clinical impression based on available data",
  "differentialDiagnoses": [
    {
      "diagnosis": "Condition name",
      "probability": "high|moderate|low",
      "icdCode": "ICD-10 code if known",
      "reasoning": "Clinical reasoning supporting this diagnosis",
      "supportingFindings": ["Finding 1", "Finding 2"],
      "againstFindings": ["Finding that argues against"],
      "urgency": "emergent|urgent|routine"
    }
  ],
  "redFlags": [
    {
      "finding": "Concerning finding",
      "implication": "What this could indicate",
      "action": "Recommended immediate action"
    }
  ],
  "recommendedInvestigations": [
    {
      "test": "Test name",
      "rationale": "Why this test is needed",
      "priority": "immediate|soon|routine"
    }
  ],
  "recommendedActions": [
    {
      "action": "Action to take",
      "timing": "immediate|today|this_week",
      "rationale": "Why this action"
    }
  ],
  "specialistReferrals": [
    {
      "specialty": "Specialty name",
      "urgency": "emergent|urgent|routine",
      "reason": "Reason for referral"
    }
  ],
  "clinicalPearls": ["Relevant clinical tip or consideration"],
  "disclaimer": "This is AI-assisted decision support. Clinical judgment is essential."
}

Provide 3-5 differential diagnoses ranked by probability. Focus on the most likely and most dangerous conditions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
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
    
    console.log('Smart diagnosis AI response received');

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
        chiefComplaint: chiefComplaint || 'Unable to process',
        clinicalImpression: 'AI analysis could not be completed. Please review patient data manually.',
        differentialDiagnoses: [],
        redFlags: [],
        recommendedInvestigations: [],
        recommendedActions: [{ action: 'Review patient manually', timing: 'today', rationale: 'AI parsing failed' }],
        specialistReferrals: [],
        clinicalPearls: [],
        disclaimer: 'This is AI-assisted decision support. Clinical judgment is essential.'
      };
    }

    // Always ensure disclaimer is present
    result.disclaimer = result.disclaimer || 'This is AI-assisted decision support. Clinical judgment is essential. This is not a definitive diagnosis.';
    result.generatedAt = new Date().toISOString();
    result.patientId = patientId;

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in smart diagnosis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate diagnosis';
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

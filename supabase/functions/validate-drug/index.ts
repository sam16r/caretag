import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OPENFDA_API_URL = 'https://api.fda.gov/drug/drugsfda.json';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
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

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log('Authenticated user:', userId);

    const { drugName } = await req.json();

    if (!drugName || drugName.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          suggestions: [], 
          message: 'Drug name must be at least 2 characters' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchTerm = encodeURIComponent(drugName.trim());
    
    // Search OpenFDA for the drug
    const response = await fetch(
      `${OPENFDA_API_URL}?search=openfda.brand_name:"${searchTerm}"+openfda.generic_name:"${searchTerm}"&limit=10`
    );

    if (!response.ok) {
      // If no results, FDA returns 404
      if (response.status === 404) {
        console.log(`No FDA results for: ${drugName}`);
        return new Response(
          JSON.stringify({ 
            valid: false, 
            suggestions: [], 
            message: 'No matching drugs found in FDA database' 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`FDA API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract unique drug names from results
    const drugNames = new Set<string>();
    const drugDetails: Array<{ brandName: string; genericName: string; manufacturer: string }> = [];

    for (const result of data.results || []) {
      const openfda = result.openfda || {};
      const brandNames = openfda.brand_name || [];
      const genericNames = openfda.generic_name || [];
      const manufacturers = openfda.manufacturer_name || [];

      for (const brand of brandNames) {
        if (!drugNames.has(brand.toLowerCase())) {
          drugNames.add(brand.toLowerCase());
          drugDetails.push({
            brandName: brand,
            genericName: genericNames[0] || '',
            manufacturer: manufacturers[0] || ''
          });
        }
      }

      for (const generic of genericNames) {
        if (!drugNames.has(generic.toLowerCase())) {
          drugNames.add(generic.toLowerCase());
          drugDetails.push({
            brandName: brandNames[0] || '',
            genericName: generic,
            manufacturer: manufacturers[0] || ''
          });
        }
      }
    }

    // Check if exact match exists
    const normalizedSearch = drugName.trim().toLowerCase();
    const exactMatch = drugDetails.some(
      d => d.brandName.toLowerCase() === normalizedSearch || 
           d.genericName.toLowerCase() === normalizedSearch
    );

    console.log(`Drug search for "${drugName}": found ${drugDetails.length} results, exact match: ${exactMatch}`);

    return new Response(
      JSON.stringify({ 
        valid: exactMatch,
        suggestions: drugDetails.slice(0, 5),
        totalResults: drugDetails.length,
        message: exactMatch 
          ? 'Drug verified in FDA database' 
          : drugDetails.length > 0 
            ? 'Similar drugs found - please select from suggestions'
            : 'No matching drugs found'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating drug:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        suggestions: [], 
        message: 'Error checking drug database',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

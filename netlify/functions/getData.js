import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY // or SERVICE_ROLE if it's server-only
);

export async function handler() {
  try {
    const { data, error } = await supabase
      .from("cost_analysis_responses")
      .select("id, created_at, data");  // fetch id + timestamp + JSON

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const data = JSON.parse(event.body);

    // ✅ Extract IP from Netlify headers
    const ip = event.headers['x-forwarded-for']?.split(",")[0] || "unknown";

    // ✅ Guard 1: Check if same IP submitted recently (e.g., 24h)
    const { data: existingIP, error: ipError } = await supabase
      .from("cost_analysis_responses")
      .select("created_at")
      .eq("ip", ip)
      .gte("created_at", new Date(Date.now() - 24*60*60*1000).toISOString());

    if (ipError) throw ipError;
    if (existingIP.length > 0) {
      return { statusCode: 429, body: "Too many submissions from this IP. Try again later." };
    }

    // ✅ Guard 2: Prevent duplicate shop name
    const { data: existingShop, error: shopError } = await supabase
      .from("cost_analysis_responses")
      .select("id")
      .eq("data->>unit_name", data.unit_name);

    if (shopError) throw shopError;
    if (existingShop.length > 0) {
      return { statusCode: 409, body: "This shop has already submitted." };
    }

    // ✅ Insert with IP tagging
    const { error } = await supabase
      .from("cost_analysis_responses")
      .insert([{ data, ip }]);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Inserted successfully" }),
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
}

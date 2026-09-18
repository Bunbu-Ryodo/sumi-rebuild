// Supabase Edge Function: picks a random first-chapter extract and pushes it to every
// user with a saved Expo push token. Invoked on a schedule via pg_cron (see migrations).
import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100; // Expo's push API accepts up to 100 messages per request

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: extracts, error: extractError } = await supabase
    .from("extracts")
    .select("id, title, author")
    .eq("chapter", 1);

  if (extractError || !extracts || extracts.length === 0) {
    return new Response(
      JSON.stringify({
        error: extractError?.message ?? "No first-chapter extracts found",
      }),
      { status: 500 },
    );
  }

  const extract = extracts[Math.floor(Math.random() * extracts.length)];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("push_token")
    .not("push_token", "is", null);

  if (profilesError) {
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
    });
  }

  const tokens = (profiles ?? [])
    .map((p) => p.push_token)
    .filter((t): t is string => !!t && t.startsWith("ExponentPushToken"));

  if (tokens.length === 0) {
    return new Response(
      JSON.stringify({ message: "No push tokens to notify" }),
      { status: 200 },
    );
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: `Start reading: ${extract.title}`,
    body: `Chapter one by ${extract.author} is waiting for you.`,
    data: { extractId: extract.id },
  }));

  const results = [];
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });
    results.push(await response.json());
  }

  return new Response(
    JSON.stringify({ extractId: extract.id, notified: tokens.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});

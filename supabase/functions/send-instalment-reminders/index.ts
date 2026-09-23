import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async () => {
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("id, userid")
    .eq("active", true)
    .lt("due", Date.now());

  if (subscriptionsError) {
    console.error("Error fetching due subscriptions:", subscriptionsError);
    return new Response(JSON.stringify({ error: subscriptionsError.message }), {
      status: 500,
    });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const userIds = [...new Set(subscriptions.map((s) => s.userid))];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, push_token")
    .in("user_id", userIds)
    .not("push_token", "is", null);

  if (profilesError) {
    console.error("Error fetching push tokens:", profilesError);
    return new Response(JSON.stringify({ error: profilesError.message }), {
      status: 500,
    });
  }

  const messages = (profiles ?? []).map((profile) => ({
    to: profile.push_token,
    sound: "default",
    title: "Sumi",
    body: "You have instalments waiting",
  }));

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const pushResponse = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messages),
  });

  if (!pushResponse.ok) {
    const body = await pushResponse.text();
    console.error("Error sending push notifications:", body);
    return new Response(JSON.stringify({ error: body }), { status: 502 });
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    status: 200,
  });
});

import supabase from "../lib/supabase";

export async function savePushToken(userId: string, token: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("user_id", userId);

  if (error) {
    console.error("Error saving push token:", error);
    return false;
  }
  return true;
}

export async function clearPushToken(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: null })
    .eq("user_id", userId);

  if (error) {
    console.error("Error clearing push token:", error);
    return false;
  }
  return true;
}

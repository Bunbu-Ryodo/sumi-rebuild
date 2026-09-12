import supabase from "../lib/supabase";

export async function updateSubscriptionInterval(
  userId: string,
  interval: number,
) {
  const { error: fetchError } = await supabase
    .from("profiles")
    .update({ subscriptioninterval: interval })
    .eq("user_id", userId);

  if (fetchError) {
    console.error("Error fetching profile:", fetchError);
    return false;
  } else {
    console.log("Updated subscription interval");
  }
}

export async function setStreakChecking(
  userId: string,
  streakChecking: boolean,
) {
  const { error: fetchError } = await supabase
    .from("profiles")
    .update({ checkForStreak: streakChecking })
    .eq("user_id", userId);
}

export async function updateHighscore(userId: string, highscore: number) {
  const { error } = await supabase
    .from("profiles")
    .update({ highscore })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating highscore:", error);
    return false;
  }
  return true;
}

export async function getHighscoreLeaderboard() {
  const { data: leaderBoard, error } = await supabase
    .from("profiles")
    .select("user_id, username, highscore")
    .not("username", "is", null)
    .order("highscore", { ascending: false });

  if (error) {
    console.error("Error fetching highscore leaderboard:", error);
    return null;
  }

  return leaderBoard;
}

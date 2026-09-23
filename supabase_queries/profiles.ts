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

export async function getLeaderboardEntry(userId: string) {
  const { data: leaderboardEntry, error } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  return leaderboardEntry;
}

export async function createLeaderboardEntry(
  userId: string,
  username: string,
  highscore: number,
) {
  const { data: leaderboardEntry, error } = await supabase
    .from("leaderboard")
    .insert({ user_id: userId, username, highscore })
    .select()
    .single();

  if (error) {
    console.error("Error creating leaderboard entry:", error);
    return null;
  }

  return leaderboardEntry;
}

export async function updateLeaderboardHighscore(
  userId: string,
  highscore: number,
) {
  const { error } = await supabase
    .from("leaderboard")
    .update({ highscore })
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating leaderboard highscore:", error);
    return false;
  }

  return true;
}

export async function getLeaderboard() {
  const { data: leaderBoard, error } = await supabase
    .from("leaderboard")
    .select("user_id, username, highscore")
    .order("highscore", { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return null;
  }

  return leaderBoard;
}

import supabase from "../lib/supabase";

export async function updateSubscriptionInterval(userId: string, interval: number){
  const { error: fetchError } = await supabase
    .from("profiles")
    .update({subscriptioninterval: interval})
    .eq("user_id", userId)

  if(fetchError){
    console.error("Error fetching profile:", fetchError);
    return false;
  } else {
    console.log("Updated subscription interval")
  }
}

export async function setStreakChecking(userId: string, streakChecking: boolean){
  const { error: fetchError } = await supabase
    .from("profiles")
    .update({checkForStreak: streakChecking})
    .eq("user_id", userId)
}
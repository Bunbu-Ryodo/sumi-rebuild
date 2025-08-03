import supabase from "../lib/supabase";
import { AchievementType } from "../types/types";

export async function awardAchievement(userId: string, title: string){
    if(!userId || !title){
        throw new Error("Missing required parameters");
    }

    const { data: achievement, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("title", title)
    .single();

    if (error) {
        console.error("Error fetching achievement:", error);
        return null;
    } else {
        const { data: profileData, error: profileFetchError } = await supabase
        .from("profiles")
        .select("achievements, achievementScore, bronzeCount, silverCount, goldCount")
        .eq("user_id", userId)
        .single();

        if (profileFetchError) {
            console.error("Error fetching profile data:", profileFetchError);
            return null;
        } else {
            const currentAchievements = profileData.achievements || [];
            const alreadyExists = currentAchievements.some((ach: AchievementType) => ach.id === achievement.id);

            if(alreadyExists){
                console.log("Achievement already exists in profile:", achievement.title);
                return null;
            }

            achievement.date = new Date().getTime();

            const updatedAchievements = [...currentAchievements, achievement];

            const { error: updateError } = await supabase
            .from("profiles")
            .update({ achievements: updatedAchievements, achievementScore: profileData.achievementScore + achievement.score, bronzeCount: profileData.bronzeCount + (achievement.tier === "bronze" ? 1 : 0), silverCount: profileData.silverCount + (achievement.tier === "silver" ? 1 : 0), goldCount: profileData.goldCount + (achievement.tier === "gold" ? 1 : 0) })
            .eq("user_id", userId)
            .single();

            console.log("Updated Profile");

            if (updateError) {
                console.error("Error updating profile with new achievement:", updateError);
                return null;
            } else {
                return true;
            }
        }
    }
}

export async function fetchProfileAchievements(userId: string){
    if(!userId){
        throw new Error("Missing userId parameter");
    }

    const { data: profileData, error } = await supabase
    .from("profiles")
    .select("readertag, achievements, achievementScore")
    .eq("user_id", userId)
    .single();

    if (error) {
        console.error("Error fetching profile data:", error);
        return null;
    } else {
        return profileData || null
    }
}

export async function fetchAchievementByDescription(desc: string){
    if(!desc){
        throw new Error("Missing description parameter");
    }
    const { data: achievement, error } = await supabase
    .from("achievements")
    .select("*")
    .eq("description", desc)
    .single();

    if (error) {
        console.error("Error fetching achievement:", error);
        return null;
    } else {
        return achievement;
    }
}
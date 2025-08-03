import supabase from "../lib/supabase";
import { ExtractType } from "../types/types";

export async function markAsRead(userId: string, extract: ExtractType){
   const { data: currentReadExtracts, error: fetchError } = await supabase
   .from("profiles")
   .select("readExtracts, readCount")
   .eq("user_id", userId)
   .single();

   if(fetchError){
    console.error("Error fetching current read extracts:", fetchError);
    return;
   } else {
    const currentReadExtractsArray = currentReadExtracts.readExtracts || [];

    if (currentReadExtractsArray.some((item: ExtractType) => item.id === extract.id)) {
      console.log("Extract already marked as read:", extract.id);
      return;
    }

    const updatedReadExtracts = [...currentReadExtractsArray, extract];

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ readExtracts: updatedReadExtracts, readCount: currentReadExtracts.readCount + 1 })
      .eq("user_id", userId)
      .single();

    if (updateError) {
      console.error("Error updating read extracts:", updateError);
    } else {
      console.log("Successfully marked extract as read.");
    }
   }
}

export async function markAsUnread(userId: string, extract: ExtractType){
    const { data: currentReadExtracts, error: fetchError } = await supabase
    .from("profiles")
    .select("readExtracts, readCount")
    .eq("user_id", userId)
    .single();
    
    if(fetchError){
     console.error("Error fetching current read extracts:", fetchError);
     return;
    } else {
     const currentReadExtractsArray = currentReadExtracts.readExtracts || [];
    
     const updatedReadExtracts = currentReadExtractsArray.filter((item: ExtractType) => item.id !== extract.id);
    
     const { error: updateError } = await supabase
        .from("profiles")
        .update({ readExtracts: updatedReadExtracts, readCount: currentReadExtracts.readCount - 1 })
        .eq("user_id", userId)
        .single();
    
     if (updateError) {
        console.error("Error updating read extracts:", updateError);
     } else {
        console.log("Successfully marked extract as unread");
     }
    }
}

export async function checkReadStatus(userId: string, extract: number) {
  const { data: currentReadExtracts, error: fetchError } = await supabase
    .from("profiles")
    .select("readExtracts")
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    console.error("Error fetching current read extracts:", fetchError);
    return false;
  } else {
    const currentReadExtractsArray = currentReadExtracts.readExtracts || [];

    return currentReadExtractsArray.some((item: ExtractType) => item.id === extract);
  }
}

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
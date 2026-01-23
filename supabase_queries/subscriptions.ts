import supabase from '../lib/supabase';

export async function getStreak(userId: string){
  if(!userId){
    throw new Error("Missing required parameters");
  } 

  const { data: streak, error } = await supabase
    .from('streaks')
    .select()
    .eq('user_id', userId)
    .single();

    return streak;
}

export async function createStreak(userId: string, username: string){
  if(!userId){
    throw new Error("Missing required parameters");
  } 

  const { data: newStreak, error } = await supabase
    .from('streaks')
    .insert({ user_id: userId,  current_streak: 0, longest_streak: 0, username: username})
    .select()
    .single();
    return newStreak;
}

export async function updateStreak(userId: string, newStreakCount: number, lastUpdated: Date){
  if(!userId || newStreakCount === undefined){
    throw new Error("Missing required parameters");
  }

  const { data: updatedStreaks, error } = await supabase
    .from('streaks')
    .update({ current_streak: newStreakCount, last_updated: lastUpdated })
    .eq('user_id', userId)
    .select()
    .single();

  if(error){
    console.error("Error updating streaks:", error);
    return null;
  }

  return updatedStreaks;
}

export async function getLeaderBoard(){
  const { data: leaderBoard, error } = await supabase
    .from('streaks')
    .select()
    .order('current_streak', { ascending: false })

  if(error){
    console.error("Error fetching leaderboard:", error);
    return null;
  }

  return leaderBoard;
}

export async function changeUserNameOnStreak(userId: string, newUsername: string){
  if(!userId || !newUsername){  
    throw new Error("Missing required parameters");
  }
  const { data: updatedStreaks, error } = await supabase
    .from('streaks')
    .update({ username: newUsername})
    .eq('user_id', userId)
    .select()
    .single();
}

export async function resetStreak(userId: string, longest_streak: number){
  if(!userId){
    throw new Error("Missing required parameters");
  }

  const { data: resetStreaks, error } = await supabase
    .from('streaks')
    .update({ current_streak: 0, longest_streak: longest_streak })
    .eq('user_id', userId)
    .select()
    .single();
}

export async function createSubscription(userId: string, textId: number, chapter: number, due: number, subscribeart: string, title: string, author: string){
  if (!userId || !textId || !chapter || !due || !title || !author) {
    throw new Error("Missing required parameters");
  }

  const { data: newSubscription, error } = await supabase
  .from('subscriptions')
  .insert({ userid: userId, textid: textId, chapter: chapter, due: due, subscribeart: subscribeart }).select().single()

  return newSubscription;
}

export async function activateSubscription(id: number, due: number){
  if(!id || !due){
    throw new Error("Missing required parameters");
  }

  const { data, error: subscriptionUpdateError } = await supabase.from('subscriptions').update({active: true, due: due }).eq('id', id).select();

  if(subscriptionUpdateError){
    console.error("Error activating subscription:", subscriptionUpdateError);
    return null;
  }

  return data;
}

export async function deactivateSubscription(id: number){
  const { data, error: subscriptionDeactivateError } = await supabase.from('subscriptions').update({active: false}).eq('id', id).select();

  if(subscriptionDeactivateError){
    console.error("Error deactivating subscription:", subscriptionDeactivateError);
    return null;
  }

  return data;
}

export async function checkForSubscription(userId: string, textId: number){
    if (!userId || !textId) {
        throw new Error("Missing required parameters");
    }

    const { data: existingSubscription } = await supabase
        .from('subscriptions')
        .select()
        .match({ userid: userId, textid: textId })
        .select()
        .single();

    return existingSubscription;
}

export async function getAllDueSubscriptions(userId: string) {
  if(!userId){
    throw new Error("Missing required parameters");
  }


  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select()
    .match({ userid: userId, active: true })
    .lt('due', new Date().getTime())
    .select();

    if(error){
      console.error("Error fetching due subscriptions:", error);
      return null;
    }
    return subscriptions;
}

export async function getAllUpcomingSubscriptions(userId: string){
  if(!userId){
    throw new Error("Missing required parameters");
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select()
    .match({ userid: userId, active: true })
    .gt('due', new Date().getTime())
    .select();

    if(error){
      console.error("Error fetching active subscriptions:", error);
      return null;
    }
    return subscriptions;

}

export async function getExtractByTextIdChapter(textId: number, chapter: number){
  if(!textId){
    throw new Error("Missing required parameters");
  }

  const { data: extract, error } = await supabase
    .from('extracts')
    .select()
    .match({ textid: textId, chapter: chapter })
    .single();

    if(error){
      return null;
    }
    return extract;
}

export async function unhideSeries(userId: string, subscriptionid: number){
  if(!userId || !subscriptionid){
    throw new Error("Missing required parameters");
  }

  const { data: updatedSeries, error: updateError } = await supabase
    .from("series")
    .update({ hidden: false })
    .match({ userid: userId, subscriptionid: subscriptionid });

  if (updateError) {
    console.error("Error unhiding series:", updateError);
    return null;
  }

  return updatedSeries;
}

export async function hideSeries(userId: string, subscriptionid: number){
  if(!userId || !subscriptionid){
    throw new Error("Missing required parameters");
  }

  const { data: updatedSeries, error: updateError } = await supabase
    .from("series")
    .update({ hidden: true })
    .match({ userid: userId, subscriptionid: subscriptionid });

  if (updateError) {
    console.error("Error hiding series:", updateError);
    return null;
  }

  return updatedSeries;
}


export async function checkForSeries(userId: string, subscriptionid: number){
  if(!userId || !subscriptionid){
    throw new Error("Missing required parameters");
  }

  const { data: existingSeries } = await supabase
    .from('series')
    .select()
    .match({ userid: userId, subscriptionid: subscriptionid })
    .single();

  return existingSeries;
}

export async function createSeries(userId: string, title: string, author: string, subscriptionid: number, subscribeart: string, extracts: any[], earnedchapters: number, totalchapters: number, sequeldue?: number) {
    if (!userId || !title || !author || !subscriptionid || !subscribeart || !extracts || earnedchapters === undefined || totalchapters === undefined) {
    throw new Error("Missing required parameters");
  }
  const { data: instalment, error } = await supabase
    .from('series')
    .insert({ userid: userId, title: title, author: author, subscriptionid: subscriptionid, subscribeart: subscribeart, extracts: extracts, earnedchapters: earnedchapters, totalchapters: totalchapters, sequeldue: sequeldue })
    .select()
    .single();

  if (error) {
    console.error("Error creating series:", error);
    return null;
  }

  return instalment;
}

export async function appendExtractToSeries(userid: string, subscriptionid: number, extract: any, sequeldue: number){
  if(!userid || !subscriptionid){
    throw new Error("Missing required parameters");
  }

   const { data: currentSeries, error: cantFindRow } = await supabase
     .from("series")
     .select("*")
     .match({ userid: userid, subscriptionid: subscriptionid })
     .single();

     if(cantFindRow){
       console.error("Error finding instalment row:", cantFindRow);
       return null;
     }

     const currentExtracts = currentSeries?.extracts || [];

     const updatedExtracts = [...currentExtracts, extract];

  const { data: updatedSeries, error } = await supabase
    .from("series")
    .update({ extracts: updatedExtracts, earnedchapters: currentSeries?.earnedchapters + 1, sequeldue: sequeldue })
    .match({ userid: userid, subscriptionid: subscriptionid })
    .select()
    .single();

  if(error){
    console.error("Error adding extract to instalment:", error);
    return null;
  }

  return updatedSeries
}

export async function updateSeriesDueDate(userId: string, subscriptionid: number, sequeldue: number){
  if(!userId || !subscriptionid || !sequeldue){
    throw new Error("Missing required parameters");
  }

  const { data: updatedSeries, error } = await supabase
    .from('series')
    .update({ sequeldue: sequeldue })
    .match({ userid: userId, subscriptionid: subscriptionid })
    .select()
    .single();

  if(error){
    console.error("Error updating series due date:", error);
    return null;
  }

  return updatedSeries;
}

export async function updateSubscription(subscriptionId: number, chapter: number, due: number){
  if(!subscriptionId){
    throw new Error("Missing required parameters");
  }

  const { data: updatedSubscription, error } = await supabase
    .from('subscriptions')
    .update({chapter: chapter, due: due}) 
    .eq('id', subscriptionId)
    .select()
    .single();

  if(error){
    console.error("Error updating subscription:", error);
    return null;
  }

    return updatedSubscription;
}

export async function getAllSeries(userId: string){
  if(!userId){
    throw new Error("Missing required parameters");
  }

  const { data: series, error } = await supabase
    .from('series')
    .select()
    .match({ userid: userId, hidden: false })
    .select();

    if(error){
      console.error("Error fetching series:", error);
      return null;
    }

    return series;
}

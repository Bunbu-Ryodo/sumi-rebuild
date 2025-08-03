import supabase from '../lib/supabase';

export async function createSubscription(userId: string, textId: number, chapter: number, due: number, subscribeart: string, title: string, author: string){
  if (!userId || !textId || !chapter || !due || !title || !author) {
    throw new Error("Missing required parameters");
  }

  const { data: newSubscription, error } = await supabase
  .from('subscriptions')
  .insert({ userid: userId, textid: textId, chapter: chapter, due: due, subscribeart: subscribeart }).select().single()

  if (error) {
    console.error("Error creating subscription:", error);
    return null;
  }

  return newSubscription;
}

export async function activateSubscription(id: number, chapter: number, userId: string, due: number){
  const { data: profile, error: subscriptionUpdateError } = await supabase.from('subscriptions').update({active: true, chapter: chapter, due: due }).eq('id', id).select();

  if(subscriptionUpdateError){
    console.error("Error activating subscription:", subscriptionUpdateError);
    return null;
  }

  const { data: profileData, error: profileFetchError } = await supabase
  .from('profiles')
  .select('subscribedCount')
  .eq('user_id', userId)
  .select()
  .single();

  if(profileFetchError){
    console.error("Error fetching profile data:", profileFetchError);
  } else {
    const currentCount = profileData.subscribedCount || 0;
    const newCount = currentCount + 1;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscribedCount: newCount })
      .eq('user_id', userId);
    
    if(updateError){
      console.error("Error updating subscription count:", updateError);
      return null;
    }
  }
}

export async function deactivateSubscription(id: number, userId: string, chapter: number){
  const { error: subscriptionDeactivateError } = await supabase.from('subscriptions').update({active: false, chapter: chapter}).eq('id', id).select();

  if(subscriptionDeactivateError){
    console.error("Error deactivating subscription:", subscriptionDeactivateError);
    return null;
  }

  const { data: profileData, error: profileFetchError } = await supabase
  .from('profiles')
  .select('subscribedCount')
  .eq('user_id', userId)
  .select()
  .single();

  if(profileFetchError){
    console.error("Error fetching profile data:", profileFetchError);
  } else {
    const currentCount = profileData.subscribedCount || 0;
    const newCount = currentCount - 1;

    const {data: countUpdate, error: updateError } = await supabase
      .from('profiles')
      .update({ subscribedCount: newCount })
      .eq('user_id', userId);
    
    console.log("Updated subscription count:", countUpdate);

    if(updateError){
      console.error("Error updating subscription count:", updateError);
      return null;
    }

    const { data, error: instalmentDeleteError } = await supabase.from('instalments').delete().match({userid: userId, subscriptionid: id}).select();
    if(instalmentDeleteError){
      console.error("Error deleting instalments:", instalmentDeleteError);
      return null;
    }
  }
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

export async function createInstalment(userId: string, extractId: number, chapter: number, title: string, author: string, subscriptionId: number, subscribeart: string, sequeldue?: number){
  if(!userId || !extractId || !chapter || !title || !author){
    throw new Error("Missing required parameters");
  }

  const { data: instalment, error } = await supabase
    .from('instalments')
    .insert({ userid: userId, extractid: extractId, chapter: chapter, title: title, author: author, subscriptionid: subscriptionId, subscribeart: subscribeart, sequeldue: sequeldue })
    .select()
    .single();

    if(error){
      console.error("Error creating instalment:", error);
      return null;

    }

    return instalment;
}

export async function deletePreviousInstalments(userId: string, title: string){
  if(!userId || !title){
    throw new Error("Missing required parameters");
  }

  const { data: deletedInstalments, error } = await supabase
    .from('instalments')
    .delete()
    .match({ userid: userId, title: title })
    .select();

  if(error){
    console.error("Error deleting previous instalments:", error);
    return null;
  }

  return deletedInstalments;
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

export async function getAllInstalments(userId: string){
  if(!userId){
    throw new Error("Missing required parameters");
  }

  const { data: instalments, error } = await supabase
    .from('instalments')
    .select()
    .match({ userid: userId })
    .select();

    if(error){
      console.error("Error fetching instalments:", error);
      return null;
    }

    return instalments;
}
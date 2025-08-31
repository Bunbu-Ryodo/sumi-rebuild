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

export async function activateSubscription(id: number){
  const { data, error: subscriptionUpdateError } = await supabase.from('subscriptions').update({active: true }).eq('id', id).select();

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

export async function checkForInstalments(userId: string, subscriptionId: number) {
  if (!userId || !subscriptionId) {
    throw new Error("Missing required parameters");
  }

  const { data: instalments, error } = await supabase
    .from('instalments')
    .select()
    .match({ userid: userId, subscriptionid: subscriptionId });

  if (error) {
    console.error("Error fetching instalments:", error);
    return null;
  }

  return instalments;
}

export async function unhideInstalment(userId: string, subscriptionid: number){
  if(!userId || !subscriptionid){
    throw new Error("Missing required parameters");
  }

  const { data: updatedInstalment, error: updateError } = await supabase
    .from("instalments")
    .update({ hidden: false })
    .match({ userid: userId, subscriptionid: subscriptionid });

  if (updateError) {
    console.error("Error unhiding instalment:", updateError);
    return null;
  }

  return updatedInstalment;
}

export async function hideInstalment(userId: string, subscriptionid: number){
  if(!userId || !subscriptionid){
    throw new Error("Missing required parameters");
  }

  const { data: updatedInstalment, error: updateError } = await supabase
    .from("instalments")
    .update({ hidden: true })
    .match({ userid: userId, subscriptionid: subscriptionid });

  if (updateError) {
    console.error("Error hiding instalment:", updateError);
    return null;
  }

  return updatedInstalment;
}


export async function createNewInstalment(userId: string, title: string, author: string, subscriptionid: number, subscribeart: string, extracts: any[], earnedchapters: number, totalchapters: number, sequeldue?: number) {
    if (!userId || !title || !author || !subscriptionid || !subscribeart || !extracts || earnedchapters === undefined || totalchapters === undefined) {
    throw new Error("Missing required parameters");
  }
  const { data: instalment, error } = await supabase
    .from('instalments')
    .insert({ userid: userId, title: title, author: author, subscriptionid: subscriptionid, subscribeart: subscribeart, extracts: extracts, earnedchapters: earnedchapters, totalchapters: totalchapters, sequeldue: sequeldue })
    .select()
    .single();

  if (error) {
    console.error("Error creating instalment:", error);
    return null;
  }

  return instalment;
}

export async function addExtractToInstalment(userid: string, subscriptionid: number, extract: any, sequeldue: number){
  if(!userid || !subscriptionid){
    throw new Error("Missing required parameters");
  }

   const { data: currentInstalment, error: cantFindRow } = await supabase
     .from("instalments")
     .select("*")
     .match({ userid: userid, subscriptionid: subscriptionid })
     .single();

     if(cantFindRow){
       console.error("Error finding instalment row:", cantFindRow);
       return null;
     }

     const currentExtracts = currentInstalment?.extracts || [];

     const updatedExtracts = [...currentExtracts, extract];

  const { data: updatedInstalments, error } = await supabase
    .from("instalments")
    .update({ extracts: updatedExtracts, earnedchapters: currentInstalment?.earnedchapters + 1, sequeldue: sequeldue })
    .match({ userid: userid, subscriptionid: subscriptionid })
    .select()
    .single();

  if(error){
    console.error("Error adding extract to instalment:", error);
    return null;
  }

  return updatedInstalments
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
    .match({ userid: userId, hidden: false })
    .select();

    if(error){
      console.error("Error fetching instalments:", error);
      return null;
    }

    return instalments;
}

export async function getHiddenInstalments(userId: string){
  if(!userId){
    throw new Error("Missing required parameters");
  }

  const { data: instalments, error } = await supabase
    .from('instalments')
    .select()
    .match({ userid: userId, hidden: true })
    .select();

    if(error){
      console.error("Error fetching instalments:", error);
      return null;
    }

    return instalments;
}
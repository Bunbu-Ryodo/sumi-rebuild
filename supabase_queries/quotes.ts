import supabase from "../lib/supabase";

export async function saveUserQuote(userid: string, quote: string, title: string, author: string, textid: number, extractid: number, portrait: string, chapter: number, year: string, coverart: string){
    if(!quote||!userid||!title || !author|| !textid || !portrait || !extractid || !chapter || !year || !coverart){
        throw new Error("Missing required fields to save quote");
    }

  const { data, error } = await supabase
    .from("userquotes")
    .insert([
      {
        quote,
        userid,
        title,
        author,
        textid,
        extractid,
        portrait,
        chapter,
        year,
        coverart
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Error saving quote:", error);
    throw error;
  }

  return data;
}

export async function getUserQuotes(userid: string) {
  const { data, error } = await supabase
    .from("userquotes")
    .select("*")
    .eq("userid", userid);

  if (error) {
    console.error("Error fetching user quotes:", error);
    throw error;
  }

  return data;
}

export async function getQuoteById(id: number){
  const { data, error } = await supabase
    .from("userquotes")
    .select("*")
    .eq("id", id)
    .single();

    if(error){  
      console.error("Error fetching quote by id:", error);
      throw error;
    }

    return data;
}

export async function deleteUserQuote(quoteId: number, userid: string) {
  const { data, error } = await supabase
    .from("userquotes")
    .delete()
    .eq("id", quoteId)
    .eq("userid", userid)
    .select()
    .single();

  if (error) {
    console.error("Error deleting user quote:", error);
    return null;
  }

  return data;
}

export async function getQuoteByUserAndExtract(userid: string, extractid: number){
  if(!userid || !extractid){
    throw new Error("Missing required fields to get quote by user and extract");
  }

  const { data, error } = await supabase
    .from("userquotes")
    .select("*")
    .eq("userid", userid)
    .eq("extractid", extractid)


  if(error){
    console.error("Error fetching quote by user and extract:", error);
    throw error;
  }

  return data;
}
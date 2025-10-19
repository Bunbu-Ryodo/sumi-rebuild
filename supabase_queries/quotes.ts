import supabase from "../lib/supabase";

export async function saveUserQuote(userid: string, quote: string, title: string, author: string, textid: number){
    if(!quote||!userid||!title || !author|| !textid){
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
        textid
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
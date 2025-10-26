import supabase from "../lib/supabase";

export async function getMarginaliaByExtractAndUser(
  extractid: number,
  userid: string){
    if(!extractid || !userid){
      throw Error("Missing extractid or userid");
    }

    const { data, error } = await supabase
      .from("marginalia")
      .select("*")
      .eq("extractid", extractid)
      .eq("userid", userid)
      .single();

      return data;
  }

export async function saveMarginalia(
  extractid: number,
  userid: string,
  text: string){
    if(!extractid || !userid || !text){
      throw Error("Missing extractid, userid, or marginalia text");
    }

    // First check if marginalia already exists
    const existing = await getMarginaliaByExtractAndUser(extractid, userid);
    
    if (existing) {
      // Update existing marginalia
      const { data, error } = await supabase
        .from("marginalia")
        .update({
          text: text,
        })
        .eq("extractid", extractid)
        .eq("userid", userid)
        .select()
        .single();

      if(error){
        console.error("Error updating marginalia:", error);
        throw error;
      }
      return data;
    } else {
      // Create new marginalia
      const { data, error } = await supabase
        .from("marginalia")
        .insert({
          extractid,
          userid,
          text: text
        })
        .select()
        .single();

      if(error){
        console.error("Error creating marginalia:", error);
        throw error;
      }
      return data;
    }
  }

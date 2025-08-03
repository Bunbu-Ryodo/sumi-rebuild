import supabase from "../lib/supabase";

export async function saveUserArtwork(userId: string, title: string, artist: string, year: number, url: string){
    if (!userId || !title || !artist || !year) {
        throw new Error("Missing required parameters");
    }
    
    const { data, error } = await supabase
        .from("userartworks")
        .insert([{ userid: userId, title, artist, year, url }])
        .select()
        .single();
    
    if (error) {
        console.error("Error saving artwork:", error);
        return null;
    }
    
    return data;
}

export async function getUserArtworkById(id: string) {
    if (!id) {
        throw new Error("Missing required parameters");
    }
    
    const { data, error } = await supabase
        .from("userartworks")
        .select("*")
        .eq("id", id)
        .single();
    
    if (error) {
        console.error("Error fetching artwork by ID:", error);
        return null;
    }
    
    return data;
}

export async function checkUserArtworkExists(userId: string, title: string, artist: string, year: number) {
    if (!userId || !title) {
        throw new Error("Missing required parameters");
    }
    
    const { data } = await supabase
        .from("userartworks")
        .select("*")
        .eq("userid", userId)
        .eq("artist", artist)
        .eq("title", title)
        .eq("year", year)
        .single();
    
    return data;
}

export async function getUserArtworks(userId: string){
    if (!userId) {
        throw new Error("Missing userId parameter");
    }
    
    const { data, error } = await supabase
        .from("userartworks")
        .select("*")
        .eq("userid", userId)
    
    if (error) {
        console.error("Error fetching artworks:", error);
        return [];
    }
    
    return data || [];
}

export async function deleteUserArtwork(userId: string, id: number) {
    if (!userId || !id) {
        throw new Error("Missing required parameters");
    }
    
    const { data, error } = await supabase
        .from("userartworks")
        .delete()
        .eq("userid", userId)
        .eq("id", id)
        .select()
        .single();
    
    if (error) {
        console.error("Error deleting artwork:", error);
        return null;
    }
    
    return data;
}

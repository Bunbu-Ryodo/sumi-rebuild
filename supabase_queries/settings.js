import supabase from '../lib/supabase';

export async function updatePassword(password){
    const { data: passwordUpdated, error } = await supabase.auth.updateUser({ password: password })

    if(error){
        return null;
    }
    return passwordUpdated;
}

export async function updateUsername(username){
    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile, error: fetchProfileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

    if (fetchProfileError) {
        console.error('Error fetching profile:', fetchProfileError);
        return null
    }

    if (profile) {
        const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ username: username })
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return null;
        }
        return updatedProfile;
    } 
}

export async function getUsername(){
    const { data: { user } } = await supabase.auth.getUser();

     const { data } = await supabase
       .from('profiles')
       .select('*')
       .eq('user_id', user.id)
       .single();

     return data.username;
}
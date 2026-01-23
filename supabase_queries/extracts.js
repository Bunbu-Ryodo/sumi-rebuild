import supabase from '../lib/supabase';

export async function getExtract(extractId){
    const { data: extract, error } = await supabase
        .from('extracts')
        .select('*')
        .eq('id', extractId)
        .single();

    if(error) {
        console.error('Error fetching extract:', error);
        return null;
    }

    return extract;
}

export async function checkForReadingProgress(userId, extractId) {
    const { data: progress, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('extract_id', extractId)
        .eq('user_id', userId)
        .single();

    return progress;
}

export async function createReadingProgress(userId, extractId) {
    const { data, error } = await supabase
        .from('reading_progress')
        .insert([{ extract_id: extractId, user_id: userId }])
        .single();
    if(error) {
        console.error('Error creating reading progress:', error);
        return null;
    }   

    return data;
}

export async function updateReadingProgress(userId, extractId, progressPercentage, furthestScrollPosition) {
    const { data, error } = await supabase
        .from('reading_progress')
        .update({ progress_percentage: progressPercentage, furthest_scroll_position: furthestScrollPosition })
        .eq('extract_id', extractId)
        .eq('user_id', userId)
        .single();

        if(error){
        console.error('Error updating reading progress:', error);
        }

    return data; 
}
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
import supabase from '../lib/supabase';

export async function getExtracts(){
    const { data: extracts, error } = await supabase
        .from('extracts')
        .select('*')
        .eq('chapter', 1)

    if (error) {
        console.error('Error fetching extracts:', error);
        return null;
    }
    
    return extracts;
}
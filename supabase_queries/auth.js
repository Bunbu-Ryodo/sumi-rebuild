import supabase from '../lib/supabase';

export async function getUserSession(){
  const { data: { user } } = await supabase.auth.getUser()
  return user;
}

export async function createNewProfile(user_id, created_at, stripe_customer_id, subscription_id, subscription_status, client_secret){
const { data: userProfile, error } = await supabase
  .from('profiles')
  .insert([
    { user_id: user_id, created_at: created_at, stripe_customer_id: stripe_customer_id, subscription_id: subscription_id, subscription_status: subscription_status, client_secret: client_secret },
  ])
  .select()

  if(error){
    console.error('Error creating new profile:', error.message);
    return null;
  }
  return userProfile;
}

export async function hasActivePremiumSubscription(user_id) {
  const profile = await lookUpUserProfile(user_id);
  
  if (!profile) return false;
  
  const activeStatuses = ['active', 'trialing'];
  return activeStatuses.includes(profile.subscription_status);
}

export async function lookUpUserProfile(user_id){
  const { data: userProfile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error) {
    console.error('Error looking up user profile:', error);
    return null;
  }

  return userProfile;
}

export async function setLoginDateTime(user_id, lastLogin){

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ lastLogin: lastLogin })
      .eq('user_id', user_id)
      .select();

    if(updateError){
      console.error('Error updating last login:', updateError.message);
      return null;
    }
    return data;
}

export async function resetPassword(email){
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'sumirebuild:///changepassword',
  })
}

export async function updatePassword(password){
  await supabase.auth.updateUser({ password: password })
}
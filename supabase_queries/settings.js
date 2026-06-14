import supabase from "../lib/supabase";

const useTestPayment = process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";

export async function updatePassword(password) {
  const { data: passwordUpdated, error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return null;
  }
  return passwordUpdated;
}

export async function updateUsername(username) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: fetchProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (fetchProfileError) {
    console.error("Error fetching profile:", fetchProfileError);
    return null;
  }

  if (profile) {
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({ username: username })
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return null;
    }
    return updatedProfile;
  }
}

export async function getUsername() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data.username;
}

export async function updateEmail(email) {
  const { data: emailUpdated, error } = await supabase.auth.updateUser({
    email: email,
  });

  if (error) {
    console.error("Error updating email:", error.message);
    return null;
  }

  return emailUpdated;
}

export async function syncStripeCustomerEmailForCurrentUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return null;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user?.id || !user?.email) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.error(
      "Error finding profile for Stripe email sync:",
      profileError.message,
    );
    return null;
  }

  if (!profile?.stripe_customer_id) {
    return null;
  }

  const syncCustomerEmailFunction = useTestPayment
    ? "update-customer-email"
    : "prod-update-customer-email";

  const { data, error } = await supabase.functions.invoke(
    syncCustomerEmailFunction,
    {
      body: {
        customerId: profile.stripe_customer_id,
        email: user.email,
        userId: user.id,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (error) {
    console.error("Error syncing Stripe customer email:", error.message);
    return null;
  }

  return data;
}

export async function deleteCurrentUserAccount(password) {
  if (!password) {
    return { success: false, error: "Please enter your password." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return { success: false, error: "Unable to find your account right now." };
  }

  if (!user.email) {
    return { success: false, error: "Unable to verify your account email." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (signInError) {
    return { success: false, error: "Incorrect password." };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return { success: false, error: "No valid session for deletion request." };
  }

  const { error: deleteError } = await supabase.functions.invoke(
    "delete-user",
    {
      body: {
        userId: user.id,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (deleteError) {
    console.error("Error deleting account:", deleteError.message);
    return {
      success: false,
      error: `Unable to delete account right now: ${deleteError.message}`,
    };
  }

  await supabase.auth.signOut();
  return { success: true };
}

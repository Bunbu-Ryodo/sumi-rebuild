import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useStripe, PaymentSheetError } from "@stripe/stripe-react-native";
import {
  getUserSession,
  lookUpUserProfile,
  updateUserProfileSubscription,
} from "../supabase_queries/auth";
import { router } from "expo-router";
import supabase from "../lib/supabase";

const useTestPayment =
  __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";

export default function UpgradeButton() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isLoading, setIsLoading] = useState(false);

  const createFreshClientSecret = async (
    stripeCustomerId: string,
    userId: string,
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("No valid session");
    }

    let createSubscription;
    if (useTestPayment) {
      createSubscription = "create-subscription";
    } else {
      createSubscription = "prod-create-subscription";
    }

    const { data, error } = await supabase.functions.invoke(
      createSubscription,
      {
        body: { customerId: stripeCustomerId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    if (error) {
      throw error;
    }

    const { subscriptionId, status, clientSecret } = data || {};

    if (!clientSecret) {
      throw new Error("Missing client secret from create-subscription");
    }

    await updateUserProfileSubscription(
      userId,
      subscriptionId,
      status,
      clientSecret,
    );

    return clientSecret as string;
  };

  const initializePaymentSheet = async (forceRefreshClientSecret = false) => {
    const user = await getUserSession();

    if (!user) {
      throw new Error("No authenticated user session");
    }

    const profile = await lookUpUserProfile(user.id);

    if (!profile?.stripe_customer_id) {
      throw new Error("Missing Stripe customer ID on profile");
    }

    const subscriptionStatus = String(
      profile.subscription_status || "",
    ).toLowerCase();
    const shouldRefreshByStatus = [
      "canceled",
      "cancelled",
      "past_due",
      "unpaid",
      "incomplete_expired",
      "incomplete",
    ].includes(subscriptionStatus);

    const shouldRefreshClientSecret =
      forceRefreshClientSecret ||
      !profile.client_secret ||
      shouldRefreshByStatus;

    const clientSecret = shouldRefreshClientSecret
      ? await createFreshClientSecret(profile.stripe_customer_id, user.id)
      : profile.client_secret;

    if (!clientSecret) {
      throw new Error("Missing payment client secret on profile");
    }

    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: "Sumi Rebuild",
      returnURL: "sumirebuild://stripe-redirect",
    });

    return error;
  };

  return (
    <TouchableOpacity
      style={styles.premiumButton}
      disabled={isLoading}
      onPress={async () => {
        if (isLoading) {
          return;
        }

        setIsLoading(true);

        try {
          let initError = await initializePaymentSheet(false);

          const shouldRefreshIntent =
            !!initError?.message &&
            (initError.message.includes("status 'succeeded'") ||
              initError.message.includes("status 'canceled'"));

          if (shouldRefreshIntent) {
            initError = await initializePaymentSheet(true);
          }

          if (initError) {
            console.error(initError, "ERROR INITIALIZING PAYMENT SHEET");
            router.replace({
              pathname: "/billchangestatus",
              params: {
                message:
                  "Unable to start checkout. Please try again in a moment.",
              },
            });
            return;
          }

          const { error } = await presentPaymentSheet();

          if (error?.code === PaymentSheetError.Canceled) {
            console.error(error, "CANCELLED PAYMENT SHEET");
          } else if (error) {
            console.error(error, "ERROR PRESENTING PAYMENT SHEET");
            router.replace({
              pathname: "/billchangestatus",
              params: {
                message:
                  "Something went wrong. Please try again later or contact support@sumi.club.",
              },
            });
          } else {
            router.replace({
              pathname: "/billchangestatus",
              params: {
                message: "Payment succeeded. Thank you for upgrading!",
              },
            });
          }
        } catch (error) {
          console.error(error, "CHECKOUT INITIALIZATION FAILED");
          router.replace({
            pathname: "/billchangestatus",
            params: {
              message:
                "Unable to start checkout. Please try again later or contact support@sumi.club.",
            },
          });
        } finally {
          setIsLoading(false);
        }
      }}
    >
      <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  premiumButton: {
    backgroundColor: "#FE7F2D",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  premiumButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
});

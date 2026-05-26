import { TouchableOpacity, Text, StyleSheet } from "react-native";
import supabase from "../lib/supabase";
import { lookUpUserProfile } from "../supabase_queries/auth";
import { useRouter } from "expo-router";

const useTestPayment =
  __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";

export default function ReactivateButton() {
  const router = useRouter();
  const reactivateSubscription = async () => {
    const { data: session } = await supabase.auth.getSession();

    if (!session?.session?.access_token) {
      throw new Error("No valid session");
    }

    let reactivateSubscription;

    if (useTestPayment) {
      reactivateSubscription = "reactivate-subscription";
    } else {
      reactivateSubscription = "prod-reactivate-subscription";
    }

    if (session.session.user.id) {
      const profile = await lookUpUserProfile(session.session.user.id);
      const { data } = await supabase.functions.invoke(reactivateSubscription, {
        body: {
          subscriptionId: profile?.subscription_id,
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      });

      if (data) {
        router.push({
          pathname: "/billchangestatus",
          params: {
            message:
              "Reactivation succeeded. You will now continue to enjoy premium features uninterrupted!",
          },
        });
      } else {
        router.push({
          pathname: "/billchangestatus",
          params: {
            message:
              "Reactivation failed. Something went wrong. Please try again later or contact support@sumi.club.",
          },
        });
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.cancelButton}
      onPress={reactivateSubscription}
    >
      <Text style={styles.cancelButtonText}>Reactivate Subscription</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: "#77966D",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  cancelButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
});

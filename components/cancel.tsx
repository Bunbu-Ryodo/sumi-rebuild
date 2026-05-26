import { TouchableOpacity, Text, StyleSheet } from "react-native";
import supabase from "../lib/supabase";
import { lookUpUserProfile } from "../supabase_queries/auth";
import { useRouter } from "expo-router";

const useTestPayment = process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";

export default function CancelButton() {
  const router = useRouter();
  const cancelSubscription = async () => {
    const { data: session } = await supabase.auth.getSession();

    if (!session?.session?.access_token) {
      throw new Error("No valid session");
    }

    let cancelSubscription;
    if (useTestPayment) {
      cancelSubscription = "cancel-subscription";
    } else {
      cancelSubscription = "prod-cancel-subscription";
    }

    if (session.session.user.id) {
      const profile = await lookUpUserProfile(session.session.user.id);
      const { data } = await supabase.functions.invoke(cancelSubscription, {
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
              "Cancellation succeeded. We're sorry to see you go! If you have any feedback or need assistance, please contact support@sumi.club.",
          },
        });
      } else {
        router.push({
          pathname: "/billchangestatus",
          params: {
            message:
              "Cancellation failed. Something went wrong. Please try again later or contact support@sumi.club.",
          },
        });
      }
    }
  };

  return (
    <TouchableOpacity style={styles.cancelButton} onPress={cancelSubscription}>
      <Text style={styles.cancelButtonText}>Cancel Premium</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: "#D64045",
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

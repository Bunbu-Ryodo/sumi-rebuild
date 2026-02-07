import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import supabase from "../lib/supabase";
import {
  getUserSession,
  lookUpUserProfile,
  cancelSubscriptionAtPeriodEnd,
} from "../supabase_queries/auth";
import { useRouter } from "expo-router";

export default function CancelButton() {
  const router = useRouter();
  const cancelSubscription = async () => {
    const user = await getUserSession();
    const { data: session } = await supabase.auth.getSession();

    if (!session?.session?.access_token) {
      throw new Error("No valid session");
    }

    if (user) {
      const profile = await lookUpUserProfile(user.id);
      const { data } = await supabase.functions.invoke("cancel-subscription", {
        body: {
          subscriptionId: profile?.subscription_id,
        },
        headers: {
          Authorization: `Bearer ${session?.session?.access_token}`,
        },
      });

      if (data) {
        Toast.show({
          type: "unsubscribed",
          text1: "Subscription Cancelled",
        });
      } else {
        Toast.show({
          type: "settingsUpdateError",
          text1: "Error Cancelling Subscription",
        });
      }

      router.replace("/(tabs)/feed");
    }
  };

  return (
    <TouchableOpacity style={styles.cancelButton} onPress={cancelSubscription}>
      <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: "#FE7F2D",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  cancelButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
});

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import supabase from "../lib/supabase";
import { getUserSession, lookUpUserProfile } from "../supabase_queries/auth";
import { useRouter } from "expo-router";

export default function CancelButton() {
  const router = useRouter();
  const cancelSubscription = async () => {
    const { data: session } = await supabase.auth.getSession();

    if (!session?.session?.access_token) {
      throw new Error("No valid session");
    }

    if (session.session.user.id) {
      const profile = await lookUpUserProfile(session.session.user.id);
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

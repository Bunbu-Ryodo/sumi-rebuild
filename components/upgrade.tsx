import { useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useStripe, PaymentSheetError } from "@stripe/stripe-react-native";
import { getUserSession, lookUpUserProfile } from "../supabase_queries/auth";

export default function UpgradeButton() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  useEffect(() => {
    const initializePaymentSheet = async () => {
      const user = await getUserSession();
      if (user) {
        const profile = await lookUpUserProfile(user.id);
        console.log(profile.client_secret, "CLIENT SECRET");
        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: profile?.client_secret,
          returnURL: "sumirebuild://settings",
          merchantDisplayName: "Sumi Rebuild",
        });

        if (error) {
          console.error(error, "ERROR INITIALIZING PAYMENT SHEET");
        }
      }
    };
    initializePaymentSheet();
  }, []);

  return (
    <TouchableOpacity
      style={styles.premiumButton}
      onPress={async () => {
        const { error } = await presentPaymentSheet();
        if (error?.code === PaymentSheetError.Canceled) {
          console.error(error, "CANCELLED PAYMENT SHEET");
        } else if (error) {
          console.error(error, "ERROR PRESENTING PAYMENT SHEET");
          // Handle Failed
        } else {
          // Payment Succeeded
        }
      }}
    >
      <Text style={styles.premiumButtonText}>
        Upgrade to Premium (£5.99 per month)
      </Text>
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
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
});

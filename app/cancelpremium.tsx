import {
  View,
  ScrollView,
  Text,
  StyleSheet,
} from "react-native";
import CancelButton from "../components/cancel";
import { useRouter } from "expo-router";

export default function CancelPremium() {
  const router = useRouter();
  return (
    <>
      <ScrollView contentContainerStyle={styles.getPremiumWrapper}>
        <View style={styles.copyWrapper}>
          <View style={styles.logoBook}>
            <View style={styles.logoTitle}></View>
          </View>
          <Text style={styles.getPremiumText}>Sumi Premium</Text>
          <Text style={styles.getPremiumText}>Cancel Sumi Premium?</Text>
          <Text style={styles.getPremiumText}>
            You will lose access to members-only features at the end of the
            billing period.
          </Text>
          <Text style={styles.getPremiumText}>
            You can re-subscribe at any time, or reverse this decision in the
            settings tab before the end of the billing period.
          </Text>
          <CancelButton />

          <Text
            onPress={() => router.push("/settings")}
            style={styles.backToSettings}
          >
            Back to Settings
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  getPremiumWrapper: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F6F7EB",
  },
  copyWrapper: {
    padding: 16,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoBook: {
    width: 50,
    height: 73,
    padding: 5,
    backgroundColor: "#363E41",
    borderRadius: 2,
    marginBottom: 12,
  },
  logoTitle: {
    width: 12,
    height: 30,
    borderRadius: 2,
    backgroundColor: "#F6F7EB",
  },
  getPremiumText: {
    fontSize: 18,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    margin: 6,
    textAlign: "center",
  },
  backToSettings: {
    fontSize: 18,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    margin: 6,
    textAlign: "center",
    textDecorationLine: "underline",
    cursor: "pointer",
    marginTop: 12,
  },
  checkboxRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 10,
  },
  checkbox: {
    marginTop: 3,
    marginRight: 10,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    lineHeight: 20,
  },
  premiumButton: {
    backgroundColor: "#FE7F2D",
    opacity: 0.6,
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

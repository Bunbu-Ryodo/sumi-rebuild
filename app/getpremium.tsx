import { useState } from "react";
import { Platform } from "react-native";
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Checkbox from "expo-checkbox";
import Ionicons from "@expo/vector-icons/Ionicons";
import UpgradeButton from "../components/upgrade";

export default function GetPremium() {
  const [isConsentChecked, setIsConsentChecked] = useState(false);

  return (
    <>
      <ScrollView contentContainerStyle={styles.getPremiumWrapper}>
        <View style={styles.copyWrapper}>
          <View style={styles.logoBook}>
            <View style={styles.logoTitle}></View>
          </View>
          <Text style={styles.getPremiumText}>Sumi Premium</Text>
          <Text style={styles.getPremiumText}>
            AI-assisted reading aids (chapter arguments, summaries,
            explanations)
          </Text>
          <Text style={styles.getPremiumText}>
            Access to future members-only features as they are released
          </Text>
          <Text style={styles.getPremiumText}>
            £2.99 per month (cancel anytime in the app)
          </Text>
          <View style={styles.checkboxRow}>
            <Checkbox
              value={isConsentChecked}
              onValueChange={setIsConsentChecked}
              color={isConsentChecked ? "#363E41" : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.consentText}>
              By ticking this box, you agree that Sumi will give you immediate
              access to members-only digital content (AI reading aids and
              ad-free experience). You acknowledge that you lose your 14-day
              right to cancel once access begins.
            </Text>
          </View>
          {isConsentChecked ? (
            <UpgradeButton />
          ) : (
            <TouchableOpacity style={styles.premiumButton} disabled={true}>
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
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

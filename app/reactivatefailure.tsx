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
import ReactivateButton from "../components/reactivate";
import { useRouter } from "expo-router";

export default function ReactivateFailure() {
  const router = useRouter();
  return (
    <>
      <ScrollView contentContainerStyle={styles.getPremiumWrapper}>
        <View style={styles.copyWrapper}>
          <View style={styles.logoBook}>
            <View style={styles.logoTitle}></View>
          </View>
          <Text style={styles.getPremiumText}>
            Something went wrong. Please try again later or contact
            support@sumi.club if the issue persists.
          </Text>
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

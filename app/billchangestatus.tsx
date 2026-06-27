import { View, ScrollView, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";

export default function SubscribeSuccess() {
  const { message, backPath, backLabel } = useLocalSearchParams<{
    message: string;
    backPath?: string;
    backLabel?: string;
  }>();
  const router = useRouter();
  const resolvedBackPath = backPath || "/settings";
  const resolvedBackLabel = backLabel || "Back to Settings";
  return (
    <>
      <ScrollView contentContainerStyle={styles.getPremiumWrapper}>
        <View style={styles.copyWrapper}>
          <View style={styles.logoBook}>
            <View style={styles.logoTitle}></View>
          </View>
          <Text style={styles.getPremiumText}>{message}</Text>
          <Text
            onPress={() => router.push(resolvedBackPath as never)}
            style={styles.backToSettings}
          >
            {resolvedBackLabel}
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
    justifyContent: "center",
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
});

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function ReactivateButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.reactivateButton}
      onPress={() =>
        router.push({
          pathname: "/billchangestatus",
          params: {
            message:
              "Subscription reactivation is temporarily unavailable while billing is being updated.",
            backPath: "/settings",
            backLabel: "Back to Settings",
          },
        })
      }
    >
      <Text style={styles.reactivateButtonText}>
        Reactivation Temporarily Unavailable
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  reactivateButton: {
    backgroundColor: "#77966D",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  reactivateButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
});

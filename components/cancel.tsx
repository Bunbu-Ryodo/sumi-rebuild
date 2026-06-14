import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function CancelButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.cancelButton}
      onPress={() =>
        router.push({
          pathname: "/billchangestatus",
          params: {
            message:
              "Subscription cancellation is temporarily unavailable while billing is being updated.",
            backPath: "/settings",
            backLabel: "Back to Settings",
          },
        })
      }
    >
      <Text style={styles.cancelButtonText}>
        Cancellation Temporarily Unavailable
      </Text>
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

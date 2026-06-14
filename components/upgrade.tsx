import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function UpgradeButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.premiumButton}
      onPress={() =>
        router.push({
          pathname: "/billchangestatus",
          params: {
            message:
              "Premium checkout is temporarily unavailable while billing is being updated.",
            backPath: "/settings",
            backLabel: "Back to Settings",
          },
        })
      }
    >
      <Text style={styles.premiumButtonText}>
        Upgrade Temporarily Unavailable
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
});

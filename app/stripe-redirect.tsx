import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function StripeRedirect() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#393E41" />
      <Text style={styles.text}>Completing payment...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7EB",
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontFamily: "BeProVietnam",
    fontSize: 18,
    color: "#393E41",
    textAlign: "center",
  },
});
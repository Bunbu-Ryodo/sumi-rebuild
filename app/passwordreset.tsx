import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { resetPassword } from "../supabase_queries/auth.js";

export default function PasswordReset() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;
  const [email, setEmail] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const handlePasswordReset = async function () {
    await resetPassword(email).catch((error) => {
      if (error)
        setConfirmationMessage("Something went wrong, please try again");
    });
    setConfirmationMessage("Reset link sent to your inbox");
  };

  return (
    <View style={styles.passwordResetWrapper}>
      <View style={styles.form}>
        <Text style={[styles.formLabel, isIPad && { fontSize: 24 }]}>
          Confirm Email
        </Text>
        <TextInput
          style={[styles.formInput, isIPad && { fontSize: 24 }]}
          onChangeText={setEmail}
        ></TextInput>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handlePasswordReset}
        >
          <Text style={[styles.primaryButtonText, isIPad && { fontSize: 24 }]}>
            Send Reset Link
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => router.push("/")}
        >
          <Text
            style={[styles.secondaryButtonText, isIPad && { fontSize: 24 }]}
          >
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
      {confirmationMessage ? (
        <Text style={[styles.errorText, isIPad && { fontSize: 24 }]}>
          {confirmationMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  passwordResetWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#393E41",
    width: "100%",
  },
  form: {
    width: "90%",
    maxWidth: 528,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: "BeProVietnam",
    color: "#F6F7EB",
  },
  formInput: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "BeProVietnam",
    color: "#F6F7EB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F6F7EB",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  buttonPrimary: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  primaryButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  buttonSecondary: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "transparent",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#F6F7EB",
  },
  secondaryButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  errorText: {
    color: "#83F65E",
    marginTop: 12,
    fontSize: 16,
    fontFamily: "BeProVietnam",
  },
});

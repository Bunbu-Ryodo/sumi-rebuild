import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { resetPassword } from "../supabase_queries/auth.js";

export default function PasswordReset() {
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
        <Text style={styles.formLabel}>Confirm Email</Text>
        <TextInput style={styles.formInput} onChangeText={setEmail}></TextInput>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={handlePasswordReset}
        >
          <Text style={styles.primaryButtonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
      {confirmationMessage ? (
        <Text style={styles.errorText}>{confirmationMessage}</Text>
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
    maxWidth: 368,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
  },
  formInput: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 16,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F6F7EB",
    padding: 12,
    backgroundColor: "transparent",
  },
  buttonPrimary: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  primaryButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  errorText: {
    color: "#FE7F2D",
    marginTop: 12,
    fontSize: 16,
    fontFamily: "QuicksandReg",
    alignSelf: "center",
  },
});

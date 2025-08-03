import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { updatePassword } from "../supabase_queries/auth.js";
import Toast from "react-native-toast-message";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const displayErrorToast = (message: string) => {
    Toast.show({
      type: "settingsUpdateError",
      text1: message,
    });
  };

  const handlePasswordReset = async function () {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords dont match");
    } else {
      setErrorMessage("");
      await updatePassword(password).catch((error) => {
        displayErrorToast(error.message);
        setErrorMessage("Something went wrong");
      });
      router.push("/");
    }
  };

  return (
    <View style={styles.changePasswordWrapper}>
      <View style={styles.form}>
        <Text style={styles.formLabel}>Create new password</Text>
        <TextInput
          style={styles.formInput}
          onChangeText={setPassword}
        ></TextInput>
        <Text style={styles.formLabel}>Confirm new password</Text>
        <TextInput
          style={styles.formInput}
          onChangeText={setConfirmPassword}
        ></TextInput>
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.passwordResetButton}
          onPress={handlePasswordReset}
        >
          <Text style={styles.passwordResetButtonText}>Send Reset Link</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  changePasswordWrapper: {
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
  passwordResetButton: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  passwordResetButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  errorText: {
    color: "#D64045",
    fontSize: 16,
    fontFamily: "QuicksandReg",
  },
});

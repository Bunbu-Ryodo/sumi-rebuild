import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import supabase from "../lib/supabase.js";
import Toast from "react-native-toast-message";

export default function Register() {
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === "ios" && Platform.isPad;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const displayErrorToast = (message: string) => {
    Toast.show({
      type: "settingsUpdateError",
      text1: message,
    });
  };

  const displaySuccessToast = (message: string) => {
    Toast.show({
      type: "settingsUpdateSuccess",
      text1: message,
    });
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (email: string) => {
    setEmail(email);
  };

  const checkEmail = (email: string) => {
    if (!validateEmail(email)) {
      setEmailError("Invalid email address");
      displayErrorToast("Invalid email address");
    } else {
      setEmailError("");
    }
  };

  const checkPasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      displayErrorToast("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  async function signUpNewUser() {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      displayErrorToast("Passwords do not match");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Invalid email address");
      displayErrorToast("Invalid email address");
      return;
    }

    setEmailError("");
    setPasswordError("");

    await supabase.auth
      .signUp({
        email: email,
        password: password,
      })
      .then(({ error }) => {
        if (error) {
          displayErrorToast("Error registering, please try again");
          return;
        } else {
          displaySuccessToast("Verification email sent");
        }
      })
      .catch((error) => {
        displayErrorToast(error.message);
      });
  }

  return (
    <View style={styles.registerWrapper}>
      <View style={styles.logoBook}>
        <View style={styles.logoTitle}></View>
      </View>
      <View style={styles.titleTaglineContainer}>
        <Text style={styles.header}>Sumi</Text>
        <Text style={styles.tagline}>Join for Free</Text>
      </View>
      <View style={styles.form}>
        <Text style={[styles.formLabel, isIPad && { fontSize: 24 }]}>
          Email
        </Text>
        <TextInput
          style={[
            styles.formInput,
            emailError ? styles.errorInput : null,
            isIPad && { fontSize: 24 },
          ]}
          keyboardType="email-address"
          value={email}
          onChangeText={handleEmailChange}
          onBlur={() => checkEmail(email)}
        ></TextInput>
        <Text style={[styles.formLabel, isIPad && { fontSize: 24 }]}>
          Create Password
        </Text>
        <TextInput
          secureTextEntry={true}
          onChangeText={setPassword}
          style={[
            styles.formInput,
            passwordError ? styles.errorInput : null,
            isIPad && { fontSize: 24 },
          ]}
        ></TextInput>
        <Text style={[styles.formLabel, isIPad && { fontSize: 24 }]}>
          Confirm Password
        </Text>
        <TextInput
          secureTextEntry={true}
          onChangeText={setConfirmPassword}
          onBlur={checkPasswords}
          style={[
            styles.formInput,
            passwordError ? styles.errorInput : null,
            isIPad && { fontSize: 24 },
          ]}
        ></TextInput>
        <TouchableOpacity style={styles.registerButton} onPress={signUpNewUser}>
          <Text style={[styles.registerButtonText, isIPad && { fontSize: 24 }]}>
            Register
          </Text>
        </TouchableOpacity>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.backButton} onPress={() => {}}>
            <Text style={[styles.backButtonText, isIPad && { fontSize: 24 }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  registerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#393E41",
    width: "100%",
  },
  logoBook: {
    width: 50,
    height: 73,
    padding: 5,
    backgroundColor: "#F6F7EB",
    borderRadius: 2,
  },
  logoTitle: {
    width: 12,
    height: 30,
    borderRadius: 2,
    backgroundColor: "#393E41",
  },
  titleTaglineContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  header: {
    fontSize: 36,
    fontFamily: "EBGaramond",
    color: "#F6F7EB",
  },
  tagline: {
    fontSize: 18,
    fontFamily: "BeProVietnam",
    color: "#F6F7EB",
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
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
  },
  registerButton: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  registerButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#F6F7EB",
    color: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  backButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  errorInput: {
    borderColor: "#D64045",
  },
});

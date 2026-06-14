import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Link } from "expo-router";
import { useState } from "react";
import supabase from "../lib/supabase.js";

export default function Register() {
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
    } else {
      setEmailError("");
    }
  };

  const checkPasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      setRegisterSuccess("");
    } else {
      setPasswordError("");
      setRegisterSuccess("");
    }
  };

  async function signUpNewUser() {
    setRegisterError("");
    setRegisterSuccess("");
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Invalid email address");
      setRegisterSuccess("");
      return;
    }
    await supabase.auth
      .signUp({
        email: email,
        password: password,
      })
      .then(({ error }) => {
        if (error) {
          setRegisterError("Error registering, please try again");
          return;
        } else {
          setRegisterSuccess("Verification email sent");
        }
      })
      .catch((error) => {
        setRegisterError(error.message);
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
        {emailError ? (
          <Text
            style={[styles.passwordEmailErrorText, isIPad && { fontSize: 24 }]}
          >
            {emailError}
          </Text>
        ) : null}
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
        {passwordError ? (
          <Text
            style={[styles.passwordEmailErrorText, isIPad && { fontSize: 24 }]}
          >
            {passwordError}
          </Text>
        ) : null}
        {registerError ? (
          <Text style={[styles.errorText, isIPad && { fontSize: 24 }]}>
            {registerError}
          </Text>
        ) : registerSuccess ? (
          <Text style={[styles.registerSuccess, isIPad && { fontSize: 24 }]}>
            {registerSuccess}
          </Text>
        ) : null}
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
  errorText: {
    color: "#D64045",
    marginTop: 12,
    fontSize: 16,
    fontFamily: "BeProVietnam",
  },
  passwordEmailErrorText: {
    color: "#D64045",
    marginBottom: 6,
    fontSize: 16,
    fontFamily: "BeProVietnam",
  },
  registerSuccess: {
    color: "#83F65E",
    marginBottom: 6,
    fontSize: 16,
    fontFamily: "BeProVietnam",
  },
  errorInput: {
    borderColor: "#D64045",
  },
});

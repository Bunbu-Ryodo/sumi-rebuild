import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import supabase from "../lib/supabase.js";
import { useEffect } from "react";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signinError, setSigninError] = useState("");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [displayedTagline, setDisplayedTagline] = useState("");
  const [typing, setTyping] = useState(true);

  const router = useRouter();

  const taglines = [
    "ひと休みする!",
    "Your new feed...",
    "...Flooded with the Great Books",
  ];

  useEffect(() => {
    let timeout: number;
    const fullText = taglines[taglineIndex];

    if (typing) {
      if (displayedTagline.length < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayedTagline(fullText.slice(0, displayedTagline.length + 1));
        }, 60);
      } else {
        timeout = setTimeout(() => setTyping(false), 1200);
      }
    } else {
      if (displayedTagline.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedTagline(fullText.slice(0, displayedTagline.length - 1));
        }, 30);
      } else {
        timeout = setTimeout(() => {
          setTaglineIndex((prev) => (prev + 1) % taglines.length);
          setTyping(true);
        }, 400);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayedTagline, typing, taglineIndex, taglines]);

  async function signInUser() {
    await supabase.auth
      .signInWithPassword({
        email: email,
        password: password,
      })
      .then(({ error }) => {
        if (error) {
          setSigninError(error.message);
          return;
        }
        router.push("/feed");
      })
      .catch((error) => {
        setSigninError(error.message);
      });
  }

  return (
    <View style={styles.indexWrapper}>
      <View style={styles.logoBook}>
        <View style={styles.logoTitle}></View>
      </View>
      <View style={styles.titleTaglineContainer}>
        <Text style={styles.header}>Sumi</Text>
        <Text style={styles.tagline}>{displayedTagline}</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.formLabel}>Email</Text>
        <TextInput style={styles.formInput} onChangeText={setEmail}></TextInput>
        <Text style={styles.formLabel}>Password</Text>
        <TextInput
          secureTextEntry={true}
          style={styles.formInput}
          onChangeText={setPassword}
        ></TextInput>
        {signinError ? (
          <Text style={styles.errorText}>{signinError}</Text>
        ) : null}

        <TouchableOpacity style={styles.signInButton} onPress={signInUser}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
        <Link href="../register" asChild>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <Link href={"/passwordreset"} asChild>
        <TouchableOpacity>
          <Text style={styles.forgottenPasswordText}>Forgotten password?</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  indexWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#393E41",
    width: "100%",
  },
  titleTaglineContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  logoBook: {
    width: 50,
    height: 73,
    padding: 5,
    backgroundColor: "#F6F7EB",
    borderRadius: 4,
  },
  logoTitle: {
    width: 12,
    height: 30,
    borderRadius: 2,
    backgroundColor: "#393E41",
  },
  header: {
    fontSize: 36,
    fontFamily: "EBGaramond",
    color: "#F6F7EB",
  },
  tagline: {
    height: 24,
    fontSize: 18,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
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
  signIn: {
    marginTop: 14,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
  },
  signInButton: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  signInButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  registerButtonText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  registerButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#F6F7EB",
    color: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  errorText: {
    color: "#D64045",
    fontSize: 16,
    fontFamily: "QuicksandReg",
  },
  forgottenPasswordText: {
    color: "#8980F5",
    fontFamily: "QuicksandReg",
    fontSize: 16,
    marginTop: 12,
    textDecorationLine: "underline",
  },
});

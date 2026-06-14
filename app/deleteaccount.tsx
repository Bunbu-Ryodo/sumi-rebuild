import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Checkbox from "expo-checkbox";
import { useRouter } from "expo-router";
import { useState } from "react";
import { deleteCurrentUserAccount } from "../supabase_queries/settings";

export default function DeleteAccount() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [hasConfirmedDelete, setHasConfirmedDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submitDeleteAccount = async () => {
    if (!hasConfirmedDelete) {
      setErrorMessage("Please confirm that you want to delete your account.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const result = await deleteCurrentUserAccount(password);

    if (!result?.success) {
      setErrorMessage(
        result?.error ||
          "Unable to delete account right now. Please try again.",
      );
      setIsSubmitting(false);
      return;
    }

    router.replace({
      pathname: "/billchangestatus",
      params: {
        message:
          "Your account has been deleted successfully and you are now logged out.",
        backPath: "/",
        backLabel: "Back to Sign In",
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.deleteAccountWrapper}>
      <View style={styles.copyWrapper}>
        <View style={styles.logoBook}>
          <View style={styles.logoTitle}></View>
        </View>

        <Text style={styles.heading}>Delete Account</Text>
        <Text style={styles.description}>
          This action is permanent. Confirm your password to permanently delete
          your Sumi account.
        </Text>

        <TextInput
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#8C8C8C"
          style={styles.passwordInput}
        ></TextInput>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setHasConfirmedDelete((previous) => !previous)}
          activeOpacity={0.8}
        >
          <Checkbox
            value={hasConfirmedDelete}
            onValueChange={setHasConfirmedDelete}
            color={hasConfirmedDelete ? "#D64045" : undefined}
            style={styles.checkbox}
          />
          <Text style={styles.checkboxText}>
            I understand this will permanently delete my account.
          </Text>
        </TouchableOpacity>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.deleteButton, isSubmitting && styles.disabledButton]}
          onPress={submitDeleteAccount}
          disabled={isSubmitting}
        >
          <Text style={styles.deleteButtonText}>
            {isSubmitting ? "Deleting..." : "Delete Account"}
          </Text>
        </TouchableOpacity>

        <Text
          onPress={() => router.push("/settings")}
          style={styles.backToSettings}
        >
          Back to Settings
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  deleteAccountWrapper: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7EB",
  },
  copyWrapper: {
    padding: 16,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  logoBook: {
    width: 50,
    height: 73,
    padding: 5,
    backgroundColor: "#363E41",
    borderRadius: 2,
    marginBottom: 12,
  },
  logoTitle: {
    width: 12,
    height: 30,
    borderRadius: 2,
    backgroundColor: "#F6F7EB",
  },
  heading: {
    fontSize: 22,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    marginTop: 6,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    marginBottom: 14,
    textAlign: "center",
    width: "100%",
    maxWidth: 360,
    lineHeight: 22,
  },
  passwordInput: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#393E41",
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    backgroundColor: "transparent",
    marginTop: 4,
    marginBottom: 12,
  },
  checkboxRow: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
  },
  checkbox: {
    marginTop: 2,
    marginRight: 10,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    lineHeight: 20,
  },
  errorText: {
    width: "100%",
    maxWidth: 360,
    color: "#D64045",
    fontSize: 14,
    fontFamily: "BeProVietnam",
    marginTop: 4,
    textAlign: "left",
  },
  deleteButton: {
    backgroundColor: "#D64045",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    maxWidth: 360,
    marginTop: 14,
  },
  deleteButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  backToSettings: {
    fontSize: 18,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    margin: 6,
    textAlign: "center",
    textDecorationLine: "underline",
    cursor: "pointer",
    marginTop: 14,
  },
});

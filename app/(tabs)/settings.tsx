import {
  Text,
  TextInput,
  ScrollView,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  updatePassword,
  updateUsername,
} from "../../supabase_queries/settings";
import { getUserSession, lookUpUserProfile } from "../../supabase_queries/auth";
import supabase from "../../lib/supabase.js";
import { updateSubscriptionInterval } from "../../supabase_queries/profiles";
import Toast from "react-native-toast-message";
import { AdsConsent } from "react-native-google-mobile-ads";

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [readerTag, setReaderTag] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [interval, setInterval] = useState<number | null>(null);

  // Feedback form states
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const displayToast = (message: string) => {
    Toast.show({
      type: "settingsUpdateSuccess",
      text1: message,
    });
  };

  const displayErrorToast = (message: string) => {
    Toast.show({
      type: "settingsUpdateError",
      text1: message,
    });
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = await getUserSession();
      if (user) {
        const profile = await lookUpUserProfile(user.id);
        if (profile) {
          setUsername(profile.username);
          setReaderTag(profile.readertag);
          setInterval(profile.subscriptioninterval);
        }
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const changeSubscriptionInterval = async (interval: number) => {
    setInterval(interval);
    const user = await getUserSession();
    if (user) {
      await updateSubscriptionInterval(user.id, interval);
    }
  };

  const Logout = async function () {
    await supabase.auth.signOut();
    router.push("/");
  };

  const updateReaderTag = async () => {
    const updateReaderTag = await updateUsername(readerTag);
    if (updateReaderTag) {
      displayToast("ReaderTag updated successfully");
    }
  };

  const checkPasswordMatch = () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("Passwords do not match");
    } else {
      setPasswordChangeError("");
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("Passwords do not match");
      return;
    }
    const passwordUpdated = await updatePassword(newPassword);
    if (passwordUpdated) {
      displayToast("Password updated successfully");
      setPasswordChangeError("");
    } else {
      displayErrorToast("Error updating password");
    }
  };

  const handleConsent = async () => {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();

      if (consentInfo.isConsentFormAvailable) {
        await AdsConsent.showPrivacyOptionsForm();
        displayToast("Privacy settings updated");
      } else {
        displayToast("No privacy options required for your location");
      }
    } catch (error) {
      console.error("Error showing privacy options form:", error);
      displayErrorToast("Unable to show privacy options");
    }
  };

  const sendFeedback = async () => {
    if (
      !feedbackName.trim() ||
      !feedbackEmail.trim() ||
      !feedbackMessage.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!feedbackEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setFeedbackLoading(true);
    try {
      // Here you would typically send the feedback to your backend or email service
      // For now, we'll simulate the sending process
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call

      setShowFeedbackModal(true);
      setFeedbackName("");
      setFeedbackEmail("");
      setFeedbackMessage("");

      displayToast("Feedback sent successfully!");
    } catch (error) {
      console.error("Error sending feedback:", error);
      displayErrorToast("Failed to send feedback. Please try again.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
  };

  const intervals = [
    { label: "Daily", value: 1 },
    { label: "Every few days", value: 3 },
    { label: "Every week", value: 7 },
    { label: "Bi-weekly", value: 14 },
  ];

  return (
    <>
      <ScrollView style={styles.settingsWrapper}>
        {loading ? (
          <ActivityIndicator size="large" color="#F6F7EB" />
        ) : (
          <View style={styles.form}>
            <Text style={styles.formLabel}>Change ReaderTag</Text>
            <TextInput
              defaultValue={username}
              style={styles.formInput}
              onChangeText={setReaderTag}
            ></TextInput>
            <TouchableOpacity
              style={styles.changeReaderTagButton}
              onPress={updateReaderTag}
            >
              <Text style={styles.changeReaderTagButtonText}>
                Change ReaderTag
              </Text>
            </TouchableOpacity>
            <Text style={styles.formLabel}>Change Password</Text>
            <TextInput
              secureTextEntry={true}
              style={[
                styles.formInput,
                passwordChangeError ? styles.errorInput : null,
              ]}
              onChangeText={setNewPassword}
            ></TextInput>
            <Text style={styles.formLabel}>Confirm New Password</Text>
            <TextInput
              secureTextEntry={true}
              style={[
                styles.formInput,
                passwordChangeError ? styles.errorInput : null,
              ]}
              onChangeText={setConfirmNewPassword}
              onBlur={checkPasswordMatch}
            ></TextInput>
            {passwordChangeError ? (
              <Text style={styles.errorText}>{passwordChangeError}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={changePassword}
            >
              <Text style={styles.changePasswordButtonText}>
                Change Password
              </Text>
            </TouchableOpacity>

            <Text style={styles.subscriptionFrequencyLabel}>
              Set Subscription Frequency
            </Text>
            <View style={styles.intervalDropdown}>
              {intervals.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.radioButtonContainer}
                  onPress={() => changeSubscriptionInterval(option.value)}
                >
                  <View
                    style={[
                      styles.radioButton,
                      interval === option.value && styles.radioButtonSelected,
                    ]}
                  />
                  <Text style={styles.radioButtonLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={handleConsent}
            >
              <Text style={styles.privacyButtonText}>
                Manage Privacy Settings
              </Text>
            </TouchableOpacity>

            {/* Feedback Form */}
            {/* <Text style={styles.feedbackSectionTitle}>Send Feedback</Text>
            <Text style={styles.feedbackDescription}>
              Help us improve by sending your feedback to support@sumi.club
            </Text>

            <Text style={styles.formLabel}>Your Name</Text>
            <TextInput
              style={styles.formInput}
              value={feedbackName}
              onChangeText={setFeedbackName}
              placeholder="Enter your name"
              placeholderTextColor="#B0B0B0"
            />

            <Text style={styles.formLabel}>Email Address</Text>
            <TextInput
              style={styles.formInput}
              value={feedbackEmail}
              onChangeText={setFeedbackEmail}
              placeholder="Enter your email address"
              placeholderTextColor="#B0B0B0"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.formLabel}>Message</Text>
            <TextInput
              style={[styles.formInput, styles.feedbackTextarea]}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
              placeholder="Tell us what you think, report bugs, or suggest improvements..."
              placeholderTextColor="#B0B0B0"
              multiline={true}
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.feedbackButton,
                feedbackLoading && styles.disabledButton,
              ]}
              onPress={sendFeedback}
              disabled={feedbackLoading}
            >
              {feedbackLoading ? (
                <ActivityIndicator size="small" color="#393E41" />
              ) : (
                <Text style={styles.feedbackButtonText}>Send Feedback</Text>
              )}
            </TouchableOpacity> */}

            <TouchableOpacity style={styles.logoutButton} onPress={Logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Success Modal */}
      {/* <Modal
        animationType="fade"
        transparent={true}
        visible={showFeedbackModal}
        onRequestClose={closeFeedbackModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Feedback Sent!</Text>
            <Text style={styles.modalMessage}>
              Thank you for your feedback. We'll review it and get back to you
              at the email address you provided.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeFeedbackModal}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}
    </>
  );
}

const styles = StyleSheet.create({
  settingsWrapper: {
    backgroundColor: "#393E41",
    width: "100%",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBar: {
    marginTop: 16,
    padding: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
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
  tagline: {
    fontSize: 18,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
  },
  form: {
    width: "100%",
    padding: 16,
    height: "100%",
  },
  formLabel: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
  },
  formInput: {
    marginTop: 8,
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
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  buttonPrimary: {
    paddingVertical: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    marginTop: 16,
  },
  changePasswordButton: {
    paddingVertical: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    marginTop: 16,
  },
  changeReaderTagButton: {
    paddingVertical: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    marginTop: 16,
  },
  buttonLogout: {
    paddingVertical: 16,
    color: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    backgroundColor: "#8980F5",
  },
  primaryButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  changePasswordButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  changeReaderTagButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  buttonSecondary: {
    paddingVertical: 16,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  secondaryButtonText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    color: "#D64045",
    fontSize: 16,
    fontFamily: "QuicksandReg",
  },
  errorPasswordText: {
    color: "#D64045",
    fontSize: 16,
    fontFamily: "QuicksandReg",
  },
  errorInput: {
    borderColor: "#D64045",
  },
  successInput: {
    borderColor: "#77966D",
  },
  successText: {
    color: "#77966D",
    fontSize: 16,
    fontFamily: "QuicksandReg",
    alignSelf: "center",
  },
  successPasswordText: {
    color: "#77966D",
    fontSize: 16,
    fontFamily: "QuicksandReg",
    alignSelf: "center",
    marginBottom: 12,
  },
  intervalDropdown: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    minHeight: 100,
  },
  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 20,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#F6F7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  radioButtonSelected: {
    backgroundColor: "#F6F7EB",
  },
  radioButtonLabel: {
    fontSize: 16,
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
  },
  selectedText: {
    marginTop: 16,
    fontSize: 16,
    color: "#393E41",
  },
  subscriptionFrequencyLabel: {
    fontSize: 16,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: "#8980F5",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  privacyButton: {
    backgroundColor: "#F6F7EB",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  privacyButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  logoutButtonText: {
    color: "#FFF",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  // Feedback form styles
  feedbackSectionTitle: {
    fontSize: 20,
    fontFamily: "QuicksandReg",
    color: "#F6F7EB",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  feedbackDescription: {
    fontSize: 14,
    fontFamily: "QuicksandReg",
    color: "#B0B0B0",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  feedbackTextarea: {
    height: 120,
    paddingTop: 12,
  },
  feedbackButton: {
    backgroundColor: "#FE7F2D",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginTop: 16,
  },
  feedbackButtonText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#F6F7EB",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "QuicksandReg",
    color: "#393E41",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "QuicksandReg",
    color: "#393E41",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: "#FE7F2D",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 16,
    fontWeight: "bold",
  },
});

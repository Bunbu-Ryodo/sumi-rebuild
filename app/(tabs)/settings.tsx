import {
  Text,
  TextInput,
  ScrollView,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  updatePassword,
  updateUsername,
  updateEmail,
} from "../../supabase_queries/settings";
import { getUserSession, lookUpUserProfile } from "../../supabase_queries/auth";
// import {
//   hasActivePremiumSubscription,
//   getSubscriptionCancellationInfo,
// } from "../../supabase_queries/auth";
import { changeUserNameOnStreak } from "../../supabase_queries/subscriptions";
import supabase from "../../lib/supabase.js";
import { updateSubscriptionInterval } from "../../supabase_queries/profiles";
import Toast from "react-native-toast-message";
import { AdsConsent } from "react-native-google-mobile-ads";
import Purchases from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [readerTag, setReaderTag] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [interval, setInterval] = useState<number | null>(null);
  // Old stripe premium state management, to be restored on Android release
  // const [premium, setPremium] = useState(false);
  // const [deactivated, setDeactivated] = useState(false);
  // const [cancelAt, setCancelAt] = useState<Date | null>(null);
  const [hasPremium, setHasPremium] = useState(false);

  async function presentPaywall() {
    try {
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        displayErrorToast("No paywall is configured in RevenueCat yet");
        return;
      }

      const result = await RevenueCatUI.presentPaywall();

      if (result === PAYWALL_RESULT.PURCHASED) {
        router.replace({
          pathname: "/billchangestatus",
          params: {
            message:
              "Your Sumi Premium subscription is now active! Enjoy your enhanced reading experience.",
          },
        });
      } else if (result === PAYWALL_RESULT.RESTORED) {
        router.replace({
          pathname: "/billchangestatus",
          params: {
            message:
              "Your Sumi Premium subscription is active again. Enjoy your enhanced reading experience.",
          },
        });
      } else if (result === PAYWALL_RESULT.CANCELLED) {
        router.replace({
          pathname: "/billchangestatus",
          params: {
            message:
              "Your Sumi Premium subscription has been cancelled. You will retain access until the end of your billing period.",
          },
        });
      } else if (result === PAYWALL_RESULT.NOT_PRESENTED) {
        router.replace({
          pathname: "/billchangestatus",
          params: {
            message:
              "Something went wrong. Please try again later, or contact support@sumi.club if the problem persists.",
          },
        });
      }

      console.log("Paywall result:", result);
    } catch (error) {
      console.error("Failed to present paywall", error);
      displayErrorToast("Unable to open paywall right now");
    }
  }

  async function manageSubscription() {
    const customerInfo = await Purchases.getCustomerInfo();
    await Linking.openURL(
      customerInfo.managementURL ||
        "https://apps.apple.com/account/subscriptions",
    );
  }

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
          // Old Stripe implementation commented out, to be restored on Android release
          // const subscription = await hasActivePremiumSubscription(user.id);
          // const cancellationInfo = await getSubscriptionCancellationInfo(
          //   user.id,
          // );

          // setPremium(subscription);

          // if (subscription) {
          //   setDeactivated(cancellationInfo?.willCancel || false);
          //   setCancelAt(cancellationInfo?.cancelAt || null);
          // } else {
          //   setDeactivated(false);
          //   setCancelAt(null);
          // }

          const customerInfo = await Purchases.getCustomerInfo();
          const premiumStatus =
            !!customerInfo.entitlements.active["Sumi Premium"];
          setHasPremium(premiumStatus);
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
    const user = await getUserSession();
    if (user) {
      await changeUserNameOnStreak(user.id, readerTag);
    }

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmail = (email: string) => {
    return validateEmail(email);
  };

  const changeEmail = async () => {
    if (!checkEmail(email)) {
      displayErrorToast("Invalid email address");
      return;
    } else {
      const emailUpdated = await updateEmail(email);
      if (emailUpdated) {
        displayToast("Verification email sent");
      } else {
        displayErrorToast("Error updating email");
      }
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
            <Text style={styles.formLabel}>Change Email</Text>
            <TextInput
              defaultValue={email}
              style={styles.formInput}
              onChangeText={setEmail}
            ></TextInput>
            <TouchableOpacity
              style={styles.changeEmailButton}
              onPress={changeEmail}
            >
              <Text style={styles.changeEmailButtonText}>Change Email</Text>
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
            {/* {deactivated ? (
              <>
                <Text style={styles.selectedText}>
                  Premium will end on{" "}
                  {cancelAt
                    ? new Date(cancelAt).toLocaleDateString()
                    : "Unknown"}
                </Text>
                <TouchableOpacity
                  style={styles.privacyButton}
                  onPress={() => router.push("/reactivatepremium")}
                >
                  <Text style={styles.privacyButtonText}>
                    Reactivate Sumi Premium
                  </Text>
                </TouchableOpacity>
              </>
            ) : !premium && !deactivated ? (
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={() => router.push("/getpremium")}
              >
                <Text style={styles.privacyButtonText}>
                  Explore Sumi Premium
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={() => router.push("/cancelpremium")}
              >
                <Text style={styles.privacyButtonText}>
                  Cancel Sumi Premium
                </Text>
              </TouchableOpacity>
            )} */}
            {!hasPremium && (
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={presentPaywall}
              >
                <Text style={styles.privacyButtonText}>
                  Explore Sumi Premium
                </Text>
              </TouchableOpacity>
            )}
            {hasPremium && (
              <TouchableOpacity
                style={styles.privacyButton}
                onPress={manageSubscription}
              >
                <Text style={styles.privacyButtonText}>
                  Manage Sumi Premium
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.logoutButton} onPress={Logout}>
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    color: "#F6F7EB",
  },
  formInput: {
    marginTop: 8,
    fontSize: 16,
    fontFamily: "BeProVietnam",
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
  changeEmailButton: {
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  changePasswordButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  changeReaderTagButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  changeEmailButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  errorText: {
    marginTop: 8,
    color: "#D64045",
    fontSize: 16,
    fontFamily: "BeProVietnam",
  },
  errorPasswordText: {
    color: "#D64045",
    fontSize: 16,
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    alignSelf: "center",
  },
  successPasswordText: {
    color: "#77966D",
    fontSize: 16,
    fontFamily: "BeProVietnam",
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
    fontSize: 14,
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
  },
  selectedText: {
    marginTop: 16,
    fontSize: 16,
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    textAlign: "center",
  },
  subscriptionFrequencyLabel: {
    fontSize: 16,
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  getPremiumText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
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

  logoutButtonText: {
    color: "#FFF",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  // Feedback form styles
  feedbackSectionTitle: {
    fontSize: 20,
    fontFamily: "BeProVietnam",
    color: "#F6F7EB",
    marginTop: 24,
    marginBottom: 8,
    textAlign: "center",
  },
  feedbackDescription: {
    fontSize: 14,
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    color: "#393E41",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "bold",
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
    fontWeight: "bold",
  },
});

import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { savePushToken } from "../supabase_queries/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Requests permission, grabs the device's Expo push token, and persists it on the user's profile.
export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  try {
    console.log("Push registration started", userId);

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log("Expo token received", tokenResponse.data);

    const saved = await savePushToken(userId, tokenResponse.data);
    console.log("Expo token saved", saved);

    return tokenResponse.data;
  } catch (error) {
    console.error("Push registration failed", error);
    return null;
  }
}

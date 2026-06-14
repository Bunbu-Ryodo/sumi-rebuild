import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import supabase from "../lib/supabase";
import { createContext, useContext } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import Ionicons from "@expo/vector-icons/Ionicons";
// import StripeProvider from "../components/stripe-provider";
// import { useStripe } from "@stripe/stripe-react-native";
// import { syncStripeCustomerEmailForCurrentUser } from "../supabase_queries/settings";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

const SupabaseContext = createContext(supabase);
const useTestPayments = process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";
const revenueCatApiKey =
  process.env.EXPO_PUBLIC_REVENUECAT_API ??
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

import mobileAds from "react-native-google-mobile-ads";

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    BeProVietnam: require("../assets/fonts/BeVietnamPro-Light.ttf"),
    EBGaramond: require("../assets/fonts/EBGaramondVariable.ttf"),
    EBGaramondItalic: require("../assets/fonts/EBGaramondItalic.ttf"),
  });

  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
      await mobileAds().initialize();
    }
    prepare();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

    const testApiKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY;
    const apiKey = useTestPayments ? testApiKey : revenueCatApiKey;

    if (!apiKey) {
      console.warn("RevenueCat API key is missing");
      return;
    }

    if (Platform.OS === "ios") {
      Purchases.configure({ apiKey });
    } else if (Platform.OS === "android") {
      Purchases.configure({ apiKey });
    }

    const syncRevenueCatUser = async (userId: string | null) => {
      try {
        if (userId) {
          await Purchases.logIn(userId);
        } else {
          await Purchases.logOut();
        }
      } catch (syncError) {
        console.error("Failed to sync RevenueCat user", syncError);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data }) => syncRevenueCatUser(data.session?.user?.id ?? null));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncRevenueCatUser(session?.user?.id ?? null);
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!loaded && !error) {
    return null;
  }

  const toastConfig = {
    settingsUpdateError: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#d64045",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="close" size={24} color="#F6F7EB"></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
    settingsUpdateSuccess: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393E41",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="checkmark" size={24} color="#F6F7EB"></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
    newInstalments: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393E41",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="mail" size={24} color="#F6F7EB"></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
    savedQuote: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393E41",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={24}
            color="#F6F7EB"
          ></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
    streakUp: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393E41",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="calendar" size={24} color="#F6F7EB"></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
    subscribed: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393E41",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="star" size={24} color="#F6F7EB"></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
    unsubscribed: ({ text1 }: { text1?: string }) => (
      <View
        style={{
          width: "85%",
          borderRadius: 8,
          backgroundColor: "#F6F7EB",
          borderWidth: 1,
          borderColor: "#393E41",
          padding: 12,
          flexDirection: "row",
        }}
      >
        <View
          style={{
            height: 44,
            width: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#393E41",
            borderRadius: 8,
            marginRight: 8,
          }}
        >
          <Ionicons name="close-circle" size={24} color="#F6F7EB"></Ionicons>
        </View>
        <View style={{ alignContent: "center", justifyContent: "center" }}>
          <Text
            style={{
              fontFamily: "BeProVietnam",
              fontSize: 16,
              color: "#393E41",
            }}
          >
            {text1 ?? ""}
          </Text>
        </View>
      </View>
    ),
  };

  return (
    // <StripeProvider>
    <RootNavigator toastConfig={toastConfig} />
    // </StripeProvider>
  );
}

function RootNavigator({ toastConfig }: { toastConfig: any }) {
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;
  // const { handleURLCallback } = useStripe();
  // const lastSyncedEmailRef = useRef<string | null>(null);

  // useEffect(() => {
  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     (event, session) => {
  //       if (event !== "USER_UPDATED") {
  //         return;
  //       }

  //       const updatedEmail = session?.user?.email ?? null;
  //       if (!updatedEmail || updatedEmail === lastSyncedEmailRef.current) {
  //         return;
  //       }

  //       lastSyncedEmailRef.current = updatedEmail;
  //       syncStripeCustomerEmailForCurrentUser().catch((error) => {
  //         console.error("Failed to sync Stripe customer email", error);
  //       });
  //     },
  //   );

  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, []);

  // useEffect(() => {
  //   const handleDeepLink = async ({ url }: { url: string }) => {
  //     if (!url) {
  //       return;
  //     }

  //     await handleURLCallback(url);
  //   };

  //   const subscription = Linking.addEventListener("url", handleDeepLink);

  //   Linking.getInitialURL().then((url) => {
  //     if (url) {
  //       handleURLCallback(url).catch((error) => {
  //         console.error("Failed to process initial URL callback", error);
  //       });
  //     }
  //   });

  //   return () => {
  //     subscription.remove();
  //   };
  // }, [handleURLCallback]);

  return (
    <>
      <SupabaseContext.Provider value={supabase}>
        <GestureHandlerRootView>
          <StatusBar backgroundColor="#393E41" barStyle="light-content" />
          <Stack
            screenOptions={() => ({
              headerStyle: {
                backgroundColor: "#393E41",
              },
              headerTitleStyle: {
                fontFamily: "BeProVietnam",
                color: "#F6F7EB",
                fontSize: isIPad ? 24 : 16,
              },
              headerTintColor: "#F6F7EB",
              headerShadowVisible: false,
              headerBackButtonDisplayMode: "minimal",
            })}
          >
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            ></Stack.Screen>
            <Stack.Screen
              name="register"
              options={{ headerShown: false }}
            ></Stack.Screen>
            <Stack.Screen
              name="passwordreset"
              options={{ headerShown: false }}
            ></Stack.Screen>
            {/* <Stack.Screen
              name="getpremium"
              options={{ headerShown: false }}
            ></Stack.Screen> */}
            {/* <Stack.Screen
              name="reactivatepremium"
              options={{ headerShown: false }}
            ></Stack.Screen> */}
            {/* <Stack.Screen
              name="cancelpremium"
              options={{ headerShown: false }}
            ></Stack.Screen> */}
            <Stack.Screen
              name="billchangestatus"
              options={{ headerShown: false }}
            ></Stack.Screen>
            <Stack.Screen
              name="deleteaccount"
              options={{ headerShown: false }}
            ></Stack.Screen>
            {/* <Stack.Screen
              name="stripe-redirect"
              options={{ headerShown: false }}
            ></Stack.Screen> */}
            <Stack.Screen
              name="changepassword"
              options={{ headerShown: false }}
            ></Stack.Screen>
            <Stack.Screen
              name="leaderboards"
              options={{ headerShown: true, title: "Leaderboards" }}
            ></Stack.Screen>
            <Stack.Screen
              name="ereader/[id]"
              options={{ headerShown: true, title: "Reader" }}
            ></Stack.Screen>
            <Stack.Screen
              name="view_artwork/[id]"
              options={{
                headerShown: true,
                title: "View Artwork",
                headerStyle: {
                  backgroundColor: "#393E41",
                },
                headerTitleStyle: {
                  fontFamily: "BeProVietnam",
                  color: "#F6F7EB",
                  fontSize: isIPad ? 24 : 16,
                },
                headerTintColor: "#F6F7EB",
                headerShadowVisible: false,
              }}
            ></Stack.Screen>
            <Stack.Screen
              name="view_quote/[id]"
              options={{
                headerShown: true,
                title: "View Quote",
                headerStyle: {
                  backgroundColor: "#393E41",
                },
                headerTitleStyle: {
                  fontFamily: "BeProVietnam",
                  color: "#F6F7EB",
                  fontSize: isIPad ? 24 : 16,
                },
                headerTintColor: "#F6F7EB",
                headerShadowVisible: false,
              }}
            ></Stack.Screen>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false, title: "Home" }}
            />
          </Stack>
          <Toast config={toastConfig} />
        </GestureHandlerRootView>
      </SupabaseContext.Provider>
    </>
  );
}

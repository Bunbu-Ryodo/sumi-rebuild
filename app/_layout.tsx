import { Stack } from "expo-router";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import supabase from "../lib/supabase";
import { createContext, useContext } from "react";
import { View, Text } from "react-native";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import Ionicons from "@expo/vector-icons/Ionicons";

const SupabaseContext = createContext(supabase);

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
    QuicksandReg: require("../assets/fonts/Quicksand-Regular.ttf"),
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
              fontFamily: "QuicksandReg",
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
              fontFamily: "QuicksandReg",
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
              fontFamily: "QuicksandReg",
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
              fontFamily: "QuicksandReg",
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
              fontFamily: "QuicksandReg",
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
    <SupabaseContext.Provider value={supabase}>
      <GestureHandlerRootView>
        <StatusBar backgroundColor="#393E41" barStyle="light-content" />
        <Stack>
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
          <Stack.Screen
            name="changepassword"
            options={{ headerShown: false }}
          ></Stack.Screen>
          <Stack.Screen
            name="ereader/[id]"
            options={{ headerShown: false }}
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
                fontFamily: "QuicksandReg",
                color: "#F6F7EB",
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
                fontFamily: "QuicksandReg",
                color: "#F6F7EB",
              },
              headerTintColor: "#F6F7EB",
              headerShadowVisible: false,
            }}
          ></Stack.Screen>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <Toast config={toastConfig} />
      </GestureHandlerRootView>
    </SupabaseContext.Provider>
  );
}

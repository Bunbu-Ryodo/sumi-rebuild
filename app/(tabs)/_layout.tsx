import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar, useWindowDimensions } from "react-native";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;

  return (
    <>
      <StatusBar backgroundColor="#393E41" barStyle="light-content" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#F6F7EB",
          headerStyle: {
            backgroundColor: "#393E41",
          },
          headerTitleStyle: {
            fontFamily: "BeProVietnam",
            fontSize: isIPad ? 24 : 16,
          },
          headerShadowVisible: false,
          headerTintColor: "#F6F7EB",
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#393E41",
          },
        }}
      >
        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "newspaper" : "newspaper-outline"}
                size={isIPad ? 30 : 24}
                color={color}
              />
            ),
          }}
        ></Tabs.Screen>

        <Tabs.Screen
          name="subscriptions"
          options={{
            title: "Subscriptions",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "mail" : "mail-outline"}
                size={isIPad ? 32 : 24}
                color={color}
              />
            ),
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="artworks"
          options={{
            title: "Artworks & Quotes",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={(focused ? "heart" : "heart-outline") as any}
                size={isIPad ? 32 : 24}
                color={color}
              />
            ),
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={isIPad ? 30 : 24}
                color={color}
              />
            ),
          }}
        ></Tabs.Screen>
      </Tabs>
    </>
  );
}

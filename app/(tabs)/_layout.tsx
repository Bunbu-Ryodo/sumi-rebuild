import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StatusBar } from "react-native";

export default function TabLayout() {
  return (
    <>
      <StatusBar
        backgroundColor="#393E41" // Match the header background color
        barStyle="light-content" // Light icons for dark background
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#F6F7EB",
          headerStyle: {
            backgroundColor: "#393E41",
          },
          headerTitleStyle: {
            fontFamily: "QuicksandReg",
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
                size={24}
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
                size={24}
                color={color}
              />
            ),
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="achievements"
          options={{
            title: "Achievements",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "trophy" : "trophy-outline"}
                size={24}
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
                size={24}
                color={color}
              />
            ),
          }}
        ></Tabs.Screen>
      </Tabs>
    </>
  );
}

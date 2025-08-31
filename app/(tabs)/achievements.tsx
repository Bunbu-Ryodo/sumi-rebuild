import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Easing,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  getUserSession,
  lookUpUserProfile,
} from "../../supabase_queries/auth.js";
import Achievement from "../../components/achievement";
import PendingAchievement from "../../components/pendingAchievement";
import {
  AchievementTypeClient,
  PendingAchievementType,
} from "../../types/types.js";
import { fetchAchievementByDescription } from "../../supabase_queries/achievements";
import type { PropsWithChildren } from "react";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";

let adUnitId = "";

// Use test ads when in dev mode OR when EXPO_PUBLIC_USE_TEST_ADS is set
const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

if (useTestAds) {
  adUnitId = TestIds.ADAPTIVE_BANNER;
} else if (Platform.OS === "android") {
  adUnitId = "ca-app-pub-5850018728161057/6524403480";
} else if (Platform.OS === "ios") {
  adUnitId = "ca-app-pub-5850018728161057/3269917700";
}

type BounceInProps = PropsWithChildren<{}>;

const BounceView: React.FC<BounceInProps> = (props) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.3333,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      }}
    >
      {props.children}
    </Animated.View>
  );
};

export default function Achievements() {
  const bannerRef = useRef<BannerAd>(null);
  // const [loading, setLoading] = useState(true); // Add a loading state

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  // const getProfileData = async function () {
  //   setLoading(true);
  //   const user = await getUserSession();
  //   setLoading(false);
  // };

  // useEffect(() => {
  //   getProfileData();
  // }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.achievementsContentContainer}
      style={styles.container}
      // refreshControl={
      // <RefreshControl
      //   refreshing={loading}
      //   onRefresh={getProfileData}
      //   tintColor="#F6F7EB"
      // />
      // }
    >
      {/* {loading ? null : (
        <View style={styles.achievementHeader}>
          <Text style={styles.header}>Sumi</Text>
          <Text style={styles.tagline}>Just One More Chapter</Text>
        </View>
      )} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  achievementsContentContainer: {
    alignItems: "center",
    width: "100%",
    padding: 16,
  },
  container: {
    backgroundColor: "#F6F7EB",
    flex: 1,
  },
  achievementHeader: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 36,
    fontFamily: "EBGaramond",
    color: "#393E41",
  },
  tagline: {
    fontSize: 18,
    fontFamily: "QuicksandReg",
    color: "#393E41",
  },
  nameAndScoreContainer: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 18,
    fontFamily: "QuicksandReg",
    color: "#393E41",
    textAlign: "center",
  },
  readerTag: {
    fontSize: 18,
    fontFamily: "QuicksandReg",
    color: "#393E41",
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
  },
  medalContainer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    width: 150,
  },
  bronzeMedal: {
    backgroundColor: "#cd7f32",
    height: 24,
    width: 24,
    borderRadius: 12,
  },
  silverMedal: {
    backgroundColor: "#C0C0C0",
    height: 24,
    width: 24,
    borderRadius: 12,
  },
  goldMedal: {
    backgroundColor: "#FFD700",
    height: 24,
    width: 24,
    borderRadius: 12,
  },
  completedAchievementsContainer: {
    marginTop: 12,
    width: "90%",
    maxWidth: 368,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    padding: 16,
    justifyContent: "space-evenly",
  },
  completedAchievementsHeader: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    flexDirection: "row",
  },
  completedAchievementText: {
    fontFamily: "QuicksandReg",
    fontSize: 18,
    color: "#393E41",
  },
  pendingAchievementsContainer: {
    marginTop: 12,
    width: "90%",
    maxWidth: 368,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    padding: 16,
    justifyContent: "space-evenly",
  },
  pendingAchievementsHeader: {
    marginTop: 16,
    textDecorationLine: "underline",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  achievementsWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  medalCountContainer: {},
});

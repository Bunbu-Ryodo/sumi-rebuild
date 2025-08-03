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
  const [achievements, setAchievements] = useState([]);
  const [achievementScore, setAchievementScore] = useState(0);
  const [bronzeCount, setBronzeCount] = useState(0);
  const [silverCount, setSilverCount] = useState(0);
  const [goldCount, setGoldCount] = useState(0);
  const [readerTag, setReaderTag] = useState("");
  const [readCount, setReadCount] = useState(0);
  const [subscribedCount, setSubscribedCount] = useState(0);
  const [pendingAchievements, setPendingAchievements] = useState<
    PendingAchievementType[]
  >([]);
  const [loading, setLoading] = useState(true); // Add a loading state

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  const getProfileData = async function () {
    setLoading(true);
    const user = await getUserSession();

    if (user) {
      const userProfile = await lookUpUserProfile(user.id);
      if (userProfile) {
        setAchievements(userProfile.achievements || []);
        setAchievementScore(userProfile.achievementScore || 0);
        setBronzeCount(userProfile.bronzeCount || 0);
        setSilverCount(userProfile.silverCount || 0);
        setGoldCount(userProfile.goldCount || 0);
        setReaderTag(userProfile.username || "");
        setReadCount(userProfile.readCount);
        setSubscribedCount(userProfile.subscribedCount);
        await calculateInProgressAchievements();
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getProfileData();
  }, []);

  useEffect(() => {
    const calculateAchievements = async () => {
      await calculateInProgressAchievements();
    };
    calculateAchievements();
  }, [achievements, achievementScore, readCount, subscribedCount]);

  const calculateInProgressAchievements = async () => {
    let inProgressAchievements = [];
    let inProgress;

    if (readCount === 0) {
    } else if (readCount < 10) {
      const progress = (readCount / 10) * 100;
      const achievement = await fetchAchievementByDescription(
        "Read 10 extracts"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (readCount < 25) {
      const progress = (readCount / 25) * 100;
      const achievement = await fetchAchievementByDescription(
        "Read 25 extracts"
      );
      inProgress = { ...achievement, progress };
    } else if (readCount < 50) {
      const progress = (readCount / 50) * 100;
      const achievement = await fetchAchievementByDescription(
        "Read 50 extracts"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (readCount < 100) {
      const progress = readCount;
      const achievement = await fetchAchievementByDescription(
        "Read 100 extracts"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (readCount < 200) {
      const progress = (readCount / 200) * 100;
      const achievement = await fetchAchievementByDescription(
        "Read 200 extracts"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    }

    if (subscribedCount === 0) {
    } else if (subscribedCount < 10) {
      const progress = (subscribedCount / 10) * 100;
      const achievement = await fetchAchievementByDescription(
        "Subscribe to 10 series"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (subscribedCount < 25) {
      const progress = (subscribedCount / 25) * 100;
      const achievement = await fetchAchievementByDescription(
        "Subscribe to 25 series"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (subscribedCount < 50) {
      const progress = (subscribedCount / 50) * 100;
      const achievement = await fetchAchievementByDescription(
        "Subscribe to 50 series"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (subscribedCount < 100) {
      const progress = subscribedCount;
      const achievement = await fetchAchievementByDescription(
        "Subscribe to 100 series"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    } else if (subscribedCount < 200) {
      const progress = (subscribedCount / 200) * 100;
      const achievement = await fetchAchievementByDescription(
        "Subscribe to 200 series"
      );
      inProgress = { ...achievement, achievementProgress: progress };
    }

    if (inProgress) {
      inProgressAchievements.push(inProgress);
    }
    setPendingAchievements(inProgressAchievements);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.achievementsContentContainer}
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={getProfileData}
            tintColor="#F6F7EB"
          />
        }
      >
        {loading ? null : (
          <View style={styles.achievementHeader}>
            <Text style={styles.header}>Sumi</Text>
            <Text style={styles.tagline}>Just One More Chapter</Text>
          </View>
        )}

        {!loading && (
          <View style={styles.achievementsWrapper}>
            <View style={styles.nameAndScoreContainer}>
              <Text style={styles.readerTag}>ReaderTag: {readerTag}</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.score}>Score: {achievementScore}</Text>
              </View>
              <View style={styles.medalContainer}>
                <View style={styles.medalCountContainer}>
                  <BounceView>
                    <View style={styles.bronzeMedal}></View>
                  </BounceView>
                  <Text style={styles.score}>{bronzeCount}</Text>
                </View>
                <View style={styles.medalCountContainer}>
                  <BounceView>
                    <View style={styles.silverMedal}></View>
                  </BounceView>
                  <Text style={styles.score}>{silverCount}</Text>
                </View>
                <View style={styles.medalCountContainer}>
                  <BounceView>
                    <View style={styles.goldMedal}></View>
                  </BounceView>
                  <Text style={styles.score}>{goldCount}</Text>
                </View>
              </View>
            </View>
            <View style={styles.completedAchievementsHeader}>
              <Text style={styles.completedAchievementText}>
                Completed Achievements
              </Text>
              <Ionicons name="trophy" size={20} color={"#393E41"} />
            </View>
            <View style={styles.completedAchievementsContainer}>
              {achievements.length > 0 ? (
                achievements.map((row: AchievementTypeClient) => (
                  <Achievement
                    id={row.id}
                    key={row.id}
                    title={row.title}
                    description={row.description}
                    score={row.score}
                    date={row.date}
                    icon={row.icon}
                    tier={row.tier}
                  />
                ))
              ) : (
                <Text style={styles.score}>No achievements unlocked.</Text>
              )}
            </View>
            <View style={styles.completedAchievementsHeader}>
              <Text style={styles.completedAchievementText}>
                Pending Achievements
              </Text>
              <Ionicons name="trophy-outline" size={20} color={"#393E41"} />
            </View>
            <View style={styles.pendingAchievementsContainer}>
              {pendingAchievements.length > 0 ? (
                pendingAchievements.map((row: PendingAchievementType) => (
                  <PendingAchievement
                    id={row.id}
                    key={row.id}
                    title={row.title}
                    description={row.description}
                    score={row.score}
                    icon={row.icon}
                    achievementProgress={row.achievementProgress}
                  />
                ))
              ) : (
                <Text style={styles.score}>No pending achievements.</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      <BannerAd
        key={`ad-achievements`}
        ref={bannerRef}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </>
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

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useEffect, useState } from "react";
import { getUserSession } from "../../supabase_queries/auth.js";
import { getAllSeries, getStreak } from "../../supabase_queries/subscriptions";
import { SeriesType, StreakType } from "../../types/types";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import React, { useRef } from "react";
import Series from "../../components/series";
import { Link } from "expo-router";

let adUnitId = "";

const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

if (useTestAds) {
  adUnitId = TestIds.ADAPTIVE_BANNER;
} else if (Platform.OS === "android") {
  adUnitId = "ca-app-pub-5850018728161057/6524403480";
} else if (Platform.OS === "ios") {
  adUnitId = "ca-app-pub-5850018728161057/3269917700";
}

export default function Subscriptions() {
  const bannerRef = useRef<BannerAd>(null);
  const [series, setSeries] = useState<SeriesType[]>([]);
  const [streak, setStreak] = useState<StreakType | null>(null);
  const [loading, setLoading] = useState(true);

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  const fetchSubscriptionData = async () => {
    setLoading(true);
    const user = await getUserSession();
    const streakData = await getStreak(user?.id || "");
    if (streakData) {
      setStreak(streakData);
    }
    if (user) {
      const series = await getAllSeries(user.id);
      setSeries(series || []);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.subscriptionWrapper}
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchSubscriptionData}
            tintColor="#F6F7EB"
          />
        }
      >
        {!loading && (
          <View style={styles.extractWrapper}>
            <View style={styles.subscriptionsHeader}>
              <Text style={styles.newInstallmentsHeader}>
                {series.length > 0
                  ? "Your Subscriptions"
                  : "Subscribe To A Series!"}
              </Text>
              <View style={styles.headerIconContainer}>
                <Ionicons name="mail-unread" size={24} color={"#393E41"} />
              </View>
            </View>
            <View style={styles.streakHeader}>
              <Text style={styles.streakHeaderText}>
                Current Login & Read Streak: {streak?.current_streak}
              </Text>
              <Text style={styles.streakHeaderText}>
                Longest Streak:{" "}
                {streak && streak.longest_streak > 0
                  ? streak.longest_streak
                  : streak?.current_streak}
              </Text>
              <View style={styles.headerIconContainer}>
                <Ionicons name="calendar" size={24} color={"#393E41"} />
              </View>
              <Link href="/leaderboards" asChild>
                <TouchableOpacity style={styles.seeLeaderboardButton}>
                  <Text style={styles.secondaryButtonText}>
                    Global Leaderboard
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.subscriptionSection}>
              {series
                ? series.map((series) => <Series key={series.id} {...series} />)
                : null}
            </View>
          </View>
        )}
      </ScrollView>
      <BannerAd
        key={`ad-subscriptions`}
        ref={bannerRef}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </>
  );
}

const styles = StyleSheet.create({
  subscriptionWrapper: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F6F7EB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F7EB",
  },
  subscriptionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  streakHeader: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  artworksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  newInstallmentsHeader: {
    fontFamily: "BeProVietnam",
    fontSize: 20,
    color: "#393E41",
  },
  streakHeaderText: {
    fontFamily: "BeProVietnam",
    fontSize: 16,
    color: "#393E41",
  },
  yourArtworks: {
    fontFamily: "BeProVietnam",
    fontSize: 20,
    color: "#393E41",
  },
  headerIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  extractWrapper: {
    padding: 16,
    marginTop: 24,
    width: "100%",
  },
  subscriptionSection: {
    marginTop: 12,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  scrapbookSection: {
    marginTop: 12,
    padding: 8,
    width: "100%",
    backgroundColor: "lightblue",
  },
  noInstalmentsText: {
    fontFamily: "BeProVietnam",
    fontSize: 16,
    color: "#393E41",
    textAlign: "center",
    alignSelf: "center",
  },
  thumbnailContainer: {
    alignItems: "center",
    width: "100%",
  },
  artworkTitle: {
    fontFamily: "EBGaramondItalic",
    fontSize: 16,
    color: "#393E41",
    textAlign: "center",
  },
  artworkDetails: {
    fontFamily: "EBGaramond",
    fontSize: 16,
    color: "#393E41",
    textAlign: "center",
  },
  thumbnail: {
    width: 200,
    height: 220,
    cursor: "pointer",
    textAlign: "center",
    borderRadius: 8,
  },
  artworkDetailsContainer: {
    marginTop: 8,
  },
  seeLeaderboardButton: {
    paddingVertical: 16,
    backgroundColor: "#363E41",
    borderRadius: 8,
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
    marginTop: 16,
  },
  secondaryButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
});

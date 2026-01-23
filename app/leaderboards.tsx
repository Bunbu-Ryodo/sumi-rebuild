import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import { useEffect, useState } from "react";
import React, { useRef } from "react";
import { StreakType } from "../types/types";
import { getLeaderBoard } from "../supabase_queries/subscriptions";
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

export default function Leaderboards() {
  const bannerRef = useRef<BannerAd>(null);
  const [leaderboard, setLeaderboard] = useState<StreakType[]>([]);
  const [loading, setLoading] = useState(true);

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  const fetchLeaderboardData = async () => {
    setLoading(true);
    const leaderboardData = await getLeaderBoard();
    if (leaderboardData) {
      setLeaderboard(leaderboardData || []);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.subscriptionWrapper}
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLeaderboardData}
            tintColor="#F6F7EB"
          />
        }
      >
        <View style={styles.streakWrapper}>
          <View style={styles.leaderBoardHeader}>
            <Text style={styles.newInstallmentsHeader}>Global Leaderboard</Text>
            <View style={styles.headerIconContainer}>
              <Ionicons name="globe" size={24} color={"#393E41"} />
            </View>
          </View>
          <View
            style={{ width: "100%", alignItems: "center", marginBottom: 12 }}
          >
            <Link href="/subscriptions" asChild>
              <TouchableOpacity style={styles.seeLeaderboardButton}>
                <Ionicons name="arrow-back" size={20} color={"#393E41"} />
                <Text style={styles.secondaryButtonText}>
                  Back to Subscriptions
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
          {!loading &&
            leaderboard.map((streak, index) => (
              <View
                key={streak.id}
                style={{
                  alignItems: "center",
                  width: "100%",
                  justifyContent: "center",
                  flexDirection: "row",
                }}
              >
                <Text
                  style={[
                    {
                      fontFamily: "QuicksandReg",
                      fontSize: 18,
                      color: "#393E41",
                    },
                  ]}
                >
                  {index + 1}. {streak.username}: {streak.current_streak} days
                  (record:{" "}
                  {streak.longest_streak
                    ? streak.longest_streak
                    : streak.current_streak}
                  )
                </Text>
                {index + 1 === 1 && (
                  <Ionicons name="trophy" size={24} color={"gold"} />
                )}
                {index + 1 === 2 && (
                  <Ionicons name="trophy" size={24} color={"silver"} />
                )}
                {index + 1 === 3 && (
                  <Ionicons name="trophy" size={24} color={"bronze"} />
                )}
              </View>
            ))}
        </View>
      </ScrollView>
      <BannerAd
        key={`ad-leaderboard`}
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
  leaderBoardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
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
    fontFamily: "QuicksandReg",
    fontSize: 20,
    color: "#393E41",
  },
  streakHeaderText: {
    fontFamily: "QuicksandReg",
    fontSize: 16,
    color: "#393E41",
  },
  yourArtworks: {
    fontFamily: "QuicksandReg",
    fontSize: 20,
    color: "#393E41",
  },
  headerIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  streakWrapper: {
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
    fontFamily: "QuicksandReg",
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
  changeReaderTagButton: {
    paddingVertical: 16,
    backgroundColor: "#363E41",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
    marginTop: 16,
  },
  secondaryButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  seeLeaderboardButton: {
    flexDirection: "row",
    backgroundColor: "#F6F7EB",
    alignItems: "center",
    width: "50%",
  },
});

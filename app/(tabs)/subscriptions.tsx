import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useEffect, useState } from "react";
import {
  getUserSession,
  // hasActivePremiumSubscription,
} from "../../supabase_queries/auth.js";
import { getAllSeries } from "../../supabase_queries/subscriptions";
import { SeriesType } from "../../types/types";
import React from "react";
import Series from "../../components/series";
import { Link } from "expo-router";

export default function Subscriptions() {
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === "ios" && Platform.isPad;
  const [series, setSeries] = useState<SeriesType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    const user = await getUserSession();
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
              <Text
                style={[
                  styles.newInstallmentsHeader,
                  isIPad && { fontSize: 24 },
                ]}
              >
                {series.length > 0 ? "" : "Subscribe To A Series!"}
              </Text>
              <View style={styles.headerIconContainer}>
                <Ionicons name="mail-unread" size={24} color={"#393E41"} />
              </View>
            </View>
            <View style={styles.streakHeader}>
              <Link href="/leaderboards" asChild>
                <TouchableOpacity style={styles.seeLeaderboardButton}>
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      isIPad && { fontSize: 24 },
                    ]}
                  >
                    Global Leaderboard
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.subscriptionSection}>
              {series
                ? series.map((series) => (
                    <Series key={series.id} {...series} isIPad={isIPad} />
                  ))
                : null}
            </View>
          </View>
        )}
      </ScrollView>
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
    marginTop: 12,
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

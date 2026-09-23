import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import React from "react";
import { ProfileHighscoreType } from "../types/types";
import { getHighscoreLeaderboard } from "../supabase_queries/profiles";
import { getUserSession } from "../supabase_queries/auth";

export default function Leaderboards() {
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === "ios" && Platform.isPad;
  const [leaderboard, setLeaderboard] = useState<ProfileHighscoreType[]>([]);
  const [currentUserRow, setCurrentUserRow] =
    useState<ProfileHighscoreType | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    const user = await getUserSession();

    const leaderboardData = await getHighscoreLeaderboard();
    if (leaderboardData) {
      setLeaderboard(leaderboardData || []);

      if (user) {
        const matchedIndex = leaderboardData.findIndex(
          (profile) => profile.user_id === user.id,
        );

        if (matchedIndex !== -1) {
          setCurrentUserRow(leaderboardData[matchedIndex]);
          setCurrentUserRank(matchedIndex + 1);
        } else {
          setCurrentUserRow(null);
          setCurrentUserRank(null);
        }
      } else {
        setCurrentUserRow(null);
        setCurrentUserRank(null);
      }
    }

    setLoading(false);
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
          {!loading && currentUserRow && currentUserRank !== null ? (
            <View style={styles.currentUserCard}>
              <Text style={styles.currentUserTitle}>Your ranking</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.rankColumn]}>
                  #
                </Text>
                <Text style={[styles.tableHeaderText, styles.usernameColumn]}>
                  User
                </Text>
                <Text style={[styles.tableHeaderText, styles.recordColumn]}>
                  Score
                </Text>
              </View>
              <View style={[styles.tableRow, styles.currentUserRow]}>
                <View style={styles.rankColumn}>
                  <Text
                    style={[
                      styles.tableCellText,
                      { fontSize: isIPad ? 22 : 16 },
                    ]}
                  >
                    {currentUserRank}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tableCellText,
                    styles.usernameColumn,
                    { fontSize: isIPad ? 22 : 16 },
                  ]}
                  numberOfLines={1}
                >
                  {currentUserRow.username}
                </Text>
                <Text
                  style={[
                    styles.tableCellText,
                    styles.recordColumn,
                    { fontSize: isIPad ? 22 : 16 },
                  ]}
                  numberOfLines={1}
                >
                  {currentUserRow.highscore}
                </Text>
              </View>
            </View>
          ) : null}
          {!loading && leaderboard.length > 0 ? (
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.rankColumn]}>#</Text>
              <Text style={[styles.tableHeaderText, styles.usernameColumn]}>
                User
              </Text>
              <Text style={[styles.tableHeaderText, styles.recordColumn]}>
                Score
              </Text>
            </View>
          ) : null}
          {!loading &&
            leaderboard.map((profile, index) => (
              <View key={profile.user_id} style={styles.tableRow}>
                <View style={styles.rankColumn}>
                  <Text
                    style={[
                      styles.tableCellText,
                      { fontSize: isIPad ? 24 : 18 },
                    ]}
                  >
                    {index + 1}
                  </Text>
                  {index + 1 === 1 && (
                    <Ionicons name="trophy" size={18} color={"gold"} />
                  )}
                  {index + 1 === 2 && (
                    <Ionicons name="trophy" size={18} color={"silver"} />
                  )}
                  {index + 1 === 3 && (
                    <Ionicons name="trophy" size={18} color={"#cd7f32"} />
                  )}
                </View>
                <Text
                  style={[
                    styles.tableCellText,
                    styles.usernameColumn,
                    { fontSize: isIPad ? 24 : 18 },
                  ]}
                  numberOfLines={1}
                >
                  {profile.username}
                </Text>
                <Text
                  style={[
                    styles.tableCellText,
                    styles.recordColumn,
                    { fontSize: isIPad ? 24 : 18 },
                  ]}
                  numberOfLines={1}
                >
                  {profile.highscore}
                </Text>
              </View>
            ))}
        </View>
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
  streakWrapper: {
    padding: 16,
    marginTop: 8,
    width: "100%",
  },
  currentUserCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(57,62,65,0.25)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  currentUserTitle: {
    fontFamily: "BeProVietnam",
    fontSize: 14,
    color: "#393E41",
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(57,62,65,0.2)",
    marginBottom: 6,
  },
  tableHeaderText: {
    fontFamily: "BeProVietnam",
    color: "#393E41",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(57,62,65,0.12)",
  },
  currentUserRow: {
    borderBottomWidth: 0,
    paddingVertical: 8,
  },
  tableCellText: {
    fontFamily: "BeProVietnam",
    color: "#393E41",
  },
  rankColumn: {
    width: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-start",
  },
  usernameColumn: {
    flex: 1.4,
    textAlign: "left",
    paddingRight: 8,
  },
  recordColumn: {
    flex: 0.9,
    textAlign: "right",
    paddingLeft: 8,
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
    fontFamily: "BeProVietnam",
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

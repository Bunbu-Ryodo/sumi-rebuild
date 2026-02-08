import {
  Dimensions,
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import { ArtworkType, QuoteType } from "../../types/types";
import { getUserArtworks } from "../../supabase_queries/artworks";
import { getUserSession } from "../../supabase_queries/auth.js";
import Ionicons from "@expo/vector-icons/Ionicons";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { useSharedValue } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { getUserQuotes } from "../../supabase_queries/quotes";

let adUnitId = "";

const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

if (useTestAds) {
  adUnitId = TestIds.ADAPTIVE_BANNER;
} else if (Platform.OS === "android") {
  adUnitId = "ca-app-pub-5850018728161057/6524403480";
} else if (Platform.OS === "ios") {
  adUnitId = "ca-app-pub-5850018728161057/3269917700";
}

export default function Artwork() {
  const router = useRouter();
  const bannerRef = useRef<BannerAd>(null);
  const [artworks, setArtworks] = useState<ArtworkType[]>([]);
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [loading, setLoading] = useState(true);

  const artworkCarousel = React.useRef<ICarouselInstance>(null);
  const quoteCarousel = React.useRef<ICarouselInstance>(null);

  const artworkProgress = useSharedValue<number>(0);
  const quoteProgress = useSharedValue<number>(0);

  const width = Dimensions.get("window").width;

  const onPressPaginationArtworks = (index: number) => {
    artworkCarousel.current?.scrollTo({
      count: index - artworkProgress.value,
      animated: true,
    });
  };

  const onPressPaginationQuotes = (index: number) => {
    quoteCarousel.current?.scrollTo({
      count: index - quoteProgress.value,
      animated: true,
    });
  };

  const handleNavigation = (id: number) => {
    router.push({
      pathname: "/view_artwork/[id]",
      params: { id: id },
    });
  };

  const redirectToQuote = (id: number) => {
    router.push({
      pathname: "/view_quote/[id]",
      params: { id: id },
    });
  };

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const user = await getUserSession();
    if (user) {
      const artworks = await getUserArtworks(user.id);
      const quotes = await getUserQuotes(user.id);
      setArtworks(artworks);
      setQuotes(quotes);
    }
    setLoading(false);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.artworksWrapper}
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchData}
            tintColor="#F6F7EB"
          />
        }
      >
        {!loading && (
          <View style={styles.artWrapper}>
            <View style={styles.artworksHeader}>
              <Text style={styles.yourArtworks}>{"Artworks and Quotes"}</Text>
              <View style={styles.headerIconContainer}>
                <View style={styles.iconContainer}>
                  <Ionicons name="color-palette" size={24} color={"#393E41"} />
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={24}
                    color={"#393E41"}
                  />
                </View>
              </View>
            </View>
            {artworks && artworks.length > 0 ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 24,
                  minHeight: 500,
                }}
              >
                <Carousel
                  ref={artworkCarousel}
                  width={width}
                  height={310}
                  data={artworks}
                  onProgressChange={artworkProgress}
                  renderItem={(artwork) => {
                    return (
                      <TouchableOpacity
                        style={styles.thumbnailContainer}
                        onPress={() => handleNavigation(artwork.item.id)}
                      >
                        <Image
                          source={{ uri: artwork.item.url }}
                          style={styles.thumbnail}
                        />
                        <View style={styles.artworkDetailsContainer}>
                          <Text style={styles.artworkTitle}>
                            {artwork.item.title}
                          </Text>
                          <Text style={styles.artworkDetails}>
                            {artwork.item.artist}
                          </Text>
                          <Text style={styles.artworkDetails}>
                            {artwork.item.year}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
                <Pagination.Basic
                  progress={artworkProgress}
                  data={artworks}
                  dotStyle={{
                    backgroundColor: "rgba(57,62,65,0.2)",
                    borderRadius: 50,
                  }}
                  containerStyle={{ gap: 5, marginTop: 10 }}
                  onPress={onPressPaginationArtworks}
                />
              </View>
            ) : null}
            <View style={styles.artworksHeader}>
              <View style={styles.headerIconContainer}></View>
            </View>
            {quotes && quotes.length > 0 ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Carousel
                  ref={quoteCarousel}
                  width={width}
                  height={300}
                  data={quotes}
                  onProgressChange={quoteProgress}
                  renderItem={(quote) => {
                    const quotePreview = quote.item.quote.slice(0, 420);
                    return (
                      <TouchableOpacity
                        style={styles.quoteContainer}
                        onPress={() => redirectToQuote(quote.item.id)}
                      >
                        <View style={styles.quoteHeader}>
                          <View style={styles.quoteDetails}>
                            <Text style={styles.quoteText}>
                              {quote.item.author}
                            </Text>
                            <Text style={styles.quoteText}>
                              {quote.item.title}
                            </Text>
                            <Text style={styles.quoteText}>
                              {quote.item.year}
                            </Text>
                            <Text style={styles.quoteText}>
                              Chapter {quote.item.chapter}
                            </Text>
                          </View>
                          <View style={styles.artContainer}>
                            <Image
                              source={{ uri: quote.item.coverart }}
                              style={styles.coverart}
                            />
                          </View>
                        </View>
                        <Text style={styles.quoteText}>
                          {quotePreview}
                          {quote.item.quote.length > 420 ? "..." : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
                <Pagination.Basic
                  progress={quoteProgress}
                  data={quotes}
                  dotStyle={{
                    backgroundColor: "rgba(57,62,65,0.2)",
                    borderRadius: 50,
                  }}
                  containerStyle={{ gap: 5, marginTop: 10 }}
                  onPress={onPressPaginationArtworks}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
      <BannerAd
        key={`ad-artworks`}
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
    fontFamily: "BeProVietnam",
    color: "#393E41",
  },
  nameAndScoreContainer: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  score: {
    fontSize: 18,
    fontFamily: "BeProVietnam",
    color: "#393E41",
    textAlign: "center",
  },
  readerTag: {
    fontSize: 18,
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  quoteText: {
    fontFamily: "EBGaramond",
    fontSize: 18,
  },
  achievementsWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailContainer: {
    alignItems: "center",
    width: "100%",
  },
  quoteContainer: {
    padding: 12,
    width: "100%",
    height: "auto",
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
  headerIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  artworksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  yourArtworks: {
    fontFamily: "BeProVietnam",
    fontSize: 20,
    color: "#393E41",
  },
  artworksWrapper: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F6F7EB",
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F7EB",
  },
  artWrapper: {
    padding: 16,
    marginTop: 24,
    width: "100%",
    height: "100%",
  },
  coverart: {
    borderRadius: 8,
    height: 100,
    width: 100,
  },
  quoteDetails: {
    flex: 1,
    marginBottom: 8,
    marginRight: 12,
    padding: 8,
  },
  quoteHeader: {
    flexDirection: "row",
    width: "100%",
    height: "auto",
    alignItems: "flex-start",
    borderColor: "#393E41",
    borderBottomWidth: 1,
    borderStyle: "dotted",
  },
  artContainer: {
    width: 100,
    height: 100,
  },
  iconContainer: {
    flexDirection: "row",
  },
});

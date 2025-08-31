import {
  View,
  Dimensions,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Instalment from "../../components/chapter";

import { useEffect, useState } from "react";
import { getUserSession } from "../../supabase_queries/auth.js";
import {
  getAllInstalments,
  getAllUpcomingSubscriptions,
} from "../../supabase_queries/subscriptions";
import { getUserArtworks } from "../../supabase_queries/artworks";
import {
  InstalmentType,
  SubscriptionType,
  ArtworkType,
} from "../../types/types";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import React, { useRef } from "react";
import { useSharedValue } from "react-native-reanimated";
import Carousel, {
  ICarouselInstance,
  Pagination,
} from "react-native-reanimated-carousel";
import { useRouter } from "expo-router";
import Book from "../../components/book";

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

export default function Subscriptions() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<ArtworkType[]>([]);
  const bannerRef = useRef<BannerAd>(null);

  // const ref = React.useRef<ICarouselInstance>(null);
  // const progress = useSharedValue<number>(0);
  // const width = Dimensions.get("window").width;

  // const onPressPagination = (index: number) => {
  //   ref.current?.scrollTo({
  //     /**
  //      * Calculate the difference between the current index and the target index
  //      * to ensure that the carousel scrolls to the nearest index
  //      */
  //     count: index - progress.value,
  //     animated: true,
  //   });
  // };

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      5;
      bannerRef.current?.load();
    }
  });

  const fetchInstalments = async (userid: string) => {
    if (userid) {
      const instalments = await getAllInstalments(userid);

      if (instalments && instalments.length > 0) {
        populateInstalments(instalments);
      }
    }
  };

  // const fetchUserArtworks = async (userid: string) => {
  //   if (userid) {
  //     const art = await getUserArtworks(userid);
  //     if (art && art.length > 0) {
  //       setArtworks(art);
  //     }
  //   }
  // };

  // const handleNavigation = (id: number) => {
  //   router.push({
  //     pathname: "/view_artwork/[id]",
  //     params: { id: id }, // Assuming 'new' is the ID for creating a new artwork
  //   });
  // };

  // const fetchSubscriptions = async (userid: string) => {
  //   if (userid) {
  //     const upcomingSubscriptions = await getAllUpcomingSubscriptions(userid);

  //     if (upcomingSubscriptions && upcomingSubscriptions.length > 0) {
  //       populateSubscriptions(upcomingSubscriptions);
  //     }
  //   }
  // };

  const fetchSubscriptionData = async () => {
    setLoading(true);
    const user = await getUserSession();
    if (user) {
      await fetchInstalments(user.id);
      // await fetchSubscriptions(user.id);
      // await fetchUserArtworks(user.id);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  async function populateInstalments(instalments: InstalmentType[]) {
    setInstalments(() => {
      return instalments || [];
    });
  }

  // async function populateSubscriptions(subscriptions: SubscriptionType[]) {
  //   setActiveSubscriptions(() => {
  //     return subscriptions || [];
  //   });
  // }

  const [instalments, setInstalments] = useState<InstalmentType[]>([]);
  const [loading, setLoading] = useState(true);
  // const [activeSubscriptions, setActiveSubscriptions] = useState<
  //   SubscriptionType[]
  // >([]);
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
                {instalments.length > 0
                  ? "Your Subscriptions"
                  : "Subscribe To A Series!"}
              </Text>
              <View style={styles.headerIconContainer}>
                <Ionicons name="mail-unread" size={24} color={"#393E41"} />
              </View>
            </View>
            <View style={styles.subscriptionSection}>
              {instalments
                ? instalments.map((instalment) => (
                    <Book key={instalment.id} {...instalment} />
                  ))
                : null}
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
    backgroundColor: "lightblue", // debug
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
});

import {
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useRouter } from "expo-router";
import {
  createNewProfile,
  lookUpUserProfile,
  getUserSession,
  setLoginDateTime,
} from "../../supabase_queries/auth.js";
import { getExtracts } from "../../supabase_queries/feed";
import {
  getAllDueSubscriptions,
  deletePreviousInstalments,
  getExtractByTextIdChapter,
  createInstalment,
  updateSubscription,
  deactivateSubscription,
} from "../../supabase_queries/subscriptions";
import { ExtractType } from "../../types/types.js";
import Extract from "../../components/extract";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import { useRef } from "react";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";

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

function RightAction() {
  return <Reanimated.View style={{ width: 250 }} />;
}

function LeftAction() {
  return <Reanimated.View style={{ width: 250 }} />;
}

export default function FeedScreen() {
  const bannerRef = useRef<BannerAd>(null);
  const router = useRouter();
  const [extracts, setExtracts] = useState([] as ExtractType[]);
  const [refreshing, setRefreshing] = useState(false);
  const [allExtractsDismissed, setAllExtractsDismissed] = useState(false);
  const [userid, setUserid] = useState("");
  const [instalmentCount, setInstalmentCount] = useState(0);

  const displayNewInstalmentsToast = (count: number) => {
    Toast.show({
      type: "newInstalments",
      text1: `${count} new instalment${count > 1 ? "s" : ""}!`,
    });
  };

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  const swipeableRefs = useRef<{ [key: number]: React.RefObject<any> }>({});

  useFocusEffect(
    React.useCallback(() => {
      // Close all swipeables
      Object.values(swipeableRefs.current).forEach((ref) => {
        if (ref.current && typeof ref.current.close === "function") {
          ref.current.close();
        }
      });
    }, [extracts.length])
  );

  useEffect(() => {
    const checkUserAuthenticated = async function () {
      setRefreshing(true);
      const user = await getUserSession();

      if (!user) {
        router.push("/");
      } else if (user) {
        setUserid(user.id);
        await checkUserProfileStatus(user.id);
        await fetchExtracts();
        await processSubscriptions(user.id);
      }
      setRefreshing(false);
      if (instalmentCount > 0) {
        displayNewInstalmentsToast(instalmentCount);
      }
    };
    checkUserAuthenticated();
  }, []);

  const checkUserProfileStatus = async function (userId: string) {
    const userProfile = await lookUpUserProfile(userId);
    if (!userProfile) {
      await createNewProfile(userId, new Date());
    } else if (userProfile) {
      await setLoginDateTime(userId, new Date());
    }
  };

  const handleDismiss = (id: number) => {
    setExtracts((prev) => {
      if (extracts.length - 1 === 0) {
        setAllExtractsDismissed(true);
      }
      return prev.filter((extract) => extract.id !== id);
    });
  };

  const processSubscriptions = async function (userId: string) {
    setInstalmentCount(0);
    const user = await getUserSession();
    const subscriptions = await getAllDueSubscriptions(userId);
    if (user && subscriptions) {
      let count = 0;

      for (let i = 0; i < subscriptions.length; i++) {
        const extract = await getExtractByTextIdChapter(
          subscriptions[i].textid,
          subscriptions[i].chapter
        );

        if (!extract) {
          await deactivateSubscription(subscriptions[i].id, user.id, 1);
          continue;
        }

        const userProfile = await lookUpUserProfile(userId);
        let interval;
        if (userProfile.subscriptioninterval) {
          interval =
            new Date().getTime() + userProfile.subscriptioninterval * 86400000;
        } else {
          interval = new Date().getTime() + 7 * 86400000;
        }
        //For testing
        // interval = new Date().getTime() + 1000;

        if (extract) {
          const updatedSubscription = await updateSubscription(
            subscriptions[i].id,
            subscriptions[i].chapter + 1,
            interval
          );

          if (updatedSubscription) {
            await deletePreviousInstalments(userId, extract.title);

            const nextExtract = await getExtractByTextIdChapter(
              subscriptions[i].textid,
              subscriptions[i].chapter + 1
            );

            if (!nextExtract) {
              const newInstalment = await createInstalment(
                userId,
                extract.id,
                extract.chapter,
                extract.title,
                extract.author,
                updatedSubscription.id,
                updatedSubscription.subscribeart
              );

              if (newInstalment) {
                count++;
                console.log("Instalment created successfully");
              }
            } else {
              const newInstalment = await createInstalment(
                userId,
                extract.id,
                extract.chapter,
                extract.title,
                extract.author,
                updatedSubscription.id,
                updatedSubscription.subscribeart,
                updatedSubscription.due
              );

              if (newInstalment) {
                count++;
                console.log("Instalment created successfully");
              }
            }
          }
        }
      }
      if (count > 0) {
        setInstalmentCount(count);
      }
    } else {
      console.log("Subscriptions up to date");
    }
  };

  const fetchExtracts = async function () {
    setRefreshing(true);
    setAllExtractsDismissed(false);

    const shuffle = (array: ExtractType[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const extracts = await getExtracts();
    if (extracts) {
      const shuffledExtracts = shuffle(extracts);
      setExtracts(shuffledExtracts);
    } else {
      setExtracts([]);
    }
    setRefreshing(false);
  };

  //Refresh data is for testing, should only processSubscriptions on initial load on login
  // const refreshData = async () => {
  //   setInstalmentCount(0);
  //   setRefreshing(true);
  //   const user = await getUserSession();
  //   if (user) {
  //     await fetchExtracts();
  //     await processSubscriptions(user.id);
  //   }
  //   setRefreshing(false);
  //   if (instalmentCount > 0) {
  //     displayNewInstalmentsToast(instalmentCount);
  //   }
  // };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.feedWrapper}
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchExtracts}
            tintColor="#F6F7EB"
          />
        }
      >
        {extracts && extracts.length > 0 ? (
          extracts.map((extract: ExtractType, index: number) => {
            if (!swipeableRefs.current[extract.id]) {
              swipeableRefs.current[extract.id] = React.createRef();
            }
            return (
              <ReanimatedSwipeable
                key={extract.id}
                ref={swipeableRefs.current[extract.id]}
                friction={2}
                containerStyle={styles.swipeable}
                enableTrackpadTwoFingerGesture
                rightThreshold={40}
                leftThreshold={40}
                renderRightActions={RightAction}
                renderLeftActions={LeftAction}
                onSwipeableWillOpen={(direction) => {
                  if (direction === "right") {
                    handleDismiss(extract.id);
                  } else if (direction === "left") {
                    router.push({
                      pathname: "/ereader/[id]",
                      params: { id: extract.id },
                    });
                  }
                }}
              >
                <Extract
                  key={index}
                  id={extract.id}
                  textid={extract.textid}
                  author={extract.author}
                  title={extract.title}
                  year={extract.year}
                  chapter={extract.chapter}
                  fulltext={extract.fulltext}
                  subscribeart={extract.subscribeart}
                  portrait={extract.portrait}
                  coverart={extract.coverart}
                  coverartArtist={extract.coverartArtist}
                  coverartYear={extract.coverartYear}
                  coverartTitle={extract.coverartTitle}
                  userid={userid}
                />
              </ReanimatedSwipeable>
            );
          })
        ) : allExtractsDismissed ? (
          <TouchableOpacity style={styles.refresh} onPress={fetchExtracts}>
            <Ionicons name="arrow-down" size={36} color="#F6F7EB" />
            <Text style={styles.pulldown}>Pull to be served more extracts</Text>
          </TouchableOpacity>
        ) : (
          <ActivityIndicator size="large" color="#393E41" />
        )}
      </ScrollView>
      <BannerAd
        key={`feedad`}
        ref={bannerRef}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </>
  );
}

const styles = StyleSheet.create({
  feedWrapper: {
    alignItems: "center",
    paddingVertical: 24,
  },
  container: {
    backgroundColor: "#393E41",
    flex: 1,
  },
  headerBar: {
    padding: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  buttonPrimary: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  primaryButtonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  rightAction: {
    backgroundColor: "#F6F7EB",
    fontFamily: "QuicksandReg",
    color: "#393E41",
    fontSize: 16,
    padding: 16,
    borderRadius: 50,
  },
  separator: {
    width: "100%",
    borderTopWidth: 1,
  },
  swipeable: {
    width: "90%",
    minWidth: 250,
    maxWidth: 768,
  },
  refresh: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pulldown: {
    fontFamily: "QuicksandReg",
    fontSize: 18,
    color: "#F6F7EB",
  },
});

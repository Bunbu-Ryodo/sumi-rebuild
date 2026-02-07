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
  getExtractByTextIdChapter,
  updateSubscription,
  appendExtractToSeries,
  getStreak,
  resetStreak,
  createStreak,
} from "../../supabase_queries/subscriptions";
import { setStreakChecking } from "../../supabase_queries/profiles";
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
import { AdsConsent, AdsConsentStatus } from "react-native-google-mobile-ads";
import supabase from "../../lib/supabase.js";

let adUnitId = "";

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

  const displayNewInstalmentsToast = (count: number) => {
    Toast.show({
      type: "newInstalments",
      text1: `${count} new instalment${count > 1 ? "s" : ""}!`,
    });
  };

  const displayErrorToast = (message: string) => {
    Toast.show({
      type: "settingsUpdateError",
      text1: message,
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
      Object.values(swipeableRefs.current).forEach((ref) => {
        if (ref.current && typeof ref.current.close === "function") {
          ref.current.close();
        }
      });
    }, [extracts.length]),
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
        await initializeAdsConsent();
        await fetchExtracts();
        setRefreshing(false);
        processSubscriptions(user.id).catch((err) =>
          console.error("Subscription processing error:", err),
        );
      }
    };
    checkUserAuthenticated();
  }, []);

  const initializeAdsConsent = async () => {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();

      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        await AdsConsent.loadAndShowConsentFormIfRequired();
      }
    } catch (error) {
      console.error("Error initializing consent:", error);
    }
  };

  const createCustomer = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      const { data: customerData, error: customerError } =
        await supabase.functions.invoke("create-customer", {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

      if (customerError) throw customerError;

      console.log("Customer created:", customerData);
      const subscriptionData = await createSubscription(customerData);

      const { id } = customerData;
      const { subscriptionId, status, clientSecret } = subscriptionData || {};

      return {
        id: id,
        subscriptionId: subscriptionId,
        status: status,
        clientSecret: clientSecret,
      };
    } catch (error) {
      console.error("Error creating customer:", error);
      displayErrorToast("Failed to create customer. Please try again.");
    }
  };

  const createSubscription = async (customerData: any) => {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      const { data: subscriptionData, error: subscriptionError } =
        await supabase.functions.invoke("create-subscription", {
          body: {
            customerId: customerData.id,
          },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

      if (subscriptionError) throw subscriptionError;

      console.log("Subscription created:", subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error("Error creating subscription:", error);
      displayErrorToast("Failed to create subscription. Please try again.");
      return null;
    }
  };

  const checkUserProfileStatus = async function (userId: string) {
    const userProfile = await lookUpUserProfile(userId);
    const streak = await getStreak(userId);
    if (!streak) {
      console.log("Streak not found, creating new streak");
      await createStreak(userId, userProfile?.username || "NewUser");
    }
    if (!userProfile) {
      console.log("Profile not found, creating new profile");
      const data = await createCustomer();
      console.log("Customer and subscription data:", data);

      await createNewProfile(
        userId,
        new Date(),
        data?.id,
        data?.subscriptionId,
        data?.status,
        data?.clientSecret,
      );
    } else if (userProfile) {
      const today = new Date();
      const lastLogin = new Date(userProfile.lastLogin);
      const daysDiff = Math.floor(
        (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff > 1) {
        console.log("Streak broken, resetting streak count");

        const streak = await getStreak(userId);
        const currentStreak = streak ? streak.current_streak : 0;
        const longestStreak = streak ? streak.longest_streak : 0;
        if (currentStreak >= longestStreak) {
          await resetStreak(userId, currentStreak);
        } else {
          await resetStreak(userId, longestStreak);
        }
        console.log("Streak reset, checking for new streak");
      }
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
    const user = await getUserSession();
    const subscriptions = await getAllDueSubscriptions(userId);
    if (user && subscriptions?.length) {
      console.log("User has subscriptions due");
      let count = 0;

      for (let i = 0; i < subscriptions.length; i++) {
        const extract = await getExtractByTextIdChapter(
          subscriptions[i].textid,
          subscriptions[i].chapter,
        );

        if (!extract) {
          console.log("No extract found, possibly end of the text");
          continue;
        }

        const userProfile = await lookUpUserProfile(userId);
        let duedate;
        if (userProfile.subscriptioninterval) {
          duedate =
            new Date().getTime() + userProfile.subscriptioninterval * 86400000;
        } else {
          duedate = new Date().getTime() + 7 * 86400000;
        }

        // Comment 162-169, and uncomment 173 for testing
        // let duedate = new Date().getTime() + 1000;

        const preciseDate = new Date(duedate);
        const dueDateMidnight = preciseDate.setHours(0, 0, 0, 0);

        console.log(new Date(dueDateMidnight).toString(), "Next due date");

        if (extract) {
          console.log("Creating new instalment");
          const newInstalment = await appendExtractToSeries(
            userId,
            subscriptions[i].id,
            extract,
            dueDateMidnight,
          );

          if (newInstalment) {
            console.log("Updating subscription to track next due instalment");
            const updatedSubscription = await updateSubscription(
              subscriptions[i].id,
              subscriptions[i].chapter + 1,
              dueDateMidnight,
            );
            if (updatedSubscription) {
              count++;
              console.log("Instalment created successfully");
            }
          }
        }
      }

      if (count > 0) {
        displayNewInstalmentsToast(count);
      }
    } else {
      console.log("Subscriptions up to date");
    }
  };

  const fetchExtracts = async function () {
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
      console.log("Extracts found");
      const shuffledExtracts = shuffle(extracts);
      setExtracts(shuffledExtracts);
    } else {
      console.log("No extracts found");
      setExtracts([]);
    }
  };

  // Refresh data is for testing, should only processSubscriptions on initial load on login
  // const refreshData = async () => {
  //   setRefreshing(true);
  //   const user = await getUserSession();
  //   if (user) {
  //     await fetchExtracts();
  //     await processSubscriptions(user.id);
  //   }
  //   setRefreshing(false);
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

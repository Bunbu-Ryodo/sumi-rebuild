import {
  StyleSheet,
  ScrollView,
  Text,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
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
  // updateUserProfileSubscription,
  // hasActivePremiumSubscription,
} from "../../supabase_queries/auth.js";
import { getExtracts } from "../../supabase_queries/feed";
import { processSubscriptions } from "../../supabase_queries/subscriptions";
import { ExtractType } from "../../types/types.js";
import Extract from "../../components/extract";
import { useRef } from "react";
import { useFocusEffect } from "expo-router";
import Toast from "react-native-toast-message";
import supabase from "../../lib/supabase.js";
const useTestPayment = process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";

function RightAction() {
  return <Reanimated.View style={{ width: 250 }} />;
}

function LeftAction() {
  return <Reanimated.View style={{ width: 250 }} />;
}

export default function FeedScreen() {
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
        await fetchExtracts();
        setRefreshing(false);
        processSubscriptions(user.id)
          .then((count) => {
            if (count > 0) displayNewInstalmentsToast(count);
          })
          .catch((err) => console.error("Subscription processing error:", err));
      }
    };
    checkUserAuthenticated();
  }, []);

  // const createCustomer = async () => {
  //   try {
  //     const { data: session } = await supabase.auth.getSession();

  //     if (!session?.session?.access_token) {
  //       throw new Error("No valid session");
  //     }

  //     let createCustomer;

  //     if (useTestPayment) {
  //       createCustomer = "create-customer";
  //     } else {
  //       createCustomer = "prod-create-customer";
  //     }

  //     const { data: customerData, error: customerError } =
  //       await supabase.functions.invoke(createCustomer, {
  //         headers: {
  //           Authorization: `Bearer ${session.session.access_token}`,
  //         },
  //       });

  //     if (customerError) throw customerError;

  //     const subscriptionData = await createSubscription(customerData.id);

  //     const { id } = customerData;
  //     const { subscriptionId, status, clientSecret } = subscriptionData || {};

  //     return {
  //       id: id,
  //       subscriptionId: subscriptionId,
  //       status: status,
  //       clientSecret: clientSecret,
  //     };
  //   } catch (error) {
  //     console.error("Error creating customer:", error);
  //     displayErrorToast("Failed to create customer. Please try again.");
  //   }
  // };

  const createSubscription = async (customerId: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      let createSubscription;
      if (useTestPayment) {
        createSubscription = "create-subscription";
      } else {
        createSubscription = "prod-create-subscription";
      }
      const { data: subscriptionData, error: subscriptionError } =
        await supabase.functions.invoke(createSubscription, {
          body: {
            customerId: customerId,
          },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

      if (subscriptionError) throw subscriptionError;

      return subscriptionData;
    } catch (error) {
      console.error("Error creating subscription:", error);
      displayErrorToast("Failed to create subscription. Please try again.");
      return null;
    }
  };

  const checkUserProfileStatus = async function (userId: string) {
    const userProfile = await lookUpUserProfile(userId);
    if (!userProfile) {
      console.log("Profile not found, creating new profile");
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
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  primaryButtonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  rightAction: {
    backgroundColor: "#F6F7EB",
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    fontSize: 18,
    color: "#F6F7EB",
  },
});

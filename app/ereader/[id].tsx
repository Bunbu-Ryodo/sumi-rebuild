import { Platform } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import {} from "react";
import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { getExtract } from "../../supabase_queries/extracts";
import { ExtractType } from "../../types/types";
import {
  checkForSubscription,
  createSubscription,
  activateSubscription,
  deactivateSubscription,
  createSeries,
  unhideSeries,
  hideSeries,
  checkForSeries,
} from "../../supabase_queries/subscriptions";
import { getUserSession } from "../../supabase_queries/auth.js";
import supabase from "../../lib/supabase.js";
import { lookUpUserProfile } from "../../supabase_queries/auth";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";
import { useFocusEffect } from "expo-router";

import type { PropsWithChildren } from "react";

// import OpenAI from "openai";

// const client = new OpenAI({
//   apiKey: process.env.EXPO_PUBLIC_OPENAI,
// });

let adUnitId = "";

const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

if (useTestAds) {
  adUnitId = TestIds.ADAPTIVE_BANNER;
} else if (Platform.OS === "android") {
  adUnitId = "ca-app-pub-5850018728161057/6524403480";
} else if (Platform.OS === "ios") {
  adUnitId = "ca-app-pub-5850018728161057/3269917700";
}

type BounceInProps = PropsWithChildren<{}>;

const BounceView = forwardRef<any, BounceInProps>((props, ref) => {
  const scale = useRef(new Animated.Value(1)).current;

  useImperativeHandle(ref, () => ({
    bounce: () => {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3333,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    },
  }));

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      {props.children}
    </Animated.View>
  );
});

export default function EReader() {
  const bannerRef = useRef<BannerAd>(null);
  let { id } = useLocalSearchParams();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  const [extract, setExtract] = useState<ExtractType>({
    id: 0,
    title: "",
    author: "",
    chapter: 0,
    year: "",
    fulltext: "",
    portrait: "",
    coverart: "",
    textid: 0,
    subscribeart: "",
    coverartArtist: "",
    coverartYear: 0,
    coverartTitle: "",
    totalchapters: 0,
  });

  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subid, setSubid] = useState(0);
  const [read, setRead] = useState(false);
  const [userid, setUserid] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [warmth, setWarmth] = useState(0);
  const [due, setDue] = useState(new Date().getTime());
  const [argument, setArgument] = useState("");
  const [thinking, setThinking] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (argument && argument.length > 0) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      }).start();
    }
  }, [argument]);

  const generateChapterArgument = async () => {
    setThinking(true);
    // const creditBalance = await spendOneCredit(userid);
    // if (creditBalance > -1) setCreditsLeft(creditBalance);

    // if (creditBalance > -1) {
    //   setArgument("");
    //   const response = await client.responses.create({
    //     model: "gpt-4o",
    //     input:
    //       "The following is an example of a chapter argument from the novel 'Confessions of an Italian': 'Sicilians at General Guglielmo Pep's camp in Abruzzi. I become acquainted with prison and very nearly with the scaffold, but thanks to la Pisana I lose no more than my eyesight. The miracles of love delivered by a nurse. Refugee Italians in London and soldiers in Greece. I regain my sight with the help of Lucilio, but soon thereafter I lose la Pisana and return home with only my memories still alive.' Read the following text and compose a chapter argument in a similar style. Keep the arguments relatively succinct, as being three or more paragraphs would defeat the purpose of having an argument, as it would become a lengthy extract of in its own right. Please don't include headings like 'chapter argument'." +
    //       extract.fulltext,
    //   });
    //   setThinking(false);
    //   setArgument(response.output_text);
    // } else {
    setArgument(
      "You must become a paying member [coming soon] to get generate AI summaries."
    );
    setThinking(false);
    // }
  };

  const generateChapterBulletPoints = async () => {
    setThinking(true);
    // const creditBalance = await spendOneCredit(userid);

    // if (creditBalance > -1) {
    //   setArgument("");

    //   const response = await client.responses.create({
    //     model: "gpt-4o",
    //     input:
    //       "Summarise the following text into bullet points to help less confident readers understand the text better. These bullets do not need to capture every descriptive detail, unless this is critical to understanding the text or the novel as a whole. The intention is to signpost the main plot points to aid understanding. No need to give the response a title or a heading. " +
    //       extract.fulltext,
    //   });
    //   setThinking(false);
    //   setArgument(response.output_text);
    // } else {
    setArgument(
      "You must become a paying member [coming soon] to get generate AI summaries."
    );
    setThinking(false);
    // }
  };

  const generateSynopsis = async () => {
    setThinking(true);
    // const creditBalance = await spendOneCredit(userid);

    // if (creditBalance > -1) {
    //   setArgument("");
    //   const response = await client.responses.create({
    //     model: "gpt-4o",
    //     input:
    //       "Identify the text the following extract is from and provide a short synopsis as one would find on the back of a paperback. Omit any headers like 'Synopsis' or 'Book Summary': " +
    //       extract.fulltext,
    //   });
    //   setThinking(false);
    //   setArgument(response.output_text);
    // } else {
    setArgument(
      "You must become a paying member [coming soon] to get generate AI summaries."
    );
    setThinking(false);
    // }
  };

  const backToFeed = () => {
    router.push({
      pathname: "/feed",
    });
  };

  const fontUp = () => {
    setFontSize((prevFont) => {
      if (prevFont + 4 > 32) {
        return prevFont;
      }
      return prevFont + 4;
    });
  };

  const fontDown = () => {
    setFontSize((prevFont) => {
      if (prevFont - 4 < 18) {
        return prevFont;
      }
      return prevFont - 4;
    });
  };

  const adjustBrightness = () => {
    setWarmth((prevWarmth) => {
      if (prevWarmth < 4) {
        return prevWarmth + 1;
      } else return 0;
    });
  };

  const brightnessHex = ["#F6F7EB", "#FEECD1", "#FEE4BD", "#FFDAA3", "#393E41"];

  const checkForActiveSubscription = async (
    userId: string,
    extract: ExtractType
  ) => {
    const existingSubscription = await checkForSubscription(
      userId,
      extract.textid
    );

    if (existingSubscription) {
      const isActive =
        existingSubscription.active &&
        existingSubscription.textid === extract.textid;
      setSubscribed(isActive);
      setSubid(existingSubscription.id);
    } else {
      const userProfile = await lookUpUserProfile(userId);

      const doubleCheckSubscription = await checkForSubscription(
        userId,
        extract.textid
      );

      if (doubleCheckSubscription) {
        console.log("Subscription was created by another call");
        setSubid(doubleCheckSubscription.id);
        if (doubleCheckSubscription.active) {
          setSubscribed(true);
        }
        return;
      }

      let duedate;
      if (userProfile.subscriptioninterval) {
        duedate =
          new Date().getTime() + userProfile.subscriptioninterval * 86400000;
      } else {
        duedate = new Date().getTime() + 7 * 86400000;
      }

      // Comment 289-295 and uncomment 298 for testing.
      // let duedate = new Date().getTime();

      const newSubscription = await createSubscription(
        userId,
        extract.textid,
        extract.chapter + 1,
        duedate,
        extract.subscribeart,
        extract.title,
        extract.author
      );

      const existingSeries = await checkForSeries(userId, newSubscription.id);

      if (!existingSeries) {
        const series = await createSeries(
          userId,
          extract.title,
          extract.author,
          newSubscription.id,
          extract.subscribeart,
          [extract],
          1,
          extract.totalchapters,
          duedate
        );

        if (!series) {
          console.error("Error creating series:", series);
        }
      }

      if (newSubscription) {
        setSubid(newSubscription.id);
      }
    }
  };
  const fetchExtract = async () => {
    const user = await getUserSession();
    if (user) {
      setUserid(user.id);
      const extract = await getExtract(id);

      if (extract) {
        setExtract(extract);

        await checkForActiveSubscription(user.id, extract);
      } else {
        router.push("/");
      }

      setLoading(false);
    }
  };

  function shop() {
    if (cartRef.current) {
      cartRef.current.bounce();
    }
  }

  const bounceRef = useRef<any>(null);
  const cartRef = useRef<any>(null);

  async function subscribe() {
    if (bounceRef.current) {
      bounceRef.current.bounce();
    }

    if (subscribed) {
      console.log("Subscription deactivated", subid);
      await deactivateSubscription(subid);

      await hideSeries(userid, subid);
    } else {
      console.log("Subscription activated", subid);
      await activateSubscription(subid);

      await unhideSeries(userid, subid);
    }
  }

  useEffect(() => {
    fetchExtract();
  }, []);

  useEffect(() => {
    if (!subid || subid === 0) return;

    console.log("Setting up listener for subscription:", subid);
    supabase
      .channel(`subscription-updates-${subid}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `id=eq.${subid}`,
        },
        (payload) => {
          if (payload.new && "active" in payload.new) {
            setSubscribed(payload.new.active);
          }
        }
      )
      .subscribe();
  }, [subid]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        console.log("Screen unfocused, cleaning up any active listeners");
        supabase.getChannels().forEach((channel) => {
          if (channel.topic.includes("subscription-updates")) {
            console.log("Force cleaning up channel:", channel.topic);
            supabase.removeChannel(channel);
          }
        });
      };
    }, [])
  );

  return (
    <>
      <ScrollView
        style={[styles.paper, { backgroundColor: brightnessHex[warmth] }]}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#393E41" />
        ) : (
          <View>
            <View>
              <View style={styles.adjustFontSize}>
                <TouchableOpacity
                  style={[
                    styles.fontUp,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={fontUp}
                >
                  <Ionicons name="text" size={24} color="#393E41"></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.fontDown,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={fontDown}
                >
                  <Ionicons name="text" size={18} color="#393E41"></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.brightness,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={adjustBrightness}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={generateChapterArgument}
                >
                  <Ionicons name="school" size={18} color="#393E41"></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={generateChapterBulletPoints}
                >
                  <Ionicons name="list" size={18} color="#393E41"></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={generateSynopsis}
                >
                  <Ionicons
                    name="help-outline"
                    size={18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
              </View>
              <View style={styles.titleBar}>
                <Text
                  style={[styles.title, warmth === 4 && { color: "#F6F7EB" }]}
                >
                  {extract.title}
                </Text>
                <Text
                  style={[styles.chapter, warmth === 4 && { color: "#F6F7EB" }]}
                >
                  {extract.chapter}
                </Text>
              </View>
              {thinking || argument.length ? (
                <View
                  style={[
                    styles.argumentContainer,
                    { alignItems: "center" },
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                >
                  {thinking ? (
                    <ActivityIndicator
                      size="large"
                      color={warmth === 4 ? "#393E41" : "#F6F7EB"}
                    />
                  ) : (
                    <Ionicons
                      name="school"
                      size={24}
                      color="#F6F7EB"
                      style={warmth === 4 && { color: "#393E41" }}
                    />
                  )}

                  {argument && argument.length > 0 && (
                    <Animated.View style={{ opacity: fadeAnim }}>
                      <Text
                        style={[
                          styles.argument,
                          { fontSize },
                          warmth === 4 && { color: "#393E41" },
                        ]}
                      >
                        {argument}
                      </Text>
                    </Animated.View>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="star"
                      size={16}
                      color={warmth === 4 ? "#393E41" : "#F6F7EB"}
                    />
                    <Text
                      style={{
                        color: warmth === 4 ? "#393E41" : "#F6F7EB",
                        fontFamily: "QuicksandReg",
                        fontSize: 16,
                        marginLeft: 4,
                      }}
                    >
                      {creditsLeft || 0}
                    </Text>
                  </View>
                </View>
              ) : (
                <></>
              )}
              <Text
                style={[
                  styles.extractText,
                  { fontSize },
                  warmth === 4 && {
                    color: "#F6F7EB",
                    borderBottomColor: "#F6F7EB",
                  },
                ]}
              >
                {extract.fulltext}
              </Text>
            </View>
            <View style={styles.engagementButtons}>
              {/* <TouchableOpacity onPress={toggleLike}>
              <BounceView ref={heartRef}>
                <Ionicons
                  name={like ? "heart" : "heart-outline"}
                  size={24}
                  color="#D64045"
                />
              </BounceView>
            </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.returnAnchor}
                onPress={backToFeed}
              >
                <Ionicons name="arrow-back" size={24} color="#8980F5" />
                <Text
                  style={[
                    styles.shoppingText,
                    warmth === 4 && { color: "#F6F7EB" },
                  ]}
                >
                  Return to Feed
                </Text>
              </TouchableOpacity>
              <View style={styles.subscribeContainer}>
                <TouchableOpacity onPress={subscribe}>
                  <BounceView ref={bounceRef}>
                    <Ionicons
                      name={subscribed ? "bookmark" : "bookmark-outline"}
                      size={24}
                      color="#FE7F2D"
                    />
                  </BounceView>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.bookmarkText,
                    warmth === 4 && { color: "#F6F7EB" },
                  ]}
                >
                  Subscribe
                </Text>
              </View>
              <View style={styles.shoppingContainer}>
                <BounceView ref={cartRef}>
                  <TouchableOpacity onPress={shop}>
                    <Ionicons name="cart" size={24} color="#77966D" />
                  </TouchableOpacity>
                </BounceView>
                <Text
                  style={[
                    styles.shoppingText,
                    warmth === 4 && { color: "#F6F7EB" },
                  ]}
                >
                  Buy Full Text [Coming Soon]
                </Text>
              </View>
            </View>
            <View></View>
          </View>
        )}
      </ScrollView>
      <BannerAd
        key={`ad-${id}`}
        ref={bannerRef}
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#393E41",
    width: "100%",
    height: "100%",
  },
  titleBar: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "EBGaramondItalic",
    fontSize: 24,
    marginBottom: 8,
    marginTop: 16,
  },
  chapter: {
    fontFamily: "EBGaramond",
    fontSize: 18,
    marginBottom: 16,
  },
  paper: {
    backgroundColor: "#F6F7EB",
    width: "100%",
    padding: 16,
  },
  extractText: {
    fontFamily: "EBGaramond",
    fontSize: 18,
    borderBottomWidth: 1,
    borderColor: "#393E41",
    paddingBottom: 16,
    borderStyle: "dotted",
  },
  engagementButtons: {
    marginTop: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    height: 100,
  },
  subscribeContainer: {
    alignItems: "center",
    maxWidth: 120,
  },
  markAsReadContainer: {
    alignItems: "center",
    color: "#F6F7EB",
  },
  shoppingContainer: {
    alignItems: "center",
    maxWidth: 120,
  },
  bookmarkText: {
    textAlign: "center",
    fontFamily: "QuicksandReg",
  },
  shoppingText: {
    textAlign: "center",
    fontFamily: "QuicksandReg",
  },
  discuss: {
    fontFamily: "EBGaramond",
    fontSize: 36,
    marginTop: 8,
  },
  addCommentTextarea: {
    borderWidth: 1,
    borderColor: "#393E41",
    padding: 8,
    borderRadius: 8,
    fontFamily: "QuicksandReg",
    marginTop: 8,
  },
  submitCommentButton: {
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: "#393E41",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  markAsReadText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  returnAnchor: {
    alignItems: "center",
  },
  buttonPrimary: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    backgroundColor: "#393E41",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  buttonPrimaryDarkMode: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  markAsUnread: {
    marginTop: 8,
    padding: 16,
    borderColor: "#393E41",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  markAsUnreadDarkMode: {
    marginTop: 8,
    padding: 16,
    borderColor: "#F6F7EB",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  markAsUnreadText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  tooltip: {
    position: "absolute",
    top: -30,
    left: "90%",
    transform: [{ translateX: -30 }],
    backgroundColor: "#393E41",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
    elevation: 10,
  },
  tooltipText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 14,
  },
  adjustFontSize: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  fontUp: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  fontDown: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44,
    borderWidth: 1,
    borderColor: "#393E41",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  brightness: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44,
    borderWidth: 1,
    borderColor: "#393E41",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  summary: {
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    width: 44,
    borderWidth: 1,
    borderColor: "#393E41",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  argumentContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#393E41",
    borderRadius: 8,
    minWidth: 48,
  },
  argument: {
    fontFamily: "EBGaramond",
    fontSize: 16,
    color: "#F6F7EB",
    padding: 8,
  },
});

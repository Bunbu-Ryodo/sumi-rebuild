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
  updateSeriesDueDate,
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
import { WebView } from "react-native-webview";
import { saveUserQuote } from "../../supabase_queries/quotes";
import Toast from "react-native-toast-message";

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
  const [argument, setArgument] = useState("");
  const [thinking, setThinking] = useState(false);
  const [creditsLeft, setCreditsLeft] = useState(0);
  const [selectedText, setSelectedText] = useState("");

  const injectedJavaScript = `
  (function() {
    function handleSelectionChange() {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.length > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'textSelected',
          text: selectedText
        }));
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'textDeselected'
        }));
      }
    }
    
    document.addEventListener('selectionchange', handleSelectionChange);
    
    true; // Required for injected JavaScript
  })();
`;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === "textSelected") {
        setSelectedText(data.text);
      } else if (data.type === "textDeselected") {
        setSelectedText("");
      }
    } catch (error) {
      console.log("Error parsing WebView message:", error);
    }
  };

  const saveQuote = async () => {
    if (!selectedText) return;

    try {
      console.log("Saving quote:", selectedText);

      const quote = await saveUserQuote(
        userid,          // userid: string
        selectedText,    // quote: string  
        extract.title,   // title: string
        extract.author,  // author: string
        extract.textid   // textid: number
      );

      if (quote) {
        Toast.show({
          type: "savedQuote",
          text1: "Quote saved successfully",
        });
      }

      setSelectedText(""); // Clear selection after saving
    } catch (error) {
      console.error("Error saving quote:", error);
      alert("Error saving quote. Please try again.");
    }
  };

  // Add a ref to store the current due date immediately
  const currentDue = useRef(new Date().getTime());

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

  const callGrok = async (type: "argument" | "bullets" | "synopsis") => {
    setThinking(true);
    setArgument("");

    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      const { data, error } = await supabase.functions.invoke("ai-summary", {
        body: {
          text: extract.fulltext,
          type: type,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) throw error;

      setArgument(data.result || "Error generating summary");
    } catch (error) {
      console.error("AI Error:", error);
      setArgument("Error generating summary. Please try again.");
    } finally {
      setThinking(false);
    }
  };

  const generateChapterArgument = () => callGrok("argument");
  const generateChapterBulletPoints = () => callGrok("bullets");
  const generateSynopsis = () => callGrok("synopsis");

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

    const userProfile = await lookUpUserProfile(userId);

    let duedate;
    if (userProfile.subscriptioninterval) {
      duedate =
        new Date().getTime() + userProfile.subscriptioninterval * 86400000;
    } else {
      duedate = new Date().getTime() + 86400000;
    }

    const preciseDate = new Date(duedate);
    const setToMidnight = preciseDate.setHours(0, 0, 0, 0);

    currentDue.current = setToMidnight;

    if (existingSubscription) {
      const isActive =
        existingSubscription.active &&
        existingSubscription.textid === extract.textid;
      setSubscribed(isActive);
      setSubid(existingSubscription.id);
    } else {
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

    // Use the ref value which is updated immediately
    const dueToUse = currentDue.current;
    console.log(new Date(dueToUse).toLocaleDateString(), "Due date");

    if (subscribed) {
      console.log("Subscription deactivated", subid);
      await deactivateSubscription(subid);

      await hideSeries(userid, subid);
    } else {
      console.log("Subscription activated", subid);
      await activateSubscription(subid, dueToUse);
      await updateSeriesDueDate(userid, subid, dueToUse);

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
                  {/* <View
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
                  </View> */}
                </View>
              ) : (
                <></>
              )}
              <View style={{ width: "100%" }}>
                <WebView
                  style={styles.webView}
                  originWhitelist={["*"]}
                  source={{
                    html: `
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body {
                              font-family: 'Georgia', serif;
                              font-size: ${fontSize}px;
                              line-height: 1.6;
                              margin: 8px;
                              background-color: ${brightnessHex[warmth]};
                              color: ${warmth === 4 ? "#F6F7EB" : "#393E41"};
                            }
                            h1 {
                              font-size: 24px;
                              margin-bottom: 16px;
                            }
                            p {
                              margin-bottom: 12px;
                            }
                          </style>
                        </head>
                        <body>
                          <div>
                            ${
                              extract.fulltext ||
                              "<h1>This is a static HTML source!</h1><p>Loading content...</p>"
                            }
                          </div>
                        </body>
                      </html>
                    `,
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  scalesPageToFit={false}
                  showsVerticalScrollIndicator={false}
                  injectedJavaScript={injectedJavaScript}
                  onMessage={handleWebViewMessage}
                  onError={(event) =>
                    console.log("WebView error:", event.nativeEvent)
                  }
                  onLoad={() => console.log("WebView loaded successfully")}
                />

                {/* Add the Save Quote button outside the WebView */}
                {selectedText && (
                  <TouchableOpacity
                    style={[
                      styles.saveQuoteButton,
                      warmth === 4 && { backgroundColor: "#F6F7EB" },
                    ]}
                    onPress={saveQuote}
                  >
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={20}
                      color={warmth === 4 ? "#393E41" : "#F6F7EB"}
                    />
                    <Text
                      style={[
                        styles.saveQuoteText,
                        warmth === 4 && { color: "#393E41" },
                      ]}
                    >
                      Save Quote: "
                      {selectedText.length > 50
                        ? selectedText.substring(0, 50) + "..."
                        : selectedText}
                      "
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
                  Buy Full Text (Coming Soon)
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
  webView: {
    minHeight: 420,
    width: "100%",
    backgroundColor: "transparent",
  },
  saveQuoteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FE7F2D",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveQuoteText: {
    color: "#F6F7EB",
    fontFamily: "QuicksandReg",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

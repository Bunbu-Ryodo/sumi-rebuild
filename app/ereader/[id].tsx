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
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
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
import {
  getExtract,
  checkForReadingProgress,
  createReadingProgress,
  updateReadingProgress,
} from "../../supabase_queries/extracts";
import { ExtractType, QuoteType, StreakType } from "../../types/types";
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
  updateStreak,
  getStreak,
} from "../../supabase_queries/subscriptions";
import { setStreakChecking } from "../../supabase_queries/profiles";
import {
  getUserSession,
  hasActivePremiumSubscription,
} from "../../supabase_queries/auth.js";
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
import {
  saveUserQuote,
  getQuoteByUserAndExtract,
} from "../../supabase_queries/quotes";
import {
  getMarginaliaByExtractAndUser,
  saveMarginalia,
} from "../../supabase_queries/marginalia";
import Toast from "react-native-toast-message";
import Upgrade from "../../components/upgrade";

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
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;

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
  const [userid, setUserid] = useState("");
  const [fontSize, setFontSize] = useState(18);
  const [warmth, setWarmth] = useState(0);
  const [argument, setArgument] = useState("");
  const [thinking, setThinking] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [showMarginaliaModal, setShowMarginaliaModal] = useState(false);
  const [marginaliaText, setMarginaliaText] = useState("");
  const [marginaliaLoading, setMarginaliaLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewHeight, setViewHeight] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [streak, setStreak] = useState<StreakType | null>(null);
  const [needsPremium, setNeedsPremium] = useState(false);
  const webViewRef = useRef<WebView>(null);

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

    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = Math.max(scrollHeight - 430, 0);
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'scrollProgress',
        maxScroll: Number(maxScroll),
        progress: Number(progress),
        scrollTop: Number(scrollTop),
        scrollHeight: Number(scrollHeight),
        clientHeight: Number(clientHeight)
      }));
    }
    
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('scroll', handleScroll, { passive: true });

    setTimeout(() => {
      handleScroll();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'contentLoaded',
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      }));
    }, 100);
    
    true; // Required for injected JavaScript
  })();
`;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "goToSettings":
          toSettings();
          break;
        case "textSelected":
          setSelectedText(data.text);
          break;

        case "textDeselected":
          setSelectedText("");
          break;

        case "scrollProgress":
          setReadingProgress(data.progress);
          if (data.progress > readingProgress) {
            setReadingProgress(Math.floor(data.progress));
            setScrollPosition(Math.floor(data.scrollTop));
          }
          break;

        case "contentLoaded":
          setContentHeight(data.scrollHeight);
          setViewHeight(data.clientHeight);

          if (scrollPosition > 0) {
            webViewRef.current?.injectJavaScript(
              `window.scrollTo(0, ${scrollPosition}); true;`,
            );
          }
          break;
      }
    } catch (error) {
      console.log("Error parsing WebView message:", error);
    }
  };

  const formatTextForHTML = (text: string) => {
    if (!text) return text;

    return (
      text
        // Convert \n to <br> tags for line breaks
        .replace(/\n/g, "<br>")
        // Convert \r\n (Windows line endings) to <br>
        .replace(/\r\n/g, "<br>")
        // Convert \r (old Mac line endings) to <br>
        .replace(/\r/g, "<br>")
        // Convert multiple consecutive <br> tags to paragraph breaks
        .replace(/(<br>\s*){2,}/g, "</p><p>")
        // Wrap the entire content in paragraphs if it doesn't start with a tag
        .replace(/^(?!<)/, "<p>")
        .replace(/(?!>)$/, "</p>")
        // Clean up any empty paragraphs
        .replace(/<p>\s*<\/p>/g, "")
        // Fix any double paragraph issues
        .replace(/<\/p><p>/g, "</p>\n<p>")
    );
  };

  // Function to highlight saved quotes in the text
  const highlightSavedQuotes = (
    fulltext: string,
    savedQuotes: QuoteType[],
    warmthLevel: number,
  ) => {
    if (!savedQuotes || savedQuotes.length === 0) return fulltext;

    let highlightedText = fulltext;

    // Sort quotes by length (longest first) to avoid partial replacements
    const sortedQuotes = savedQuotes.sort(
      (a, b) => b.quote.length - a.quote.length,
    );

    // Dynamic styling based on warmth level
    const highlightStyles =
      warmthLevel === 4
        ? "background-color: #F6F7EB; color: #393E41; padding: 2px 4px; border-radius: 3px; font-weight: bold; border: 1px solid #393E41;"
        : "background-color: #393E41; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);";

    sortedQuotes.forEach((quote) => {
      // Escape special regex characters in the quote
      const escapedQuote = quote.quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuote, "gi");

      // Replace with highlighted version using dynamic styles
      highlightedText = highlightedText.replace(regex, (match) => {
        return `<mark style="${highlightStyles}">${match}</mark>`;
      });
    });

    return highlightedText;
  };

  const saveQuote = async () => {
    if (!selectedText) return;

    try {
      console.log("Saving quote:", selectedText);

      const quote = await saveUserQuote(
        userid,
        selectedText,
        extract.title,
        extract.author,
        extract.textid,
        extract.id,
        extract.portrait,
        extract.chapter,
        extract.year,
        extract.coverart,
      );

      if (quote) {
        Toast.show({
          type: "savedQuote",
          text1: "Quote saved successfully",
        });

        // Refresh quotes to show the new highlight
        const extractQuotes = await getQuoteByUserAndExtract(
          userid,
          extract.id,
        );

        setQuotes(extractQuotes || []);
      }

      setSelectedText(""); // Clear selection after saving
    } catch (error) {
      console.error("Error saving quote:", error);
    }
  };

  // Marginalia functions
  const openMarginaliaModal = async () => {
    setMarginaliaLoading(true);
    setShowMarginaliaModal(true);

    // Start fade-in animation
    modalOpacity.setValue(0);
    modalScale.setValue(0.8);

    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const existingMarginalia = await getMarginaliaByExtractAndUser(
        extract.id,
        userid,
      );
      setMarginaliaText(existingMarginalia?.text || "");
    } catch (error) {
      console.error("Error fetching marginalia:", error);
      setMarginaliaText("");
    } finally {
      setMarginaliaLoading(false);
    }
  };

  const saveMarginaliaText = async () => {
    if (!marginaliaText.trim()) {
      Alert.alert("Error", "Please enter some text for your marginalia.");
      return;
    }

    setMarginaliaLoading(true);
    try {
      await saveMarginalia(extract.id, userid, marginaliaText.trim());

      closeMarginaliaModal();
    } catch (error) {
      console.error("Error saving marginalia:", error);
    } finally {
      setMarginaliaLoading(false);
    }
  };

  const closeMarginaliaModal = () => {
    // Start fade-out animation
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hide modal after animation completes
      setShowMarginaliaModal(false);
      setMarginaliaText("");
    });
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

      const hasSubscription = await hasActivePremiumSubscription(userid);

      if (!hasSubscription) {
        setArgument(
          "Upgrade to Premium to unlock Grok-powered reading assists!",
        );
        setNeedsPremium(true);
        return;
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

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const backToFeed = async () => {
    if (streak) {
      const lastUpdated = streak.last_updated
        ? new Date(streak?.last_updated)
        : null;
      const today = new Date();
      if (lastUpdated !== null && isSameDay(lastUpdated, today)) {
        console.log("Already ready today, streak not incremented");
      } else {
        console.log("Incrementing streak from", streak.current_streak);
        const updatedStreak = await updateStreak(
          userid,
          streak.current_streak + 1,
          new Date(),
        );
        if (updatedStreak) {
          Toast.show({
            type: "streakUp",
            text1: "+1 to your reading streak!",
          });
        }
      }
    }

    await updateReadingProgress(
      userid,
      extract.id,
      Math.floor(readingProgress),
      Math.floor(scrollPosition),
    );

    router.push({
      pathname: "/feed",
    });
  };

  const toSettings = async () => {
    router.push("/settings");
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
    extract: ExtractType,
  ) => {
    const existingSubscription = await checkForSubscription(
      userId,
      extract.textid,
    );

    const userProfile = await lookUpUserProfile(userId);

    const currentStreak = await getStreak(userId);
    if (currentStreak) {
      setStreak(currentStreak);
    }

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
        extract.textid,
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
        extract.author,
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
          duedate,
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
        const savedReadingProgress = await checkForReadingProgress(
          user.id,
          extract.id,
        );

        if (
          savedReadingProgress &&
          savedReadingProgress.furthest_scroll_position
        ) {
          setScrollPosition(savedReadingProgress.furthest_scroll_position);
        } else if (!savedReadingProgress) {
          await createReadingProgress(user.id, extract.id);
        }

        const formattedExtract = {
          ...extract,
          fulltext: formatTextForHTML(extract.fulltext),
        };

        setExtract(formattedExtract);

        await checkForActiveSubscription(user.id, extract);
      } else {
        router.push("/");
      }

      const extractQuotes = await getQuoteByUserAndExtract(user.id, extract.id);
      setQuotes(extractQuotes || []);

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
        },
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
    }, []),
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
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                  ]}
                  onPress={openMarginaliaModal}
                >
                  <Ionicons
                    name="create-outline"
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
                  ref={webViewRef}
                  style={styles.webView}
                  originWhitelist={["*"]}
                  scrollEnabled={true}
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
                            mark {
                              padding: 2px 4px;
                              border-radius: 3px;
                              font-weight: bold;
                              /* Default styles - will be overridden by inline styles */
                            }
                            ::selection {
                              background-color: #8980F5;
                              color: white;
                            }
                            ::-moz-selection {
                              background-color: #8980F5;
                              color: white;
                            }
                            .argument-container {
                              margin-bottom: 16px;
                              padding: 16px;
                              background-color: ${warmth === 4 ? "#F6F7EB" : "#393E41"};
                              border-radius: 8px;
                              text-align: center;
                            }
                            .argument-text {
                              font-family: 'Georgia', serif;
                              font-size: ${fontSize}px;
                              color: ${warmth === 4 ? "#393E41" : "#F6F7EB"};
                              line-height: 1.6;
                              white-space: pre-wrap;
                            }
                            .thinking-text {
                              color: ${warmth === 4 ? "#393E41" : "#F6F7EB"};
                              font-style: italic;
                            }
                            .settings-link {
                              display: inline-block;
                              margin-top: 12px;
                              padding: 8px 16px;
                              background-color: #8980F5;
                              color: white;
                              text-decoration: none;
                              border-radius: 6px;
                              font-family: 'Georgia', serif;
                            }
                          </style>
                        </head>
                        <body>
                         ${thinking ? '<div class="argument-container"><div class="thinking-text">✨ Thinking...</div></div>' : ""}
                         ${argument && argument.length > 0 ? `<div class="argument-container"><div class="argument-text">${argument.replace(/\n/g, "<br>")}</div>${needsPremium ? '<a href="#settings" class="settings-link" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: \'goToSettings\'})); return false;">Go To Settings</a>' : ""}</div>` : ""}
                          <div>
                            ${
                              extract.fulltext
                                ? highlightSavedQuotes(
                                    extract.fulltext,
                                    quotes,
                                    warmth,
                                  )
                                : "<h1>This is a static HTML source!</h1><p>Loading content...</p>"
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
            <View style={styles.readingProgressContainer}>
              <Text style={styles.readingProgressText}>
                {Math.floor(readingProgress)}% complete
              </Text>
            </View>
            <View style={styles.engagementButtons}>
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
                  Save Progress &amp;
                </Text>
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
                  Buy Book (Coming Soon)
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

      {/* Marginalia Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showMarginaliaModal}
        onRequestClose={closeMarginaliaModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <Animated.View
            style={[styles.modalOverlay, { opacity: modalOpacity }]}
          >
            <Animated.View
              style={[
                styles.modalContainer,
                { backgroundColor: brightnessHex[warmth] },
                {
                  opacity: modalOpacity,
                  transform: [{ scale: modalScale }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text
                  style={[
                    styles.modalTitle,
                    warmth === 4 && { color: "#F6F7EB" },
                  ]}
                >
                  Reflections
                </Text>
                <TouchableOpacity
                  onPress={closeMarginaliaModal}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={warmth === 4 ? "#F6F7EB" : "#393E41"}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.modalSubtitle,
                  warmth === 4 && { color: "#F6F7EB" },
                ]}
              >
                {extract.title} - Chapter {extract.chapter}
              </Text>

              <TextInput
                style={[
                  styles.marginaliaInput,
                  { fontSize },
                  warmth === 4 && {
                    backgroundColor: "#393E41",
                    color: "#F6F7EB",
                    borderColor: "#F6F7EB",
                  },
                ]}
                multiline={true}
                numberOfLines={8}
                value={marginaliaText}
                onChangeText={setMarginaliaText}
                placeholder="Mark your extract, make it your own..."
                placeholderTextColor={warmth === 4 ? "#B0B0B0" : "#666"}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={closeMarginaliaModal}
                  style={[
                    styles.cancelButton,
                    warmth === 4 && { borderColor: "#F6F7EB" },
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      warmth === 4 && { color: "#F6F7EB" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={saveMarginaliaText}
                  style={[
                    styles.saveButton,
                    marginaliaLoading && styles.disabledButton,
                  ]}
                  disabled={marginaliaLoading}
                >
                  {marginaliaLoading ? (
                    <ActivityIndicator size="small" color="#F6F7EB" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Notes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
  goToSettingsText: {
    marginTop: 8,
    color: "#F6F7EB",
    textDecorationLine: "underline",
    fontFamily: "QuicksandReg",
    fontSize: 16,
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
    alignItems: "center",
    height: 100,
  },
  readingProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  readingProgressText: {
    fontFamily: "EBGaramond",
    fontSize: 18,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center", // Change from alignItems: center
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#F6F7EB",
    borderRadius: 12,
    padding: 20,
    maxHeight: "95%",
    minHeight: 300,
  },
  modalScrollView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "EBGaramondItalic",
    color: "#393E41",
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "EBGaramond",
    color: "#393E41",
    marginBottom: 15,
    textAlign: "center",
  },
  marginaliaInput: {
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    padding: 12,
    fontFamily: "EBGaramond",
    fontSize: 16,
    backgroundColor: "#F6F7EB",
    color: "#393E41",
    minHeight: 120, // Reduce from 150 to save space
    maxHeight: 200, // Add max height to prevent overflow
    marginBottom: 15, // Reduce from 20
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 10, // Add padding to separate from scroll content
    backgroundColor: "inherit", // Ensure buttons stay visible
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontFamily: "QuicksandReg",
    fontSize: 16,
    color: "#393E41",
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FE7F2D",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: "QuicksandReg",
    fontSize: 16,
    color: "#F6F7EB",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

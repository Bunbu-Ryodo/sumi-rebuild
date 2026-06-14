import { Platform, useWindowDimensions } from "react-native";
import {
  View,
  Text,
  StyleSheet,
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
  useMemo,
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
import {
  getUserSession,
  // hasActivePremiumSubscription,
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
import Purchases from "react-native-purchases";

let adUnitId = "";

const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";
const useTestPayment = process.env.EXPO_PUBLIC_USE_TEST_PAYMENTS === "true";
const premiumEntitlementId = useTestPayment ? "Sumi Premium" : "premium";

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
  const { width } = useWindowDimensions();
  const isIPad = width >= 768;
  let { id } = useLocalSearchParams();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.8)).current;

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      if (hasPremium !== null && !hasPremium) {
        bannerRef.current?.load();
      }
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
  const [fontSize, setFontSize] = useState(isIPad ? 24 : 18);
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
  const [hasPremium, setHasPremium] = useState<boolean | null>(null);
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
          const nextProgress = Math.ceil(Number(data.progress) || 0);
          const nextScrollTop = Math.floor(Number(data.scrollTop) || 0);

          setReadingProgress(nextProgress);
          setScrollPosition(nextScrollTop);
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

  const highlightSavedQuotes = (
    fulltext: string,
    savedQuotes: QuoteType[],
    warmthLevel: number,
  ) => {
    if (!savedQuotes || savedQuotes.length === 0) return fulltext;

    let highlightedText = fulltext;

    const sortedQuotes = savedQuotes.sort(
      (a, b) => b.quote.length - a.quote.length,
    );

    const highlightStyles =
      warmthLevel === 4
        ? "background-color: #F6F7EB; color: #393E41; padding: 2px 4px; border-radius: 3px; font-weight: bold; border: 1px solid #393E41;"
        : "background-color: #393E41; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);";

    sortedQuotes.forEach((quote) => {
      const escapedQuote = quote.quote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuote, "gi");

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

        const extractQuotes = await getQuoteByUserAndExtract(
          userid,
          extract.id,
        );

        setQuotes(extractQuotes || []);
      }

      setSelectedText("");
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
      setShowMarginaliaModal(false);
      setMarginaliaText("");
    });
  };

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
    setScrollPosition(0);
    setThinking(true);
    setArgument("");

    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      const customerInfo = await Purchases.getCustomerInfo();
      const hasSubscription =
        !!customerInfo.entitlements.active[premiumEntitlementId];

      if (!hasSubscription) {
        setArgument(
          "Upgrade to Premium to unlock AI-powered reading assists! Generate chapter arguments, bullet point summaries, and synopses to help you engage with the text in a deeper way.",
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
        console.log("Already read today, streak not incremented");
      } else {
        console.log("Incrementing streak from");
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

      // const premiumStatus = await hasActivePremiumSubscription(user.id);
      // setHasPremium(premiumStatus);

      const premiumStatus = await Purchases.getCustomerInfo();
      setHasPremium(!!premiumStatus.entitlements.active[premiumEntitlementId]);

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

    const dueToUse = currentDue.current;

    if (subscribed) {
      console.log("Subscription deactivated");
      await deactivateSubscription(subid);

      await hideSeries(userid, subid);
    } else {
      console.log("Subscription activated");
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

    console.log("Setting up listener for subscription");
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
            console.log("Force cleaning up channel");
            supabase.removeChannel(channel);
          }
        });
      };
    }, []),
  );

  const webViewSource = useMemo(
    () => ({
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
                margin-bottom: 16px;
                padding: 16px;
                background-color: ${warmth === 4 ? "#F6F7EB" : "#393E41"};
                border-radius: 8px;
                text-align: center;
              }
              .settings-link {
                display: inline-block;
                margin-top: 12px;
                padding: 8px 16px;
                background-color: #FE7F2D;
                color: #393E41;
                text-decoration: none;
                border-radius: 6px;
                font-family: 'Georgia', serif;
              }
            </style>
          </head>
          <body>
            ${thinking ? '<div class="thinking-text">Thinking...</div>' : ""}
            ${argument && argument.length > 0 ? `<div class="argument-container"><div class="argument-text">${argument.replace(/\n/g, "<br>")}</div>${needsPremium ? '<a href="#settings" class="settings-link" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: \'goToSettings\'})); return false;">Go To Settings</a>' : ""}</div>` : ""}
            <div>
              ${
                extract.fulltext
                  ? highlightSavedQuotes(extract.fulltext, quotes, warmth)
                  : "<h1>This is a static HTML source!</h1><p>Loading content...</p>"
              }
            </div>
          </body>
        </html>
      `,
    }),
    [
      argument,
      extract.fulltext,
      fontSize,
      needsPremium,
      quotes,
      thinking,
      warmth,
    ],
  );

  return (
    <>
      <View style={[styles.paper, { backgroundColor: brightnessHex[warmth] }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#393E41" />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.mainReaderSection}>
              <View style={styles.adjustFontSize}>
                <TouchableOpacity
                  style={[
                    styles.fontUp,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={fontUp}
                >
                  <Ionicons
                    name="text"
                    size={isIPad ? 32 : 24}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.fontDown,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={fontDown}
                >
                  <Ionicons
                    name="text"
                    size={isIPad ? 24 : 18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.brightness,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={adjustBrightness}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={isIPad ? 24 : 18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={generateChapterArgument}
                >
                  <Ionicons
                    name="school"
                    size={isIPad ? 24 : 18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={generateChapterBulletPoints}
                >
                  <Ionicons
                    name="list"
                    size={isIPad ? 24 : 18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={generateSynopsis}
                >
                  <Ionicons
                    name="help-outline"
                    size={isIPad ? 24 : 18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.summary,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={openMarginaliaModal}
                >
                  <Ionicons
                    name="create-outline"
                    size={isIPad ? 24 : 18}
                    color="#393E41"
                  ></Ionicons>
                </TouchableOpacity>
              </View>
              <View style={styles.titleBar}>
                <Text
                  style={[
                    styles.title,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 32 },
                  ]}
                >
                  {extract.title}
                </Text>
                <Text
                  style={[
                    styles.chapter,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 32 },
                  ]}
                >
                  {extract.chapter}
                </Text>
              </View>
              <View style={styles.webViewContainer}>
                <WebView
                  ref={webViewRef}
                  style={styles.webView}
                  originWhitelist={["*"]}
                  scrollEnabled={true}
                  source={webViewSource}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  nestedScrollEnabled={true}
                  scalesPageToFit={false}
                  showsVerticalScrollIndicator={false}
                  injectedJavaScript={injectedJavaScript}
                  onMessage={handleWebViewMessage}
                  onError={(event) =>
                    console.log("WebView error:", event.nativeEvent)
                  }
                  onLoad={() => console.log("WebView loaded successfully")}
                />

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
                        isIPad && { fontSize: 24 },
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
                {Math.floor(readingProgress)}%
              </Text>
            </View>
            <View style={styles.engagementButtons}>
              <TouchableOpacity
                style={styles.returnAnchor}
                onPress={backToFeed}
              >
                <Ionicons
                  name="arrow-back"
                  size={isIPad ? 36 : 24}
                  color="#8980F5"
                />
                <Text
                  style={[
                    styles.shoppingText,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  Save Progress &amp;
                </Text>
                <Text
                  style={[
                    styles.shoppingText,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 24 },
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
                      size={isIPad ? 36 : 24}
                      color="#FE7F2D"
                    />
                  </BounceView>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.bookmarkText,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  Subscribe
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
      {hasPremium !== null && !hasPremium && (
        <BannerAd
          key={`ad-${id}`}
          ref={bannerRef}
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      )}

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
                      isIPad && { fontSize: 24 },
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
                    <Text
                      style={[
                        styles.saveButtonText,
                        isIPad && { fontSize: 24 },
                      ]}
                    >
                      Save Notes
                    </Text>
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
    fontFamily: "BeProVietnam",
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
    flex: 1,
    backgroundColor: "#F6F7EB",
    width: "100%",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
  },
  mainReaderSection: {
    flex: 1,
    minHeight: 0,
  },
  webViewContainer: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  extractText: {
    fontFamily: "EBGaramond",
    fontSize: 18,
    borderBottomWidth: 1,
    borderColor: "#393E41",
    paddingBottom: 16,
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
    marginTop: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  readingProgressText: {
    fontFamily: "BeVietnamPro",
    fontSize: 14,
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
    fontFamily: "BeProVietnam",
  },
  shoppingText: {
    textAlign: "center",
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  buttonPrimaryDarkMode: {
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    backgroundColor: "#F6F7EB",
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  markAsUnread: {
    marginTop: 8,
    padding: 16,
    borderColor: "#393E41",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  markAsUnreadDarkMode: {
    marginTop: 8,
    padding: 16,
    borderColor: "#F6F7EB",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  markAsUnreadText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
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
    flex: 1,
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
    fontFamily: "BeProVietnam",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
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
    minHeight: 120,
    maxHeight: 200,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 10,
    backgroundColor: "inherit",
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
    fontFamily: "BeProVietnam",
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
    fontFamily: "BeProVietnam",
    fontSize: 16,
    color: "#F6F7EB",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

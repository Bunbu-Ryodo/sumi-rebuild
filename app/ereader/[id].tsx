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
  ScrollView,
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
import { ExtractType, QuoteType } from "../../types/types";
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
import {
  getUserSession,
  // hasActivePremiumSubscription,
} from "../../supabase_queries/auth.js";
import supabase from "../../lib/supabase.js";
import { lookUpUserProfile } from "../../supabase_queries/auth";
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
import { updateHighscore } from "../../supabase_queries/profiles";
import { updateUsername } from "../../supabase_queries/settings";
import Toast from "react-native-toast-message";

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
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === "ios" && Platform.isPad;
  const isCompactViewport = width <= 375;
  let { id } = useLocalSearchParams();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const argumentModalOpacity = useRef(new Animated.Value(0)).current;
  const argumentModalScale = useRef(new Animated.Value(0.8)).current;
  const footnoteModalOpacity = useRef(new Animated.Value(0)).current;
  const footnoteModalScale = useRef(new Animated.Value(0.8)).current;
  const composeModalOpacity = useRef(new Animated.Value(0)).current;
  const composeModalScale = useRef(new Animated.Value(0.8)).current;

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
  const [footnotes, setFootnotes] = useState("");
  const [assistLabel, setAssistLabel] = useState("Argument");
  const [thinking, setThinking] = useState(false);
  const [footnotesThinking, setFootnotesThinking] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [footnoteSourceHighlight, setFootnoteSourceHighlight] = useState("");
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [showArgumentModal, setShowArgumentModal] = useState(false);
  const [showFootnotesModal, setShowFootnotesModal] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewHeight, setViewHeight] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeUsername, setComposeUsername] = useState("");
  const [composeGrade, setComposeGrade] = useState<string | null>(null);
  const [composeLoading, setComposeLoading] = useState(false);
  const [composeGraded, setComposeGraded] = useState(false);
  const [composeSaving, setComposeSaving] = useState(false);
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

  const openArgumentModal = () => {
    setShowArgumentModal(true);
    argumentModalOpacity.setValue(0);
    argumentModalScale.setValue(0.8);

    Animated.parallel([
      Animated.timing(argumentModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(argumentModalScale, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeArgumentModal = () => {
    Animated.parallel([
      Animated.timing(argumentModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(argumentModalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowArgumentModal(false);
    });
  };

  const openFootnotesModal = () => {
    setShowFootnotesModal(true);
    footnoteModalOpacity.setValue(0);
    footnoteModalScale.setValue(0.8);

    Animated.parallel([
      Animated.timing(footnoteModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(footnoteModalScale, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeFootnotesModal = () => {
    Animated.parallel([
      Animated.timing(footnoteModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(footnoteModalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowFootnotesModal(false);
    });
  };

  const handleComposeTextChange = (text: string) => {
    setComposeText(text);
    setComposeGraded(false);
  };

  const saveComposeAttempt = async () => {
    if (!composeText.trim()) return;

    setComposeSaving(true);
    try {
      const score = composeGrade ? Number(composeGrade) : 0;

      await saveMarginalia(extract.id, userid, composeText.trim(), score);
      await updateUsername(composeUsername.trim());

      const profile = await lookUpUserProfile(userid);
      if (profile && score > (profile.highscore ?? 0)) {
        await updateHighscore(userid, score);
      }

      Toast.show({
        type: "savedQuote",
        text1: "Marginalia saved successfully",
      });
      closeComposeModal();
    } catch (error) {
      console.error("Error saving marginalia:", error);
      Toast.show({
        type: "error",
        text1: "Error saving your marginalia. Please try again.",
      });
    } finally {
      setComposeSaving(false);
    }
  };

  const openComposeModal = async () => {
    setComposeText("");
    setComposeGrade(null);
    setComposeGraded(false);
    setShowComposeModal(true);
    composeModalOpacity.setValue(0);
    composeModalScale.setValue(0.8);

    try {
      const existing = await getMarginaliaByExtractAndUser(extract.id, userid);
      if (existing?.text) {
        setComposeText(existing.text);
      }
    } catch (error) {
      // no existing marginalia for this extract/user
    }

    try {
      const profile = await lookUpUserProfile(userid);
      setComposeUsername(profile?.username || "");
    } catch (error) {
      setComposeUsername("");
    }

    Animated.parallel([
      Animated.timing(composeModalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(composeModalScale, {
        toValue: 1,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeComposeModal = () => {
    Animated.parallel([
      Animated.timing(composeModalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(composeModalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowComposeModal(false);
    });
  };

  const submitCompose = async () => {
    if (!composeText.trim()) return;

    setComposeLoading(true);
    setComposeGrade(null);

    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      const { data, error } = await supabase.functions.invoke("ai-grading", {
        body: {
          chapter: extract.fulltext,
          summary: composeText,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      if (error) throw error;

      setComposeGrade(String(data.result ?? data.grade ?? ""));
      setComposeGraded(true);
    } catch (error) {
      console.error("Error grading response:", error);
      Toast.show({
        type: "error",
        text1: "Error grading your response. Please try again.",
      });
    } finally {
      setComposeLoading(false);
    }
  };

  const callGrok = async (type: "argument" | "bullets" | "synopsis") => {
    const nextLabel =
      type === "argument"
        ? "Argument"
        : type === "bullets"
          ? "Key Plot Points"
          : "Synopsis";

    setAssistLabel(nextLabel);
    setThinking(true);
    setArgument("");
    openArgumentModal();

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

  async function generateFootnotes() {
    if (!selectedText) return;

    const highlight = selectedText;
    setFootnotes("");
    setFootnoteSourceHighlight(highlight);
    setFootnotesThinking(true);

    try {
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.access_token) {
        throw new Error("No valid session");
      }

      const { data, error } = await supabase.functions.invoke("ai-footnotes", {
        body: {
          highlight,
          author: extract.author,
          title: extract.title,
          chapter: extract.chapter,
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });
      if (error) throw error;
      setFootnotes(data.result || "Error generating footnotes");
    } catch (error) {
      console.error("Error generating footnotes:", error);
      setFootnotes("Error generating footnotes. Please try again.");
    } finally {
      setFootnotesThinking(false);
    }
  }

  const splitFootnoteResult = (result: string, highlight: string) => {
    const footnotePrefix = `${highlight}:`;

    if (!highlight || !result.startsWith(footnotePrefix)) {
      return { highlight: "", note: result };
    }

    return {
      highlight: footnotePrefix,
      note: result.slice(footnotePrefix.length).trimStart(),
    };
  };

  useEffect(() => {
    if (footnotes && footnotes.trim().length > 0) {
      openFootnotesModal();
    }
  }, [footnotes]);

  const generateChapterArgument = () => callGrok("argument");
  const generateChapterBulletPoints = () => callGrok("bullets");
  const generateSynopsis = () => callGrok("synopsis");
  const { highlight: footnoteHighlight, note: footnoteNote } =
    splitFootnoteResult(footnotes, footnoteSourceHighlight);

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const backToFeed = async () => {
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
    [argument, extract.fulltext, fontSize, quotes, thinking, warmth],
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
              <View
                style={[
                  styles.adjustFontSize,
                  isCompactViewport && styles.adjustFontSizeCompact,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.fontUp,
                    warmth === 4 && { backgroundColor: "#F6F7EB" },
                    isCompactViewport && { height: 40, width: 40 },
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
                    isCompactViewport && { height: 40, width: 40 },
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
                    isCompactViewport && { height: 40, width: 40 },
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
                    isCompactViewport && { height: 40, width: 40 },
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
                    isCompactViewport && { height: 40, width: 40 },
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
                    isCompactViewport && { height: 40, width: 40 },
                    isIPad && { height: 60, width: 60 },
                  ]}
                  onPress={generateSynopsis}
                >
                  <Ionicons
                    name="information-circle"
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
                  <View style={styles.selectionActionsContainer}>
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

                    <TouchableOpacity
                      style={[
                        styles.footnotesButton,
                        warmth === 4 && { backgroundColor: "#F6F7EB" },
                      ]}
                      onPress={generateFootnotes}
                      disabled={footnotesThinking}
                    >
                      {footnotesThinking ? (
                        <ActivityIndicator
                          size="small"
                          color={warmth === 4 ? "#393E41" : "#F6F7EB"}
                        />
                      ) : (
                        <Ionicons
                          name="sparkles-outline"
                          size={20}
                          color={warmth === 4 ? "#393E41" : "#F6F7EB"}
                        />
                      )}
                      <Text
                        style={[
                          styles.footnotesButtonText,
                          warmth === 4 && { color: "#393E41" },
                          isIPad && { fontSize: 24 },
                        ]}
                      >
                        {footnotesThinking
                          ? "Generating Footnote..."
                          : "Generate Footnote"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.readingProgressContainer}>
              <Text
                style={[
                  styles.readingProgressText,
                  warmth === 4 && { color: "#F6F7EB" },
                  isIPad && { fontSize: 24 },
                ]}
              >
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
                {/* <Text
                  style={[
                    styles.shoppingText,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  Return to Fe
                </Text> */}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.returnAnchor}
                onPress={openComposeModal}
              >
                <Ionicons
                  name="pencil"
                  size={isIPad ? 36 : 24}
                  color="#77966D"
                />
                {/* <Text
                  style={[
                    styles.shoppingText,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  Compose
                </Text> */}
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
                {/* <Text
                  style={[
                    styles.bookmarkText,
                    warmth === 4 && { color: "#F6F7EB" },
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  Subscribe
                </Text> */}
              </View>
            </View>
          </View>
        )}
      </View>
      {/* AI Reading Assist Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showArgumentModal}
        onRequestClose={closeArgumentModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <Animated.View
            style={[styles.modalOverlay, { opacity: argumentModalOpacity }]}
          >
            <Animated.View
              style={[
                styles.assistModalContainer,
                {
                  opacity: argumentModalOpacity,
                  transform: [{ scale: argumentModalScale }],
                },
              ]}
            >
              <View style={styles.argumentModalHeader}>
                <View style={styles.argumentHeaderIconWrap}>
                  <Ionicons name="sparkles-outline" size={20} color="#F6F7EB" />
                </View>
                <Text
                  style={[
                    styles.argumentHeaderTitle,
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  {assistLabel}
                </Text>
                <TouchableOpacity
                  onPress={closeArgumentModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#F6F7EB" />
                </TouchableOpacity>
              </View>

              <View style={styles.argumentResultContainer}>
                {thinking ? (
                  <View style={styles.argumentLoadingState}>
                    <ActivityIndicator size="small" color="#FE7F2D" />
                    <Text
                      style={[
                        styles.argumentLoadingText,
                        isIPad && { fontSize: 22 },
                      ]}
                    >
                      Thinking...
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.argumentScroll}
                    contentContainerStyle={styles.argumentScrollContent}
                    showsVerticalScrollIndicator={true}
                  >
                    <Text
                      style={[
                        styles.argumentResultText,
                        isIPad && { fontSize: 24 },
                      ]}
                    >
                      {argument || "Ask for an assist using the toolbar icons."}
                    </Text>
                  </ScrollView>
                )}
              </View>

              <View style={styles.modalButtons}></View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Footnotes Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showFootnotesModal}
        onRequestClose={closeFootnotesModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <Animated.View
            style={[styles.modalOverlay, { opacity: footnoteModalOpacity }]}
          >
            <Animated.View
              style={[
                styles.assistModalContainer,
                {
                  opacity: footnoteModalOpacity,
                  transform: [{ scale: footnoteModalScale }],
                },
              ]}
            >
              <View style={styles.argumentModalHeader}>
                <View style={styles.argumentHeaderIconWrap}>
                  <Ionicons name="sparkles-outline" size={20} color="#F6F7EB" />
                </View>
                <Text
                  style={[
                    styles.argumentHeaderTitle,
                    isIPad && { fontSize: 24 },
                  ]}
                >
                  Footnote
                </Text>
                <TouchableOpacity
                  onPress={closeFootnotesModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#F6F7EB" />
                </TouchableOpacity>
              </View>

              <View style={styles.argumentResultContainer}>
                <ScrollView
                  style={styles.argumentScroll}
                  contentContainerStyle={styles.argumentScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  {footnoteHighlight && (
                    <Text
                      style={[
                        styles.argumentResultText,
                        styles.footnoteHighlightText,
                        isIPad && { fontSize: 24 },
                      ]}
                    >
                      {footnoteHighlight}
                    </Text>
                  )}
                  <Text
                    style={[
                      styles.argumentResultText,
                      styles.footnoteNoteText,
                      isIPad && { fontSize: 24 },
                    ]}
                  >
                    {footnoteNote}
                  </Text>
                </ScrollView>
              </View>
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Compose Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={showComposeModal}
        onRequestClose={closeComposeModal}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <Animated.View
            style={[styles.modalOverlay, { opacity: composeModalOpacity }]}
          >
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  opacity: composeModalOpacity,
                  transform: [{ scale: composeModalScale }],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isIPad && { fontSize: 24 }]}>
                  Marginalia
                </Text>
                {composeGrade !== null && (
                  <Text
                    style={[
                      styles.composeGradeText,
                      isIPad && { fontSize: 28 },
                    ]}
                  >
                    {composeGrade}
                  </Text>
                )}
                <TouchableOpacity
                  onPress={closeComposeModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#393E41" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.composeUsernameInput}
                value={composeUsername}
                onChangeText={setComposeUsername}
                placeholder="Choose a pen name."
                placeholderTextColor="#666"
                autoCapitalize="none"
              />

              <TextInput
                style={[styles.composeInput, { fontSize }]}
                multiline={true}
                numberOfLines={8}
                value={composeText}
                onChangeText={handleComposeTextChange}
                placeholder="Write about the text. What is the chapter about? What is being said in detail? How is it done, and why does it matter? The best notes earn the highest score and rank on the leaderboard. Premium subscription required to rank. (Aim for a score of 500+ points)."
                placeholderTextColor="#666"
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  onPress={saveComposeAttempt}
                  style={[
                    styles.saveButton,
                    (composeSaving || !composeText.trim()) &&
                      styles.disabledButton,
                  ]}
                  disabled={composeSaving || !composeText.trim()}
                >
                  {composeSaving ? (
                    <ActivityIndicator size="small" color="#F6F7EB" />
                  ) : (
                    <Text
                      style={[
                        styles.saveButtonText,
                        isIPad && { fontSize: 24 },
                      ]}
                    >
                      Save Attempt
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitCompose}
                  style={[
                    styles.saveButton,
                    (composeLoading ||
                      composeGraded ||
                      !composeText.trim() ||
                      !composeUsername.trim()) &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    composeLoading ||
                    composeGraded ||
                    !composeText.trim() ||
                    !composeUsername.trim()
                  }
                >
                  {composeLoading ? (
                    <ActivityIndicator size="small" color="#F6F7EB" />
                  ) : (
                    <Text
                      style={[
                        styles.saveButtonText,
                        isIPad && { fontSize: 24 },
                      ]}
                    >
                      Grade
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
    marginTop: 20,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 64,
  },
  readingProgressContainer: {
    marginTop: 20,
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
  adjustFontSizeCompact: {
    justifyContent: "center",
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
  selectionActionsContainer: {
    marginVertical: 8,
    gap: 8,
  },
  footnotesButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#393E41",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footnotesButtonText: {
    color: "#F6F7EB",
    fontFamily: "BeProVietnam",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  argumentResultContainer: {
    borderWidth: 1,
    borderColor: "#4A4F53",
    borderRadius: 8,
    backgroundColor: "#393E41",
    flex: 1,
    marginBottom: 15,
  },
  argumentScroll: {
    width: "100%",
  },
  argumentScrollContent: {
    padding: 12,
  },
  argumentResultText: {
    fontFamily: "EBGaramond",
    fontSize: 18,
    color: "#F6F7EB",
    lineHeight: 28,
  },
  footnoteHighlightText: {
    fontStyle: "italic",
  },
  footnoteNoteText: {
    marginTop: 8,
  },
  argumentLoadingState: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  argumentLoadingText: {
    marginTop: 10,
    fontSize: 18,
    fontFamily: "EBGaramond",
    color: "#F6F7EB",
  },
  assistModalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#2F3337",
    borderRadius: 12,
    padding: 20,
    height: "45%",
  },
  argumentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  argumentHeaderTitle: {
    flex: 1,
    marginLeft: 10,
    color: "#F6F7EB",
    fontSize: 20,
    fontFamily: "BeProVietnam",
  },
  argumentHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#393E41",
    borderWidth: 1,
    borderColor: "#4A4F53",
    alignItems: "center",
    justifyContent: "center",
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
    height: "75%",
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
    fontFamily: "EBGaramond",
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
  modalHelperText: {
    fontSize: 16,
    fontFamily: "EBGaramond",
    color: "#393E41",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
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
  composeInput: {
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    padding: 12,
    fontFamily: "EBGaramond",
    fontSize: 16,
    backgroundColor: "#F6F7EB",
    color: "#393E41",
    flex: 1,
    minHeight: 80,
    marginBottom: 15,
  },
  composeUsernameInput: {
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "EBGaramondItalic",
    fontSize: 18,
    backgroundColor: "#F6F7EB",
    color: "#393E41",
    marginBottom: 10,
    flexGrow: 0,
    flexShrink: 0,
    width: "100%",
  },
  modalButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    paddingTop: 10,
    backgroundColor: "inherit",
  },
  cancelButton: {
    flexGrow: 1,
    flexBasis: 100,
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
    flexGrow: 1,
    flexBasis: 100,
    padding: 12,
    backgroundColor: "#393E41",
    borderRadius: 8,
    alignItems: "center",
  },
  getPremiumButton: {
    flexGrow: 1,
    flexBasis: 100,
    padding: 12,
    backgroundColor: "#FE7F2D",
    borderRadius: 8,
    alignItems: "center",
  },
  getPremiumButtonText: {
    fontFamily: "BeProVietnam",
    fontSize: 16,
    color: "#393E41",
  },
  saveButtonText: {
    fontFamily: "BeProVietnam",
    fontSize: 16,
    color: "#F6F7EB",
  },
  disabledButton: {
    opacity: 0.6,
  },
  composeGradeText: {
    fontSize: 20,
    fontFamily: "BeProVietnam",
    color: "#FE7F2D",
    marginHorizontal: 10,
  },
});

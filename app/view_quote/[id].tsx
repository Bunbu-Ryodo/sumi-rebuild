import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { QuoteType } from "@/types/types";
import { useLocalSearchParams } from "expo-router";
import { getQuoteById, deleteUserQuote } from "../../supabase_queries/quotes";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  useForeground,
} from "react-native-google-mobile-ads";

let adUnitId = "";

const useTestAds = __DEV__ || process.env.EXPO_PUBLIC_USE_TEST_ADS === "true";

if (useTestAds) {
  adUnitId = TestIds.ADAPTIVE_BANNER;
} else if (Platform.OS === "android") {
  adUnitId = "ca-app-pub-5850018728161057/6524403480";
} else if (Platform.OS === "ios") {
  adUnitId = "ca-app-pub-5850018728161057/3269917700";
}

export default function ViewQuote() {
  const router = useRouter();
  let { id } = useLocalSearchParams();
  const [quote, setQuote] = useState<QuoteType | null>(null);
  const [loading, setLoading] = useState(true);

  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      bannerRef.current?.load();
    }
  });

  const fetchQuote = async () => {
    setLoading(true);
    const quoteId = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id, 10);
    const quote = await getQuoteById(quoteId);
    setQuote(quote);
    setLoading(false);
  };

  const deleteQuote = async () => {
    if (quote) {
      const deleted = await deleteUserQuote(quote?.id, quote?.userid);
      if (deleted) {
        router.push("/artworks");
      }
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.viewQuoteWrapper}
        style={styles.container}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#393E41" />
        ) : (
          <View style={styles.frameButtonsSection}>
            {quote ? (
              <>
                <View style={styles.quoteHeader}>
                  <View style={styles.quoteDetails}>
                    <Text style={styles.quoteText}>{quote.author}</Text>
                    <Text style={styles.quoteText}>{quote.title}</Text>
                    <Text style={styles.quoteText}>{quote.year}</Text>
                    <Text style={styles.quoteText}>
                      Chapter {quote.chapter}
                    </Text>
                  </View>
                  <View style={styles.artContainer}>
                    <Image
                      source={{ uri: quote.coverart }}
                      style={styles.coverart}
                    />
                  </View>
                </View>
                <Text style={styles.quoteText}>{quote.quote}</Text>
                {/* <Image
                  source={{ uri: quote.portrait }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                  }}
                /> */}
              </>
            ) : (
              <Text>Quote failed to load.</Text>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={deleteQuote}>
              <Ionicons name="trash" size={24} color="#393E41" />
              <Text style={styles.buttonText}>Delete Quote</Text>
            </TouchableOpacity>
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
  viewQuoteWrapper: {
    flexGrow: 1,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#F6F7EB",
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F7EB",
  },
  frameButtonsSection: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    flex: 1,
  },
  postButton: {
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    backgroundColor: "#393E41",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  deleteButton: {
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "BeProVietnam",
    width: "100%",
  },
  buttonText: {
    color: "#393E41",
    fontFamily: "BeProVietnam",
    fontSize: 16,
    marginLeft: 8,
    textDecorationLine: "underline",
  },
  artworkTitle: {
    fontFamily: "EBGaramondItalic",
    fontSize: 18,
    color: "#393E41",
    textAlign: "center",
  },
  artworkDetails: {
    fontFamily: "EBGaramond",
    fontSize: 18,
    color: "#393E41",
    textAlign: "center",
  },
  quoteText: {
    fontFamily: "EBGaramond",
    fontSize: 18,
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
});

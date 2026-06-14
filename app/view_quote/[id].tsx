import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useState, useEffect } from "react";
import { QuoteType } from "@/types/types";
import { useLocalSearchParams } from "expo-router";
import { getQuoteById, deleteUserQuote } from "../../supabase_queries/quotes";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

export default function ViewQuote() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isIPad = Platform.OS === "ios" && Platform.isPad;
  const dividerDots = Array.from({ length: 48 });
  let { id } = useLocalSearchParams();
  const [quote, setQuote] = useState<QuoteType | null>(null);
  const [loading, setLoading] = useState(true);

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
                    <Text
                      style={[styles.quoteText, isIPad && { fontSize: 24 }]}
                    >
                      {quote.author}
                    </Text>
                    <Text
                      style={[styles.quoteText, isIPad && { fontSize: 24 }]}
                    >
                      {quote.title}
                    </Text>
                    <Text
                      style={[styles.quoteText, isIPad && { fontSize: 24 }]}
                    >
                      {quote.year}
                    </Text>
                    <Text
                      style={[styles.quoteText, isIPad && { fontSize: 24 }]}
                    >
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
                <View style={styles.headerDivider}>
                  {dividerDots.map((_, index) => (
                    <View key={index} style={styles.headerDividerDot} />
                  ))}
                </View>
                <Text style={[styles.quoteText, isIPad && { fontSize: 24 }]}>
                  {quote.quote}
                </Text>
              </>
            ) : (
              <Text>Quote failed to load.</Text>
            )}
            <TouchableOpacity style={styles.deleteButton} onPress={deleteQuote}>
              <Ionicons name="trash" size={24} color="#393E41" />
              <Text style={[styles.buttonText, isIPad && { fontSize: 24 }]}>
                Delete Quote
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  },
  quoteHeader: {
    flexDirection: "row",
    width: "100%",
    height: "auto",
    alignItems: "flex-start",
  },
  headerDivider: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 8,
  },
  headerDividerDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: "#393E41",
  },
  artContainer: {
    width: 100,
    height: 100,
  },
});

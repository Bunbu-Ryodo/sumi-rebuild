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
import { useState, useEffect } from "react";
import { TestIds } from "react-native-google-mobile-ads";
import { ArtworkType } from "@/types/types";
import { useLocalSearchParams } from "expo-router";
import {
  getUserArtworkById,
  deleteUserArtwork,
} from "../../supabase_queries/artworks";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

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

export default function ViewArtwork() {
  const router = useRouter();
  let { id } = useLocalSearchParams();
  const [artwork, setArtwork] = useState<ArtworkType | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgDimensions, setImgDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const fetchArtwork = async () => {
    setLoading(true);
    const artworkId = Array.isArray(id) ? id[0] : id;
    const artwork = await getUserArtworkById(artworkId);
    setArtwork(artwork);
  };

  useEffect(() => {
    fetchArtwork();
  }, []);

  useEffect(() => {
    if (artwork && artwork.url) {
      Image.getSize(
        artwork.url,
        (width, height) => setImgDimensions({ width, height }),
        (error) => console.log("Failed to get image size", error)
      );
      setLoading(false);
    }
  }, [artwork]);

  const screenWidth = Dimensions.get("window").width - 20;
  let imageHeight = 200;

  if (imgDimensions) {
    imageHeight = (screenWidth * imgDimensions.height) / imgDimensions.width;
  }

  const deleteArtwork = async () => {
    if (artwork) {
      const deleted = await deleteUserArtwork(artwork?.userid, artwork?.id);
      if (deleted) {
        router.push("/subscriptions");
      }
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.postArtworkWrapper}
      style={styles.container}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#393E41" />
      ) : (
        <View style={styles.frameButtonsSection}>
          {artwork && artwork.url ? (
            <Image
              source={{ uri: artwork.url }}
              style={{
                width: screenWidth,
                height: imageHeight,
                marginBottom: 16,
                borderRadius: 8,
              }}
            />
          ) : (
            <Text>No artwork found.</Text>
          )}
          <View>
            <Text style={styles.artworkTitle}>{artwork?.title}</Text>
            <Text style={styles.artworkDetails}>{artwork?.artist}</Text>
            <Text style={styles.artworkDetails}>{artwork?.year}</Text>
          </View>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteArtwork}>
            <Ionicons name="trash" size={24} color="#393E41" />
            <Text style={styles.buttonText}>
              Delete Artwork from My Collection
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  postArtworkWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F7EB",
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
    justifyContent: "center",
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
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  deleteButton: {
    marginTop: 8,
    padding: 16,
    flexDirection: "row",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
  },
  buttonText: {
    color: "#393E41",
    fontFamily: "QuicksandReg",
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
});

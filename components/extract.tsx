import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, {
  useImperativeHandle,
  forwardRef,
  useRef,
  useState,
} from "react";
import type { PropsWithChildren } from "react";
import { ExtractComponent } from "../types/types.js";
import { useRouter } from "expo-router";
import {
  saveUserArtwork,
  checkUserArtworkExists,
} from "@/supabase_queries/artworks";

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

export default function Extract({
  id,
  title,
  author,
  chapter,
  year,
  fulltext,
  portrait,
  coverart,
  coverartArtist,
  coverartYear,
  coverartTitle,
  userid,
}: ExtractComponent) {
  const [preview, setPreview] = useState(fulltext.slice(0, 420));
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  const handleNavigation = () => {
    router.push({
      pathname: "/ereader/[id]",
      params: { id },
    });
  };

  const saveRef = useRef<any>(null);

  const saveArtwork = async () => {
    if (!saved) {
      if (saveRef.current) {
        saveRef.current.bounce();
      }

      const artworkExists = await checkUserArtworkExists(
        userid,
        coverartTitle,
        coverartArtist,
        coverartYear
      );

      if (!artworkExists) {
        const artwork = await saveUserArtwork(
          userid,
          coverartTitle,
          coverartArtist,
          coverartYear,
          coverart
        );
        if (artwork) {
          setSaved(true);
        }
      } else {
        setSaved(true);
        console.log("Artwork already saved");
      }
    }
  };

  return (
    <View style={styles.extract}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNavigation}>
          <Image source={{ uri: portrait }} style={styles.portrait}></Image>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNavigation}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTextTitle}>{title}</Text>
            <Text style={styles.headerText}>Chapter {chapter}</Text>
            <Text style={styles.headerText}>{author}</Text>
            <Text style={styles.headerText}>({year})</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleNavigation}>
        <View style={styles.previewText}>
          <Text style={styles.text}>{preview}...</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[!saved ? styles.saveButton : styles.savedButton]}
        onPress={saveArtwork}
        disabled={saved}
      >
        <BounceView ref={saveRef}>
          <Ionicons
            name={!saved ? "color-palette-outline" : "color-palette"}
            size={24}
            color={"#393E41"}
            style={styles.icon}
            onPress={saveArtwork}
          ></Ionicons>
        </BounceView>
        {!saved ? (
          <Text style={styles.saveArtwork}>Save Artwork</Text>
        ) : (
          <Text style={styles.savedArtwork}>Saved!</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={handleNavigation} style={styles.thumbnail}>
        <Image source={{ uri: coverart }} style={styles.thumbnail} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  extract: {
    backgroundColor: "#F6F7EB",
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#393E41",
  },
  thumbnail: {
    width: "100%",
    maxWidth: 768,
    alignItems: "center",
    borderRadius: 8,
    height: 250,
    cursor: "pointer",
  },
  previewText: {
    marginTop: 12,
  },
  portrait: {
    borderRadius: 8,
    height: 100,
    width: 100,
    cursor: "pointer",
  },
  text: {
    fontFamily: "EBGaramond",
    fontSize: 18,
    cursor: "pointer",
  },
  header: {
    flexDirection: "row",
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomColor: "#393E41",
    borderBottomWidth: 1,
    borderStyle: "dotted",
    width: "100%",
  },
  headerContainer: {
    padding: 8,
    cursor: "pointer",
  },
  headerText: {
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "EBGaramond",
  },
  headerTextTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "EBGaramondItalic",
  },
  headerTextFrequency: {
    marginLeft: 12,
    fontWeight: 600,
    fontSize: 14,
    fontFamily: "EBGaramond",
    color: "#D64045",
  },
  engagementButtons: {
    marginTop: 16,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    cursor: "pointer",
    marginRight: 8,
  },
  subscribe: {
    flexDirection: "row",
  },
  readFullText: {
    fontFamily: "EBGaramond",
    fontSize: 14,
    color: "#393E41",
    textDecorationLine: "underline",
    marginLeft: 12,
  },
  saveArtwork: {
    fontFamily: "QuicksandReg",
    fontSize: 14,
    color: "#393E41",
    textDecorationLine: "underline",
  },
  savedArtwork: {
    fontFamily: "QuicksandReg",
    fontSize: 14,
    color: "#393E41",
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
    flexDirection: "row",
  },
  savedButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: "center",
    fontFamily: "QuicksandReg",
    width: "100%",
    flexDirection: "row",
  },
});

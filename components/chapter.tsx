import { View, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { ExtractType } from "../types/types.js";

export default function Chapter({
  id,
  chapter,
  subscribeart,
  isIPad = false,
}: ExtractType & { isIPad?: boolean }) {
  return (
    <View style={styles.subscriptionWrapper}>
      <Link href={{ pathname: "/ereader/[id]", params: { id: id } }} asChild>
        <TouchableOpacity key={id} style={styles.subscriptionButton}>
          <Image
            style={[styles.imageIcons, isIPad && { height: 80, width: 80 }]}
            source={{ uri: subscribeart }}
          />
          <Text style={[styles.chapter, isIPad && { fontSize: 24 }]}>
            {chapter}
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  subscriptionButton: {
    width: "100%",
    alignItems: "center",
  },
  subscriptionWrapper: { width: "25%", marginBottom: 12 },
  chapter: {
    fontSize: 14,
    fontFamily: "BeProVietnam",
    textAlign: "center",
  },
  sequelDue: {
    fontFamily: "BeProVietnam",
    fontSize: 14,
    textAlign: "center",
  },
  imageIcons: {
    height: 60,
    width: 60,
    borderRadius: 8,
    margin: 8,
  },
  noSubscribes: {
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  details: {
    fontFamily: "BeProVietnam",
    fontSize: 16,
  },
  daysLeft: {
    color: "#D64045",
  },
  detailsPanel: {
    padding: 8,
  },
});

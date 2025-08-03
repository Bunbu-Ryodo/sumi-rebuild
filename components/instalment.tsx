import { View, Image, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { InstalmentTypeClient } from "../types/types.js";

export default function Instalment({
  id,
  extractid,
  title,
  chapter,
  subscribeart,
  sequeldue,
}: InstalmentTypeClient) {
  return (
    <View style={styles.subscriptionWrapper}>
      <Link
        href={{ pathname: "/ereader/[id]", params: { id: extractid } }}
        asChild
      >
        <TouchableOpacity key={id} style={styles.subscriptionButton}>
          <Image style={styles.imageIcons} source={{ uri: subscribeart }} />
          <Text style={styles.instalmentTitle}>
            {title}, ch. {chapter}
          </Text>
          {sequeldue ? (
            <Text style={styles.sequelDue}>
              Next chapter{" "}
              {new Date(sequeldue).toLocaleDateString("en-GB", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          ) : (
            <Text style={styles.noSubscribes}>The End</Text>
          )}
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
  subscriptionWrapper: { width: "33.33%", marginBottom: 12 },
  instalmentTitle: {
    fontSize: 16,
    fontFamily: "EBGaramondItalic",
    textAlign: "center",
  },
  sequelDue: {
    fontFamily: "QuicksandReg",
    fontSize: 14,
    textAlign: "center",
  },
  imageIcons: {
    height: 81,
    width: 81,
    borderRadius: 8,
    margin: 8,
  },
  noSubscribes: {
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  details: {
    fontFamily: "QuicksandReg",
    fontSize: 16,
  },
  daysLeft: {
    color: "#D64045",
  },
  detailsPanel: {
    padding: 8,
  },
});

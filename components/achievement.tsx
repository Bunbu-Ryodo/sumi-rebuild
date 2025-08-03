import { AchievementTypeClient } from "../types/types";
import { Animated, View, Text, StyleSheet, Easing } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { PropsWithChildren } from "react";
// import type { ViewStyle } from "react-native";
import { useRef, useEffect } from "react";

type BounceInProps = PropsWithChildren<{}>;

const BounceView: React.FC<BounceInProps> = (props) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.3333,
        duration: 300,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity: scale.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      }}
    >
      {props.children}
    </Animated.View>
  );
};

type LoadingProps = PropsWithChildren<{}>;

const LoadingView: React.FC<LoadingProps> = (props) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1, // animate to 100%
      duration: 800, // 1.2 seconds
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width cannot use native driver
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: progressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
      }}
    >
      {props.children}
    </Animated.View>
  );
};

export default function Achievement({
  id,
  title,
  description,
  score,
  icon,
  date,
  tier,
}: AchievementTypeClient) {
  return (
    <View style={styles.achievementsRow}>
      <BounceView>
        <View style={styles.achievementIcon}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={"#F6F7EB"}
          ></Ionicons>
        </View>
      </BounceView>
      <View style={styles.achievementDetails}>
        <View style={styles.titleContainer}>
          <Text style={styles.achievementTitle}>{title}</Text>
          {tier === "bronze" ? (
            <View style={styles.bronzeMedal}></View>
          ) : tier === "silver" ? (
            <View style={styles.silverMedal}></View>
          ) : tier === "gold" ? (
            <View style={styles.goldMedal}></View>
          ) : null}
        </View>
        <Text style={styles.achievementDescription}>
          {description} +{score}
        </Text>
        <Text style={styles.achievementDescription}>
          Achieved on:{" "}
          {new Date(date).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        <View style={styles.achievementProgressBar}>
          <LoadingView>
            <View style={styles.progress}></View>
          </LoadingView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  achievementsRow: {
    flexDirection: "row",
    padding: 8,
  },
  achievementIcon: {
    height: 48,
    width: 48,
    borderRadius: 8,
    backgroundColor: "#393E41",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  inProgressIcon: {
    height: 48,
    width: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#393E41",
    marginRight: 16,
  },
  achievementTitle: {
    fontFamily: "QuicksandReg",
    fontSize: 16,
    maxWidth: 120,
  },
  achievementDescription: {
    marginTop: 4,
    fontFamily: "QuicksandReg",
    maxWidth: 200,
    fontSize: 14,
  },
  readerScoreContainer: {
    flexDirection: "row",
  },
  achievementProgressBar: {
    marginTop: 8,
    borderRadius: 40,
    height: 14,
    borderWidth: 1,
    borderColor: "#393E41",
    backgroundColor: "transparent",
    maxWidth: 200,
  },
  progress: {
    height: 12,
    backgroundColor: "#FE7F2D",
    borderRadius: 40,
    maxWidth: 200,
  },
  achievementDetails: {
    minWidth: 200,
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  score: {
    fontSize: 24,
    fontFamily: "EBGaramond",
  },
  bronzeMedal: {
    backgroundColor: "#cd7f32",
    height: 16,
    width: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  silverMedal: {
    backgroundColor: "#C0C0C0",
    height: 16,
    width: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  goldMedal: {
    backgroundColor: "#FFD700",
    height: 16,
    width: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

//Test

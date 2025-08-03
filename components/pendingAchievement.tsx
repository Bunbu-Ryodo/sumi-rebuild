import { Animated, View, Text, StyleSheet, Easing } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PendingAchievementType } from "../types/types";
import { useRef, useEffect } from "react";
import type { PropsWithChildren } from "react";
import type { ViewStyle } from "react-native";

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

type LoadingProps = PropsWithChildren<{
  style?: ViewStyle;
  progressBar: number;
}>;

const LoadingView: React.FC<LoadingProps> = (props) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1, // animate to 100%
      duration: 800, // 0.8 seconds
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // width cannot use native driver
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        ...(props.style || {}),
        width: progressAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, props.progressBar],
        }),
      }}
    >
      {props.children}
    </Animated.View>
  );
};

export default function PendingAchievement({
  id,
  title,
  description,
  score,
  icon,
  achievementProgress,
}: PendingAchievementType) {
  return (
    <View style={styles.achievementsRow}>
      <BounceView>
        <View style={styles.achievementIcon}>
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={"#393E41"}
          ></Ionicons>
        </View>
      </BounceView>
      <View style={styles.achievementDetails}>
        <Text style={styles.achievementTitle}>{title}</Text>
        <Text style={styles.achievementDescription}>
          {description} +{score}
        </Text>
        <View style={styles.progressBarContainer}>
          <LoadingView progressBar={achievementProgress * 2}>
            <View style={[styles.achievementProgressBar]}></View>
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
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#393E41",
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
  progressBarContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 40,
    height: 14,
    width: 200,
  },
  achievementProgressBar: {
    backgroundColor: "#8980F5",
    borderRadius: 40,
    height: 12,
    width: "100%",
  },
  achievementDetails: {
    minWidth: 200,
  },
  scoreContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  score: {
    fontSize: 24,
    fontFamily: "EBGaramond",
  },
});

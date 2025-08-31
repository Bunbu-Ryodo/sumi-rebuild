import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from "react-native";
import { InstalmentType } from "../types/types.js";
import { useRouter } from "expo-router";
import Chapter from "./chapter";
import type { PropsWithChildren } from "react";
import { useRef, useEffect } from "react";

type LoadingProps = PropsWithChildren<{
  style?: ViewStyle;
  progressBar: number;
}>;

const LoadingView: React.FC<LoadingProps> = (props) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1, // animate to 100%
      duration: 400, // 0.8 seconds
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

export default function Book({
  id,
  subscriptionid,
  title,
  author,
  extracts,
  subscribeart,
  sequeldue,
  earnedchapters,
  totalchapters,
  hidden,
}: InstalmentType) {
  const router = useRouter();

  return (
    <View style={styles.bookWrapper}>
      <View style={styles.heading}>
        <Text style={styles.bookTextTitle}>{title}</Text>
        <Text style={styles.bookText}>by {author}</Text>
      </View>
      <Text style={styles.dueText}>
        Next Chapter:{" "}
        {new Date(sequeldue).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
      <Text style={styles.progressText}>
        Progress: {earnedchapters} out of {totalchapters} chapters
      </Text>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <LoadingView
            progressBar={
              (earnedchapters / totalchapters) * 250 < 15
                ? 15
                : (earnedchapters / totalchapters) * 250
            }
          >
            <View style={[styles.progress]}></View>
          </LoadingView>
        </View>
      </View>
      <View style={styles.chapters}>
        {extracts.map((extract, index) => (
          <Chapter key={`${title}-${index}`} {...extract} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bookWrapper: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#393E41",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  heading: {
    flexDirection: "row",
  },
  bookTextTitle: {
    fontSize: 16,
    fontFamily: "EBGaramondItalic",
    color: "#393E41",
    marginRight: 4,
  },
  bookText: {
    fontSize: 16,
    fontFamily: "EBGaramond",
    color: "#393E41",
  },
  chapters: {
    marginTop: 12,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  dueText: {
    marginTop: 8,
    fontFamily: "QuicksandReg",
    fontSize: 14,
    color: "#393E41",
  },
  progressText: {
    marginTop: 8,
    fontFamily: "QuicksandReg",
    fontSize: 14,
    color: "#393E41",
  },
  progressBar: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 40,
    height: 14,
    width: 250,
    justifyContent: "center",
  },
  progress: {
    backgroundColor: "#FE7F2D",
    borderRadius: 40,
    height: 12,
    width: "100%",
  },
  progressBarContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

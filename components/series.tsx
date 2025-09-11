import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from "react-native";
import { SeriesType } from "../types/types.js";
import Chapter from "./chapter";
import type { PropsWithChildren } from "react";
import { useRef, useEffect, useState } from "react";
type LoadingProps = PropsWithChildren<{
  style?: ViewStyle;
  progressBar: number;
}>;

const LoadingView: React.FC<LoadingProps> = (props) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
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

export default function Series({
  title,
  author,
  extracts,
  sequeldue,
  earnedchapters,
  totalchapters,
}: SeriesType) {
  const progressBarRef = useRef<View>(null);
  const [progressBarWidth, setProgressBarWidth] = useState(250);

  useEffect(() => {
    setTimeout(() => {
      if (progressBarRef.current) {
        progressBarRef.current.measure((x, y, width, height) => {
          setProgressBarWidth(width);
        });
      }
    }, 100);
  }, []);

  const progress = (earnedchapters / totalchapters) * progressBarWidth;

  return (
    <View style={styles.bookWrapper}>
      <View style={styles.heading}>
        <Text style={styles.bookTextTitle}>{title}</Text>
        <Text style={styles.bookText}>by {author}</Text>
      </View>

      <Text style={styles.progressText}>
        {earnedchapters} out of {totalchapters} instalments
      </Text>
      <View style={styles.progressBarContainer}>
        <View ref={progressBarRef} style={styles.progressBar}>
          <LoadingView
            progressBar={
              progress < 15
                ? 15
                : progress >= progressBarWidth
                ? progress - 2
                : progress
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
      <Text style={styles.dueText}>
        Next Chapter:{" "}
        {new Date(sequeldue).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Text>
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
    fontFamily: "QuicksandReg",
    fontSize: 16,
    color: "#393E41",
  },
  progressBar: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#393E41",
    borderRadius: 40,
    height: 14,
    width: "100%",
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

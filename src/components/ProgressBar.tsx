import { LightColors } from "@/constants/Colors";
import * as React from "react";
import { Animated, View } from "react-native";

export function ProgressBar(): React.JSX.Element {
  const [progress] = React.useState(() => new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const animatedWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "80%"],
  });

  return (
    <View style={{ flexDirection: "row" }}>
      <Animated.View
        style={{
          height: 2,
          width: animatedWidth,
          backgroundColor: LightColors.base.primary,
        }}
      />
      <View
        style={{
          height: 2,
          width: "100%",
          backgroundColor: LightColors.border.default,
        }}
      />
    </View>
  );
}

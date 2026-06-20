import * as React from "react";
import { Animated, Dimensions, Easing } from "react-native";

import { FilterType } from "@/types/market";

interface MeasurementType {
  [key: string]: { x: number; width: number };
}

const screenWidth = Dimensions.get("window").width;

export const useTabBarIndicator = (activeFilter: FilterType) => {
  const [canScroll, setCanScroll] = React.useState(false);
  const [measurements, setMeasurements] = React.useState<MeasurementType>({});

  const [indicatorPosition] = React.useState(() => new Animated.Value(0));
  const [indicatorWidth] = React.useState(() => new Animated.Value(0));

  React.useEffect(() => {
    const activeMeasurement = measurements[activeFilter];

    if (activeMeasurement) {
      Animated.parallel([
        Animated.timing(indicatorPosition, {
          toValue: activeMeasurement.x,
          useNativeDriver: false,
          duration: 250,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(indicatorWidth, {
          toValue: activeMeasurement.width,
          useNativeDriver: false,
          duration: 250,
          easing: Easing.out(Easing.ease),
        }),
      ]).start();
    }
  }, [activeFilter, measurements, indicatorPosition, indicatorWidth]);

  const handleMeasurement = React.useCallback(
    (filter: FilterType, x: number, width: number) => {
      setMeasurements((prev) => ({ ...prev, [filter]: { x, width } }));
    },
    [],
  );

  const handleContentSizeChange = React.useCallback((contentWidth: number) => {
    setCanScroll(contentWidth > screenWidth);
  }, []);

  return {
    canScroll,
    indicatorPosition,
    indicatorWidth,
    handleMeasurement,
    handleContentSizeChange,
  };
};

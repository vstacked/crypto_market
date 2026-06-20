import * as React from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";

import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { FILTERS, FilterType } from "@/types/market";

interface FilterTabBarProps {
  activeFilter: FilterType;
  canScroll: boolean;
  indicatorPosition: Animated.Value;
  indicatorWidth: Animated.Value;
  onFilterChange: (filter: FilterType) => void;
  onMeasurement: (filter: FilterType, x: number, width: number) => void;
  onContentSizeChange: (contentWidth: number) => void;
}

export const FilterTabBar = ({
  activeFilter,
  canScroll,
  indicatorPosition,
  indicatorWidth,
  onFilterChange,
  onMeasurement,
  onContentSizeChange,
}: FilterTabBarProps) => {
  return (
    <View style={styles.wrapper}>
      {canScroll && (
        <View style={styles.scrollArrow}>
          <AntDesign name="right" size={22} color="black" />
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        onContentSizeChange={onContentSizeChange}
      >
        <Animated.View
          style={[
            styles.indicator,
            {
              left: indicatorPosition,
              width: indicatorWidth,
            },
          ]}
        />

        {FILTERS.map((filter, index) => {
          const isActive = activeFilter === filter;
          const isLastItem = index === FILTERS.length - 1;

          return (
            <Pressable
              key={filter}
              onPress={() => onFilterChange(filter)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                onMeasurement(filter, x, width);
              }}
              style={[
                styles.tab,
                isLastItem && styles.tabLast,
                isActive && styles.tabActive,
              ]}
            >
              <Text
                style={[styles.tabLabel, isActive && styles.tabLabelActive]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "stretch",
    borderBottomWidth: 2,
    borderBottomColor: LightColors.border.default,
  },
  scrollArrow: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    paddingRight: 16,
    paddingLeft: 4,
    backgroundColor: LightColors.background.bg,
    justifyContent: "center",
    zIndex: 1,
  },
  scrollView: {
    overflow: "visible",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  indicator: {
    position: "absolute",
    bottom: -2,
    height: 2,
    backgroundColor: LightColors.base.primary,
    zIndex: 1,
  },
  tab: {
    height: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLast: {
    marginRight: 20, // give space for arrow
  },
  tabActive: {
    backgroundColor: LightColors.background.surfaces,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tabLabel: {
    ...Typography.titleSmall,
    color: LightColors.text.primaryBody,
  },
  tabLabelActive: {
    color: LightColors.base.primary,
  },
});

import * as React from "react";
import { StyleSheet, View } from "react-native";

import { LightColors } from "@/constants/Colors";

const SKELETON_COUNT = 4;

export const MarketListSkeleton = () => {
  return (
    <View>
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <View key={index} style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconPlaceholder} />

            <View style={styles.textGroup}>
              <View style={styles.symbolPlaceholder} />
              <View style={styles.namePlaceholder} />
            </View>
          </View>

          <View style={styles.rowRight}>
            <View style={styles.changePlaceholder} />
            <View style={styles.pricePlaceholder} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    borderRadius: 4,
    backgroundColor: LightColors.background.surfaces,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  iconPlaceholder: {
    height: 40,
    width: 40,
    backgroundColor: LightColors.base.skeleton,
    borderRadius: 2,
  },
  textGroup: {
    gap: 2,
    alignItems: "flex-start",
  },
  symbolPlaceholder: {
    height: 20,
    width: 50,
    backgroundColor: LightColors.base.skeleton,
  },
  namePlaceholder: {
    height: 20,
    width: 75,
    backgroundColor: LightColors.base.skeleton,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  changePlaceholder: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
    height: 20,
    width: 50,
    backgroundColor: LightColors.base.skeleton,
  },
  pricePlaceholder: {
    height: 20,
    width: 100,
    backgroundColor: LightColors.base.skeleton,
  },
});

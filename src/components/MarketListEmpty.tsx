import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";

interface MarketListEmptyProps {
  keyword: string;
  errorMessage: string | undefined;
}

export const MarketListEmpty = ({
  keyword,
  errorMessage,
}: MarketListEmptyProps) => {
  return (
    <>
      {!!keyword.length && !errorMessage && (
        <View style={styles.container}>
          <Text style={styles.notFoundText}>
            We couldn&apos;t find &quot;{keyword}&quot;{"\n"}Try searching with
            a{"\n"}different keyword.
          </Text>
        </View>
      )}

      {!!errorMessage && (
        <View style={styles.container}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: 300,
  },
  notFoundText: {
    ...Typography.titleLarge,
    color: LightColors.text.primaryBody,
    textAlign: "center",
  },
  errorText: {
    ...Typography.titleSmall,
    color: LightColors.base.error,
    textAlign: "center",
  },
});

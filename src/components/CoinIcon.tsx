import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { LightColors } from "@/constants/Colors";
import { localImageMap } from "@/constants/LocalImageMap";
import { CryptoMarketItem } from "@/types/api";

interface CoinIconProps {
  coin: CryptoMarketItem;
}

export const CoinIcon = ({ coin }: CoinIconProps) => {
  const imageUrl = coin?.image ?? localImageMap[coin.id];

  if (imageUrl) {
    return (
      <View style={styles.container}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="contain"
          cachePolicy="disk"
          transition={200}
        />
      </View>
    );
  }

  // TypeScript knows coin.name might be undefined, so the fallback is safe
  const fallbackChar = (coin.symbol || coin.name || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <View style={styles.fallback}>
      <Text>{fallbackChar}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    width: 40,
  },
  image: {
    width: 40,
    height: 40,
  },
  fallback: {
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: LightColors.background.bg,
    borderRadius: 2,
  },
});

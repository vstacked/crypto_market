import { LightColors } from "@/constants/Colors";
import React from "react";
import { View, ActivityIndicator, Image, StyleSheet } from "react-native";

export const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <ActivityIndicator
        size="large"
        color={LightColors.base.primary}
        style={{ opacity: 0.5 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.background.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 125,
    height: 125,
  },
});

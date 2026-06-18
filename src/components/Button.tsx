import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";

export interface ButtonProps extends Omit<
  PressableProps,
  "style" | "disabled"
> {
  /** Label displayed inside the button. */
  label: string;
  /** Replaces the label with an ActivityIndicator and disables interaction. */
  isLoading?: boolean;
  /** Prevents interaction and applies reduced-opacity styling. */
  disabled?: boolean;
  /** Override styles for the outer Pressable container. */
  style?: StyleProp<ViewStyle>;
  /** Override styles for the label text. */
  labelStyle?: StyleProp<TextStyle>;
  /** Color of the ActivityIndicator. Defaults to '#FFFFFF'. */
  loadingColor?: string;
}

export function Button({
  label,
  isLoading = false,
  disabled = false,
  style,
  labelStyle,
  loadingColor = "#FFFFFF",
  onPress,
  ...pressableProps
}: ButtonProps): React.JSX.Element {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {isLoading ? (
        <ActivityIndicator color={loadingColor} />
      ) : (
        <Text
          style={[styles.label, isDisabled && styles.labelDisabled, labelStyle]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LightColors.button.background,
    width: "100%",
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {},
  label: {
    ...Typography.titleLarge,
    color: LightColors.button.foreground,
    textAlign: "center",
  },
  labelDisabled: {
    // Additional label treatment for disabled state if needed.
  },
});

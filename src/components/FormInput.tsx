import * as React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";

export interface FormInputProps extends TextInputProps {
  /** Turns the border red and makes the field visually invalid. */
  hasError?: boolean;
  /** Optional message rendered beneath the input when hasError is true. */
  errorMessage?: string;
  /** Any node rendered to the left of the input (icon, flag, spinner, text, …). */
  leftSlot?: React.ReactNode;
  /** Any node rendered to the right of the input (icon, button, spinner, text, …). */
  rightSlot?: React.ReactNode;
  /** Override styles for the outer container. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Override styles for the inner input wrapper (border box). */
  inputWrapperStyle?: StyleProp<ViewStyle>;
  /** Override styles for the TextInput itself. */
  inputStyle?: StyleProp<TextStyle>;
  /** Override styles for the error message text. */
  errorStyle?: StyleProp<TextStyle>;
  refInput?: React.Ref<TextInput>;
}

export function FormInput({
  hasError = false,
  errorMessage,
  leftSlot,
  rightSlot,
  containerStyle,
  inputWrapperStyle,
  inputStyle,
  errorStyle,
  refInput,
  ...textInputProps
}: FormInputProps): React.JSX.Element {
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Border wrapper — changes colour when hasError is true */}
      <View
        style={[
          styles.inputWrapper,
          hasError && styles.inputWrapperError,
          inputWrapperStyle,
        ]}
      >
        {/* Left slot — only rendered when a node is provided */}
        {leftSlot != null && <View style={styles.leftSlot}>{leftSlot}</View>}

        <TextInput
          ref={refInput}
          style={[styles.input, inputStyle]}
          placeholderTextColor={LightColors.text.secondaryBody}
          autoCapitalize="none"
          autoCorrect={false}
          {...textInputProps}
        />

        {/* Right slot — only rendered when a node is provided */}
        {rightSlot != null && <View style={styles.rightSlot}>{rightSlot}</View>}
      </View>

      {/* Error message — only rendered when both hasError and a message exist */}
      {hasError && errorMessage != null && errorMessage.length > 0 && (
        <Text
          style={[styles.errorMessage, errorStyle]}
          accessibilityRole="alert"
        >
          {errorMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 4,
    borderColor: LightColors.border.default,
    backgroundColor: LightColors.background.bg,
    paddingHorizontal: 16,
  },
  inputWrapperError: {
    borderColor: LightColors.base.error,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    paddingVertical: 10,
    color: LightColors.text.primaryBody,
    textAlign: "left",
  },
  leftSlot: {
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  rightSlot: {
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  errorMessage: {
    marginTop: 4,
    ...Typography.bodySmall,
    color: LightColors.base.error,
    textAlign: "left",
  },
});

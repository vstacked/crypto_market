import * as React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";

export interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  OTP_LENGTH?: number;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  OTP_LENGTH = 6,
}: OtpInputProps): React.JSX.Element {
  const digits = React.useMemo<string[]>(() => {
    const split = value.split("").slice(0, OTP_LENGTH);
    while (split.length < OTP_LENGTH) {
      split.push("");
    }
    return split;
  }, [value, OTP_LENGTH]);

  const inputRefs = React.useRef<(TextInput | null)[]>(
    Array(OTP_LENGTH).fill(null),
  );

  const handleOnChange = (index: number, char: string): void => {
    const next = [...digits];
    next[index] = char; // upd curr
    onChange(next.join(""));
  };

  const focusInput = (index: number): void => {
    inputRefs.current[index]?.focus();
  };

  const handleChangeText = (index: number, text: string): void => {
    const numeric = text.replace(/[^0-9]/g, "");
    const char = numeric.length > 0 ? numeric[numeric.length - 1] : "";

    handleOnChange(index, char);

    // move to the new field
    if (char.length > 0 && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyPress = (index: number, eventKey: string): void => {
    if (eventKey === "Backspace" && digits[index] === "" && index > 0) {
      // clear the previous cell and move focus back
      handleOnChange(index - 1, "");
      focusInput(index - 1);
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <View key={index} style={styles.box}>
          <TextInput
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[styles.cell, digits[index].length > 0 && styles.cellFilled]}
            value={digits[index]}
            onChangeText={(text) => handleChangeText(index, text)}
            onKeyPress={(event) => handleKeyPress(index, event.nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            selectTextOnFocus
            editable={!disabled}
            caretHidden
            placeholderTextColor={LightColors.text.secondaryBody}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    width: 40,
    height: 56,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: LightColors.background.surfaces,
  },
  cell: {
    textAlign: "center",
    ...Typography.titleLarge,
    color: LightColors.base.primary,
    borderBottomColor: LightColors.border.default,
    borderBottomWidth: 2,
  },
  cellFilled: {
    borderBottomColor: LightColors.base.primary,
  },
});

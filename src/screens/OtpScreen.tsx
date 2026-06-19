import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { OtpScreenProps } from "@/types/navigation";
import { LightColors } from "@/constants/Colors";
import Octicons from "@expo/vector-icons/Octicons";
import { Typography } from "@/constants/Typography";
import { OtpInput } from "@/components/OtpInput";
import { Button } from "@/components/Button";
import { ProgressBar } from "@/components/ProgressBar";
import { useOtpVerify } from "@/hooks/useOtpVerify";

const OTP_LENGTH = 6;

export function OtpScreen({ route }: OtpScreenProps): React.JSX.Element {
  const { otp, phone, action } = useOtpVerify();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable hitSlop={10} onPress={action.goBack}>
            <Octicons name="arrow-left" size={24} color="black" />
          </Pressable>

          <Pressable hitSlop={10} onPress={action.goBack}>
            <Octicons name="x" size={24} color="black" />
          </Pressable>
        </View>

        <ProgressBar />
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Confirm your phone</Text>
          <Text style={styles.subtitle}>
            We send 6 digits code to {phone.formatted}
          </Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.otpGroup}>
          <OtpInput
            OTP_LENGTH={OTP_LENGTH}
            value={otp.value}
            onChange={otp.setCode}
            disabled={false}
          />
          <Text style={styles.resendText}>
            <Text>Didn&apos;t get a code? </Text>
            <Text style={styles.resendLink} onPress={action.goBack}>
              Resend
            </Text>
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Verify Your Number"
          onPress={action.handleVerifyOtp}
          isLoading={action.isLoading}
          disabled={!!otp.code && otp.code.length !== OTP_LENGTH}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    backgroundColor: LightColors.background.bg,
    gap: 26,
  },
  header: {
    alignSelf: "stretch",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: LightColors.background.bg,
    paddingHorizontal: 16,
    width: "100%",
  },
  titleGroup: {
    gap: 4,
  },
  title: {
    ...Typography.headlineSmall,
    color: LightColors.text.primaryBody,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: LightColors.text.primaryBody,
    textAlign: "left",
  },
  spacer: {
    height: 40,
  },
  otpGroup: {
    alignItems: "center",
    gap: 8,
  },
  resendText: {
    ...Typography.bodyMedium,
    color: LightColors.text.primaryBody,
  },
  resendLink: {
    color: LightColors.base.primary,
  },
  footer: {
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignSelf: "stretch",
  },
});

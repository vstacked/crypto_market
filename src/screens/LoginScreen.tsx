import * as React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import type { LoginScreenProps } from "@/types/navigation";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/Button";
import { Typography } from "@/constants/Typography";
import { LightColors } from "@/constants/Colors";
import { getFlagEmoji } from "@/utils/getFlagEmoji";
import CountryPickerModal from "@/components/CountryPickerModal";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLoginForm } from "@/hooks/useLoginForm";
import EyeClosedIcon from "@/assets/icons/EyeClosedIcon";

export function LoginScreen(_props: LoginScreenProps): React.JSX.Element {
  const { form, method, country, secure, refs, auth } = useLoginForm();

  return (
    <SafeAreaView edges={["bottom", "left", "right"]} style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.headline}>Sign In</Text>

          {/* ── Identifier field ── */}
          <View style={styles.fieldGroup}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.label}>
                {method.isEmail ? "Email" : "Mobile Number"}
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={method.changeMethod}
              >
                <Text style={styles.switchMethod}>
                  Sign In with {method.isEmail ? "Mobile Number" : "Email"}
                </Text>
              </TouchableOpacity>
            </View>

            <FormInput
              refInput={refs.refIdentifier}
              placeholder={
                method.isEmail ? "username@gmail.com" : "Enter your number"
              }
              keyboardType={method.isEmail ? "email-address" : "phone-pad"}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={refs.focusPassword}
              onChangeText={form.setIdentifier}
              hasError={
                method.isEmail
                  ? auth.error?.field === "email"
                  : auth.error?.field === "phone"
              }
              errorMessage={auth.error?.message}
              leftSlot={
                method.isEmail ? undefined : (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.dialCodeSlot}
                    onPress={country.openCountryModal}
                  >
                    <Text>{getFlagEmoji(country.selectedCountry.code)}</Text>
                    <Text style={styles.dialCode}>
                      {country.selectedCountry.dial_code}
                    </Text>
                  </TouchableOpacity>
                )
              }
            />
          </View>

          {/* ── Password field ── */}
          <View style={styles.passwordGroup}>
            <Text style={styles.label}>Password</Text>

            <FormInput
              refInput={refs.refPassword}
              placeholder="Enter your password"
              secureTextEntry={secure.secureText}
              returnKeyType="done"
              onSubmitEditing={
                form.identifier && form.password ? auth.handleLogin : undefined
              }
              onChangeText={form.setPassword}
              hasError={auth.error?.field === "password"}
              errorMessage={auth.error?.message}
              rightSlot={
                <Pressable onPress={secure.toggleSecure} hitSlop={8}>
                  {secure.secureText ? (
                    <EyeClosedIcon size={20} color="black" />
                  ) : (
                    <Ionicons name="eye-outline" size={20} color="black" />
                  )}
                </Pressable>
              }
            />

            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </View>

          {/* ── Unknown error banner ── */}
          <Text
            style={[
              styles.errorMessage,
              { opacity: auth.error?.field === "unknown" ? 1 : 0 },
            ]}
            accessibilityRole="alert"
          >
            {auth.error?.message}
          </Text>

          <Button
            label="Sign In"
            onPress={auth.handleLogin}
            isLoading={auth.isLoading}
            disabled={!form.identifier || !form.password}
          />

          <CountryPickerModal
            visible={country.isCountryModalVisible}
            countries={country.countries}
            selectedCode={country.selectedCountry.code}
            onSelect={country.handleSelectCountry}
            onClose={country.closeCountryModal}
          />
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 16,
    backgroundColor: LightColors.background.bg,
    gap: 24,
  },
  scrollView: {
    flex: 1,
    backgroundColor: LightColors.background.bg,
    width: "100%",
  },
  scrollContent: {
    //* CRUCIAL: Use flexGrow, NOT flex: 1, so it can scroll if the keyboard pushes it
    flexGrow: 1,
  },
  headline: {
    ...Typography.headlineSmall,
    color: LightColors.text.primaryBody,
  },
  fieldGroup: {
    width: "100%",
    gap: 4,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    ...Typography.bodySmall,
    color: LightColors.text.primaryBody,
  },
  switchMethod: {
    ...Typography.bodySmall,
    color: LightColors.base.primary,
  },
  dialCodeSlot: {
    flexDirection: "row",
    gap: 8,
  },
  dialCode: {
    ...Typography.bodyLarge,
    color: LightColors.text.primaryBody,
  },
  passwordGroup: {
    width: "100%",
    alignItems: "flex-start",
    gap: 4,
  },
  forgotPassword: {
    ...Typography.bodySmall,
    color: LightColors.base.primary,
  },
  errorMessage: {
    marginTop: 4,
    ...Typography.bodySmall,
    color: LightColors.base.error,
    textAlign: "center",
    width: "100%",
  },
});

import { Button } from "@/components/Button";
import { useLogoutMutation } from "@/services/api";
import * as React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function ServicesScreen(): React.JSX.Element {
  const [logout, { isLoading }] = useLogoutMutation();

  const handleSignOut = () => logout();

  return (
    <SafeAreaView style={styles.container}>
      <Button label="Sign Out" onPress={handleSignOut} isLoading={isLoading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 50,
  },
});

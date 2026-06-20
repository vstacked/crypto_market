import "react-native-reanimated";
import * as React from "react";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { Provider } from "react-redux";
import {
  useFonts,
  Roboto_400Regular,
  Roboto_500Medium,
} from "@expo-google-fonts/roboto";
import * as SplashScreen from "expo-splash-screen";

import { store, useAppDispatch } from "@/store";
import { AppNavigator } from "@/navigation/AppNavigator";
import { getUserToken } from "./utils/secureStore";
import { setIsRestoringTokenDone, setToken } from "./store/slices/authSlice";
import { Platform } from "react-native";

SplashScreen.preventAutoHideAsync();

export function App(): React.JSX.Element {
  const [loaded, error] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
  });

  if (!loaded && !error) {
    // Async font loading only occurs in development.
    return <></>;
  }

  return (
    <Provider store={store}>
      <InternalApp />
    </Provider>
  );
}

function InternalApp(): React.JSX.Element {
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    getUserToken()
      .then((token) => {
        if (token) dispatch(setToken({ token }));
      })
      .finally(() => {
        dispatch(setIsRestoringTokenDone());
        SplashScreen.hideAsync();
      });
  }, [dispatch]);

  return (
    <SafeAreaProvider
      style={
        Platform.OS === "android"
          ? { marginBottom: initialWindowMetrics?.insets.bottom }
          : {}
      }
    >
      <AppNavigator />
    </SafeAreaProvider>
  );
}

import { View, StyleSheet } from "react-native";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  createStaticNavigation,
  StaticParamList,
} from "@react-navigation/native";

import type { MainTabParamList } from "@/types/navigation";

import { LoginScreen } from "@/screens/LoginScreen";
import { OtpScreen } from "@/screens/OtpScreen";
import { MarketScreen } from "@/screens/MarketScreen";
import { ServicesScreen } from "@/screens/ServicesScreen";
import {
  useIsGuest,
  useIsLoggedIn,
  useIsRestoringToken,
} from "@/hooks/useAuth";
import { MarketsIcon } from "@/assets/icons/MarketsIcon";
import { ServicesIcon } from "@/assets/icons/ServicesIcon";
import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { SplashScreen } from "@/screens/SplashScreen";

// ---------------------------------------------------------------------------
// Authenticated — bottom-tab navigator (Markets | Services)
// ---------------------------------------------------------------------------

// NOTE: createBottomTabNavigator with a static config needs a typed generic only
// when used with the dynamic API. With the static API (object of screens), the
// generic is not required here — StaticParamList infers it from the config below.
const MainTabs = createBottomTabNavigator<MainTabParamList>({
  screenOptions: {
    headerShown: false,
    tabBarStyle: {
      height: 75,
      paddingBottom: 8,
      paddingTop: 8,
    },
    tabBarLabelStyle: {
      ...Typography.labelMedium,
      marginTop: 5,
      color: LightColors.text.primaryBody,
    },
  },
  screens: {
    Markets: {
      screen: MarketScreen,
      options: {
        tabBarLabel: "Markets",
        tabBarIcon: ({ focused }) => (
          <View
            style={[
              styles.iconWrapper,
              focused && styles.activeIconWrapper,
              { paddingBottom: 2 },
            ]}
          >
            <MarketsIcon
              size={34}
              color={
                focused
                  ? LightColors.background.surfaces
                  : LightColors.text.primaryBody
              }
            />
          </View>
        ),
      },
    },
    Services: {
      screen: ServicesScreen,
      options: {
        tabBarLabel: "Services",
        tabBarIcon: ({ focused }) => (
          <View
            style={[styles.iconWrapper, focused && styles.activeIconWrapper]}
          >
            <ServicesIcon
              size={34}
              color={
                focused
                  ? LightColors.background.surfaces
                  : LightColors.text.primaryBody
              }
            />
          </View>
        ),
      },
    },
  },
});

const styles = StyleSheet.create({
  iconWrapper: {
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  activeIconWrapper: {
    backgroundColor: LightColors.base.primary,
  },
});

// ---------------------------------------------------------------------------
// Root stack (unauthenticated → authenticated)
// ---------------------------------------------------------------------------

const RootStack = createNativeStackNavigator({
  screenOptions: {
    headerShown: false,
  },
  groups: {
    SplashGroup: {
      if: useIsRestoringToken,
      screens: {
        Splash: {
          screen: SplashScreen,
        },
      },
    },
    GuestGroup: {
      if: useIsGuest,
      screens: {
        Login: {
          screen: LoginScreen,
        },
        Otp: {
          screen: OtpScreen,
        },
      },
    },
    UserGroup: {
      if: useIsLoggedIn,
      screens: {
        MainTabs: {
          screen: MainTabs,
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Static navigation + global type augmentation
// ---------------------------------------------------------------------------

export const AppNavigator = createStaticNavigation(RootStack);

type AppRootParamList = StaticParamList<typeof RootStack>;

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends AppRootParamList {}
  }
}

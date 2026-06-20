import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, RouteProp } from "@react-navigation/native";

// ---------------------------------------------------------------------------
// Root stack param list
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  Login: undefined;
  Otp: undefined;
  /** Authenticated section — hosts the bottom-tab navigator */
  MainTabs: undefined;
};

// ---------------------------------------------------------------------------
// Bottom-tab param list (authenticated screens)
// ---------------------------------------------------------------------------

export type MainTabParamList = {
  Markets: undefined;
  Services: undefined;
};

// ---------------------------------------------------------------------------
// Root stack — navigation prop helpers
// ---------------------------------------------------------------------------

export type LoginNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;
export type OtpNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Otp"
>;

// ---------------------------------------------------------------------------
// Root stack — route prop helpers
// ---------------------------------------------------------------------------

export type LoginRouteProp = RouteProp<RootStackParamList, "Login">;
export type OtpRouteProp = RouteProp<RootStackParamList, "Otp">;

// ---------------------------------------------------------------------------
// Root stack — composite screen-props types
// ---------------------------------------------------------------------------

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  "Login"
>;
export type OtpScreenProps = NativeStackScreenProps<RootStackParamList, "Otp">;

// ---------------------------------------------------------------------------
// Tab screens — composite screen-props types
// Each tab screen can also access the root stack navigator via CompositeScreenProps
// ---------------------------------------------------------------------------

export type MarketsScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Markets">,
  NativeStackScreenProps<RootStackParamList>
>;

export type ServicesScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Services">,
  NativeStackScreenProps<RootStackParamList>
>;

// ---------------------------------------------------------------------------
// Global type augmentation — enables useNavigation() without generic args
// ---------------------------------------------------------------------------

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}

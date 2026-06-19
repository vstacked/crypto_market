import * as React from "react";
import { TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";
import { useGetCountriesQuery, useLoginMutation } from "@/services/api";
import { FALLBACK_COUNTRY } from "@/components/CountryPickerModal";
import { normalizePhoneWithDialCode } from "@/utils/validators";
import { ApiResponse, Country, ErrorData } from "@/types/api";

interface ErrorType {
  field: "password" | "email" | "phone" | "unknown";
  message: string;
}

export interface FormGroup {
  identifier: string;
  password: string;
  setIdentifier: (value: string) => void;
  setPassword: (value: string) => void;
}

export interface MethodGroup {
  isEmail: boolean;
  changeMethod: () => void;
}

export interface CountryGroup {
  selectedCountry: Country;
  countries: Country[];
  isCountryModalVisible: boolean;
  openCountryModal: () => void;
  closeCountryModal: () => void;
  handleSelectCountry: (country: Country) => void;
}

export interface SecureGroup {
  secureText: boolean;
  toggleSecure: () => void;
}

export interface RefsGroup {
  refIdentifier: React.RefObject<TextInput | null>;
  refPassword: React.RefObject<TextInput | null>;
  focusPassword: () => void;
}

export interface AuthGroup {
  isLoading: boolean;
  error: ErrorType | undefined;
  handleLogin: () => Promise<void>;
}

export interface UseLoginFormReturn {
  form: FormGroup;
  method: MethodGroup;
  country: CountryGroup;
  secure: SecureGroup;
  refs: RefsGroup;
  auth: AuthGroup;
}

export function useLoginForm(): UseLoginFormReturn {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isEmail, setIsEmail] = React.useState(false);
  const [secureText, setSecureText] = React.useState(true);
  const [selectedCountry, setSelectedCountry] =
    React.useState<Country>(FALLBACK_COUNTRY);
  const [isCountryModalVisible, setIsCountryModalVisible] =
    React.useState(false);
  const [error, setError] = React.useState<ErrorType | undefined>(undefined);

  const refIdentifier = React.useRef<TextInput | null>(null);
  const refPassword = React.useRef<TextInput | null>(null);

  const { data: countryData } = useGetCountriesQuery(undefined, {
    skip: isEmail,
  });

  const [login, { isLoading }] = useLoginMutation();

  const countries: Country[] =
    countryData && countryData.length > 0 ? countryData : [FALLBACK_COUNTRY];

  const changeMethod = () => {
    setIsEmail((prev) => !prev);
    setIdentifier("");
    refIdentifier.current?.clear();
  };

  const toggleSecure = () => setSecureText((prev) => !prev);

  const focusPassword = () => refPassword.current?.focus();

  // ─── Modal Country handlers ────────────────────────────────────────────────────────

  const openCountryModal = () => setIsCountryModalVisible(true);
  const closeCountryModal = () => setIsCountryModalVisible(false);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    closeCountryModal();
  };

  const handleLogin = async () => {
    try {
      setError(undefined);

      if (isEmail) {
        const result = await login({ email: identifier, password }).unwrap();

        dispatch(
          setCredentials({
            user: {
              phone: result.data.phone,
              dialCode: selectedCountry.dial_code,
            },
            token: result.data.token,
            otp: result.data.otp,
          }),
        );
      } else {
        const mergedPhone = normalizePhoneWithDialCode(
          identifier,
          selectedCountry.dial_code,
        );

        const result = await login({ phone: mergedPhone, password }).unwrap();

        dispatch(
          setCredentials({
            user: {
              phone: mergedPhone,
              dialCode: selectedCountry.dial_code,
            },
            token: result.data.token,
            otp: result.data.otp,
          }),
        );
      }

      navigation.navigate("Otp");
    } catch (err: unknown) {
      const maybeApiError = err as {
        status?: number;
        data?: ApiResponse<ErrorData>;
      };
      if (maybeApiError.status) {
        const apiError = maybeApiError.data as ApiResponse<ErrorData>;
        setError({
          field: apiError.data.field as ErrorType["field"],
          message: apiError.message,
        });
      } else {
        setError({ field: "unknown", message: "Something went wrong!" });
      }
    }
  };

  return {
    form: { identifier, password, setIdentifier, setPassword },
    method: { isEmail, changeMethod },
    country: {
      selectedCountry,
      countries,
      isCountryModalVisible,
      openCountryModal,
      closeCountryModal,
      handleSelectCountry,
    },
    secure: { secureText, toggleSecure },
    refs: { refIdentifier, refPassword, focusPassword },
    auth: { isLoading, error, handleLogin },
  };
}

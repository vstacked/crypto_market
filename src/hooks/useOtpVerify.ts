import * as React from "react";
import { Alert } from "react-native";

import { useAppDispatch, useAppSelector } from "@/store";
import { formatPhoneWithDialCode } from "@/utils/validators";
import { useNavigation } from "@react-navigation/native";
import { useVerifyOtpMutation } from "@/services/api";
import { ApiResponse } from "@/types/api";
import { clearOtp } from "@/store/slices/authSlice";
import { saveUserToken } from "@/utils/secureStore";

export interface OtpGroup {
  code: string | undefined;
  value: string;
  setCode: (code: string) => void;
}

export interface PhoneGroup {
  formatted: string;
}

export interface ActionGroup {
  isLoading: boolean;
  goBack: () => void;
  handleVerifyOtp: () => Promise<void>;
}

export interface UseOtpVerifyReturn {
  otp: OtpGroup;
  phone: PhoneGroup;
  action: ActionGroup;
}

export function useOtpVerify(): UseOtpVerifyReturn {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { otp: storedOtp, user, token } = useAppSelector((state) => state.auth);

  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();

  const [code, setCode] = React.useState<string | undefined>();

  const formatted = React.useMemo(() => {
    if (!user) return "-";
    return formatPhoneWithDialCode(user.phone, user.dialCode);
  }, [user]);

  const goBack = () => navigation.goBack();

  const handleVerifyOtp = async () => {
    try {
      if (!user) return;

      const resolvedOtp = code ?? storedOtp ?? "";

      await verifyOtp({ phone: user.phone, otp: resolvedOtp }).unwrap();

      if (token !== null) saveUserToken(token);
      dispatch(clearOtp());
    } catch (err: unknown) {
      const maybeApiError = err as {
        status?: number;
        data?: ApiResponse<object>;
      };
      if (maybeApiError.status) {
        const apiError = maybeApiError.data as ApiResponse<object>;
        Alert.alert("Error Occured", apiError.message);
      } else {
        Alert.alert("Error Occured", "Something went wrong!");
      }
    }
  };

  return {
    otp: {
      code,
      value: code ?? storedOtp ?? "",
      setCode,
    },
    phone: {
      formatted,
    },
    action: {
      isLoading,
      goBack,
      handleVerifyOtp,
    },
  };
}

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import type {
  Country,
  CryptoMarketItem,
  ApiResponse,
  LoginData,
} from "@/types/api";
import { deleteUserToken } from "@/utils/secureStore";
import { clearToken } from "@/store/slices/authSlice";

type LoginPayload =
  | { email: string; password: string }
  | { phone: string; password: string };

interface VerifyOtpPayload {
  otp: string;
  phone: string;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("Authorization", token);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getCountries: builder.query<Country[], void>({
      query: () => "countries",
      transformResponse: (response: ApiResponse<Country[]>) => {
        return response.data;
      },
    }),
    login: builder.mutation<ApiResponse<LoginData>, LoginPayload>({
      query: (payload) => ({
        url: "auth/login",
        method: "POST",
        body: payload,
      }),
    }),
    verifyOtp: builder.mutation<ApiResponse<object>, VerifyOtpPayload>({
      query: (payload) => ({
        url: "auth/verify-otp",
        method: "POST",
        body: payload,
      }),
    }),
    getCryptoList: builder.query<ApiResponse<CryptoMarketItem[]>, void>({
      query: () => "list-crypto",
      transformErrorResponse: (response) => {
        if (response?.data) {
          const error = response?.data as ApiResponse<object>;
          return error.message;
        }
        return "Something went wrong!";
      },
      onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (err: unknown) {
          const maybeApiError = err as {
            error: {
              status?: number;
              data?: ApiResponse<object>;
            };
            meta?: {
              response?: {
                status?: number;
              };
            };
          };

          // Invalid or expired token, it'll be logout
          if (
            maybeApiError?.error?.status === 401 ||
            maybeApiError?.meta?.response?.status === 401
          ) {
            await deleteUserToken();
            dispatch(clearToken());
          }
        }
      },
    }),
    logout: builder.mutation<boolean, void>({
      queryFn: async (token, api) => {
        try {
          await deleteUserToken();
          api.dispatch(clearToken());

          return { data: true };
        } catch {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Failed to logout",
            },
          };
        }
      },
    }),
  }),
});

export const {
  useGetCountriesQuery,
  useLoginMutation,
  useVerifyOtpMutation,
  useGetCryptoListQuery,
  useLogoutMutation,
} = apiSlice;

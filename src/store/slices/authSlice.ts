import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  phone: string;
  dialCode: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  otp: string | null;
  isRestoringToken: boolean;
}

const initialState: AuthState = {
  token: null,
  user: null,
  otp: null,
  isRestoringToken: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        token: string;
        user: User;
        otp: string;
      }>,
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.otp = action.payload.otp;
    },
    setToken: (
      state,
      action: PayloadAction<{
        token: string;
      }>,
    ) => {
      state.token = action.payload.token;
    },
    setIsRestoringTokenDone: (state) => {
      state.isRestoringToken = false;
    },
    clearCredentials: (state) => {
      state.token = null;
      state.user = null;
      state.otp = null;
    },
    clearOtp: (state) => {
      state.otp = null;
    },
    clearToken: (state) => {
      state.token = null;
    },
  },
});

export const {
  setCredentials,
  setToken,
  setIsRestoringTokenDone,
  clearCredentials,
  clearOtp,
  clearToken,
} = authSlice.actions;
export default authSlice.reducer;

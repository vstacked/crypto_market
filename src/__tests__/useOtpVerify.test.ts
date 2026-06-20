/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * useOtpVerify.test.ts
 *
 * Unit test suite for the `useOtpVerify` custom hook.
 *
 * Mocking strategy
 * ─────────────────
 * The hook has five external dependencies mocked at the module boundary:
 *
 * 1. `@/store`                  — `useAppDispatch` and `useAppSelector` are
 *    mocked so we drive the Redux auth state without a real store.
 *
 * 2. `@react-navigation/native` — `useNavigation` is mocked with a jest.fn()
 *    `goBack` spy.
 *
 * 3. `@/services/api`           — `useVerifyOtpMutation` is mocked so we can
 *    resolve or reject the mutation without a network layer.
 *
 * 4. `@/store/slices/authSlice` — `clearOtp` is mocked to return a typed
 *    action object we can assert was passed to dispatch.
 *
 * 5. `@/utils/secureStore`      — `saveUserToken` is mocked so we can verify
 *    it is called with the token from the store without touching the filesystem.
 *
 * `@/utils/validators` (`formatPhoneWithDialCode`) is also mocked for
 * predictability in the `phone.formatted` tests.
 *
 * RNTL v14 note
 * ─────────────
 * `renderHook` is async in RNTL v14 and must be awaited.
 * State-update callbacks inside `act()` must also be awaited.
 *
 * Tests
 * ─────
 * Success path
 *  1.  Calls `saveUserToken` with the store token on a successful mutation.
 *  2.  Dispatches `clearOtp()` action after a successful mutation.
 *  3.  Does NOT call `saveUserToken` when the store token is null.
 *  4.  Still dispatches `clearOtp()` when token is null (cleanup always runs).
 *
 * OTP resolution
 *  5.  `otp.value` is the user-typed code when `code` state is set.
 *  6.  `otp.value` falls back to `storedOtp` when code is undefined.
 *  7.  `otp.value` is an empty string when both code and storedOtp are null.
 *  8.  `handleVerifyOtp` passes the resolved OTP to the mutation.
 *
 * Error handling
 *  9.  Shows `Alert.alert` with API message on a structured error (has status).
 *  10. Shows `Alert.alert` with fallback message on an unstructured error.
 *  11. Does NOT call `saveUserToken` or dispatch when mutation throws.
 *
 * Phone formatting
 *  12. `phone.formatted` returns formatted string when user exists.
 *  13. `phone.formatted` returns "-" when user is null.
 *
 * action.isLoading passthrough
 *  14. `action.isLoading` mirrors the mutation's `isLoading` flag.
 *
 * goBack handler
 *  15. `action.goBack` calls `navigation.goBack()`.
 *
 * Return shape
 *  16. Returns the expected shape with all required groups and keys.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useOtpVerify } from '@/hooks/useOtpVerify';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// IMPORTANT: jest.mock() factories are hoisted by Babel and CANNOT close over
// module-scope variables. Use require() inside the factory body.

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  useVerifyOtpMutation: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  clearOtp: jest.fn((payload?: unknown) => ({
    type: 'auth/clearOtp',
    payload,
  })),
}));

jest.mock('@/utils/secureStore', () => ({
  saveUserToken: jest.fn(),
}));

jest.mock('@/utils/validators', () => ({
  formatPhoneWithDialCode: jest.fn(
    (phone: string, dialCode: string) => `${dialCode}${phone}`,
  ),
}));

// ─── Typed references to mocked modules ──────────────────────────────────────

const mockUseAppDispatch = require('@/store').useAppDispatch as jest.Mock;
const mockUseAppSelector = require('@/store').useAppSelector as jest.Mock;
const mockUseNavigation =
  require('@react-navigation/native').useNavigation as jest.Mock;
const mockUseVerifyOtpMutation =
  require('@/services/api').useVerifyOtpMutation as jest.Mock;
const mockClearOtp =
  require('@/store/slices/authSlice').clearOtp as jest.Mock;
const mockSaveUserToken =
  require('@/utils/secureStore').saveUserToken as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER = { phone: '8515822603', dialCode: '+62' };
const MOCK_TOKEN = 'mock-jwt-token-xyz';
const MOCK_OTP = '123456';

/** Minimal auth state shape expected by `useAppSelector`. */
function buildAuthState(overrides?: {
  otp?: string | null;
  user?: { phone: string; dialCode: string } | null;
  token?: string | null;
}) {
  return {
    // Use hasOwnProperty so an explicit `null` override is preserved
    // (the `??` operator would coerce null to the default value).
    otp: overrides && Object.prototype.hasOwnProperty.call(overrides, 'otp')
      ? overrides.otp
      : MOCK_OTP,
    user: overrides && Object.prototype.hasOwnProperty.call(overrides, 'user')
      ? overrides.user
      : MOCK_USER,
    token: overrides && Object.prototype.hasOwnProperty.call(overrides, 'token')
      ? overrides.token
      : MOCK_TOKEN,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wires up all mocks with sensible defaults before each test.
 * Individual tests can override specific mocks as needed.
 */
function setupMocks({
  authState = buildAuthState(),
  mutationResult = Promise.resolve({ success: true, message: 'ok', data: {} }),
  isLoading = false,
}: {
  authState?: ReturnType<typeof buildAuthState>;
  mutationResult?: Promise<unknown>;
  isLoading?: boolean;
} = {}) {
  const mockDispatch = jest.fn();
  const mockGoBack = jest.fn();
  const mockVerifyOtpUnwrap = jest.fn(() => mutationResult);
  const mockVerifyOtp = jest.fn(() => ({ unwrap: mockVerifyOtpUnwrap }));

  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseAppSelector.mockImplementation(
    (selector: (state: { auth: typeof authState }) => unknown) =>
      selector({ auth: authState }),
  );
  mockUseNavigation.mockReturnValue({ goBack: mockGoBack });
  mockUseVerifyOtpMutation.mockReturnValue([mockVerifyOtp, { isLoading }]);

  return { mockDispatch, mockGoBack, mockVerifyOtp, mockVerifyOtpUnwrap };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('useOtpVerify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Success path ────────────────────────────────────────────────────────────

  // ── Test 1 ──────────────────────────────────────────────────────────────────

  it('calls saveUserToken with the store token on a successful mutation', async () => {
    setupMocks({ authState: buildAuthState({ token: MOCK_TOKEN }) });

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(mockSaveUserToken).toHaveBeenCalledTimes(1);
    expect(mockSaveUserToken).toHaveBeenCalledWith(MOCK_TOKEN);
  });

  // ── Test 2 ──────────────────────────────────────────────────────────────────

  it('dispatches clearOtp() after a successful mutation', async () => {
    const { mockDispatch } = setupMocks();

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    // clearOtp action creator must have been called and its result dispatched.
    expect(mockClearOtp).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth/clearOtp' }),
    );
  });

  // ── Test 3 ──────────────────────────────────────────────────────────────────

  it('does NOT call saveUserToken when the store token is null', async () => {
    setupMocks({ authState: buildAuthState({ token: null }) });

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(mockSaveUserToken).not.toHaveBeenCalled();
  });

  // ── Test 4 ──────────────────────────────────────────────────────────────────

  it('still dispatches clearOtp() when token is null (cleanup always runs)', async () => {
    const { mockDispatch } = setupMocks({
      authState: buildAuthState({ token: null }),
    });

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth/clearOtp' }),
    );
  });

  // ── OTP resolution ──────────────────────────────────────────────────────────

  // ── Test 5 ──────────────────────────────────────────────────────────────────

  it('otp.value reflects the user-typed code when setCode has been called', async () => {
    setupMocks({ authState: buildAuthState({ otp: MOCK_OTP }) });

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      result.current.otp.setCode('999888');
    });

    // code state takes priority over storedOtp.
    expect(result.current.otp.value).toBe('999888');
  });

  // ── Test 6 ──────────────────────────────────────────────────────────────────

  it('otp.value falls back to the stored OTP when code state is undefined', async () => {
    setupMocks({ authState: buildAuthState({ otp: MOCK_OTP }) });

    const { result } = await renderHook(() => useOtpVerify());

    // code is never set, so storedOtp is used.
    expect(result.current.otp.code).toBeUndefined();
    expect(result.current.otp.value).toBe(MOCK_OTP);
  });

  // ── Test 7 ──────────────────────────────────────────────────────────────────

  it('otp.value is an empty string when both code and storedOtp are absent', async () => {
    setupMocks({ authState: buildAuthState({ otp: null }) });

    const { result } = await renderHook(() => useOtpVerify());

    expect(result.current.otp.value).toBe('');
  });

  // ── Test 8 ──────────────────────────────────────────────────────────────────

  it('passes the resolved OTP (code ?? storedOtp ?? "") to the mutation payload', async () => {
    const { mockVerifyOtp } = setupMocks({
      authState: buildAuthState({ otp: MOCK_OTP }),
    });

    const { result } = await renderHook(() => useOtpVerify());

    // No code set — storedOtp (MOCK_OTP) is the resolved value.
    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: MOCK_USER.phone,
      otp: MOCK_OTP,
    });
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  // ── Test 9 ──────────────────────────────────────────────────────────────────

  it('shows Alert with the API error message on a structured error (has status)', async () => {
    const apiError = {
      status: 400,
      data: { success: false, message: 'Invalid OTP', data: {} },
    };

    const { mockVerifyOtpUnwrap } = setupMocks();
    mockVerifyOtpUnwrap.mockImplementation(() => Promise.reject(apiError));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith('Error Occured', 'Invalid OTP');

    alertSpy.mockRestore();
  });

  // ── Test 10 ─────────────────────────────────────────────────────────────────

  it('shows Alert with "Something went wrong!" on an unstructured error (no status)', async () => {
    const { mockVerifyOtpUnwrap } = setupMocks();
    mockVerifyOtpUnwrap.mockImplementation(() =>
      Promise.reject(new Error('Network Error')),
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith('Error Occured', 'Something went wrong!');

    alertSpy.mockRestore();
  });

  // ── Test 11 ─────────────────────────────────────────────────────────────────

  it('does NOT call saveUserToken or dispatch clearOtp when the mutation throws', async () => {
    const { mockDispatch, mockVerifyOtpUnwrap } = setupMocks();
    mockVerifyOtpUnwrap.mockImplementation(() =>
      Promise.reject({ status: 500, data: { message: 'Server error' } }),
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      await result.current.action.handleVerifyOtp();
    });

    expect(mockSaveUserToken).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ── Phone formatting ─────────────────────────────────────────────────────────

  // ── Test 12 ─────────────────────────────────────────────────────────────────

  it('phone.formatted returns the formatted number when user exists', async () => {
    setupMocks({
      authState: buildAuthState({ user: MOCK_USER }),
    });

    const { result } = await renderHook(() => useOtpVerify());

    // The mock implementation returns `${dialCode}${phone}`.
    expect(result.current.phone.formatted).toBe(
      `${MOCK_USER.dialCode}${MOCK_USER.phone}`,
    );
  });

  // ── Test 13 ─────────────────────────────────────────────────────────────────

  it('phone.formatted returns "-" when user is null', async () => {
    setupMocks({
      authState: buildAuthState({ user: null }),
    });

    const { result } = await renderHook(() => useOtpVerify());

    expect(result.current.phone.formatted).toBe('-');
  });

  // ── action.isLoading passthrough ─────────────────────────────────────────────

  // ── Test 14 ─────────────────────────────────────────────────────────────────

  it('action.isLoading mirrors the mutation isLoading flag', async () => {
    setupMocks({ isLoading: true });

    const { result } = await renderHook(() => useOtpVerify());

    expect(result.current.action.isLoading).toBe(true);
  });

  // ── goBack handler ───────────────────────────────────────────────────────────

  // ── Test 15 ─────────────────────────────────────────────────────────────────

  it('action.goBack calls navigation.goBack()', async () => {
    const { mockGoBack } = setupMocks();

    const { result } = await renderHook(() => useOtpVerify());

    await act(async () => {
      result.current.action.goBack();
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  // ── Return shape ─────────────────────────────────────────────────────────────

  // ── Test 16 ─────────────────────────────────────────────────────────────────

  it('returns the expected shape with all required groups and keys', async () => {
    setupMocks();

    const { result } = await renderHook(() => useOtpVerify());
    const { otp, phone, action } = result.current;

    // otp group
    expect(otp).toHaveProperty('code');
    expect(otp).toHaveProperty('value');
    expect(typeof otp.setCode).toBe('function');

    // phone group
    expect(phone).toHaveProperty('formatted');
    expect(typeof phone.formatted).toBe('string');

    // action group
    expect(action).toHaveProperty('isLoading');
    expect(typeof action.goBack).toBe('function');
    expect(typeof action.handleVerifyOtp).toBe('function');
  });
});

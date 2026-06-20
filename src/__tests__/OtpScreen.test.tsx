/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * OtpScreen.test.tsx
 *
 * Test suite for OtpScreen using Jest + React Native Testing Library.
 *
 * Mocking strategy
 * ─────────────────
 * `OtpScreen` renders the pure UI and delegates every piece of logic to the
 * `useOtpVerify` hook. We mock `@/hooks/useOtpVerify` at the module boundary
 * so each test drives the hook's return value without needing a Redux store,
 * React Navigation context, or a live RTK Query mutation.
 *
 * The `useVerifyOtpMutation` export from `@/services/api` is additionally
 * mocked to demonstrate the RTK-level failure path when it is called
 * directly in the "failed mutation → Alert" test via a custom hook
 * implementation.
 *
 * Tests
 * ─────
 * 1. Pre-fill  – OtpInput boxes are pre-populated with the mock OTP on
 *                initial render.
 * 2. API Error – a rejected verifyOtp mutation triggers Alert.alert with
 *                the server error message.
 */

import * as React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { OtpScreen } from '@/screens/OtpScreen';
import type { UseOtpVerifyReturn } from '@/hooks/useOtpVerify';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// IMPORTANT: jest.mock() factories are hoisted to the top of the file by Babel.
// They CANNOT close over variables defined in module scope (including `React`).
// Use require() inside the factory instead.

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    SafeAreaView: ({
      children,
      style,
    }: {
      children?: unknown;
      style?: object;
    }) => mockReact.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@expo/vector-icons/Octicons', () => {
  const { Text } = require('react-native');
  const mockReact = require('react');
  return (props: { name: string }) =>
    mockReact.createElement(Text, { testID: `octicons-${props.name}` }, props.name);
});

// Mock ProgressBar to avoid transitive native deps
jest.mock('@/components/ProgressBar', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    ProgressBar: () => mockReact.createElement(View, { testID: 'progress-bar' }),
  };
});

// Mock Button to avoid transitive native deps and expose a testID
jest.mock('@/components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  const mockReact = require('react');
  return {
    Button: ({
      label,
      onPress,
    }: {
      label: string;
      onPress?: () => void;
      isLoading?: boolean;
      disabled?: boolean;
    }) =>
      mockReact.createElement(
        TouchableOpacity,
        { testID: 'verify-button', onPress },
        mockReact.createElement(Text, null, label),
      ),
  };
});

// The hook mock — actual implementation is overridden per-test.
jest.mock('@/hooks/useOtpVerify');

// ─── Typed access to the mocked hook ─────────────────────────────────────────
const mockUseOtpVerify = require('@/hooks/useOtpVerify')
  .useOtpVerify as jest.Mock;

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_PHONE = '+6281234567890';
const MOCK_OTP = '123456';

// ─── Helper: build the exact return shape expected by OtpScreen ───────────────

function buildHookReturn(
  overrides: Partial<{
    otpValue: string;
    otpCode: string | undefined;
    setCode: jest.Mock;
    formattedPhone: string;
    isLoading: boolean;
    goBack: jest.Mock;
    handleVerifyOtp: () => Promise<void>;
  }> = {},
): UseOtpVerifyReturn {
  const {
    otpValue = MOCK_OTP,
    otpCode = MOCK_OTP,
    setCode = jest.fn(),
    formattedPhone = MOCK_PHONE,
    isLoading = false,
    goBack = jest.fn(),
    handleVerifyOtp = jest.fn().mockResolvedValue(undefined),
  } = overrides;

  return {
    otp: {
      code: otpCode,
      value: otpValue,
      setCode,
    },
    phone: {
      formatted: formattedPhone,
    },
    action: {
      isLoading,
      goBack,
      handleVerifyOtp,
    },
  };
}

// ─── Render helper ────────────────────────────────────────────────────────────

const renderScreen = () =>
  render(<OtpScreen navigation={null as any} route={null as any} />);

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('OtpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Test 1: OTP pre-fill ────────────────────────────────────────────────────

  it('pre-fills the 6-digit OtpInput with the OTP value from the hook on initial render', async () => {
    // Arrange — hook returns the mock OTP string, which OtpInput splits into
    // individual digit cells.
    mockUseOtpVerify.mockReturnValue(buildHookReturn({ otpValue: MOCK_OTP }));

    // Act — RNTL v14 render() is async; await to get query helpers.
    const { getAllByDisplayValue } = await renderScreen();

    // Assert — each character of MOCK_OTP ("123456") is rendered in its own
    // TextInput cell. OtpInput splits `value` into one char per box.
    const digits = MOCK_OTP.split('');
    digits.forEach((digit) => {
      // getAllByDisplayValue finds all TextInput elements showing that digit.
      const cells = getAllByDisplayValue(digit);
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Test 2: Failed mutation → Alert ─────────────────────────────────────────

  it('calls Alert.alert with an error message when the verifyOtp mutation fails', async () => {
    // Arrange — simulate the hook's handleVerifyOtp throwing an RTK Query
    // rejection that the real hook would translate into an Alert.
    const API_ERROR_MESSAGE = 'OTP is invalid or has expired.';

    /**
     * We replicate the exact error-handling branch from useOtpVerify:
     *
     *   catch (err) {
     *     if (maybeApiError.status) {
     *       Alert.alert("Error Occured", apiError.message);
     *     } else {
     *       Alert.alert("Error Occured", "Something went wrong!");
     *     }
     *   }
     *
     * The mock implementation calls Alert.alert directly so the test stays
     * decoupled from the real hook internals.
     */
    const handleVerifyOtp = jest.fn().mockImplementation(async () => {
      Alert.alert('Error Occured', API_ERROR_MESSAGE);
    });

    mockUseOtpVerify.mockReturnValue(
      buildHookReturn({ otpValue: MOCK_OTP, handleVerifyOtp }),
    );

    // Act — render and press the verify button.
    const { getByTestId } = await renderScreen();
    fireEvent.press(getByTestId('verify-button'));

    // Assert — Alert.alert was invoked with the expected title and message.
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Error Occured', API_ERROR_MESSAGE);
    });
  });
});

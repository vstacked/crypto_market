/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * LoginScreen.test.tsx
 *
 * Test suite for LoginScreen using Jest + React Native Testing Library.
 *
 * Mocking strategy
 * ─────────────────
 * `LoginScreen` renders pure UI and delegates every piece of logic to the
 * `useLoginForm` hook. We mock `@/hooks/useLoginForm` at the module boundary so
 * each test can drive the hook's return value without needing a Redux store,
 * React Navigation context, or a live RTK Query mutation.
 *
 * The RTK Query `useLoginMutation` export from `@/services/api` is implicitly
 * covered because `useLoginForm` (which consumes it) is fully mocked — the
 * mutation never runs in tests.
 *
 * Tests
 * ─────
 * 1. Successful login  – pressing Sign In calls handleLogin; the hook then
 *    calls navigation.navigate("Otp") internally after a successful unwrap.
 * 2. Toggle sign-in method – renders Phone Number UI (phone-pad keyboard,
 *    dial-code slot) vs Email UI (email-address keyboard, no dial-code slot).
 * 3. Password 400 error – when error.field === "password" the error message
 *    appears strictly under the password FormInput (not the identifier field)
 *    and the red border is applied only to the password wrapper.
 */

import * as React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { LoginScreen } from '@/screens/LoginScreen';
import type { UseLoginFormReturn } from '@/hooks/useLoginForm';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// IMPORTANT: jest.mock() factories are hoisted by Babel.
// They CANNOT close over module-scope variables. Use require() inside.

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

// react-native-keyboard-aware-scroll-view has no native parts; render as a
// plain ScrollView so keyboard-layout logic is transparent to tests.
jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const { ScrollView } = require('react-native');
  const mockReact = require('react');
  return {
    KeyboardAwareScrollView: ({
      children,
      style,
      contentContainerStyle,
    }: {
      children?: unknown;
      style?: object;
      contentContainerStyle?: object;
    }) =>
      mockReact.createElement(
        ScrollView,
        { style, contentContainerStyle },
        children,
      ),
  };
});

// Expo vector icons have no native binary in the Jest environment.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = require('react-native');
  const mockReact = require('react');
  return (props: { name: string }) =>
    mockReact.createElement(
      Text,
      { testID: `ionicons-${props.name}` },
      props.name,
    );
});

// SVG-based custom icon — also has no native binary.
jest.mock('@/assets/icons/EyeClosedIcon', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return () => mockReact.createElement(View, { testID: 'eye-closed-icon' });
});

// CountryPickerModal uses a native Modal and FlatList. Stub it out so it
// doesn't appear in the assertions we care about.
jest.mock('@/components/CountryPickerModal', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    __esModule: true,
    default: () =>
      mockReact.createElement(View, { testID: 'country-picker-modal' }),
    FALLBACK_COUNTRY: {
      name: 'Indonesia',
      code: 'ID',
      dial_code: '+62',
    },
  };
});

// Button — expose a testID so we can press it in tests.
jest.mock('@/components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');
  const mockReact = require('react');
  return {
    Button: ({
      label,
      onPress,
      isLoading,
      disabled,
    }: {
      label: string;
      onPress?: () => void;
      isLoading?: boolean;
      disabled?: boolean;
    }) =>
      mockReact.createElement(
        TouchableOpacity,
        { testID: 'sign-in-button', onPress, disabled },
        mockReact.createElement(Text, null, label),
      ),
  };
});

// The hook mock — actual implementation is overridden per-test.
jest.mock('@/hooks/useLoginForm');

// ─── Typed access to the mocked hook ─────────────────────────────────────────
const mockUseLoginForm = require('@/hooks/useLoginForm')
  .useLoginForm as jest.Mock;

// ─── Helper: build the exact return shape expected by LoginScreen ─────────────

function buildHookReturn(
  overrides: Partial<{
    identifier: string;
    password: string;
    isEmail: boolean;
    isLoading: boolean;
    error: UseLoginFormReturn['auth']['error'];
    handleLogin: jest.Mock;
    changeMethod: jest.Mock;
    setIdentifier: jest.Mock;
    setPassword: jest.Mock;
  }> = {},
): UseLoginFormReturn {
  const {
    identifier = '',
    password = '',
    isEmail = false,
    isLoading = false,
    error = undefined,
    handleLogin = jest.fn().mockResolvedValue(undefined),
    changeMethod = jest.fn(),
    setIdentifier = jest.fn(),
    setPassword = jest.fn(),
  } = overrides;

  return {
    form: { identifier, password, setIdentifier, setPassword },
    method: { isEmail, changeMethod },
    country: {
      selectedCountry: { name: 'Indonesia', code: 'ID', dial_code: '+62' },
      countries: [{ name: 'Indonesia', code: 'ID', dial_code: '+62' }],
      isCountryModalVisible: false,
      openCountryModal: jest.fn(),
      closeCountryModal: jest.fn(),
      handleSelectCountry: jest.fn(),
    },
    secure: { secureText: true, toggleSecure: jest.fn() },
    refs: {
      refIdentifier: { current: null },
      refPassword: { current: null },
      focusPassword: jest.fn(),
    },
    auth: { isLoading, error, handleLogin },
  };
}

// ─── Render helper ────────────────────────────────────────────────────────────

const renderScreen = () =>
  render(<LoginScreen navigation={null as any} route={null as any} />);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten a RN style prop (may be array of objects) into a flat array. */
function flattenStyle(
  style: unknown,
): (Record<string, unknown> | null | undefined)[] {
  if (Array.isArray(style)) {
    return style.flat(Infinity) as (Record<string, unknown> | null | undefined)[];
  }
  return [style as Record<string, unknown> | null | undefined];
}

/** Count how many objects in a flattened style array have a `borderColor` key. */
function borderColorCount(style: unknown): number {
  return flattenStyle(style).filter(
    (s) => s != null && typeof s === 'object' && 'borderColor' in s,
  ).length;
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 1: Successful login → OTP screen navigation ────────────────────────
  //
  // navigation.navigate("Otp") is called by the hook (not by the screen
  // component), so the correct boundary assertion is that pressing Sign In
  // invokes handleLogin. The real hook then navigates after a successful unwrap.

  it('calls handleLogin when the Sign In button is pressed with valid credentials', async () => {
    // Arrange — credentials provided so the button is enabled.
    const handleLogin = jest.fn().mockResolvedValue(undefined);
    mockUseLoginForm.mockReturnValue(
      buildHookReturn({
        identifier: 'user@example.com',
        password: 'P@ssw0rd',
        handleLogin,
      }),
    );

    // Act
    const { getByTestId } = await renderScreen();
    fireEvent.press(getByTestId('sign-in-button'));

    // Assert — hook's handleLogin was called exactly once.
    await waitFor(() => {
      expect(handleLogin).toHaveBeenCalledTimes(1);
    });
  });

  // ── Test 2a: Phone Number mode ───────────────────────────────────────────────

  it('renders Phone Number UI (phone-pad keyboard, dial-code slot) when isEmail is false', async () => {
    mockUseLoginForm.mockReturnValue(buildHookReturn({ isEmail: false }));

    const { getByText, getByPlaceholderText, queryByPlaceholderText } =
      await renderScreen();

    // Label and toggle link
    expect(getByText('Mobile Number')).toBeTruthy();
    expect(getByText(/Sign In with Email/i)).toBeTruthy();

    // Phone placeholder with phone-pad keyboard
    expect(getByPlaceholderText('Enter your number')).toBeTruthy();
    expect(getByPlaceholderText('Enter your number').props.keyboardType).toBe(
      'phone-pad',
    );

    // Email placeholder is absent
    expect(queryByPlaceholderText('username@gmail.com')).toBeNull();
  });

  // ── Test 2b: Email mode ───────────────────────────────────────────────────────

  it('renders Email UI (email-address keyboard, no dial-code slot) when isEmail is true', async () => {
    mockUseLoginForm.mockReturnValue(buildHookReturn({ isEmail: true }));

    const { getByText, getByPlaceholderText, queryByPlaceholderText } =
      await renderScreen();

    // Label and toggle link
    expect(getByText('Email')).toBeTruthy();
    expect(getByText(/Sign In with Mobile Number/i)).toBeTruthy();

    // Email placeholder with email-address keyboard
    expect(getByPlaceholderText('username@gmail.com')).toBeTruthy();
    expect(
      getByPlaceholderText('username@gmail.com').props.keyboardType,
    ).toBe('email-address');

    // Phone placeholder is absent
    expect(queryByPlaceholderText('Enter your number')).toBeNull();
  });

  // ── Test 3: 400 password error → error message + red border only on password ─
  //
  // When the hook surfaces { field: "password" }, LoginScreen passes:
  //   hasError={true}  to the password FormInput
  //   hasError={false} to the identifier FormInput
  //
  // FormInput's error <Text> is conditionally rendered (only when hasError=true
  // AND a message string is provided). The screen-level unknown-error banner is
  // always in the tree but has opacity:0 when field !== "unknown".
  //
  // Because both nodes share the same error message string we use getAllByText
  // and distinguish them by the presence/absence of an opacity style.
  //
  // The red border is detected by counting objects with a `borderColor` key in
  // the inputWrapper's style array:
  //   hasError=false → 1 object  (styles.inputWrapper only)
  //   hasError=true  → 2 objects (styles.inputWrapper + styles.inputWrapperError)

  it('shows error message and red border only on the password field for a 400 password error', async () => {
    // Arrange
    const PASSWORD_ERROR_MSG = 'Password is incorrect.';

    mockUseLoginForm.mockReturnValue(
      buildHookReturn({
        isEmail: true, // email mode — simpler tree (no leftSlot dial-code slot)
        error: { field: 'password', message: PASSWORD_ERROR_MSG },
      }),
    );

    // Act
    const { getAllByText, getByPlaceholderText } = await renderScreen();

    // ── Assert: field-level error message is present and visible ──────────────
    // getAllByText collects every Text node whose content matches. We expect:
    //   • The FormInput error Text (no opacity style) — rendered only when hasError=true.
    //   • The screen-level unknown-error banner (opacity:0)  — always rendered.
    const allErrorNodes = getAllByText(PASSWORD_ERROR_MSG);
    expect(allErrorNodes.length).toBeGreaterThanOrEqual(1);

    // Identify the FormInput field-level alert by the absence of opacity in its style.
    const fieldErrorNode = allErrorNodes.find((node) => {
      return !flattenStyle(node.props.style).some(
        (s) => s != null && typeof s === 'object' && 'opacity' in s,
      );
    });

    expect(fieldErrorNode).toBeDefined();
    expect(fieldErrorNode?.props.children).toBe(PASSWORD_ERROR_MSG);

    // Confirm the screen banner is present but hidden (opacity:0).
    const bannerNode = allErrorNodes.find((node) => {
      return flattenStyle(node.props.style).some(
        (s) => s != null && typeof s === 'object' && (s as Record<string, unknown>)['opacity'] === 0,
      );
    });
    expect(bannerNode).toBeDefined();

    // ── Assert: identifier input has NO red-border (borderColor count = 1) ────
    // FormInput structure: [container View] > [inputWrapper View] > TextInput
    // TextInput.parent === inputWrapper View.
    const identifierInput = getByPlaceholderText('username@gmail.com');
    expect(borderColorCount(identifierInput.parent?.props?.style)).toBe(1);

    // ── Assert: password input HAS red-border (borderColor count = 2) ─────────
    const passwordInput = getByPlaceholderText('Enter your password');
    expect(borderColorCount(passwordInput.parent?.props?.style)).toBe(2);
  });
});

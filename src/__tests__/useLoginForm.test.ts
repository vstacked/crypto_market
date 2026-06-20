/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * useLoginForm.test.ts
 *
 * Unit test suite for the `useLoginForm` custom hook.
 *
 * Mocking strategy
 * ─────────────────
 * The hook has four external dependencies mocked at the module boundary:
 *
 * 1. `@/services/api`           — `useGetCountriesQuery` and `useLoginMutation`
 *    are mocked so we drive return values without a network or Redux layer.
 *
 * 2. `@/store`                  — `useAppDispatch` is mocked to intercept
 *    `setCredentials` dispatch calls without a real Redux store.
 *
 * 3. `@react-navigation/native` — `useNavigation` is mocked with a jest.fn()
 *    `navigate` spy to assert post-login navigation.
 *
 * 4. `@/components/CountryPickerModal` — re-exports `FALLBACK_COUNTRY` so the
 *    hook's initial state is predictable inside tests.
 *
 * RNTL v14 note
 * ─────────────
 * `renderHook` is async in RNTL v14 and must be awaited.
 * State-update callbacks inside `act()` must also be awaited.
 *
 * Tests
 * ─────
 * Method-toggle group
 *  1.  Default method is phone  — `isEmail` starts as false.
 *  2.  changeMethod toggles to email  — flips isEmail → true.
 *  3.  changeMethod toggles back to phone — flips isEmail → false.
 *  4.  changeMethod clears identifier  — resets the text field.
 *
 * handleLogin — email branch (discriminated union)
 *  5.  Email payload shape — login called with { email, password }.
 *  6.  Email success dispatches setCredentials correctly.
 *  7.  Email success navigates to "Otp".
 *
 * handleLogin — phone branch (discriminated union)
 *  8.  Phone payload shape — login called with { phone, password }.
 *  9.  Phone number is normalized (dial-code merged, leading-0 stripped).
 *  10. Phone success dispatches setCredentials with mergedPhone.
 *  11. Phone success navigates to "Otp".
 *
 * handleLogin — error handling
 *  12. API error (has status) sets field + message on auth.error.
 *  13. Unknown error sets field="unknown" fallback message.
 *  14. Successful call clears a pre-existing error.
 *
 * Country modal handlers
 *  15. openCountryModal sets isCountryModalVisible to true.
 *  16. closeCountryModal sets isCountryModalVisible to false.
 *  17. handleSelectCountry updates selectedCountry and closes modal.
 *
 * Secure text toggle
 *  18. toggleSecure flips secureText true → false → true.
 *
 * Return shape
 *  19. Return shape — all documented groups/keys are present.
 */

import { renderHook, act } from '@testing-library/react-native';

import { useLoginForm } from '@/hooks/useLoginForm';
import type { Country, ApiResponse, LoginData } from '@/types/api';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// IMPORTANT: jest.mock() factories are hoisted by Babel and CANNOT close over
// module-scope variables. Use require() inside the factory body.

jest.mock('@/store', () => ({
  useAppDispatch: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('@/services/api', () => ({
  useGetCountriesQuery: jest.fn(),
  useLoginMutation: jest.fn(),
}));

jest.mock('@/store/slices/authSlice', () => ({
  setCredentials: jest.fn((payload) => ({ type: 'auth/setCredentials', payload })),
}));

jest.mock('@/components/CountryPickerModal', () => ({
  FALLBACK_COUNTRY: {
    name: 'Indonesia',
    code: 'ID',
    dial_code: '+62',
  },
}));

// ─── Typed references to mocked modules ──────────────────────────────────────

const mockUseAppDispatch = require('@/store').useAppDispatch as jest.Mock;
const mockUseNavigation = require('@react-navigation/native').useNavigation as jest.Mock;
const mockUseGetCountriesQuery = require('@/services/api').useGetCountriesQuery as jest.Mock;
const mockUseLoginMutation = require('@/services/api').useLoginMutation as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_FALLBACK_COUNTRY: Country = {
  name: 'Indonesia',
  code: 'ID',
  dial_code: '+62',
};

const MOCK_BRAZIL_COUNTRY: Country = {
  name: 'Brazil',
  code: 'BR',
  dial_code: '+55',
};

function buildLoginSuccess(
  overrides?: Partial<LoginData>,
): ApiResponse<LoginData> {
  return {
    success: true,
    message: 'Login successful',
    data: {
      token: 'mock-token-xyz',
      otp: '123456',
      phone: '628515822603',
      ...overrides,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Wires up all mocks with sensible defaults before each test.
 * Individual tests can override specific mocks as needed.
 */
function setupMocks({
  loginResult = Promise.resolve(buildLoginSuccess()),
  countries = [],
}: {
  loginResult?: Promise<ApiResponse<LoginData>>;
  countries?: Country[];
} = {}) {
  const mockDispatch = jest.fn();
  const mockNavigate = jest.fn();
  const mockLoginUnwrap = jest.fn(() => loginResult);
  const mockLogin = jest.fn(() => ({ unwrap: mockLoginUnwrap }));

  mockUseAppDispatch.mockReturnValue(mockDispatch);
  mockUseNavigation.mockReturnValue({ navigate: mockNavigate });
  mockUseLoginMutation.mockReturnValue([mockLogin, { isLoading: false }]);
  mockUseGetCountriesQuery.mockReturnValue({ data: countries });

  return { mockDispatch, mockNavigate, mockLogin, mockLoginUnwrap };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('useLoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Method-toggle group ─────────────────────────────────────────────────────

  // ── Test 1 ──────────────────────────────────────────────────────────────────

  it('starts with isEmail = false (phone method is the default)', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());

    expect(result.current.method.isEmail).toBe(false);
  });

  // ── Test 2 ──────────────────────────────────────────────────────────────────

  it('changeMethod toggles isEmail from false → true', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());
    expect(result.current.method.isEmail).toBe(false);

    await act(async () => {
      result.current.method.changeMethod();
    });

    expect(result.current.method.isEmail).toBe(true);
  });

  // ── Test 3 ──────────────────────────────────────────────────────────────────

  it('changeMethod toggles isEmail from true → false on second call', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.method.changeMethod(); // false → true
    });
    expect(result.current.method.isEmail).toBe(true);

    await act(async () => {
      result.current.method.changeMethod(); // true → false
    });
    expect(result.current.method.isEmail).toBe(false);
  });

  // ── Test 4 ──────────────────────────────────────────────────────────────────

  it('changeMethod resets identifier to an empty string', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());

    // Set a non-empty identifier first.
    await act(async () => {
      result.current.form.setIdentifier('user@example.com');
    });
    expect(result.current.form.identifier).toBe('user@example.com');

    await act(async () => {
      result.current.method.changeMethod();
    });

    // Identifier must be cleared after the method switch.
    expect(result.current.form.identifier).toBe('');
  });

  // ── handleLogin — email branch ──────────────────────────────────────────────

  // ── Test 5 ──────────────────────────────────────────────────────────────────

  it('calls login() with { email, password } discriminated union when isEmail=true', async () => {
    const { mockLogin } = setupMocks();
    const { result } = await renderHook(() => useLoginForm());

    // Switch to email method.
    await act(async () => {
      result.current.method.changeMethod();
    });

    // Set credentials.
    await act(async () => {
      result.current.form.setIdentifier('user@example.com');
      result.current.form.setPassword('secret123');
    });

    await act(async () => {
      await result.current.auth.handleLogin();
    });

    // Verify the discriminated union shape — must have `email`, NOT `phone`.
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(mockLogin).not.toHaveBeenCalledWith(
      expect.objectContaining({ phone: expect.anything() }),
    );
  });

  // ── Test 6 ──────────────────────────────────────────────────────────────────

  it('dispatches setCredentials with correct shape after a successful email login', async () => {
    const loginData = buildLoginSuccess({ phone: '628515822603', token: 'tok-abc', otp: '654321' });
    const { mockDispatch } = setupMocks({ loginResult: Promise.resolve(loginData) });

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.method.changeMethod(); // → email
    });
    await act(async () => {
      result.current.form.setIdentifier('user@example.com');
      result.current.form.setPassword('secret123');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          user: {
            phone: loginData.data.phone,
            dialCode: MOCK_FALLBACK_COUNTRY.dial_code,
          },
          token: loginData.data.token,
          otp: loginData.data.otp,
        },
      }),
    );
  });

  // ── Test 7 ──────────────────────────────────────────────────────────────────

  it('navigates to "Otp" after a successful email login', async () => {
    const { mockNavigate } = setupMocks();
    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.method.changeMethod();
    });
    await act(async () => {
      result.current.form.setIdentifier('user@example.com');
      result.current.form.setPassword('pass');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Otp');
  });

  // ── handleLogin — phone branch ──────────────────────────────────────────────

  // ── Test 8 ──────────────────────────────────────────────────────────────────

  it('calls login() with { phone, password } discriminated union when isEmail=false', async () => {
    const { mockLogin } = setupMocks();
    const { result } = await renderHook(() => useLoginForm());

    // Default state is phone; no need to call changeMethod.
    await act(async () => {
      result.current.form.setIdentifier('08515822603');
      result.current.form.setPassword('secret123');
    });

    await act(async () => {
      await result.current.auth.handleLogin();
    });

    // Verify the discriminated union shape — must have `phone`, NOT `email`.
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: expect.any(String),
        password: 'secret123',
      }),
    );
    expect(mockLogin).not.toHaveBeenCalledWith(
      expect.objectContaining({ email: expect.anything() }),
    );
  });

  // ── Test 9 ──────────────────────────────────────────────────────────────────

  it('normalizes the phone number by stripping leading 0 and prepending the dial code', async () => {
    const { mockLogin } = setupMocks();
    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      // Input: "08515822603" with default dial_code "+62"
      // Expected: "628515822603"
      result.current.form.setIdentifier('08515822603');
      result.current.form.setPassword('pass');
    });

    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(mockLogin).toHaveBeenCalledWith({
      phone: '628515822603',
      password: 'pass',
    });
  });

  // ── Test 10 ─────────────────────────────────────────────────────────────────

  it('dispatches setCredentials with the normalized phone after a successful phone login', async () => {
    const mergedPhone = '628515822603';
    const loginData = buildLoginSuccess({ phone: mergedPhone, token: 'tok-xyz', otp: '111222' });
    const { mockDispatch } = setupMocks({ loginResult: Promise.resolve(loginData) });

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.form.setIdentifier('08515822603');
      result.current.form.setPassword('pass');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: {
          user: {
            phone: mergedPhone,
            dialCode: MOCK_FALLBACK_COUNTRY.dial_code,
          },
          token: loginData.data.token,
          otp: loginData.data.otp,
        },
      }),
    );
  });

  // ── Test 11 ─────────────────────────────────────────────────────────────────

  it('navigates to "Otp" after a successful phone login', async () => {
    const { mockNavigate } = setupMocks();
    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.form.setIdentifier('08515822603');
      result.current.form.setPassword('pass');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Otp');
  });

  // ── handleLogin — error handling ────────────────────────────────────────────

  // ── Test 12 ─────────────────────────────────────────────────────────────────

  it('sets auth.error with field and message when the API returns a structured error', async () => {
    const apiError = {
      status: 400,
      data: {
        success: false,
        message: 'Invalid password',
        data: { field: 'password' },
      },
    };
    const { mockLoginUnwrap } = setupMocks();
    // Override unwrap to reject so the hook's catch block fires.
    mockLoginUnwrap.mockImplementation(() => Promise.reject(apiError));

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.method.changeMethod(); // → email
    });
    await act(async () => {
      result.current.form.setIdentifier('user@example.com');
      result.current.form.setPassword('wrongpass');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(result.current.auth.error).toEqual({
      field: 'password',
      message: 'Invalid password',
    });
  });

  // ── Test 13 ─────────────────────────────────────────────────────────────────

  it('sets auth.error with field="unknown" when the thrown error has no status', async () => {
    const { mockLoginUnwrap } = setupMocks();
    mockLoginUnwrap.mockImplementation(() =>
      Promise.reject(new Error('Network Error')),
    );

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.form.setIdentifier('08515822603');
      result.current.form.setPassword('pass');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(result.current.auth.error).toEqual({
      field: 'unknown',
      message: 'Something went wrong!',
    });
  });

  // ── Test 14 ─────────────────────────────────────────────────────────────────

  it('clears a pre-existing auth.error on a subsequent successful login', async () => {
    // First call: fail.
    const { mockLoginUnwrap } = setupMocks();
    mockLoginUnwrap.mockImplementationOnce(() =>
      Promise.reject(new Error('Network Error')),
    );

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.form.setIdentifier('08515822603');
      result.current.form.setPassword('pass');
    });
    await act(async () => {
      await result.current.auth.handleLogin();
    });
    expect(result.current.auth.error).toBeDefined();

    // Second call: succeed — error must be cleared.
    mockLoginUnwrap.mockImplementationOnce(() =>
      Promise.resolve(buildLoginSuccess()),
    );
    await act(async () => {
      await result.current.auth.handleLogin();
    });

    expect(result.current.auth.error).toBeUndefined();
  });

  // ── Country modal handlers ──────────────────────────────────────────────────

  // ── Test 15 ─────────────────────────────────────────────────────────────────

  it('openCountryModal sets isCountryModalVisible to true', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());
    expect(result.current.country.isCountryModalVisible).toBe(false);

    await act(async () => {
      result.current.country.openCountryModal();
    });

    expect(result.current.country.isCountryModalVisible).toBe(true);
  });

  // ── Test 16 ─────────────────────────────────────────────────────────────────

  it('closeCountryModal sets isCountryModalVisible back to false', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());

    await act(async () => {
      result.current.country.openCountryModal();
    });
    expect(result.current.country.isCountryModalVisible).toBe(true);

    await act(async () => {
      result.current.country.closeCountryModal();
    });
    expect(result.current.country.isCountryModalVisible).toBe(false);
  });

  // ── Test 17 ─────────────────────────────────────────────────────────────────

  it('handleSelectCountry updates selectedCountry and closes the modal', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());

    // Open modal first.
    await act(async () => {
      result.current.country.openCountryModal();
    });
    expect(result.current.country.isCountryModalVisible).toBe(true);

    // Select a different country.
    await act(async () => {
      result.current.country.handleSelectCountry(MOCK_BRAZIL_COUNTRY);
    });

    expect(result.current.country.selectedCountry).toEqual(MOCK_BRAZIL_COUNTRY);
    expect(result.current.country.isCountryModalVisible).toBe(false);
  });

  // ── Secure text toggle ──────────────────────────────────────────────────────

  // ── Test 18 ─────────────────────────────────────────────────────────────────

  it('toggleSecure flips secureText: true → false → true', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());
    expect(result.current.secure.secureText).toBe(true);

    await act(async () => {
      result.current.secure.toggleSecure();
    });
    expect(result.current.secure.secureText).toBe(false);

    await act(async () => {
      result.current.secure.toggleSecure();
    });
    expect(result.current.secure.secureText).toBe(true);
  });

  // ── Return shape ────────────────────────────────────────────────────────────

  // ── Test 19 ─────────────────────────────────────────────────────────────────

  it('returns the expected shape with all required groups and keys', async () => {
    setupMocks();

    const { result } = await renderHook(() => useLoginForm());
    const { form, method, country, secure, refs, auth } = result.current;

    // form group
    expect(form).toHaveProperty('identifier');
    expect(form).toHaveProperty('password');
    expect(typeof form.setIdentifier).toBe('function');
    expect(typeof form.setPassword).toBe('function');

    // method group
    expect(method).toHaveProperty('isEmail');
    expect(typeof method.changeMethod).toBe('function');

    // country group
    expect(country).toHaveProperty('selectedCountry');
    expect(country).toHaveProperty('countries');
    expect(country).toHaveProperty('isCountryModalVisible');
    expect(typeof country.openCountryModal).toBe('function');
    expect(typeof country.closeCountryModal).toBe('function');
    expect(typeof country.handleSelectCountry).toBe('function');

    // secure group
    expect(secure).toHaveProperty('secureText');
    expect(typeof secure.toggleSecure).toBe('function');

    // refs group
    expect(refs).toHaveProperty('refIdentifier');
    expect(refs).toHaveProperty('refPassword');
    expect(typeof refs.focusPassword).toBe('function');

    // auth group
    expect(auth).toHaveProperty('isLoading');
    expect(auth).toHaveProperty('error');
    expect(typeof auth.handleLogin).toBe('function');
  });
});

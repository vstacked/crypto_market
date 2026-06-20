/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * MarketScreen.test.tsx
 *
 * Test suite for MarketScreen using Jest + React Native Testing Library.
 *
 * Mocking strategy
 * ─────────────────
 * `MarketScreen` consumes `useMarketList`, which wraps `useGetCryptoListQuery`
 * internally. We mock `@/hooks/useMarketList` at the module boundary so every
 * test can drive the hook's return value without setting up a Redux store or
 * hitting the network.
 *
 * Tests
 * ─────
 * 1. Happy path   – both coin cards render correctly.
 * 2. Favorites tab – tapping the tab calls the filter handler with "Favorites".
 * 3. Empty search  – keyword present + empty data shows the "couldn't find" text.
 */

import * as React from 'react';
import { Animated } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { MarketScreen } from '@/screens/MarketScreen';
import type { CryptoMarketItem } from '@/types/api';
import type { FilterType } from '@/types/market';

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

jest.mock('@expo/vector-icons/Feather', () => {
  const { Text } = require('react-native');
  const mockReact = require('react');
  return (props: { name: string }) =>
    mockReact.createElement(Text, { testID: `feather-${props.name}` }, props.name);
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { Text } = require('react-native');
  const mockReact = require('react');
  return (props: { name: string }) =>
    mockReact.createElement(Text, { testID: `antdesign-${props.name}` }, props.name);
});

jest.mock('@/components/CoinIcon', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    CoinIcon: () => mockReact.createElement(View, { testID: 'coin-icon' }),
  };
});

// The hook mock — the actual implementation will be overridden in each test.
jest.mock('@/hooks/useMarketList');

// ─── Typed access to the mocked hook ─────────────────────────────────────────
const mockUseMarketList = require('@/hooks/useMarketList')
  .useMarketList as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_BITCOIN: CryptoMarketItem = {
  id: 'btc',
  name: 'Bitcoin',
  symbol: 'BTC',
  price_idr: 1_600_000_000,
  change_percent: 2.5,
  isPositive: true,
  hot: true,
  isFavorite: true,
  type: 'cryptocurrency',
};

const MOCK_ETHEREUM: CryptoMarketItem = {
  id: 'eth',
  name: 'Ethereum',
  symbol: 'ETH',
  price_idr: 55_000_000,
  change_percent: -1.2,
  isPositive: false,
  hot: false,
  isFavorite: false,
  type: 'cryptocurrency',
};

const ALL_COINS: CryptoMarketItem[] = [MOCK_BITCOIN, MOCK_ETHEREUM];

// ─── Helper: build the exact return shape expected by MarketScreen ────────────

function buildHookReturn(
  overrides: {
    memoizedData?: CryptoMarketItem[];
    keyword?: string;
    activeFilter?: FilterType;
    isFetching?: boolean;
    errorMessage?: string | undefined;
    setKeyword?: jest.Mock;
    handleFilterChange?: jest.Mock;
  } = {},
) {
  const {
    memoizedData = ALL_COINS,
    keyword = '',
    activeFilter = 'All',
    isFetching = false,
    errorMessage = undefined,
    setKeyword = jest.fn(),
    handleFilterChange = jest.fn(),
  } = overrides;

  return {
    data: { memoizedData, isFetching, refetch: jest.fn(), errorMessage },
    tabs: {
      activeFilter,
      canScroll: false,
      indicatorPosition: new Animated.Value(0),
      indicatorWidth: new Animated.Value(60),
    },
    list: { keyword, activeCard: undefined },
    handlers: {
      setKeyword,
      handleFilterChange,
      handleCardPress: jest.fn(),
      handleMeasurement: jest.fn(),
      handleContentSizeChange: jest.fn(),
    },
  };
}

// ─── Render helper ────────────────────────────────────────────────────────────
// RNTL v14 `render()` is async — always await it to get the query helpers.

const renderScreen = () =>
  render(<MarketScreen navigation={null as any} route={null as any} />);

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('MarketScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 1: Happy path ──────────────────────────────────────────────────────

  it('renders a list of crypto cards when data is available', async () => {
    // Arrange
    mockUseMarketList.mockReturnValue(buildHookReturn());

    // Act — RNTL v14 render() is async; await to get query helpers.
    const { getByText, queryByText } = await renderScreen();

    // Assert — both coin symbols are rendered as card labels.
    expect(getByText(/BTC/)).toBeTruthy();
    expect(getByText(/ETH/)).toBeTruthy();

    // Screen heading is present.
    expect(getByText('Market')).toBeTruthy();

    // No empty-state copy should appear.
    expect(queryByText(/couldn't find/i)).toBeNull();
  });

  // ── Test 2: Favorites tab ───────────────────────────────────────────────────

  it('calls handleFilterChange with "Favorites" when the Favorites tab is pressed', async () => {
    // Arrange
    const handleFilterChange = jest.fn();
    mockUseMarketList.mockReturnValue(buildHookReturn({ handleFilterChange }));

    // Act
    const { getByText } = await renderScreen();
    fireEvent.press(getByText('Favorites'));

    // Assert — the filter handler was invoked with the correct argument.
    expect(handleFilterChange).toHaveBeenCalledTimes(1);
    expect(handleFilterChange).toHaveBeenCalledWith('Favorites');
  });

  // ── Test 3: Empty search state ──────────────────────────────────────────────

  it("shows the \"couldn't find\" empty state when the search keyword returns no results", async () => {
    // Arrange — hook returns an empty list + a non-empty keyword so that
    // MarketListEmpty renders the "We couldn't find …" message.
    mockUseMarketList.mockReturnValue(
      buildHookReturn({
        memoizedData: [],
        keyword: 'xyznonexistentcoin',
      }),
    );

    // Act
    const { getByText, queryByText } = await renderScreen();

    // Assert — the empty-state copy from <MarketListEmpty> is visible.
    expect(getByText(/couldn't find/i)).toBeTruthy();
    expect(getByText(/xyznonexistentcoin/i)).toBeTruthy();

    // No crypto card symbols should be present.
    expect(queryByText(/BTC/)).toBeNull();
    expect(queryByText(/ETH/)).toBeNull();
  });
});

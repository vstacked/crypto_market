/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * useMarketList.test.ts
 *
 * Unit test suite for the `useMarketList` custom hook.
 *
 * Mocking strategy
 * ─────────────────
 * The hook has two external dependencies mocked at the module boundary:
 *
 * 1. `@/services/api` — `useGetCryptoListQuery` is mocked so we drive the API
 *    return value (data, isFetching, isError, error) without a Redux store or
 *    network layer.
 *
 * 2. `@/hooks/useTabBarIndicator` — mocked with stable Animated values and
 *    no-op callbacks to keep assertions focused on filtering logic only.
 *
 * RNTL v14 note
 * ─────────────
 * `renderHook` is async in RNTL v14 (it returns a Promise) and must be
 * awaited.  State-update callbacks inside `act()` must also be awaited so that
 * React flushes effects and the `result.current` ref (a React.createRef) is
 * populated before assertions run.
 *
 * Tests
 * ─────
 * 1.  No data yet                – returns [] when query hasn't resolved.
 * 2.  "All" filter               – returns all items unchanged.
 * 3.  "Cryptocurrency" filter    – excludes non-crypto items.
 * 4.  "Favorites" filter         – returns only items with isFavorite=true.
 * 5.  Keyword search (table)     – case-insensitive match on id/name/symbol.
 * 6.  Filter + keyword           – compound: category first, then keyword.
 * 7.  Keyword no match in filter – empty result when keyword misses inside filter.
 * 8.  No global matches          – empty result for an unknown keyword.
 * 9.  isFetching passthrough     – data.isFetching mirrors query state.
 * 10. errorMessage (string)      – surfaces raw string error unchanged.
 * 11. errorMessage (object)      – falls back to "Something went wrong!".
 * 12. No error                   – errorMessage is undefined.
 * 13. handleFilterChange         – updates activeFilter + re-derives memoizedData.
 * 14. handleCardPress toggle     – toggles activeCard on → off.
 * 15. handleCardPress swap       – replaces active card with a different item.
 * 16. setKeyword reactivity      – keyword change → memoizedData re-computed.
 * 17. Return shape               – all documented keys are present.
 */

import { renderHook, act } from '@testing-library/react-native';
import { Animated } from 'react-native';

import { useMarketList } from '@/hooks/useMarketList';
import type { CryptoMarketItem, ApiResponse } from '@/types/api';

// ─── Module mocks ─────────────────────────────────────────────────────────────
// IMPORTANT: jest.mock() factories are hoisted by Babel and CANNOT close over
// module-scope variables. Use require() inside the factory body.

jest.mock('@/hooks/useTabBarIndicator', () => {
  const { Animated: RNAnimated } = require('react-native');
  return {
    useTabBarIndicator: () => ({
      canScroll: false,
      indicatorPosition: new RNAnimated.Value(0),
      indicatorWidth: new RNAnimated.Value(60),
      handleMeasurement: jest.fn(),
      handleContentSizeChange: jest.fn(),
    }),
  };
});

jest.mock('@/services/api', () => ({
  useGetCryptoListQuery: jest.fn(),
}));

// ─── Typed reference to the mocked query ─────────────────────────────────────

const mockUseGetCryptoListQuery = require('@/services/api')
  .useGetCryptoListQuery as jest.Mock;

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

/** A non-crypto asset to verify "Cryptocurrency" filter excludes it. */
const MOCK_TOKEN: CryptoMarketItem = {
  id: 'usdt',
  name: 'Tether',
  symbol: 'USDT',
  price_idr: 16_000,
  change_percent: 0.01,
  isPositive: true,
  hot: false,
  isFavorite: false,
  type: 'token',
};

const ALL_ITEMS: CryptoMarketItem[] = [MOCK_BITCOIN, MOCK_ETHEREUM, MOCK_TOKEN];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildQueryReturn(overrides: {
  data?: ApiResponse<CryptoMarketItem[]> | undefined;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
  refetch?: jest.Mock;
}) {
  return {
    data: overrides.data,
    isFetching: overrides.isFetching ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error ?? undefined,
    refetch: overrides.refetch ?? jest.fn(),
  };
}

function buildApiResponse(
  items: CryptoMarketItem[],
): ApiResponse<CryptoMarketItem[]> {
  return { success: true, message: 'ok', data: items };
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('useMarketList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Test 1: No data yet ─────────────────────────────────────────────────────

  it('returns an empty memoizedData list when the query has not resolved yet', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: undefined, isFetching: true }),
    );

    const { result } = await renderHook(() => useMarketList());

    expect(result.current.data.memoizedData).toEqual([]);
    expect(result.current.data.isFetching).toBe(true);
  });

  // ── Test 2: "All" filter returns every item ──────────────────────────────────

  it('returns all items when the active filter is "All" (default)', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    expect(result.current.tabs.activeFilter).toBe('All');
    expect(result.current.data.memoizedData).toHaveLength(3);
    expect(result.current.data.memoizedData).toEqual(ALL_ITEMS);
  });

  // ── Test 3: "Cryptocurrency" filter ─────────────────────────────────────────

  it('filters to only cryptocurrency-type items when "Cryptocurrency" tab is selected', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    await act(async () => {
      result.current.handlers.handleFilterChange('Cryptocurrency');
    });

    // USDT (type: "token") must be excluded; BTC and ETH remain.
    expect(result.current.tabs.activeFilter).toBe('Cryptocurrency');
    expect(result.current.data.memoizedData).toHaveLength(2);
    expect(result.current.data.memoizedData.map((i) => i.id)).toEqual([
      'btc',
      'eth',
    ]);
  });

  // ── Test 4: "Favorites" filter ──────────────────────────────────────────────

  it('filters to only favorited items when "Favorites" tab is selected', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    await act(async () => {
      result.current.handlers.handleFilterChange('Favorites');
    });

    // Only MOCK_BITCOIN has isFavorite: true.
    expect(result.current.tabs.activeFilter).toBe('Favorites');
    expect(result.current.data.memoizedData).toHaveLength(1);
    expect(result.current.data.memoizedData[0].id).toBe('btc');
  });

  // ── Test 5: Keyword search (case-insensitive, matches id / name / symbol) ───

  it.each([
    ['btc', 'btc', 'matches by id (lowercase input)'],
    ['BTC', 'btc', 'matches by id (uppercase input)'],
    ['bitcoin', 'btc', 'matches name (lowercase)'],
    ['BITCOIN', 'btc', 'matches name (uppercase)'],
    // 'ETH' also substring-matches 'tETHer', so use the full name instead.
    ['ethereum', 'eth', 'matches full name (lowercase)'],
    ['ETHEREUM', 'eth', 'matches full name (uppercase)'],
    ['tether', 'usdt', 'matches non-crypto item by name'],
    ['USDT', 'usdt', 'matches non-crypto item by symbol'],
  ])(
    'returns the correct item when keyword is "%s" (%s)',
    async (keyword, expectedId, _description) => {
      mockUseGetCryptoListQuery.mockReturnValue(
        buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
      );

      const { result } = await renderHook(() => useMarketList());

      await act(async () => {
        result.current.handlers.setKeyword(keyword);
      });

      // Each keyword in the table must resolve to exactly one item.
      expect(result.current.list.keyword).toBe(keyword);
      expect(result.current.data.memoizedData).toHaveLength(1);
      expect(result.current.data.memoizedData[0].id).toBe(expectedId);
    },
  );

  // ── Test 6: Compound filter + keyword ───────────────────────────────────────

  it('applies keyword search on top of the active category filter', async () => {
    // Only BTC is a Favorite; ETH and USDT are not.
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    await act(async () => {
      result.current.handlers.handleFilterChange('Favorites');
    });
    await act(async () => {
      result.current.handlers.setKeyword('bit');
    });

    // After Favorites filter → [BTC]; after "bit" keyword → still [BTC].
    expect(result.current.data.memoizedData).toHaveLength(1);
    expect(result.current.data.memoizedData[0].id).toBe('btc');
  });

  // ── Test 7: Keyword matches nothing inside the active filter ─────────────────

  it('returns an empty list when keyword matches nothing within the active filter', async () => {
    // Favorites only contains BTC; "ethereum" should miss.
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    await act(async () => {
      result.current.handlers.handleFilterChange('Favorites');
    });
    await act(async () => {
      result.current.handlers.setKeyword('ethereum');
    });

    expect(result.current.data.memoizedData).toHaveLength(0);
  });

  // ── Test 8: No global matches ────────────────────────────────────────────────

  it('returns an empty memoizedData list when the search keyword matches nothing', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    await act(async () => {
      result.current.handlers.setKeyword('xyznonexistentcoin');
    });

    expect(result.current.data.memoizedData).toHaveLength(0);
  });

  // ── Test 9: isFetching passthrough ──────────────────────────────────────────

  it('exposes isFetching=false when the query has resolved', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({
        data: buildApiResponse(ALL_ITEMS),
        isFetching: false,
      }),
    );

    const { result } = await renderHook(() => useMarketList());

    expect(result.current.data.isFetching).toBe(false);
  });

  // ── Test 10: errorMessage — raw string error ─────────────────────────────────

  it('surfaces the error string directly when the query error is a string', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({
        isError: true,
        error: 'Unauthorized',
      }),
    );

    const { result } = await renderHook(() => useMarketList());

    expect(result.current.data.errorMessage).toBe('Unauthorized');
  });

  // ── Test 11: errorMessage — non-string error falls back ──────────────────────

  it('falls back to "Something went wrong!" when the query error is not a string', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({
        isError: true,
        error: { status: 500, data: { message: 'Internal Server Error' } },
      }),
    );

    const { result } = await renderHook(() => useMarketList());

    expect(result.current.data.errorMessage).toBe('Something went wrong!');
  });

  // ── Test 12: No error ────────────────────────────────────────────────────────

  it('returns undefined errorMessage when there is no error', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    expect(result.current.data.errorMessage).toBeUndefined();
  });

  // ── Test 13: handleFilterChange updates activeFilter ──────────────────────────

  it('updates activeFilter and re-derives memoizedData when handleFilterChange is called', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    // Default
    expect(result.current.tabs.activeFilter).toBe('All');

    await act(async () => {
      result.current.handlers.handleFilterChange('Favorites');
    });

    expect(result.current.tabs.activeFilter).toBe('Favorites');
    // Only MOCK_BITCOIN is a favorite.
    expect(result.current.data.memoizedData).toHaveLength(1);
  });

  // ── Test 14: handleCardPress toggle (on → off) ────────────────────────────────

  it('sets activeCard to the pressed item, and clears it when the same item is pressed again', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    // Initial state: no card selected.
    expect(result.current.list.activeCard).toBeUndefined();

    // Press BTC → active.
    await act(async () => {
      result.current.handlers.handleCardPress(MOCK_BITCOIN);
    });
    expect(result.current.list.activeCard).toEqual(MOCK_BITCOIN);

    // Press BTC again → toggle off.
    await act(async () => {
      result.current.handlers.handleCardPress(MOCK_BITCOIN);
    });
    expect(result.current.list.activeCard).toBeUndefined();
  });

  // ── Test 15: handleCardPress swap (different item) ────────────────────────────

  it('replaces the active card when a different item is pressed', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    await act(async () => {
      result.current.handlers.handleCardPress(MOCK_BITCOIN);
    });
    expect(result.current.list.activeCard).toEqual(MOCK_BITCOIN);

    // Press ETH while BTC is active.
    await act(async () => {
      result.current.handlers.handleCardPress(MOCK_ETHEREUM);
    });
    expect(result.current.list.activeCard).toEqual(MOCK_ETHEREUM);
  });

  // ── Test 16: setKeyword drives memoizedData re-computation ──────────────────

  it('re-computes memoizedData reactively when setKeyword is called', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse(ALL_ITEMS) }),
    );

    const { result } = await renderHook(() => useMarketList());

    // Baseline — all items visible.
    expect(result.current.data.memoizedData).toHaveLength(3);

    // Search for Tether.
    await act(async () => {
      result.current.handlers.setKeyword('tether');
    });
    expect(result.current.data.memoizedData).toHaveLength(1);
    expect(result.current.data.memoizedData[0].id).toBe('usdt');

    // Clear the keyword → all items visible again.
    await act(async () => {
      result.current.handlers.setKeyword('');
    });
    expect(result.current.data.memoizedData).toHaveLength(3);
  });

  // ── Test 17: Return shape is stable ─────────────────────────────────────────

  it('returns the expected shape with all required keys', async () => {
    mockUseGetCryptoListQuery.mockReturnValue(
      buildQueryReturn({ data: buildApiResponse([]) }),
    );

    const { result } = await renderHook(() => useMarketList());
    const { data, tabs, list, handlers } = result.current;

    // data group
    expect(data).toHaveProperty('memoizedData');
    expect(data).toHaveProperty('isFetching');
    expect(data).toHaveProperty('refetch');
    expect(data).toHaveProperty('errorMessage');

    // tabs group
    expect(tabs).toHaveProperty('activeFilter');
    expect(tabs).toHaveProperty('canScroll');
    expect(tabs).toHaveProperty('indicatorPosition');
    expect(tabs).toHaveProperty('indicatorWidth');

    // list group
    expect(list).toHaveProperty('keyword');
    expect(list).toHaveProperty('activeCard');

    // handlers group
    expect(typeof handlers.setKeyword).toBe('function');
    expect(typeof handlers.handleFilterChange).toBe('function');
    expect(typeof handlers.handleCardPress).toBe('function');
    expect(typeof handlers.handleMeasurement).toBe('function');
    expect(typeof handlers.handleContentSizeChange).toBe('function');

    // Animated values from useTabBarIndicator
    expect(tabs.indicatorPosition).toBeInstanceOf(Animated.Value);
    expect(tabs.indicatorWidth).toBeInstanceOf(Animated.Value);
  });
});

import * as React from "react";

import { useGetCryptoListQuery } from "@/services/api";
import { CryptoMarketItem } from "@/types/api";
import { FilterType } from "@/types/market";
import { useTabBarIndicator } from "@/hooks/useTabBarIndicator";


export { FILTERS, FilterType } from "@/types/market";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const searchItems = (
  keyword: string,
  values: CryptoMarketItem[],
): CryptoMarketItem[] => {
  if (keyword.length === 0) return values;

  const _keyword = keyword.toLowerCase();

  return values.filter((item) => {
    const fields = [item.id, item.name, item.symbol]
      .filter((e) => e !== undefined)
      .map((f) => f.toLowerCase());
    return fields.some((f) => f.includes(_keyword));
  });
};

const filterItems = (
  filter: FilterType,
  values: CryptoMarketItem[],
): CryptoMarketItem[] => {
  const localValues = [...values];

  switch (filter) {
    case "All":
      return localValues;
    case "Cryptocurrency":
      return localValues.filter((item) => item.type === "cryptocurrency");
    case "Favorites":
      return localValues.filter((item) => item.isFavorite);
    default:
      return localValues;
  }
};


export const useMarketList = () => {
  // ── API ─────────────────────────────────────────────────────────────────────

  const {
    data: cryptoList,
    isFetching,
    refetch,
    isError,
    error,
  } = useGetCryptoListQuery();

  // ── State ───────────────────────────────────────────────────────────────────

  const [keyword, setKeyword] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<FilterType>("All");
  const [activeCard, setActiveCard] = React.useState<
    CryptoMarketItem | undefined
  >();

  // ── Composed hooks ──────────────────────────────────────────────────────────

  const {
    canScroll,
    indicatorPosition,
    indicatorWidth,
    handleMeasurement,
    handleContentSizeChange,
  } = useTabBarIndicator(activeFilter);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const errorMessage = React.useMemo(() => {
    if (isError && error) {
      if (typeof error === "string") return error as string;
      return "Something went wrong!";
    }
  }, [isError, error]);

  const memoizedData = React.useMemo(() => {
    if (!cryptoList) return [];
    let result = filterItems(activeFilter, cryptoList.data);

    if (keyword.length > 0) {
      result = searchItems(keyword, result);
    }

    return result;
  }, [activeFilter, cryptoList, keyword]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleFilterChange = React.useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const handleCardPress = React.useCallback((item: CryptoMarketItem) => {
    setActiveCard((prev) => (prev === item ? undefined : item));
  }, []);

  // ── Return ──────────────────────────────────────────────────────────────────

  return {
    data: {
      memoizedData,
      isFetching,
      refetch,
      errorMessage,
    },
    tabs: {
      activeFilter,
      canScroll,
      indicatorPosition,
      indicatorWidth,
    },
    list: {
      keyword,
      activeCard,
    },
    handlers: {
      setKeyword,
      handleFilterChange,
      handleCardPress,
      handleMeasurement,
      handleContentSizeChange,
    },
  };
};

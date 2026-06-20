import * as React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

import type { MarketsScreenProps } from "@/types/navigation";
import { LightColors } from "@/constants/Colors";
import { Typography } from "@/constants/Typography";
import { FormInput } from "@/components/FormInput";
import { CoinIcon } from "@/components/CoinIcon";
import { FilterTabBar } from "@/components/FilterTabBar";
import { MarketListSkeleton } from "@/components/MarketListSkeleton";
import { MarketListEmpty } from "@/components/MarketListEmpty";
import { useMarketList } from "@/hooks/useMarketList";
import { CryptoMarketItem } from "@/types/api";

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MarketScreen(_props: MarketsScreenProps): React.JSX.Element {
  const {
    data: { memoizedData, isFetching, refetch, errorMessage },
    tabs: { activeFilter, canScroll, indicatorPosition, indicatorWidth },
    list: { keyword, activeCard },
    handlers: {
      setKeyword,
      handleFilterChange,
      handleCardPress,
      handleMeasurement,
      handleContentSizeChange,
    },
  } = useMarketList();

  const renderItem = React.useCallback(
    ({ item }: { item: CryptoMarketItem }) => {
      const isActive = activeCard === item;

      return (
        <Pressable
          onPress={() => handleCardPress(item)}
          style={[styles.card, isActive && styles.cardActive]}
        >
          <View style={styles.cardLeft}>
            <CoinIcon coin={item} />

            <View style={styles.cardInfo}>
              <Text style={[styles.cardSymbol, isActive && styles.cardTextInverted]}>
                {item.symbol} {item.hot ? "🔥" : ""}
              </Text>

              <Text style={[styles.cardName, isActive && styles.cardTextInverted]}>
                {item.name ?? item.id}
              </Text>
            </View>
          </View>

          <View style={styles.cardRight}>
            <View style={[styles.changeBadge, isActive && styles.changeBadgeActive]}>
              <Text
                style={[
                  styles.changeText,
                  {
                    color: item.isPositive
                      ? LightColors.base.success
                      : LightColors.base.error,
                  },
                ]}
              >
                {item.change_percent}
              </Text>
            </View>

            <Text style={[styles.priceText, isActive && styles.cardTextInverted]}>
              {item.price_idr}
            </Text>
          </View>
        </Pressable>
      );
    },
    [activeCard, handleCardPress],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.title}>Market</Text>

      <FilterTabBar
        activeFilter={activeFilter}
        canScroll={canScroll}
        indicatorPosition={indicatorPosition}
        indicatorWidth={indicatorWidth}
        onFilterChange={handleFilterChange}
        onMeasurement={handleMeasurement}
        onContentSizeChange={handleContentSizeChange}
      />

      <View style={styles.searchWrapper}>
        <FormInput
          placeholder={"Search"}
          keyboardType={"web-search"}
          returnKeyType="search"
          submitBehavior="blurAndSubmit"
          onChangeText={setKeyword}
          rightSlot={
            <Feather
              name="search"
              size={24}
              color={LightColors.text.primaryBody}
            />
          }
        />
      </View>

      <View style={styles.listWrapper}>
        <FlatList<CryptoMarketItem>
          data={errorMessage ? [] : memoizedData}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} />
          }
          ListHeaderComponent={isFetching ? <MarketListSkeleton /> : null}
          renderItem={renderItem}
          ListEmptyComponent={
            <MarketListEmpty keyword={keyword} errorMessage={errorMessage} />
          }
          keyboardShouldPersistTaps="handled"
          // Optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          windowSize={21}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "flex-start",
    backgroundColor: LightColors.background.bg,
    gap: 16,
  },
  spacer: {
    height: 40,
  },
  title: {
    ...Typography.titleLarge,
    color: LightColors.text.primaryBody,
    paddingHorizontal: 20,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    alignSelf: "stretch",
  },
  listWrapper: {
    flex: 1,
    alignSelf: "stretch",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    borderRadius: 4,
    backgroundColor: LightColors.background.surfaces,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardActive: {
    backgroundColor: LightColors.base.primary,
  },
  cardLeft: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  cardInfo: {
    gap: 2,
    alignItems: "flex-start",
  },
  cardSymbol: {
    ...Typography.titleMediumUppercase,
    color: LightColors.text.primaryBody,
  },
  cardName: {
    ...Typography.bodyMedium,
    color: LightColors.text.primaryBody,
  },
  cardTextInverted: {
    color: LightColors.background.bg,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  changeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  changeBadgeActive: {
    backgroundColor: LightColors.background.surfaces,
  },
  changeText: {
    ...Typography.titleSmall,
  },
  priceText: {
    ...Typography.titleSmall,
    color: LightColors.text.primaryBody,
  },
});

import * as React from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { LightColors } from "@/constants/Colors";
import { getFlagEmoji } from "@/utils/getFlagEmoji";
import { Country } from "@/types/api";
import { Typography } from "@/constants/Typography";

export const FALLBACK_COUNTRY: Country = {
  name: "Indonesia",
  code: "ID",
  dial_code: "+62",
};

interface CountryPickerModalProps {
  visible: boolean;
  countries: Country[];
  selectedCode: string;
  onSelect: (country: Country) => void;
  onClose: () => void;
}

export default function CountryPickerModal({
  visible,
  countries,
  selectedCode,
  onSelect,
  onClose,
}: CountryPickerModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Dim backdrop */}
      <Pressable style={modalStyles.backdrop} onPress={onClose} />

      {/* Bottom sheet */}
      <View style={modalStyles.sheet}>
        {/* Header */}
        <View style={modalStyles.header}>
          <Text style={modalStyles.headerTitle}>Select Country</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={modalStyles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={22} color="black" />
          </Pressable>
        </View>

        {/* Divider */}
        <View style={modalStyles.divider} />

        {/* Country list */}
        <FlatList<Country>
          data={countries}
          keyExtractor={(item) => item.code}
          contentContainerStyle={modalStyles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={modalStyles.separator} />}
          renderItem={({ item }) => {
            const isSelected = item.code === selectedCode;
            return (
              <Pressable
                style={[modalStyles.row, isSelected && modalStyles.rowSelected]}
                onPress={() => onSelect(item)}
                android_ripple={{ color: LightColors.background.surfaces }}
              >
                <Text style={modalStyles.flag}>{getFlagEmoji(item.code)}</Text>
                <Text
                  style={[
                    modalStyles.countryName,
                    isSelected && modalStyles.countryNameSelected,
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    modalStyles.dialCode,
                    isSelected && modalStyles.dialCodeSelected,
                  ]}
                >
                  {item.dial_code}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: LightColors.background.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    ...Typography.titleMediumUppercase,
    color: LightColors.text.primaryBody,
  },
  closeButton: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: LightColors.border.default,
    marginHorizontal: 20,
  },
  listContent: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },
  separator: {
    height: 1,
    backgroundColor: LightColors.border.default,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowSelected: {
    backgroundColor: LightColors.background.surfaces,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  flag: {
    fontSize: 24,
  },
  countryName: {
    flex: 1,
    ...Typography.bodyLarge,
    color: LightColors.text.primaryBody,
  },
  countryNameSelected: {
    color: LightColors.base.primary,
  },
  dialCode: {
    ...Typography.bodyLarge,
    color: LightColors.text.primaryBody,
  },
  dialCodeSelected: {
    color: LightColors.base.primary,
  },
});

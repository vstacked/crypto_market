/**
 * Design token — colour palette for the Crypto Market app (Light Theme).
 *
 * Tokens are grouped by their Figma category so callers can use them
 * semantically (e.g. Colors.light.text.primaryBody) rather than hard-coding
 * hex values in component files.
 */

const palette = {
  purple600: "#613DE4",
  neutral50: "#F5F7FC",
  neutral100: "#FBFCFE",
  neutral200: "#CDD5E9",
  neutral300: "#D4D4D4",
  neutral900: "#111112",
  white: "#FFFFFF",
  offWhite: "#F2F4F7",
  green500: "#3BB266",
  red500: "#EF4444",

  skeletonBase: "#E2E6F0",
} as const;

export const Colors = {
  light: {
    // Text
    text: {
      /** Light Theme/Text/Primary Body */
      primaryBody: palette.neutral900,
      /** Light Theme/Text/Secondary Body */
      secondaryBody: palette.neutral300,
    },

    // Base / brand colours
    base: {
      /** Light Theme/Base color/Primary/Default — buttons, links, accents */
      primary: palette.purple600,
      /** Light Theme/Base color/Info */
      info: palette.neutral50,
      /** Light Theme/Base color/Success */
      success: palette.green500,
      /** Light Theme/Base color/Error */
      error: palette.red500,

      skeleton: palette.skeletonBase,
    },

    // Surfaces & backgrounds
    background: {
      /** Light Theme/Background/Surfaces */
      surfaces: palette.neutral50,
      /** Light Theme/Background/Bg */
      bg: palette.neutral100,
    },

    // Borders & dividers
    border: {
      /** Light Theme/Border and divider/Border and divider */
      default: palette.neutral200,
    },

    // Interactive — button fill / label pair
    button: {
      /** Button background fill */
      background: palette.purple600,
      /** Text / icon colour on top of the button */
      foreground: palette.offWhite,
    },
  },
} as const;

/** Convenience re-export of the light-theme token set. */
export const LightColors = Colors.light;

/** Raw palette — use sparingly; prefer semantic tokens above. */
export { palette };

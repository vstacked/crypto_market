/**
 * Typography tokens — Crypto Market app.
 *
 * Each token maps to a Figma text style and is structured to be spread
 * directly into a React Native `StyleSheet.create` entry or a `Text` style.
 *
 * Font family: 'Roboto' (requires expo-google-fonts/roboto or equivalent).
 * Until the font is loaded, React Native will fall back to the system sans-serif.
 *
 * Usage:
 *   import { Typography } from '@/constants/Typography';
 *   <Text style={Typography.headlineSmall}>Hello</Text>
 */
import { type TextStyle } from 'react-native';

/**
 * App/Headline/Small/Lowercase
 * Weight 500 | 24 sp | line-height 32 | tracking 0
 */
const headlineSmall: TextStyle = {
  fontFamily: 'Roboto_500Medium',
  fontWeight: '500',
  fontSize: 24,
  lineHeight: 32,
  letterSpacing: 0,
};

/**
 * App/Title/Large/Lowercase
 * Weight 500 | 20 sp | line-height 24 | tracking 0.1
 */
const titleLarge: TextStyle = {
  fontFamily: 'Roboto_500Medium',
  fontWeight: '500',
  fontSize: 20,
  lineHeight: 24,
  letterSpacing: 0.1,
};

/**
 * App/Title/Medium/Uppercase
 * Weight 500 | 16 sp | line-height 20 | tracking 0.15 | UPPERCASE
 */
const titleMediumUppercase: TextStyle = {
  fontFamily: 'Roboto_500Medium',
  fontWeight: '500',
  fontSize: 16,
  lineHeight: 20,
  letterSpacing: 0.15,
  textTransform: 'uppercase',
};

/**
 * App/Title/Small/Lowercase
 * Weight 500 | 14 sp | line-height 20 | tracking 0.1
 */
const titleSmall: TextStyle = {
  fontFamily: 'Roboto_500Medium',
  fontWeight: '500',
  fontSize: 14,
  lineHeight: 20,
  letterSpacing: 0.1,
};

/**
 * App/Body/Large/Lowercase
 * Weight 400 | 16 sp | line-height 20 | tracking 0.2
 */
const bodyLarge: TextStyle = {
  fontFamily: 'Roboto_400Regular',
  fontWeight: '400',
  fontSize: 16,
  lineHeight: 20,
  letterSpacing: 0.2,
};

/**
 * App/Body/Medium/Lowercase
 * Weight 400 | 14 sp | line-height 20 | tracking 0.25 | centered
 */
const bodyMedium: TextStyle = {
  fontFamily: 'Roboto_400Regular',
  fontWeight: '400',
  fontSize: 14,
  lineHeight: 20,
  letterSpacing: 0.25,
  textAlign: 'center',
};

/**
 * App/Body/Small/Lowercase
 * Weight 400 | 12 sp | line-height 16 | tracking 0.4 | centered
 */
const bodySmall: TextStyle = {
  fontFamily: 'Roboto_400Regular',
  fontWeight: '400',
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 0.4,
  textAlign: 'center',
};

/**
 * App/Label/Medium/Lowercase
 * Weight 500 | 12 sp | line-height 16 | tracking 0.5 | centered
 */
const labelMedium: TextStyle = {
  fontFamily: 'Roboto_500Medium',
  fontWeight: '500',
  fontSize: 12,
  lineHeight: 16,
  letterSpacing: 0.5,
  textAlign: 'center',
};

export const Typography = {
  headlineSmall,
  titleLarge,
  titleMediumUppercase,
  titleSmall,
  bodyLarge,
  bodyMedium,
  bodySmall,
  labelMedium,
} as const;

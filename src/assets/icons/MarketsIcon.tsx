import * as React from "react";
import Svg, { Path, Rect } from "react-native-svg";

export function MarketsIcon({ size = 24, color = "#FFFFFF" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* The bottom baseline */}
      <Path d="M4 19h16" stroke={color} strokeWidth="1.75" strokeLinecap="round" />
      {/* Tall left bar */}
      <Rect x="6.5" y="7" width="4.5" height="10" fill={color} rx="1" />
      {/* Short right bar */}
      <Rect x="13" y="11" width="4.5" height="6" fill={color} rx="1" />
    </Svg>
  );
}

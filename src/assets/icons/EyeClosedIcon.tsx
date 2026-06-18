import * as React from "react";
import Svg, { Path } from "react-native-svg";

export default function EyeClosedIcon({ size = 24, color = "#111827" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The downward eyelid curve */}
      <Path d="M3 10c3 4 6.5 5 9 5s6-1 9-5" />
      {/* The four eyelashes */}
      <Path d="M5.5 13.5l-2 3" />
      <Path d="M10 14.8l-1 3.2" />
      <Path d="M14 14.8l1 3.2" />
      <Path d="M18.5 13.5l2 3" />
    </Svg>
  );
}

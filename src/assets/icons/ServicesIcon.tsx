import * as React from "react";
import Svg, { Circle } from "react-native-svg";

export function ServicesIcon({ size = 24, color = "#000000" }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1"
    >
      {/* Top Left Circle */}
      <Circle cx="9.5" cy="8.5" r="2.5" />
      {/* Top Right Circle (Smallest) */}
      <Circle cx="15.5" cy="10" r="1.5" />
      {/* Bottom Circle (Largest) */}
      <Circle cx="12.5" cy="15" r="3" />
    </Svg>
  );
}

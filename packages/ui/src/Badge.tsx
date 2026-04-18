/**
 * packages/ui/src/Badge.tsx
 *
 * Small inline status badge.
 */

import React from "react";

type Color = "green" | "yellow" | "red" | "blue" | "gray";

interface BadgeProps {
  label: string;
  color?: Color;
}

const colorClasses: Record<Color, string> = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ label, color = "gray" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[color]}`}
    >
      {label}
    </span>
  );
}

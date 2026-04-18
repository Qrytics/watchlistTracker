/**
 * packages/ui/src/Avatar.tsx
 *
 * User avatar — shows the user image or a fallback initials circle.
 */

import React from "react";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "User avatar"}
        className={`rounded-full object-cover ${sizeClasses[size]}`}
      />
    );
  }

  return (
    <div
      aria-label={name ?? "User"}
      className={`flex items-center justify-center rounded-full bg-indigo-600 font-semibold text-white ${sizeClasses[size]}`}
    >
      {getInitials(name)}
    </div>
  );
}

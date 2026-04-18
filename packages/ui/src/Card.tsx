/**
 * packages/ui/src/Card.tsx
 *
 * Generic content card container.
 */

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Optional click handler — turns the card into a pressable item */
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={[
        "rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-4",
        onClick ? "cursor-pointer hover:shadow-md active:scale-[0.99] transition-all" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

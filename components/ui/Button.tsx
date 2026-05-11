import React from "react";
import { Spinner } from "./Spinner";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 border-transparent",
  secondary:
    "bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400 border-gray-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 border-transparent",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps): React.ReactElement {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isLoading && <Spinner size="sm" className="shrink-0" />}
      {children}
    </button>
  );
}

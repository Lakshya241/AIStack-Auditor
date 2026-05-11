import React, { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  id: externalId,
  className = "",
  ...rest
}: InputProps): React.ReactElement {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;
  const helperTextId = `${id}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText && !error ? helperTextId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={[
          "block w-full rounded-md border px-3 py-2 text-sm text-gray-900",
          "placeholder:text-gray-400",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-gray-300 focus-visible:ring-blue-500",
          rest.disabled ? "bg-gray-50 opacity-60 cursor-not-allowed" : "bg-white",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperTextId} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

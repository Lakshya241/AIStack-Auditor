import React, { useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({
  label,
  error,
  options,
  id: externalId,
  className = "",
  ...rest
}: SelectProps): React.ReactElement {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        {...rest}
        id={id}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={[
          "block w-full rounded-md border px-3 py-2 text-sm text-gray-900",
          "bg-white",
          "transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          error
            ? "border-red-500 focus-visible:ring-red-500"
            : "border-gray-300 focus-visible:ring-blue-500",
          rest.disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

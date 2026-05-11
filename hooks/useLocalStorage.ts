import { useState, useEffect } from "react";

/**
 * Generic hook for persisting state to localStorage.
 * Handles SSR (typeof window check), JSON parse failures, and
 * localStorage unavailability gracefully by falling back to initialValue.
 *
 * @param key - The localStorage key to read/write
 * @param initialValue - The value to use when no stored value exists or on any error
 * @returns A stateful value and a setter that also persists to localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // localStorage unavailable (e.g. private browsing quota exceeded) — silently ignore
    }
  }, [key, storedValue]);

  const setValue = (value: T): void => {
    setStoredValue(value);
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable — silently ignore
    }
  };

  return [storedValue, setValue];
}

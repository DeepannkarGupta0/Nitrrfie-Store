import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  const val = amount > 9999 ? Math.round(amount / 100) : amount;
  return `₹${val.toLocaleString("en-IN")}`;
}
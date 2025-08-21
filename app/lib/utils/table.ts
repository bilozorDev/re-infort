import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Debounce function for delayed execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format currency values
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date values
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  return window.innerWidth < 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
}

/**
 * Get row density styles
 */
export function getRowDensityStyles(density: "compact" | "normal" | "comfortable" = "normal"): string {
  const densityMap = {
    compact: "py-1 text-sm",
    normal: "py-2",
    comfortable: "py-3",
  };
  
  return densityMap[density];
}

/**
 * Merge class names with Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get status badge styles
 */
export function getStatusBadgeStyles(status: string): string {
  const statusMap: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    discontinued: "bg-red-100 text-red-800",
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
  };
  
  return statusMap[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

/**
 * Fuzzy filter function for global search
 */
export function fuzzyFilter(value: string, searchValue: string): boolean {
  if (!searchValue) return true;
  if (!value) return false;
  
  const search = searchValue.toLowerCase();
  const text = value.toString().toLowerCase();
  
  return text.includes(search);
}
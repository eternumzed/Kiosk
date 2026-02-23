/**
 * Color theme matching kiosk-client styling
 * Uses Tailwind CSS green color palette
 */

export const colors = {
  // Primary colors (green theme matching kiosk-client)
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a', // Main primary - bg-green-600
    700: '#15803d', // Hover state - bg-green-700
    800: '#166534', // Dark text - text-green-800
    900: '#14532d',
  },

  // Gray colors for text and backgrounds
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb', // bg-gray-200
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563', // text-gray-600
    700: '#374151',
    800: '#1f2937', // text-gray-800
    900: '#111827',
  },

  // Status colors
  status: {
    success: '#10b981', // Green for approved
    warning: '#f59e0b', // Amber for pending
    error: '#ef4444',   // Red for rejected/errors
    info: '#3b82f6',    // Blue for info
  },

  // Background colors
  background: {
    primary: '#f5f5f5',
    white: '#ffffff',
    overlay: 'rgba(0,0,0,0.5)',
  },

  // Text colors
  text: {
    primary: '#1f2937',   // gray-800
    secondary: '#4b5563', // gray-600
    muted: '#9ca3af',     // gray-400
    light: '#ffffff',
    placeholder: '#999999',
  },

  // Border colors
  border: {
    light: '#e5e7eb',
    default: '#d1d5db',
    focus: '#16a34a',
  },
};

// Common style patterns
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export default colors;

// Dark Mode Colors (Existing)
export const darkColors = {
    // Primary Brand - Electric Indigo / Violet
    primary: '#6366F1', // Indigo 500
    primaryDark: '#4338CA', // Indigo 700
    primaryLight: '#818CF8', // Indigo 400

    // Accent - Gold/Amber for premium touches
    accent: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.3)',

    // Secondary / Action
    secondary: '#10B981', // Emerald 500
    secondaryDark: '#059669', // Emerald 700

    // Feedback
    success: '#10B981',
    error: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    info: '#3B82F6', // Blue 500

    // Backgrounds (Dark Mode Focus for Premium Feel)
    background: '#0B0F19', // Deep Rich Navy/Black
    surface: '#161E2E', // Slightly lighter 
    surfaceLight: '#252F45', // Lighter still
    surfaceHighlight: '#334155',

    // Text
    textPrimary: '#F8FAFC', // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    textTertiary: '#64748B', // Slate 500

    // Elements
    border: 'rgba(255, 255, 255, 0.1)',
    borderHighlight: 'rgba(255, 255, 255, 0.2)',
    overlay: 'rgba(11, 15, 25, 0.8)',
};

// Light Mode Colors (Inverted)
export const lightColors = {
    // Primary Brand - Same but maybe slightly adjusted for contrast
    primary: '#4F46E5', // Indigo 600 (darker for light bg)
    primaryDark: '#4338CA', // Indigo 700
    primaryLight: '#818CF8', // Indigo 400

    // Accent
    accent: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.2)',

    // Secondary / Action
    secondary: '#059669', // Emerald 600
    secondaryDark: '#047857', // Emerald 700

    // Feedback
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',

    // Backgrounds (Light Mode)
    background: '#F8FAFC', // Slate 50
    surface: '#FFFFFF', // White
    surfaceLight: '#F1F5F9', // Slate 100
    surfaceHighlight: '#E2E8F0', // Slate 200

    // Text
    textPrimary: '#0F172A', // Slate 900
    textSecondary: '#64748B', // Slate 500
    textTertiary: '#94A3B8', // Slate 400

    // Elements
    border: 'rgba(0, 0, 0, 0.1)',
    borderHighlight: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(255, 255, 255, 0.8)',
};

// Default export for backward compatibility (defaults to dark)
export const colors = darkColors;

export const getThemeColors = (theme: 'light' | 'dark') => {
    return theme === 'dark' ? darkColors : lightColors;
};

export const gradients = {
    primary: ['#6366F1', '#4F46E5', '#4338CA'], // 3-stop rich indigo
    success: ['#34D399', '#10B981'],
    danger: ['#F87171', '#EF4444'],
    dark: ['#1E293B', '#0F172A'],
    gold: ['#FBBF24', '#D97706'], // Premium gold gradient
    glass: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
};

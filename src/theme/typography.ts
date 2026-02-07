import { TextStyle } from 'react-native';

type Typography = {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body1: TextStyle;
    body2: TextStyle;
    caption: TextStyle;
    button: TextStyle;
};

export const typography: Typography = {
    h1: {
        fontSize: 34,
        fontWeight: '700',
        lineHeight: 42,
        letterSpacing: -0.8,
        color: '#F8FAFC',
    },
    h2: {
        fontSize: 26,
        fontWeight: '600',
        lineHeight: 34,
        letterSpacing: -0.5,
        color: '#F8FAFC',
    },
    h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        letterSpacing: -0.2,
        color: '#F8FAFC',
    },
    body1: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
        color: '#F8FAFC',
    },
    body2: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 22,
        color: '#94A3B8',
    },
    caption: {
        fontSize: 12,
        fontWeight: '500',
        lineHeight: 16,
        color: '#64748B',
        letterSpacing: 0.2,
    },
    button: {
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        letterSpacing: 0.5,
        textTransform: 'none', // Modern apps often use sentence case for buttons, but let's keep it flexible
    },
};

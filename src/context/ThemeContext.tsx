import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { colors, getThemeColors, lightColors, darkColors } from '../theme/colors';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    toggleTheme: () => void;
    setTheme: (theme: ThemeType) => void;
    colors: typeof colors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<ThemeType>('dark'); // Default to dark as per original design
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('user_theme');
            if (savedTheme) {
                setThemeState(savedTheme as ThemeType);
            } else if (systemScheme) {
                // If no saved preference, follow system? 
                // Currently app is dark-first, so maybe default to dark unless system is explicitly light?
                // Let's stick to saved preference or default dark for consistency with current UI.
                setThemeState('dark');
            }
        } catch (error) {
            console.log('Failed to load theme:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const setTheme = async (newTheme: ThemeType) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('user_theme', newTheme);
        } catch (error) {
            console.log('Failed to save theme:', error);
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const currentColors = theme === 'dark' ? darkColors : lightColors;

    // Provide legacy 'colors' object shape filled with current theme colors
    // This allows components to use `const { colors } = useTheme()`

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, colors: currentColors, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

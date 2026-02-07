import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface ScreenWrapperProps {
    children: ReactNode;
    style?: ViewStyle;
    edges?: Edge[];
    statusBarStyle?: StatusBarProps['style'];
}

export const ScreenWrapper: React.FC<ScreenWrapperProps & { keyboardShouldDismiss?: boolean }> = ({
    children,
    style,
    edges = ['top', 'bottom', 'left', 'right'],
    statusBarStyle,
    keyboardShouldDismiss = true
}) => {
    const { colors, isDark } = useTheme();

    // Default status bar style based on theme if not provided
    const defaultStatusBarStyle = isDark ? 'light' : 'dark';
    const finalStatusBarStyle = statusBarStyle || defaultStatusBarStyle;

    const content = (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={finalStatusBarStyle} backgroundColor={colors.background} />
            <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
                {children}
            </SafeAreaView>
        </View>
    );

    if (keyboardShouldDismiss) {
        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                {content}
            </TouchableWithoutFeedback>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    } as ViewStyle,
});

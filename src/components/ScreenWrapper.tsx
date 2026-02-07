import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

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
    statusBarStyle = 'light',
    keyboardShouldDismiss = true
}) => {
    const content = (
        <View style={styles.container}>
            <StatusBar style={statusBarStyle} backgroundColor={colors.background} />
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
        backgroundColor: colors.background,
    },
    safeArea: {
        flex: 1,
    } as ViewStyle,
});

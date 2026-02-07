import React from 'react';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, gradients } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';

interface GradientButtonProps {
    onPress: () => void;
    title: string;
    loading?: boolean;
    disabled?: boolean;
    colors?: string[];
    style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
    onPress,
    title,
    loading = false,
    disabled = false,
    colors: buttonColors = gradients.primary,
    style
}) => {
    const handlePress = () => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress && onPress();
        }
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            disabled={disabled || loading}
            style={[styles.container, style]}
        >
            <LinearGradient
                colors={(disabled ? [colors.surfaceLight, colors.surfaceLight] : buttonColors) as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={colors.textPrimary} />
                ) : (
                    <Text style={[styles.text, disabled && styles.disabledText]}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: layout.borderRadius.l,
        overflow: 'hidden',
        width: '100%',
        ...layout.shadows.medium,
    },
    gradient: {
        paddingVertical: layout.spacing.m,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        ...(typography.button as TextStyle),
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    disabledText: {
        color: colors.textSecondary,
    },
});

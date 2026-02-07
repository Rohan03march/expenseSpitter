import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';

interface InputProps extends TextInputProps {
    label?: string;
    icon?: string; // Placeholder for future icon support
    style?: ViewStyle;
    inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    style,
    inputStyle,
    secureTextEntry,
    ...rest // Capture all other TextInput props (value, onChangeText, placeholder, etc.)
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // If secureTextEntry is passed, we handle visibility toggle
    const isPasswordInput = secureTextEntry === true;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                isFocused && styles.focusedInput
            ]}>
                <TextInput
                    style={[styles.input, inputStyle]}
                    placeholderTextColor={colors.textSecondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCorrect={false}
                    spellCheck={false}
                    keyboardAppearance="dark"
                    secureTextEntry={isPasswordInput && !isPasswordVisible}
                    {...rest} // Spread rest props to TextInput
                />
                {isPasswordInput && (
                    <TouchableOpacity
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        style={styles.eyeIcon}
                    >
                        <Ionicons
                            name={isPasswordVisible ? "eye" : "eye-off"}
                            size={20}
                            color={colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: layout.spacing.m,
    } as ViewStyle,
    label: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        marginBottom: layout.spacing.xs,
        marginLeft: layout.spacing.xs,
    } as TextStyle,
    inputWrapper: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: layout.spacing.m,
        paddingVertical: layout.spacing.s,
        height: 50,
        justifyContent: 'center', // Center vertically
        // Use row direction if icon present? No, absolute positioning is easier or flex row
    } as ViewStyle,
    focusedInput: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    } as ViewStyle,
    input: {
        ...(typography.body1 as TextStyle),
        color: colors.textPrimary,
        height: '100%',
        flex: 1, // Take available space
        paddingRight: 30, // Make room for eye icon
    } as TextStyle,
    eyeIcon: {
        position: 'absolute',
        right: layout.spacing.m,
        height: '100%',
        justifyContent: 'center',
    } as ViewStyle,
});

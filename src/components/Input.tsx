import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, TextStyle, TouchableOpacity, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';

interface InputProps extends TextInputProps {
    label?: string;
    icon?: string; // Placeholder for future icon support
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
}

export const Input: React.FC<InputProps> = ({
    label,
    icon,
    style,
    inputStyle,
    secureTextEntry,
    ...rest // Capture all other TextInput props (value, onChangeText, placeholder, etc.)
}) => {
    const { colors } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // If secureTextEntry is passed, we handle visibility toggle
    const isPasswordInput = secureTextEntry === true;

    return (
        <View style={[styles.container, style]}>
            {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
            <View style={[
                styles.inputWrapper,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isFocused && { borderColor: colors.primary, borderWidth: 1.5 }
            ]}>
                <TextInput
                    style={[styles.input, { color: colors.textPrimary }, inputStyle]}
                    placeholderTextColor={colors.textSecondary}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoCorrect={false}
                    spellCheck={false}
                    keyboardAppearance={colors.background === '#0B0F19' ? "dark" : "light"} // Basic check for theme
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
        marginBottom: layout.spacing.xs,
        marginLeft: layout.spacing.xs,
    } as TextStyle,
    inputWrapper: {
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
        paddingHorizontal: layout.spacing.m,
        paddingVertical: layout.spacing.s,
        height: 50,
        justifyContent: 'center',
    } as ViewStyle,
    input: {
        ...(typography.body1 as TextStyle),
        height: '100%',
        flex: 1,
        paddingRight: 30,
    } as TextStyle,
    eyeIcon: {
        position: 'absolute',
        right: layout.spacing.m,
        height: '100%',
        justifyContent: 'center',
    } as ViewStyle,
});

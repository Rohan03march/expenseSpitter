import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GradientButton } from '../components/GradientButton';
import { Illustration } from '../components/Illustration';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.logoContainer}>
                <Illustration type="logo" width={150} height={150} />
                <Text style={[styles.appName, { color: colors.textPrimary }]}>Expense<Text style={[styles.appNameHighlight, { color: colors.primary }]}>Splitter</Text></Text>
                <Text style={[styles.tagline, { color: colors.textSecondary }]}>Financial harmony for everyone.</Text>
            </View>

            <View style={styles.footer}>
                <GradientButton
                    title="Sign In"
                    onPress={() => navigation.navigate('Login')}
                    style={styles.signInButton}
                />
                <GradientButton
                    title="Create Account"
                    onPress={() => navigation.navigate('Signup')}
                    colors={[colors.surface, colors.surface]} // Secondary style
                    style={[styles.createButton, { borderColor: colors.border }]}
                />
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {

    } as ViewStyle,
    logoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    appName: {
        fontSize: 36,
        fontWeight: 'bold',
        marginTop: layout.spacing.l,
        letterSpacing: -1,
    } as TextStyle,
    appNameHighlight: {
    } as TextStyle,
    tagline: {
        ...(typography.body1 as TextStyle),
        marginTop: layout.spacing.s,
    } as TextStyle,
    footer: {
        padding: layout.spacing.l,
        marginBottom: layout.spacing.xl,
        gap: layout.spacing.m,
    } as ViewStyle,
    signInButton: {
        // Default gradient used
    } as ViewStyle,
    createButton: {
        borderWidth: 1,
    } as ViewStyle,
});

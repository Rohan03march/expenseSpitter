import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ImageStyle, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Input } from '../../components/Input';
import { GradientButton } from '../../components/GradientButton';
import { useTheme } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { layout } from '../../theme/layout';
import { RootStackParamList } from '../../navigation/types';
import { FirebaseContext } from '../../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { login } = useContext(FirebaseContext);
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Please enter email and password");
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            await AsyncStorage.setItem('hasSeenIntro', 'true');
        } catch (error: any) {
            alert(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <View style={[styles.logoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="wallet" size={40} color={colors.primary} />
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { color: '#666' }]}>Sign in to continue splitting bills.</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Email"
                            placeholder="john@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <GradientButton
                            title="Log In"
                            onPress={handleLogin}
                            loading={loading}
                            style={styles.button}
                        />
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or continue with</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    </View>

                    <View style={styles.socialRow}>
                        <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="logo-google" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="logo-apple" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={[styles.linkText, { color: colors.primary }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper >
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        padding: layout.spacing.xl,
        justifyContent: 'center',
    } as ViewStyle,
    header: {
        marginBottom: layout.spacing.xxl,
        alignItems: 'center', // Centered for a balanced look
    } as ViewStyle,
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24, // Squircle
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.spacing.l,
        borderWidth: 1,
        ...layout.shadows.medium, // Nice shadow
    } as ViewStyle,
    title: {
        ...(typography.h1 as TextStyle),
        fontSize: 32,
        marginBottom: layout.spacing.xs,
        textAlign: 'center',
    } as TextStyle,
    subtitle: {
        ...(typography.body1 as TextStyle),
        color: '#666', // Explicit gray for subtitle is often cleaner
        textAlign: 'center',
        marginBottom: layout.spacing.l,
    } as TextStyle,
    form: {
        gap: layout.spacing.l,
    } as ViewStyle,
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: -layout.spacing.s, // Pull it closer to password input
        marginBottom: layout.spacing.s,
    } as ViewStyle,
    forgotPasswordText: {
        ...(typography.caption as TextStyle),
        fontWeight: '600',
    } as TextStyle,
    button: {
        height: 56, // Taller button for better tap target
        borderRadius: layout.borderRadius.l,
        ...layout.shadows.small,
    } as ViewStyle,
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: layout.spacing.xl,
    } as ViewStyle,
    dividerLine: {
        flex: 1,
        height: 1,
    } as ViewStyle,
    dividerText: {
        paddingHorizontal: layout.spacing.m,
        ...(typography.caption as TextStyle),
        textTransform: 'uppercase',
        letterSpacing: 1,
    } as TextStyle,
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: layout.spacing.l,
        marginBottom: layout.spacing.xl,
    } as ViewStyle,
    socialButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        ...layout.shadows.small, // Subtle shadow for depth
    } as ViewStyle,
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: layout.spacing.m,
    } as ViewStyle,
    footerText: {
        ...(typography.body1 as TextStyle),
    } as TextStyle,
    linkText: {
        ...(typography.body1 as TextStyle),
        fontWeight: 'bold',
        marginLeft: 4,
    } as TextStyle,
});

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
                        <View style={styles.iconRow}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ rotate: '-15deg' }], marginTop: 20 }]}>
                                <Ionicons name="wallet-outline" size={32} color={colors.primary} />
                            </View>
                            <View style={[styles.iconContainer, styles.mainIcon, { backgroundColor: colors.surface, borderColor: colors.success + '40', zIndex: 10 }]}>
                                <Ionicons name="cash" size={48} color={colors.success} />
                            </View>
                            <View style={[styles.iconContainer, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ rotate: '15deg' }], marginTop: 20 }]}>
                                <Ionicons name="card-outline" size={32} color={colors.secondary} />
                            </View>
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Welcome Back</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to continue splitting bills.</Text>
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

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text style={[styles.linkText, { color: colors.primary }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: layout.spacing.l,
    } as ViewStyle,
    header: {
        alignItems: 'center',
        marginBottom: layout.spacing.xl,
    } as ViewStyle,
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: layout.spacing.m,
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        ...layout.shadows.small,
    } as ViewStyle,
    mainIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        ...layout.shadows.medium,
    } as ViewStyle,
    title: {
        ...(typography.h1 as TextStyle),
        marginBottom: layout.spacing.s,
        textAlign: 'center',
    } as TextStyle,
    subtitle: {
        ...(typography.body1 as TextStyle),
        textAlign: 'center',
    } as TextStyle,
    form: {
        gap: layout.spacing.m,
    } as ViewStyle,
    forgotPassword: {
        alignSelf: 'flex-end',
    } as ViewStyle,
    forgotPasswordText: {
        ...(typography.caption as TextStyle),
        fontWeight: '600',
    } as TextStyle,
    button: {
        marginTop: layout.spacing.m,
    } as ViewStyle,
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: layout.spacing.xl,
        paddingBottom: 20,
    } as ViewStyle,
    footerText: {
        ...(typography.body2 as TextStyle),
    } as TextStyle,
    linkText: {
        ...(typography.body2 as TextStyle),
        fontWeight: 'bold',
    } as TextStyle,
});

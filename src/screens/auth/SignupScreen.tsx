import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
    const { signup } = useContext(FirebaseContext);
    const { colors } = useTheme();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !email || !password) {
            alert("Please fill in all fields");
            return;
        }
        setLoading(true);
        try {
            await signup(name, email, password);
            await AsyncStorage.setItem('hasSeenIntro', 'true');
            // Navigation is handled by auth state change or we can navigate here if needed, 
            // but usually auth state listener in AppNavigator handles it.
        } catch (error: any) {
            alert(error.message || "Signup failed");
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
                            <Ionicons name="person-add" size={40} color={colors.secondary} />
                        </View>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
                        <Text style={[styles.subtitle, { color: '#666' }]}>Join us and start splitting expenses.</Text>
                    </View>

                    <View style={styles.form}>
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                        />
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

                        <GradientButton
                            title="Sign Up"
                            onPress={handleSignup}
                            loading={loading}
                            style={styles.button}
                        />
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or join with</Text>
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
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.linkText, { color: colors.primary }]}>Log In</Text>
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
        padding: layout.spacing.xl,
        justifyContent: 'center',
    } as ViewStyle,
    header: {
        marginBottom: layout.spacing.xxl,
        alignItems: 'center',
    } as ViewStyle,
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: layout.spacing.l,
        borderWidth: 1,
        ...layout.shadows.medium,
    } as ViewStyle,
    title: {
        ...(typography.h1 as TextStyle),
        fontSize: 32,
        marginBottom: layout.spacing.xs,
        textAlign: 'center',
    } as TextStyle,
    subtitle: {
        ...(typography.body1 as TextStyle),
        color: '#666',
        textAlign: 'center',
        marginBottom: layout.spacing.l,
    } as TextStyle,
    form: {
        gap: layout.spacing.l,
    } as ViewStyle,
    button: {
        height: 56,
        borderRadius: layout.borderRadius.l,
        ...layout.shadows.small,
        marginTop: layout.spacing.m,
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
        ...layout.shadows.small,
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

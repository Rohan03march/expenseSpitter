import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle, TextStyle, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { Input } from '../../components/Input';
import { GradientButton } from '../../components/GradientButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout } from '../../theme/layout';
import { RootStackParamList } from '../../navigation/types';
import { FirebaseContext } from '../../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
    const { signup } = useContext(FirebaseContext);
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
                        <View style={styles.iconRow}>
                            <View style={[styles.iconContainer, { transform: [{ rotate: '-10deg' }], marginTop: 15 }]}>
                                <Ionicons name="pie-chart-outline" size={32} color={colors.primary} />
                            </View>
                            <View style={[styles.iconContainer, styles.mainIcon, { zIndex: 10 }]}>
                                <Ionicons name="person-add" size={48} color={colors.secondary} />
                            </View>
                            <View style={[styles.iconContainer, { transform: [{ rotate: '10deg' }], marginTop: 15 }]}>
                                <Ionicons name="trending-up" size={32} color={colors.success} />
                            </View>
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join us and start splitting expenses.</Text>
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

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Log In</Text>
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
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...layout.shadows.small,
    } as ViewStyle,
    mainIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.secondary + '40', // slightly transparent border
        ...layout.shadows.medium,
    } as ViewStyle,
    title: {
        ...(typography.h1 as TextStyle),
        color: colors.textPrimary,
        marginBottom: layout.spacing.s,
        textAlign: 'center',
    } as TextStyle,
    subtitle: {
        ...(typography.body1 as TextStyle),
        color: colors.textSecondary,
        textAlign: 'center',
    } as TextStyle,
    form: {
        gap: layout.spacing.m,
    } as ViewStyle,
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
        color: colors.textSecondary,
    } as TextStyle,
    linkText: {
        ...(typography.body2 as TextStyle),
        color: colors.primary,
        fontWeight: 'bold',
    } as TextStyle,
});

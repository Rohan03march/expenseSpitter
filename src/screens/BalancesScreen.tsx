import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ViewStyle, TextStyle, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';
import { gradients } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext, User } from '../context/FirebaseContext';
import { Avatar } from '../components/Avatar';
import { GlassView } from '../components/GlassView';
import { GradientButton } from '../components/GradientButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Balances'>;

export const BalancesScreen: React.FC<Props> = ({ route, navigation }) => {
    const { group } = route.params;
    const { getGroupBalances, formatCurrency, addExpense, user } = useContext(FirebaseContext);
    const { colors } = useTheme();
    const [balances, setBalances] = useState<{ [userId: string]: number }>({});

    useEffect(() => {
        const loadBalances = () => {
            setBalances(getGroupBalances(group.id));
        };
        loadBalances();
        // Refresh when gaining focus
        const unsubscribe = navigation.addListener('focus', loadBalances);
        return unsubscribe;
    }, [navigation, group.id, getGroupBalances, group.members]);

    const getMemberName = (id: string) => {
        if (id === user?.id) return 'You';
        const member = group.members.find((m: User) => m.id === id);
        return member?.name || 'Unknown';
    };

    const getMemberAvatar = (id: string) => {
        const member = group.members.find((m: User) => m.id === id);
        return member?.avatar || 'https://i.pravatar.cc/150';
    };

    const handleSettle = (userId: string, amount: number) => {
        // ... (Logic kept same as before)
    };

    const renderBalanceItem = (userId: string, amount: number) => {
        const isMe = userId === user?.id;
        const isOwed = amount > 0;
        const myBalance = balances[user?.id || ''] || 0;

        const handleUserPress = () => {
            if (isMe) return;

            let settlementType = 'pay'; // default
            let defaultAmount = 0;

            if (myBalance < 0 && amount > 0) {
                // I owe, they are owed. I likely pay them.
                defaultAmount = Math.min(Math.abs(myBalance), amount);
                navigation.navigate('AddExpense', {
                    group,
                    recipientId: userId,
                    amount: parseFloat(defaultAmount.toFixed(2))
                });
            } else if (myBalance > 0 && amount < 0) {
                // I am owed, they owe. They likely pay me.
                defaultAmount = Math.min(myBalance, Math.abs(amount));
                Alert.alert("Info", "To record that they paid you, please use the Settle Up button below and switch payer.");
            } else {
                // No obvious debt relation or both owe/owed (complex)
                navigation.navigate('AddExpense', { group, recipientId: userId });
            }
        };

        if (Math.abs(amount) < 0.01) return null; // Settled

        return (
            <TouchableOpacity
                key={userId}
                style={[styles.balanceItem, { borderBottomColor: colors.border }]}
                onPress={handleUserPress}
                disabled={isMe}
            >
                <View style={styles.userInfo}>
                    <Avatar source={{ uri: getMemberAvatar(userId) }} size={40} />
                    <View style={{ marginLeft: layout.spacing.m }}>
                        <Text style={[styles.userName, { color: colors.textPrimary }]}>{isMe ? 'You' : getMemberName(userId)}</Text>
                        <Text style={[
                            styles.balanceText,
                            isOwed ? { color: colors.success } : { color: colors.error }
                        ]}>
                            {isOwed ? 'gets back' : 'owes'} {formatCurrency(Math.abs(amount))}
                        </Text>
                    </View>
                </View>
                {!isMe && amount > 0 && myBalance < 0 && (
                    <LinearGradient
                        colors={gradients.primary as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.settleButton}
                    >
                        <Text style={styles.settleButtonText}>Settle</Text>
                    </LinearGradient>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Balances</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <GlassView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Net Balances</Text>
                    {Object.entries(balances).map(([userId, amount]) => renderBalanceItem(userId, amount))}
                    {Object.keys(balances).length === 0 && (
                        <View style={{ padding: layout.spacing.l, alignItems: 'center' }}>
                            <Ionicons name="documents-outline" size={48} color={colors.textSecondary} />
                            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: layout.spacing.m }}>
                                No balances calculated yet.
                            </Text>
                        </View>
                    )}
                </GlassView>

                {/* Simplified Settle Button for Demo */}
                <View style={styles.settleSection}>
                    <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                        To settle up, add an expense paid by the debtor and split with the creditor.
                    </Text>
                    <GradientButton
                        title="Record a Payment"
                        onPress={() => navigation.navigate('AddExpense', { group })}
                    />
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.l,
        paddingTop: layout.spacing.m,
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    backButton: {
        marginRight: layout.spacing.m,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h2 as TextStyle),
    } as TextStyle,
    content: {
        paddingHorizontal: layout.spacing.l,
    } as ViewStyle,
    card: {
        marginBottom: layout.spacing.xl,
        padding: layout.spacing.l,
        borderWidth: 1,
    } as ViewStyle,
    sectionTitle: {
        ...(typography.h3 as TextStyle),
        marginBottom: layout.spacing.m,
    } as TextStyle,
    balanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: layout.spacing.m,
        borderBottomWidth: 1,
    } as ViewStyle,
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    } as ViewStyle,
    userName: {
        ...(typography.body1 as TextStyle),
        fontWeight: '600',
    } as TextStyle,
    balanceText: {
        ...(typography.body2 as TextStyle),
        marginTop: 2,
    } as TextStyle,
    settleSection: {
        marginTop: layout.spacing.m,
    } as ViewStyle,
    helperText: {
        ...(typography.caption as TextStyle),
        textAlign: 'center',
        marginBottom: layout.spacing.m,
    } as TextStyle,
    settleButton: {
        paddingHorizontal: layout.spacing.m,
        paddingVertical: 6,
        borderRadius: 16,
    } as ViewStyle,
    settleButtonText: {
        ...(typography.caption as TextStyle),
        color: '#FFF',
        fontWeight: 'bold',
    } as TextStyle,
});

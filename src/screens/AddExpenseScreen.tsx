import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle, TextStyle, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { Avatar } from '../components/Avatar';
import { colors, gradients } from '../theme/colors';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext, User } from '../context/FirebaseContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

export const AddExpenseScreen: React.FC<Props> = ({ navigation, route }) => {
    const { group, expense, recipientId, amount: initialAmount, requestId, requestMemberIds, initialType } = route.params;
    const { addExpense, deleteExpense, currency, user, getGroupBalances } = useContext(FirebaseContext);

    const displayMembers = (group?.members || [])
        .filter((m: User) => !requestMemberIds || requestMemberIds.includes(m.id))
        .map((m: User) => ({
            ...m,
            name: m.id === user?.id ? 'You' : m.name
        }));

    const [type, setType] = useState<'expense' | 'settlement'>(initialType || (recipientId ? 'settlement' : 'expense'));
    const [title, setTitle] = useState(expense?.title || (recipientId ? `Payment to ${displayMembers.find(m => m.id === recipientId)?.name}` : ''));
    const [amount, setAmount] = useState(expense?.amount?.toString() || initialAmount?.toString() || '');
    const [paidBy, setPaidBy] = useState(expense?.paidBy || user?.id || '');
    const [splitWith, setSplitWith] = useState(expense?.splitWith || displayMembers.map(m => m.id));
    const [recipient, setRecipient] = useState<string | null>(expense?.splitWith?.[0] || recipientId || null);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (type === 'settlement' && recipient && paidBy) {
            const balances = getGroupBalances(group.id, requestId);
            const payerBalance = balances[paidBy] || 0;
            const recipientBalance = balances[recipient] || 0;

            if (payerBalance < 0 && recipientBalance > 0) {
                const suggestedAmount = Math.min(Math.abs(payerBalance), recipientBalance);
                if (suggestedAmount > 0) {
                    setAmount(suggestedAmount.toFixed(2));
                } else {
                    setAmount('');
                }
            } else {
                setAmount('');
            }
        }
    }, [recipient, type, paidBy, group.id]);

    const toggleSplitMember = (id: string) => {
        if (splitWith.includes(id)) {
            setSplitWith(splitWith.filter(mId => mId !== id));
        } else {
            setSplitWith([...splitWith, id]);
        }
    };

    const handleCreate = () => {
        if (!amount) return;
        if (type === 'expense' && !title) return;
        if (type === 'settlement' && !recipient) return;

        setLoading(true);
        setTimeout(() => {
            if (type === 'settlement' && recipient) {
                addExpense(group.id, `Payment to ${displayMembers.find(m => m.id === recipient)?.name}`, parseFloat(amount), paidBy, [recipient], 'settlement', requestId);
            } else {
                addExpense(group.id, title, parseFloat(amount), paidBy, splitWith, 'expense', requestId);
            }
            setLoading(false);
            navigation.goBack();
        }, 1000);
    };

    const handleSwap = () => {
        if (recipient) {
            const temp = paidBy;
            setPaidBy(recipient);
            setRecipient(temp);
        }
    };

    const currencySymbol = (0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="close" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, type === 'expense' && styles.activeToggle]}
                            onPress={() => setType('expense')}
                        >
                            <Text style={[styles.toggleText, type === 'expense' && styles.activeToggleText]}>Expense</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, type === 'settlement' && styles.activeToggle]}
                            onPress={() => setType('settlement')}
                        >
                            <Text style={[styles.toggleText, type === 'settlement' && styles.activeToggleText]}>Settle Up</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero Amount Input */}
                    <View style={styles.amountSection}>
                        <Text style={styles.currencyPrefix}>{currencySymbol}</Text>
                        <TextInput
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="decimal-pad"
                            style={styles.amountInput}
                            autoFocus={!expense}
                        />
                    </View>

                    {type === 'expense' ? (
                        <>
                            <View style={styles.inputGroup}>
                                <Ionicons name="document-text-outline" size={24} color={colors.accent} style={styles.inputIcon as any} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="What is this for?"
                                    placeholderTextColor={colors.textSecondary}
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>PAID BY</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                    {displayMembers.map(member => (
                                        <TouchableOpacity
                                            key={member.id}
                                            style={[styles.chip, paidBy === member.id && styles.activeChip]}
                                            onPress={() => setPaidBy(member.id)}
                                        >
                                            <Avatar source={{ uri: member.avatar }} size={28} />
                                            <Text style={[styles.chipText, paidBy === member.id && styles.activeChipText]}>
                                                {member.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>SPLIT WITH</Text>
                                <View style={styles.splitList}>
                                    {displayMembers.map(member => {
                                        const isSelected = splitWith.includes(member.id);
                                        const splitAmount = isSelected && amount
                                            ? parseFloat(amount) / Math.max(1, splitWith.length)
                                            : 0;

                                        return (
                                            <TouchableOpacity
                                                key={member.id}
                                                style={[styles.splitRow, isSelected && styles.activeSplitRow]}
                                                onPress={() => toggleSplitMember(member.id)}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                                    <Avatar source={{ uri: member.avatar }} size={36} />
                                                    <View>
                                                        <Text style={[styles.splitName, isSelected && styles.activeSplitName]}>{member.name}</Text>
                                                        {isSelected && (
                                                            <Text style={styles.splitAmount}>
                                                                {(0).toLocaleString('en-US', { style: 'currency', currency }).replace(/\d/g, '').replace('.', '').trim()}
                                                                {splitAmount.toFixed(2)}
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                                {isSelected && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </>
                    ) : (
                        // Settlement UI
                        // Settlement UI
                        <View style={{ marginTop: layout.spacing.l }}>
                            <View style={styles.settlementCard}>
                                <View style={styles.settlementUserCol}>
                                    <Text style={styles.settlementLabel}>Payer</Text>
                                    <View style={styles.settlementAvatarContainer}>
                                        <Avatar source={{ uri: displayMembers.find(m => m.id === paidBy)?.avatar || '' }} size={64} />
                                        <Text style={styles.settlementUserName} numberOfLines={1}>
                                            {displayMembers.find(m => m.id === paidBy)?.name}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.settlementArrow}
                                    onPress={handleSwap}
                                    activeOpacity={0.7}
                                >
                                    <LinearGradient
                                        colors={gradients.primary as any}
                                        style={styles.arrowCircle}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="swap-horizontal" size={24} color="#FFF" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.settlementUserCol}>
                                    <Text style={styles.settlementLabel}>Recipient</Text>
                                    <View style={styles.settlementAvatarContainer}>
                                        {recipient ? (
                                            <>
                                                <Avatar source={{ uri: displayMembers.find(m => m.id === recipient)?.avatar || '' }} size={64} />
                                                <Text style={styles.settlementUserName} numberOfLines={1}>
                                                    {displayMembers.find(m => m.id === recipient)?.name}
                                                </Text>
                                            </>
                                        ) : (
                                            <View style={styles.emptyAvatar}>
                                                <Ionicons name="help" size={32} color={colors.primary} />
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <Text style={[styles.sectionTitle, { marginTop: layout.spacing.xl, marginBottom: layout.spacing.m }]}>
                                WHO ARE YOU SETTLING WITH?
                            </Text>

                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                {displayMembers.filter(m => m.id !== paidBy).map(member => (
                                    <TouchableOpacity
                                        key={member.id}
                                        style={[
                                            styles.recipientChip,
                                            recipient === member.id && styles.activeRecipientChip
                                        ]}
                                        onPress={() => {
                                            setRecipient(member.id);
                                            // Optional: Update title if user wants logic there
                                        }}
                                    >
                                        <Avatar source={{ uri: member.avatar }} size={48} />
                                        <Text
                                            style={[
                                                styles.recipientName,
                                                recipient === member.id && styles.activeRecipientName
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {member.name}
                                        </Text>
                                        {recipient === member.id && (
                                            <View style={styles.checkmarkBadge}>
                                                <Ionicons name="checkmark" size={12} color="#FFF" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <GradientButton
                        title={type === 'settlement' ? "Settle Up" : "Save Expense"}
                        onPress={handleCreate}
                        loading={loading}
                        disabled={type === 'expense' ? (!title || !amount || splitWith.length === 0) : (!amount || !recipient)}
                        colors={(type === 'settlement' ? gradients.success : gradients.primary) as any}
                    />
                    {expense && (
                        <TouchableOpacity style={styles.deleteLink} onPress={() => { deleteExpense(expense.id); navigation.goBack(); }}>
                            <Text style={styles.deleteText}>Delete Expense</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layout.spacing.l,
        paddingVertical: layout.spacing.m,
    } as ViewStyle,
    backButton: {
        padding: layout.spacing.s,
        borderRadius: layout.borderRadius.round,
        backgroundColor: colors.surfaceHighlight,
    } as ViewStyle,
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.l,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: layout.borderRadius.m,
    } as ViewStyle,
    activeToggle: {
        backgroundColor: colors.surfaceHighlight,
    } as ViewStyle,
    toggleText: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        fontWeight: '600',
    } as TextStyle,
    activeToggleText: {
        color: colors.textPrimary,
    } as TextStyle,
    content: {
        paddingHorizontal: layout.spacing.l,
        paddingBottom: 150,
    } as ViewStyle,
    amountSection: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center', // Changed from flex-start to center for vertical alignment
        marginVertical: layout.spacing.xl,
    } as ViewStyle,
    currencyPrefix: {
        fontSize: 40,
        fontWeight: '300',
        color: colors.textSecondary,
        marginRight: 8,
        // Remove lineHeight or marginTop if possible to let flex align them
    } as TextStyle,
    amountInput: {
        fontSize: 64, // Huge font
        fontWeight: '700',
        color: colors.textPrimary,
        minWidth: 100,
        textAlign: 'center',
        padding: 0, // Reset padding
    } as TextStyle,
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.l,
        paddingHorizontal: layout.spacing.m,
        paddingVertical: layout.spacing.m,
        marginBottom: layout.spacing.l,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    inputIcon: {
        marginRight: layout.spacing.m,
    } as ViewStyle,
    textInput: {
        flex: 1,
        ...(typography.body1 as TextStyle),
        color: colors.textPrimary,
    } as TextStyle,
    section: {
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    sectionTitle: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        marginBottom: layout.spacing.m,
        fontWeight: '700',
        letterSpacing: 1,
    } as TextStyle,
    horizontalScroll: {
        flexDirection: 'row',
    } as ViewStyle,
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: layout.borderRadius.l,
        marginRight: layout.spacing.s,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    activeChip: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: colors.primary,
    } as ViewStyle,
    chipText: {
        marginLeft: 8,
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        fontWeight: '600',
    } as TextStyle,
    activeChipText: {
        color: colors.primaryLight,
    } as TextStyle,
    splitList: {
        gap: layout.spacing.s,
    } as ViewStyle,
    splitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: layout.spacing.m,
        borderRadius: layout.borderRadius.m,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    activeSplitRow: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
    } as ViewStyle,
    splitName: {
        ...(typography.body1 as TextStyle),
        color: colors.textPrimary,
        fontWeight: '500',
    } as TextStyle,
    activeSplitName: {
        color: colors.primary,
        fontWeight: '600',
    } as TextStyle,
    splitAmount: {
        ...(typography.caption as TextStyle),
        color: colors.success,
        marginTop: 2,
        fontWeight: '600',
    } as TextStyle,
    settlementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: layout.spacing.xl,
        borderRadius: layout.borderRadius.xl,
        borderWidth: 1,
        borderColor: colors.border,
    } as ViewStyle,
    settlementUserCol: {
        alignItems: 'center',
        flex: 1,
    } as ViewStyle,
    settlementLabel: {
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        marginBottom: layout.spacing.m,
        textTransform: 'uppercase',
    } as TextStyle,
    settlementAvatarContainer: {
        alignItems: 'center',
    } as ViewStyle,
    settlementUserName: {
        marginTop: layout.spacing.s,
        ...(typography.body2 as TextStyle),
        color: colors.textPrimary,
        fontWeight: '600',
        textAlign: 'center',
    } as TextStyle,
    settlementArrow: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    } as ViewStyle,
    arrowCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    emptyAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.surfaceHighlight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    } as ViewStyle,
    selectText: {
        ...(typography.caption as TextStyle),
        color: colors.primary,
        marginTop: 4,
        fontWeight: '600',
    } as TextStyle,
    recipientChip: {
        alignItems: 'center',
        marginRight: layout.spacing.l,
        width: 70,
        opacity: 0.7,
    } as ViewStyle,
    activeRecipientChip: {
        opacity: 1,
        transform: [{ scale: 1.05 }],
    } as ViewStyle,
    recipientName: {
        marginTop: 8,
        ...(typography.caption as TextStyle),
        color: colors.textSecondary,
        textAlign: 'center',
        width: '100%',
    } as TextStyle,
    activeRecipientName: {
        color: colors.primary,
        fontWeight: 'bold',
    } as TextStyle,
    checkmarkBadge: {
        position: 'absolute',
        top: 0,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    } as ViewStyle,
    footer: {
        padding: layout.spacing.l,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
    } as ViewStyle,
    deleteLink: {
        alignItems: 'center',
        marginTop: layout.spacing.m,
    } as ViewStyle,
    deleteText: {
        ...(typography.button as TextStyle),
        color: colors.error,
    } as TextStyle,
});

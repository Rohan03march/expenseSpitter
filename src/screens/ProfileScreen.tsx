import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GlassView } from '../components/GlassView';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { FirebaseContext } from '../context/FirebaseContext';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
    const { user, logout } = useContext(FirebaseContext);
    const { colors } = useTheme();

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
            </View>

            <View style={styles.content}>
                <GlassView style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: user?.avatar || 'https://i.pravatar.cc/300' }}
                            style={[styles.avatar, { backgroundColor: colors.surfaceLight }]}
                        />
                        <TouchableOpacity style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'Guest User'}</Text>
                    <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || 'guest@example.com'}</Text>
                </GlassView>

                {/* Menu Options */}
                <GlassView style={[styles.menuContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                        <Ionicons name="person-outline" size={24} color={colors.textPrimary} />
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                        <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
                        <Ionicons name="shield-checkmark-outline" size={24} color={colors.textPrimary} />
                        <Text style={[styles.menuText, { color: colors.textPrimary }]}>Privacy & Security</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </GlassView>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: layout.spacing.l,
        paddingTop: layout.spacing.m,
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h1 as TextStyle),
    } as TextStyle,
    content: {
        paddingHorizontal: layout.spacing.l,
    } as ViewStyle,
    profileCard: {
        alignItems: 'center',
        padding: layout.spacing.xl,
        marginBottom: layout.spacing.xl,
        borderWidth: 1,
    } as ViewStyle,
    avatarContainer: {
        marginBottom: layout.spacing.m,
        position: 'relative',
    } as ViewStyle,
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    } as ImageStyle,
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    } as ViewStyle,
    userName: {
        ...(typography.h2 as TextStyle),
        marginBottom: 4,
    } as TextStyle,
    userEmail: {
        ...(typography.body2 as TextStyle),
    } as TextStyle,
    menuContainer: {
        padding: layout.spacing.m,
        marginBottom: layout.spacing.xl,
        borderWidth: 1,
    } as ViewStyle,
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: layout.spacing.m,
        borderBottomWidth: 1,
    } as ViewStyle,
    menuText: {
        ...(typography.body1 as TextStyle),
        flex: 1,
        marginLeft: layout.spacing.m,
    } as TextStyle,
    logoutButton: {
        alignItems: 'center',
        paddingVertical: layout.spacing.m,
    } as ViewStyle,
    logoutText: {
        ...(typography.button as TextStyle),
    } as TextStyle,
});

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, TextInput, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, ViewStyle, TextStyle } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';
import { FirebaseContext } from '../context/FirebaseContext';
import { Avatar } from '../components/Avatar';
import { GlassView } from '../components/GlassView';
import { GradientButton } from '../components/GradientButton';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { BlurView } from 'expo-blur';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

// ... (EditProfileModal and ChangePasswordModal remain largely same but accessing colors from hook would be better. For now keeping them as is might break them if I remove 'colors' export, but I kept 'colors' export for compat. I will update them to use hook for correctness.)

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
    initialName: string;
    initialAvatar: string;
    onSave: (name: string, avatar?: string) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose, initialName, initialAvatar, onSave }) => {
    const { colors, isDark } = useTheme();
    const [name, setName] = useState(initialName);
    const [avatar, setAvatar] = useState(initialAvatar);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setName(initialName);
            setAvatar(initialAvatar);
        }
    }, [visible, initialName, initialAvatar]);

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.2,
            });

            if (!result.canceled) {
                setAvatar(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setLoading(true);
        try {
            let uploadedAvatarUrl = avatar;
            if (avatar !== initialAvatar && !avatar.startsWith('http')) {
                const url = await uploadImageToCloudinary(avatar);
                if (url) {
                    uploadedAvatarUrl = url;
                } else {
                    Alert.alert("Warning", "Failed to upload image. Saving with local URI (only works locally).");
                }
            } else if (avatar !== initialAvatar && avatar.startsWith('file://')) {
                const url = await uploadImageToCloudinary(avatar);
                if (url) uploadedAvatarUrl = url;
            }

            await onSave(name, uploadedAvatarUrl);
            onClose();
        } catch (error) {
            Alert.alert("Error", "Failed to update profile");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={styles.modalContainer}>
                    <GlassView style={styles.modalContent} intensity={95}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
                            <TouchableOpacity onPress={onClose} disabled={loading}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={pickImage} disabled={loading}>
                                <Avatar source={{ uri: avatar }} size={100} />
                                <View style={[styles.editAvatarBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                                    <Ionicons name="camera" size={20} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.textSecondary}
                                autoCapitalize="words"
                            />
                        </View>

                        <GradientButton
                            title={loading ? "Saving..." : "Save Changes"}
                            onPress={handleSave}
                            disabled={loading}
                            style={{ marginTop: layout.spacing.l }}
                        />
                    </GlassView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

interface ChangePasswordModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (password: string) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose, onSave }) => {
    const { colors, isDark } = useTheme();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            setPassword('');
            setConfirmPassword('');
        }
    }, [visible]);

    const handleSave = async () => {
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await onSave(password);
            Alert.alert("Success", "Password updated successfully");
            onClose();
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update password. You may need to re-login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={styles.modalContainer}>
                    <GlassView style={styles.modalContent} intensity={95}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Password</Text>
                            <TouchableOpacity onPress={onClose} disabled={loading}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter new password"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Confirm new password"
                                placeholderTextColor={colors.textSecondary}
                                secureTextEntry
                            />
                        </View>

                        <GradientButton
                            title={loading ? "Updating..." : "Update Password"}
                            onPress={handleSave}
                            disabled={loading}
                            style={{ marginTop: layout.spacing.l }}
                        />
                    </GlassView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const { user, logout, currency, toggleCurrency, updateUserProfile, changePassword } = useContext(FirebaseContext);
    const { colors, theme, toggleTheme } = useTheme();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);

    const renderItem = (icon: string, label: string, trailing?: React.ReactNode, onPress?: () => void, danger: boolean = false) => (
        <TouchableOpacity
            style={[styles.item, danger && styles.dangerItem]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: danger ? `${colors.error}20` : `${colors.primary}15` }]}>
                    <Ionicons name={icon as any} size={20} color={danger ? colors.error : colors.primary} />
                </View>
                <Text style={[styles.itemLabel, { color: danger ? colors.error : colors.textPrimary }]}>{label}</Text>
            </View>
            {trailing ? trailing : <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Profile Card */}
                <View style={styles.profileSection}>
                    <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
                        <Avatar source={{ uri: user?.avatar || 'https://via.placeholder.com/150' }} size={80} />
                        <View style={styles.profileInfo}>
                            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'email@example.com'}</Text>
                        </View>
                        <TouchableOpacity style={[styles.editButton, { backgroundColor: `${colors.primary}15` }]} onPress={() => setEditModalVisible(true)}>
                            <Ionicons name="pencil" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Preferences */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>PREFERENCES</Text>
                <GlassView style={styles.sectionContainer}>
                    {renderItem(
                        "cash-outline",
                        "Currency",
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: colors.textSecondary, marginRight: 8, fontWeight: '600' }}>{currency}</Text>
                            <Switch
                                value={currency === 'INR'}
                                onValueChange={toggleCurrency}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={'#FFF'}
                            />
                        </View>
                    )}
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    {renderItem(
                        "moon-outline",
                        "Dark Mode",
                        <Switch
                            value={theme === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={'#FFF'}
                        />
                    )}
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    {renderItem("notifications-outline", "Notifications", <Switch value={true} disabled trackColor={{ false: colors.border, true: colors.primary }} />)}
                </GlassView>

                {/* Account */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ACCOUNT</Text>
                <GlassView style={styles.sectionContainer}>
                    {renderItem("person-outline", "Edit Profile", undefined, () => setEditModalVisible(true))}
                    <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    {renderItem("lock-closed-outline", "Change Password", undefined, () => setPasswordModalVisible(true))}
                </GlassView>

                {/* Danger Zone */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SESSION</Text>
                <GlassView style={styles.sectionContainer}>
                    {renderItem("log-out-outline", "Log Out", null, () => {
                        Alert.alert(
                            "Log Out",
                            "Are you sure you want to log out?",
                            [
                                {
                                    text: "Cancel",
                                    style: "cancel"
                                },
                                {
                                    text: "Log Out",
                                    style: "destructive",
                                    onPress: logout
                                }
                            ]
                        );
                    }, true)}
                </GlassView>

                <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
            </ScrollView>

            {user && (
                <EditProfileModal
                    visible={editModalVisible}
                    onClose={() => setEditModalVisible(false)}
                    initialName={user.name}
                    initialAvatar={user.avatar}
                    onSave={updateUserProfile}
                />
            )}

            <ChangePasswordModal
                visible={passwordModalVisible}
                onClose={() => setPasswordModalVisible(false)}
                onSave={changePassword}
            />
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: layout.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: layout.spacing.l,
        paddingTop: layout.spacing.m,
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    backButton: {
        padding: 4,
    } as ViewStyle,
    headerTitle: {
        ...(typography.h2 as TextStyle),
    } as TextStyle,
    profileSection: {
        marginBottom: layout.spacing.l,
        paddingHorizontal: layout.spacing.l,
    } as ViewStyle,
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: layout.borderRadius.l,
        padding: layout.spacing.l,
        ...layout.shadows.medium,
    } as ViewStyle,
    profileInfo: {
        flex: 1,
        marginLeft: layout.spacing.m,
    } as ViewStyle,
    profileName: {
        ...(typography.h3 as TextStyle),
        marginBottom: 4,
    } as TextStyle,
    profileEmail: {
        ...(typography.body2 as TextStyle),
    } as TextStyle,
    editButton: {
        padding: 8,
        borderRadius: layout.borderRadius.m,
    } as ViewStyle,
    sectionHeader: {
        ...(typography.caption as TextStyle),
        paddingHorizontal: layout.spacing.xl,
        marginBottom: layout.spacing.s,
        marginTop: layout.spacing.m,
        fontWeight: 'bold',
        letterSpacing: 1,
    } as TextStyle,
    sectionContainer: {
        marginHorizontal: layout.spacing.l,
        padding: 0,
    } as ViewStyle,
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: layout.spacing.m,
        paddingHorizontal: 0,
    } as ViewStyle,
    dangerItem: {
        // Special style for danger items if needed
    } as ViewStyle,
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: layout.spacing.m,
    } as ViewStyle,
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    } as ViewStyle,
    itemLabel: {
        ...(typography.body1 as TextStyle),
        fontWeight: '500',
    } as TextStyle,
    separator: {
        height: 1,
        marginLeft: 48,
    } as ViewStyle,
    versionText: {
        textAlign: 'center',
        marginTop: layout.spacing.xl,
        ...(typography.caption as TextStyle),
    } as TextStyle,
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: layout.spacing.l,
    } as ViewStyle,
    modalContainer: {
        width: '100%',
        maxWidth: 400,
    } as ViewStyle,
    modalContent: {
        width: '100%',
    } as ViewStyle,
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    modalTitle: {
        ...(typography.h3 as TextStyle),
    } as TextStyle,
    avatarContainer: {
        alignItems: 'center',
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    editAvatarBadge: {
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
    inputContainer: {
        marginBottom: layout.spacing.l,
    } as ViewStyle,
    label: {
        ...(typography.body2 as TextStyle),
        marginBottom: layout.spacing.s,
        marginLeft: layout.spacing.s,
    } as TextStyle,
    input: {
        borderRadius: layout.borderRadius.m,
        padding: layout.spacing.m,
        borderWidth: 1,
        fontSize: 16,
    } as TextStyle,
});

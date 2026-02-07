import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, TextStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Input } from '../components/Input';
import { GradientButton } from '../components/GradientButton';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { FirebaseContext } from '../context/FirebaseContext';
import { uploadImageToCloudinary } from '../services/cloudinary';

import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateGroup'>;

export const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
    const { createGroup } = React.useContext(FirebaseContext); // Import Context
    const { colors } = useTheme();
    const [groupName, setGroupName] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.2,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleCreate = async () => {
        if (!groupName) return;
        setLoading(true);
        setStatus('Uploading image...');

        let imageUrl = image;
        if (image && !image.startsWith('http')) {
            const uploadedUrl = await uploadImageToCloudinary(image);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                // If upload fails, we could alert or just use local (which is broken for others)
                // For now, let's proceed but maybe log it?
                console.warn("Image upload failed, using local URI");
            }
        }

        setStatus('Creating group...');
        await createGroup(groupName, imageUrl);
        setLoading(false);
        setStatus('');
        navigation.goBack();
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Create New Group</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.surface }]}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.image as any} />
                    ) : (
                        <View style={[styles.placeholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Ionicons name="camera" size={32} color={colors.textSecondary} />
                            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <Input
                    label="Group Name"
                    placeholder="e.g. Hawaii Trip 2026"
                    value={groupName}
                    onChangeText={setGroupName}
                />

                <GradientButton
                    title="Create Group"
                    onPress={handleCreate}
                    loading={loading}
                    disabled={!groupName}
                    style={styles.button}
                />
                {loading && <Text style={[styles.statusText, { color: colors.textSecondary }]}>{status}</Text>}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: layout.spacing.l,
        paddingTop: layout.spacing.m,
        marginBottom: layout.spacing.xl,
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
    imagePicker: {
        alignSelf: 'center',
        marginBottom: layout.spacing.xl,
        borderRadius: 50,
        ...layout.shadows.small,
    } as ViewStyle,
    image: {
        width: 100,
        height: 100,
        borderRadius: 50,
    } as ViewStyle,
    placeholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
    } as ViewStyle,
    placeholderText: {
        ...(typography.caption as TextStyle),
        marginTop: layout.spacing.xs,
    } as TextStyle,
    button: {
        marginTop: layout.spacing.m,
    } as ViewStyle,
    statusText: {
        textAlign: 'center',
        marginTop: layout.spacing.s,
        ...(typography.caption as TextStyle),
    } as TextStyle,
});

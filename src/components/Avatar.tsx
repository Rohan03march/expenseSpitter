import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { colors } from '../theme/colors';

interface AvatarProps {
    source: ImageSource | string;
    size?: number;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({ source, size = 40, style }) => {
    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
            <Image
                source={source}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surfaceLight,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
});

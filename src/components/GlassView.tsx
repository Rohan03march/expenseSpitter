import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

interface GlassViewProps {
    children: ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export const GlassView: React.FC<GlassViewProps> = ({ children, style, intensity = 20 }) => {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: layout.borderRadius.l,
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'android' ? 'rgba(30, 41, 59, 0.8)' : 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
    },
    content: {
        padding: layout.spacing.m,
    }
});

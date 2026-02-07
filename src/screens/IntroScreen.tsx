import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Illustration } from '../components/Illustration';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { layout } from '../theme/layout';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Intro'>;

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Split Bills Effortlessly',
        description: 'Track expenses with friends and family. No more awkward math.',
        image: 'finance' as const,
    },
    {
        id: '2',
        title: 'Stay Connected',
        description: 'Chat, plan, and manage your groups all in one place.',
        image: 'friends' as const,
    },
    {
        id: '3',
        title: 'Settle Up Instantly',
        description: 'Keep track of balances and settle debts with a single tap.',
        image: 'settle' as const,
    },
];

export const IntroScreen: React.FC<Props> = ({ navigation }) => {
    const { colors } = useTheme();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await AsyncStorage.setItem('hasSeenIntro', 'true');
            navigation.replace('Welcome');
        }
    };

    const handleSkip = async () => {
        await AsyncStorage.setItem('hasSeenIntro', 'true');
        navigation.replace('Welcome');
    };

    const onMomentumScrollEnd = (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    return (
        <ScreenWrapper>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: colors.primary }]}>Skip</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <View style={styles.imageContainer}>
                            <Illustration type={item.image} width={280} height={280} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
                            <Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text>
                        </View>
                    </View>
                )}
            />

            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: colors.surfaceLight },
                                currentIndex === index && { backgroundColor: colors.primary, width: 20 }
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: layout.spacing.l,
    } as ViewStyle,
    skipText: {
        ...(typography.body2 as TextStyle),
        fontWeight: '600',
    } as TextStyle,
    slide: {
        width: width,
        alignItems: 'center',
        paddingHorizontal: layout.spacing.xl,
    } as ViewStyle,
    imageContainer: {
        flex: 0.6,
        justifyContent: 'center',
        alignItems: 'center',
    } as ViewStyle,
    textContainer: {
        flex: 0.4,
        alignItems: 'center',
    } as ViewStyle,
    title: {
        ...(typography.h1 as TextStyle),
        textAlign: 'center',
        marginBottom: layout.spacing.m,
    } as TextStyle,
    description: {
        ...(typography.body1 as TextStyle),
        textAlign: 'center',
        lineHeight: 24,
    } as TextStyle,
    footer: {
        padding: layout.spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as ViewStyle,
    pagination: {
        flexDirection: 'row',
        gap: layout.spacing.s,
    } as ViewStyle,
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    } as ViewStyle,
    nextButton: {
        paddingHorizontal: layout.spacing.l,
        paddingVertical: layout.spacing.m,
        borderRadius: layout.borderRadius.round,
    } as ViewStyle,
    nextButtonText: {
        ...(typography.button as TextStyle),
        color: '#FFF',
    } as TextStyle,
});

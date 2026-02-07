import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface IllustrationProps {
    type: 'finance' | 'friends' | 'settle' | 'logo';
    width?: number;
    height?: number;
    style?: ViewStyle;
}

export const Illustration: React.FC<IllustrationProps> = ({ type, width = 200, height = 200, style }) => {
    const { colors } = useTheme();

    const renderContent = () => {
        switch (type) {
            case 'logo':
                return (
                    // Abstract Hexagon/Cube Logo
                    <G>
                        <Path
                            d="M100 20 L180 60 L180 140 L100 180 L20 140 L20 60 Z"
                            fill="url(#grad1)"
                            stroke={colors.primaryLight || colors.primary} // fallback if primaryLight not in theme colors type yet, but it should be? Check colors.ts. Actually colors.ts usually has primaryLight.
                            strokeWidth="2"
                        />
                        <Path
                            d="M100 180 L100 100 L180 60"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="2"
                        />
                        <Path
                            d="M100 100 L20 60"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="2"
                        />
                        <Circle cx="100" cy="100" r="15" fill={colors.secondary} />
                    </G>
                );
            case 'finance':
                return (
                    // Charts and Coins
                    <G>
                        <Circle cx="100" cy="100" r="80" fill="url(#grad1)" opacity="0.1" />
                        <Path
                            d="M40 140 L80 100 L110 120 L160 60"
                            stroke={colors.secondary}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                        <Circle cx="160" cy="60" r="8" fill={colors.secondary} />
                        <Circle cx="150" cy="140" r="20" fill={colors.primary} opacity="0.8" />
                        <Circle cx="50" cy="60" r="12" fill={colors.warning} opacity="0.8" />
                    </G>
                );
            case 'friends':
                return (
                    // Connected People Nodes
                    <G>
                        <Circle cx="100" cy="80" r="30" fill="url(#grad1)" />
                        <Circle cx="40" cy="150" r="20" fill={colors.textSecondary} opacity="0.5" />
                        <Circle cx="160" cy="150" r="20" fill={colors.textSecondary} opacity="0.5" />
                        <Path d="M70 130 L90 105" stroke={colors.textSecondary} strokeWidth="3" />
                        <Path d="M130 130 L110 105" stroke={colors.textSecondary} strokeWidth="3" />
                    </G>
                );
            case 'settle':
                return (
                    // Handshake / Checkmark
                    <G>
                        <Circle cx="100" cy="100" r="70" fill={colors.success} opacity="0.2" />
                        <Path
                            d="M60 100 L90 130 L140 70"
                            stroke={colors.success}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />
                    </G>
                );
            default:
                return null;
        }
    };

    return (
        <View style={[style, { width, height }]}>
            <Svg width="100%" height="100%" viewBox="0 0 200 200">
                <Defs>
                    <LinearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor={colors.primary} stopOpacity="1" />
                        <Stop offset="1" stopColor={colors.primaryDark || colors.primary} stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                {renderContent()}
            </Svg>
        </View>
    );
};

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Path, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface TravelBackgroundProps {
    children?: React.ReactNode;
}

const TravelBackground: React.FC<TravelBackgroundProps> = ({ children }) => {
    const { colors, isDark } = useTheme();

    // Subtle colors for the icons - significantly reduced opacity for "watermark" effect
    const iconColor = isDark ? '#FFFFFF' : '#000000';
    const iconOpacity = isDark ? 0.05 : 0.03;
    const bgColor = colors.background;

    // SVG Paths (Standard 24x24 ViewBox)
    const airplanePath = "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z";
    const globePath = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z";
    const suitcasePath = "M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4h6v2H9V4zm11 15H4V8h16v11z";
    const compassPath = "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5 7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z";

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <View style={styles.patternContainer}>
                <Svg height="100%" width="100%">
                    <Defs>
                        <Pattern
                            id="TravelPattern"
                            patternUnits="userSpaceOnUse"
                            width="100"
                            height="100"
                            patternTransform="rotate(15)"
                        >
                            {/* Airplane */}
                            <G transform="translate(10, 10) scale(1.2)">
                                <Path d={airplanePath} fill={iconColor} opacity={iconOpacity} />
                            </G>

                            {/* Globe - Offset */}
                            <G transform="translate(60, 50) scale(1.2)">
                                <Path d={globePath} fill={iconColor} opacity={iconOpacity} />
                            </G>

                            {/* Suitcase */}
                            <G transform="translate(10, 60) scale(1.0)">
                                <Path d={suitcasePath} fill={iconColor} opacity={iconOpacity} />
                            </G>

                            {/* Compass - Offset */}
                            <G transform="translate(60, 10) scale(1.1)">
                                <Path d={compassPath} fill={iconColor} opacity={iconOpacity} />
                            </G>
                        </Pattern>
                    </Defs>

                    {/* Fill the entire screen with the pattern */}
                    <Rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="url(#TravelPattern)"
                    />
                </Svg>
            </View>
            <View style={styles.contentContainer}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    patternContainer: {
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none', // Allow touches to pass through pattern
    },
    contentContainer: {
        flex: 1,
    }
});

export default TravelBackground;

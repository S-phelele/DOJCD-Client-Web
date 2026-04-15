// utils/responsive.ts
// Web version – replaces React Native's Dimensions, Platform, PixelRatio

// Get current window dimensions (with resize listener)
let windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
let windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

if (typeof window !== 'undefined') {
    window.addEventListener('resize', () => {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
    });
}

// Guideline base sizes (same as original)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Breakpoints (same as original)
export const breakpoints = {
    xs: 320,
    sm: 375,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
};

// Simple PixelRatio replacement – round to nearest pixel (0.5 increments)
const roundToNearestPixel = (value: number): number => {
    return Math.round(value * 2) / 2;
};

// Detect platform from user agent (simple)
const getPlatform = () => {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'web';
};

const platform = getPlatform();

// Screen size classification (reactive – updates on resize)
export const screenSize = {
    get isExtraSmall() { return windowWidth < breakpoints.xs; },
    get isSmall() { return windowWidth >= breakpoints.xs && windowWidth < breakpoints.sm; },
    get isMedium() { return windowWidth >= breakpoints.sm && windowWidth < breakpoints.md; },
    get isLarge() { return windowWidth >= breakpoints.md && windowWidth < breakpoints.lg; },
    get isExtraLarge() { return windowWidth >= breakpoints.lg && windowWidth < breakpoints.xl; },
    get isXXLarge() { return windowWidth >= breakpoints.xl; },
    get isPhone() { return windowWidth < breakpoints.md; },
    get isTablet() { return windowWidth >= breakpoints.md && windowWidth < breakpoints.lg; },
    get isDesktop() { return windowWidth >= breakpoints.lg; },
    get isTall() { return windowHeight > 800; },
    get isShort() { return windowHeight < 600; },
    get isIOS() { return platform === 'ios'; },
    get isAndroid() { return platform === 'android'; },
    get isWeb() { return platform === 'web'; },
    get width() { return windowWidth; },
    get height() { return windowHeight; },
    get aspectRatio() { return windowWidth / windowHeight; },
};

// Scale functions
export const scale = (size: number): number => {
    const scaleFactor = windowWidth / guidelineBaseWidth;
    let scaledSize = size * scaleFactor;
    const minSize = size * 0.8;
    const maxSize = size * 1.5;
    return roundToNearestPixel(Math.max(minSize, Math.min(scaledSize, maxSize)));
};

export const verticalScale = (size: number): number => {
    const scaleFactor = windowHeight / guidelineBaseHeight;
    let scaledSize = size * scaleFactor;
    const minSize = size * 0.8;
    const maxSize = size * 1.5;
    return roundToNearestPixel(Math.max(minSize, Math.min(scaledSize, maxSize)));
};

export const moderateScale = (size: number, factor = 0.5): number => {
    const scaledSize = scale(size);
    return size + (scaledSize - size) * factor;
};

// Responsive helper object
export const responsive = {
    fontSize: {
        get xs() { return scale(10); },
        get sm() { return scale(12); },
        get base() { return screenSize.isDesktop ? 16 : scale(14); },
        get lg() { return screenSize.isDesktop ? 18 : scale(16); },
        get xl() { return screenSize.isDesktop ? 20 : scale(18); },
        get '2xl'() { return screenSize.isDesktop ? 24 : scale(20); },
        get '3xl'() { return screenSize.isDesktop ? 30 : scale(24); },
        get '4xl'() { return screenSize.isDesktop ? 36 : scale(30); },
        get '5xl'() { return screenSize.isDesktop ? 48 : scale(36); },
        dynamic: (baseSize: number) => {
            if (screenSize.isDesktop) return baseSize * 1.25;
            if (screenSize.isTablet) return baseSize * 1.1;
            return scale(baseSize);
        },
    },
    spacing: {
        get xs() { return screenSize.isDesktop ? 6 : scale(4); },
        get sm() { return screenSize.isDesktop ? 10 : scale(8); },
        get md() { return screenSize.isDesktop ? 16 : scale(12); },
        get lg() { return screenSize.isDesktop ? 24 : scale(16); },
        get xl() { return screenSize.isDesktop ? 32 : scale(24); },
        get '2xl'() { return screenSize.isDesktop ? 48 : scale(32); },
        get '3xl'() { return screenSize.isDesktop ? 64 : scale(48); },
        get '4xl'() { return screenSize.isDesktop ? 96 : scale(64); },
        dynamic: (baseSpacing: number) => {
            if (screenSize.isDesktop) return baseSpacing * 1.5;
            if (screenSize.isTablet) return baseSpacing * 1.25;
            return scale(baseSpacing);
        },
    },
    layout: {
        get maxContentWidth() {
            if (screenSize.isDesktop) return 1200;
            if (screenSize.isTablet) return 800;
            return '100%';
        },
        contentPadding: {
            get horizontal() {
                if (screenSize.isDesktop) return 64;
                if (screenSize.isTablet) return 48;
                return 24;
            },
            get vertical() {
                if (screenSize.isDesktop) return 48;
                if (screenSize.isTablet) return 32;
                return 16;
            },
        },
        get sectionSpacing() {
            if (screenSize.isDesktop) return 96;
            if (screenSize.isTablet) return 64;
            return 48;
        },
    },
    grid: {
        columns: () => {
            if (screenSize.isDesktop) return 12;
            if (screenSize.isTablet) return 8;
            return 4;
        },
        get gutter() {
            if (screenSize.isDesktop) return 32;
            if (screenSize.isTablet) return 24;
            return 16;
        },
    },
};

// Platform styles – now web-first with CSS box‑shadow
export const platformStyle = {
    ios: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    android: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    web: {
        boxShadow: screenSize.isDesktop ? '0 4px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
};

// Platform fonts – web‑optimised
export const platformFont = {
    ios: {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        letterSpacing: '-0.2px',
    },
    android: {
        fontFamily: "'Roboto', 'Noto Sans', sans-serif",
    },
    web: {
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
    },
};

// Media query helpers (string for use in CSS-in-JS)
export const mediaQuery = {
    minWidth: (bp: number) => `@media (min-width: ${bp}px)`,
    maxWidth: (bp: number) => `@media (max-width: ${bp}px)`,
    between: (min: number, max: number) => `@media (min-width: ${min}px) and (max-width: ${max}px)`,
};

// Hook for responsive values (re‑runs on window resize)
import { useEffect, useState } from 'react';
export const useResponsiveValue = <T,>(
    phoneValue: T,
    tabletValue: T,
    desktopValue: T
): T => {
    const [value, setValue] = useState<T>(() => {
        if (screenSize.isDesktop) return desktopValue;
        if (screenSize.isTablet) return tabletValue;
        return phoneValue;
    });

    useEffect(() => {
        const handler = () => {
            const newVal = screenSize.isDesktop ? desktopValue : screenSize.isTablet ? tabletValue : phoneValue;
            setValue(newVal);
        };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [phoneValue, tabletValue, desktopValue]);

    return value;
};

// Re‑export width, height (getters so they stay live)
export const width = () => windowWidth;
export const height = () => windowHeight;

export default {
    scale,
    verticalScale,
    moderateScale,
    responsive,
    screenSize,
    breakpoints,
    platformStyle,
    platformFont,
    mediaQuery,
    useResponsiveValue,
    width,
    height,
};
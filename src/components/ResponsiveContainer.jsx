// components/ResponsiveContainer.jsx
import React from 'react';

// Default responsive values (can be overridden via props or CSS)
const DEFAULT_MAX_WIDTH = '1200px';
const DEFAULT_PADDING_HORIZONTAL = '16px';
const DEFAULT_PADDING_VERTICAL = '0px';

interface ResponsiveContainerProps {
    children: React.ReactNode;
    fullWidth?: boolean;
    centered?: boolean;
    scrollable?: boolean;
    safeArea?: boolean; // On web, safe area is not needed, but kept for API compatibility
    style?: React.CSSProperties;
    maxWidth?: string;   // allow custom max width
    paddingHorizontal?: string;
    paddingVertical?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
                                                                            children,
                                                                            fullWidth = false,
                                                                            centered = false,
                                                                            scrollable = false,
                                                                            safeArea = true,
                                                                            style,
                                                                            maxWidth,
                                                                            paddingHorizontal,
                                                                            paddingVertical,
                                                                        }) => {
    const containerStyle: React.CSSProperties = {
        width: '100%',
        marginLeft: 'auto',
        marginRight: 'auto',
        maxWidth: fullWidth ? '100%' : (maxWidth || DEFAULT_MAX_WIDTH),
        paddingLeft: paddingHorizontal || DEFAULT_PADDING_HORIZONTAL,
        paddingRight: paddingHorizontal || DEFAULT_PADDING_HORIZONTAL,
        paddingTop: (safeArea ? (paddingVertical || DEFAULT_PADDING_VERTICAL) : 0),
        paddingBottom: (safeArea ? (paddingVertical || DEFAULT_PADDING_VERTICAL) : 0),
        display: 'flex',
        flexDirection: 'column',
        alignItems: centered ? 'center' : 'stretch',
        ...style,
    };

    const content = <div style={containerStyle}>{children}</div>;

    if (scrollable) {
        return (
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {content}
            </div>
        );
    }

    return content;
};

export default ResponsiveContainer;
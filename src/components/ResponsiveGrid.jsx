// components/ResponsiveGrid.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';

// Custom hook to track window width
const useWindowWidth = () => {
    const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return width;
};

// Breakpoints
const BREAKPOINTS = { phone: 768, tablet: 1024 };

// Spacing values (in px) – you can adjust these or import from responsive utils
const SPACING = { none: 0, sm: 8, md: 16, lg: 24, xl: 32 };

export const ResponsiveGrid = ({
                                   children,
                                   columns = { phone: 1, tablet: 2, desktop: 3 },
                                   spacing = 'md',
                                   itemMinWidth = 280,
                                   maxWidth = '100%',
                                   align = 'center',
                                   scrollable = false,
                                   style,
                               }) => {
    const windowWidth = useWindowWidth();
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Measure container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Determine spacing value in px
    const spacingValue = typeof spacing === 'number'
        ? spacing
        : SPACING[spacing] ?? SPACING.md;

    // Determine base column count based on screen size
    const getBaseColumnCount = () => {
        if (typeof columns === 'number') {
            // Original logic: desktop >= 3, tablet >= 2, phone >= 1
            if (windowWidth >= BREAKPOINTS.tablet) return Math.max(columns, 3);
            if (windowWidth >= BREAKPOINTS.phone) return Math.max(columns, 2);
            return Math.max(columns, 1);
        } else {
            if (windowWidth >= BREAKPOINTS.tablet) return columns.desktop;
            if (windowWidth >= BREAKPOINTS.phone) return columns.tablet;
            return columns.phone;
        }
    };

    const baseColumns = getBaseColumnCount();

    // Adjust columns to respect itemMinWidth
    const actualColumns = useMemo(() => {
        if (baseColumns === 1) return 1;
        const availableWidth = containerWidth || windowWidth;
        // Calculate max possible columns with min width
        const maxPossible = Math.floor((availableWidth + spacingValue) / (itemMinWidth + spacingValue));
        return Math.min(baseColumns, Math.max(1, maxPossible));
    }, [baseColumns, containerWidth, windowWidth, spacingValue, itemMinWidth]);

    // Grid alignment (justify-content)
    const justifyContent = align === 'space-between' ? 'space-between' : 'flex-start';

    // Grid container style
    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${actualColumns}, minmax(0, 1fr))`,
        gap: `${spacingValue}px`,
        justifyContent,
        width: '100%',
        maxWidth: maxWidth === '100%' ? '100%' : `${maxWidth}px`,
        marginLeft: 'auto',
        marginRight: 'auto',
        ...style,
    };

    const content = (
        <div ref={containerRef} style={gridStyle}>
            {React.Children.map(children, (child, index) => (
                <div key={index} style={{ minWidth: 0, width: '100%' }}>
                    {child}
                </div>
            ))}
        </div>
    );

    // For phone screens and scrollable=true, wrap in horizontal scroll container
    if (scrollable && windowWidth < BREAKPOINTS.tablet) {
        return (
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <div style={{ minWidth: 'max-content' }}>{content}</div>
            </div>
        );
    }

    return content;
};

export default ResponsiveGrid;
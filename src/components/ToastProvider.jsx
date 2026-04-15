// components/ToastProvider.jsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
    IoCheckmarkCircle,
    IoCloseCircle,
    IoWarning,
    IoInformationCircle,
    IoClose,
} from 'react-icons/io5';

// Toast types
const TOAST_CONFIG = {
    success: { bg: '#f0fdf4', border: '#22c55e', icon: IoCheckmarkCircle, iconColor: '#16a34a' },
    error: { bg: '#fef2f2', border: '#ef4444', icon: IoCloseCircle, iconColor: '#dc2626' },
    warning: { bg: '#fffbeb', border: '#f59e0b', icon: IoWarning, iconColor: '#d97706' },
    info: { bg: '#eff6ff', border: '#3b82f6', icon: IoInformationCircle, iconColor: '#2563eb' },
};

const DURATIONS = { success: 3500, info: 3500, warning: 4500, error: 5500 };

const ToastContext = createContext(null);

function ToastItem({ toast, onDismiss }) {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);
    const config = TOAST_CONFIG[toast.type];
    const Icon = config.icon;

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        timeoutRef.current = setTimeout(() => {
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 250);
        }, DURATIONS[toast.type]);
        return () => clearTimeout(timeoutRef.current);
    }, []);

    const handleDismiss = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 250);
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 14,
                borderLeftWidth: 4,
                borderLeftStyle: 'solid',
                borderLeftColor: config.border,
                backgroundColor: config.bg,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                transform: visible ? 'translateY(0)' : 'translateY(-100%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                marginBottom: 8,
            }}
        >
            <Icon size={22} color={config.iconColor} style={{ marginRight: 12, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: '700', marginBottom: 2, color: config.iconColor }}>
                    {toast.title}
                </div>
                {toast.message && <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{toast.message}</div>}
            </div>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>
                <IoClose size={18} color="#94a3b8" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [safeTop, setSafeTop] = useState(0);

    useEffect(() => {
        const getSafeTop = () => {
            const style = getComputedStyle(document.documentElement);
            const safeTopVal = style.getPropertyValue('env(safe-area-inset-top)');
            return safeTopVal && safeTopVal !== '0px' ? parseInt(safeTopVal, 10) : 0;
        };
        setSafeTop(getSafeTop());
        const handleResize = () => setSafeTop(getSafeTop());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const show = useCallback((type, title, message) => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts(prev => {
            const trimmed = prev.length >= 3 ? prev.slice(1) : prev;
            return [...trimmed, { id, type, title, message }];
        });
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const value = {
        success: (title, message) => show('success', title, message),
        error: (title, message) => show('error', title, message),
        warning: (title, message) => show('warning', title, message),
        info: (title, message) => show('info', title, message),
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div style={{ position: 'fixed', left: 16, right: 16, top: safeTop + 12, zIndex: 9999, pointerEvents: 'none' }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{ pointerEvents: 'auto' }}>
                        <ToastItem toast={toast} onDismiss={dismiss} />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}
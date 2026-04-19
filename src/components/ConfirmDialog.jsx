// components/ConfirmDialog.jsx
// Reusable confirmation popup. Replaces all window.confirm() calls
// across the app. Used for: logout, apply for device, cancel application, etc.
//
// Usage:
//   const [dialog, setDialog] = useState(null);
//   setDialog({ title, message, confirmText, confirmColor, onConfirm });
//   <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />

import React, { useEffect } from 'react';
import {
    IoAlertCircleOutline,
    IoCheckmarkCircleOutline,
    IoTrashOutline,
    IoLogOutOutline,
    IoClose,
} from 'react-icons/io5';

const C = {
    navy:       '#0F1F3D',
    accent:     '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface:    '#FFFFFF',
    bg:         '#F4F6FA',
    border:     '#E2E8F2',
    text:       '#0F1F3D',
    muted:      '#64748B',
    mutedLight: '#94A3B8',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
};

const ICON_MAP = {
    danger:  IoAlertCircleOutline,
    success: IoCheckmarkCircleOutline,
    delete:  IoTrashOutline,
    logout:  IoLogOutOutline,
    default: IoAlertCircleOutline,
};

const COLOR_MAP = {
    danger:  { bg: C.roseSoft,  icon: C.rose,   btn: C.rose,   btnHover: '#B91C1C' },
    success: { bg: C.greenSoft, icon: C.green,  btn: C.green,  btnHover: '#047857' },
    delete:  { bg: C.roseSoft,  icon: C.rose,   btn: C.rose,   btnHover: '#B91C1C' },
    logout:  { bg: C.amberSoft, icon: C.amber,  btn: C.navy,   btnHover: '#1E3A5F' },
    default: { bg: C.accentSoft,icon: C.accent, btn: C.accent, btnHover: '#1840C0' },
};

export default function ConfirmDialog({ config, onClose }) {
    // Hooks must always be called before any early return
    useEffect(() => {
        if (!config) return;
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [config, onClose]);

    if (!config) return null;

    const {
        title        = 'Are you sure?',
        message      = '',
        confirmText  = 'Confirm',
        cancelText   = 'Cancel',
        variant      = 'default',
        onConfirm,
        details,
    } = config;

    const Icon   = ICON_MAP[variant] || ICON_MAP.default;
    const colors = COLOR_MAP[variant] || COLOR_MAP.default;

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                style={S.backdrop}
                onClick={onClose}
            />

            {/* Dialog */}
            <div style={S.dialogWrap}>
                <div style={S.dialog} onClick={e => e.stopPropagation()}>
                    {/* Close button */}
                    <button style={S.closeBtn} onClick={onClose}>
                        <IoClose size={18} color={C.mutedLight} />
                    </button>

                    {/* Icon */}
                    <div style={{ ...S.iconCircle, backgroundColor: colors.bg }}>
                        <Icon size={28} color={colors.icon} />
                    </div>

                    {/* Content */}
                    <h2 style={S.title}>{title}</h2>
                    {message && <p style={S.message}>{message}</p>}
                    {details && (
                        <div style={S.detailBox}>
                            <p style={S.detailText}>{details}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={S.actions}>
                        <button style={S.cancelBtn} onClick={onClose}>
                            {cancelText}
                        </button>
                        <button
                            style={{ ...S.confirmBtn, backgroundColor: colors.btn }}
                            onClick={handleConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

const S = {
    backdrop: {
        position: 'fixed', inset: 0, zIndex: 900,
        backgroundColor: 'rgba(15,31,61,0.5)',
        backdropFilter: 'blur(2px)',
    },
    dialogWrap: {
        position: 'fixed', inset: 0, zIndex: 901,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none',
    },
    dialog: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: '32px 28px 24px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 20px 60px rgba(15,31,61,0.2), 0 4px 16px rgba(15,31,61,0.1)',
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        pointerEvents: 'auto',
        animation: 'dialogPop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
    },
    closeBtn: {
        position: 'absolute', top: 14, right: 14,
        width: 28, height: 28, borderRadius: 8,
        backgroundColor: C.bg, border: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer',
    },
    iconCircle: {
        width: 64, height: 64, borderRadius: 20,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 20, fontWeight: '800', color: C.text,
        margin: '0 0 8px', textAlign: 'center',
    },
    message: {
        fontSize: 14, color: C.muted, textAlign: 'center',
        lineHeight: 1.65, margin: '0 0 16px',
        maxWidth: 320,
    },
    detailBox: {
        backgroundColor: C.bg, borderRadius: 12,
        padding: '10px 14px', marginBottom: 16,
        border: `1px solid ${C.border}`, width: '100%',
    },
    detailText: {
        fontSize: 13, color: C.muted, lineHeight: 1.5, margin: 0,
    },
    actions: {
        display: 'flex', gap: 10, width: '100%', marginTop: 4,
    },
    cancelBtn: {
        flex: 1, padding: '13px 0', borderRadius: 12,
        border: `1.5px solid ${C.border}`,
        backgroundColor: C.surface,
        fontSize: 14, fontWeight: '700', color: C.text,
        cursor: 'pointer',
    },
    confirmBtn: {
        flex: 1, padding: '13px 0', borderRadius: 12,
        border: 'none',
        fontSize: 14, fontWeight: '700', color: '#fff',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
    },
};

// Inject animation once
if (typeof document !== 'undefined') {
    const id = 'confirm-dialog-css';
    if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            @keyframes dialogPop {
                from { opacity: 0; transform: scale(0.92) translateY(8px); }
                to   { opacity: 1; transform: scale(1)    translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
}
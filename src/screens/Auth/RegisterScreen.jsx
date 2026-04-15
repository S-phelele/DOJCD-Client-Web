// screens/Auth/RegisterScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IoArrowBack,
    IoPersonOutline,
    IoDocumentTextOutline,
    IoCloudUploadOutline,
    IoArrowForward,
    IoChevronForward,
    IoLogInOutline,
} from 'react-icons/io5';

// ─── Shared design tokens ─────────────────────────────────────────────
const C = {
    navy: '#0F1F3D',
    accent: '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface: '#FFFFFF',
    bg: '#F4F6FA',
    border: '#E2E8F2',
    text: '#0F1F3D',
    muted: '#64748B',
    mutedLight: '#94A3B8',
    green: '#059669',
    greenSoft: '#D1FAE5',
};

const ROLES = [
    {
        key: 'client',
        title: 'Client User',
        subtitle: 'Magistrates & DOJCD Staff',
        desc: 'For department staff who need to request and manage devices through the platform.',
        icon: IoPersonOutline,
        color: C.accent,
        bg: C.accentSoft,
        features: [
            { icon: IoPersonOutline, text: 'Request new devices' },
            { icon: IoDocumentTextOutline, text: 'Track application status' },
            { icon: IoCloudUploadOutline, text: 'Upload required documents' },
        ],
        navigate: '/client-register',
    },
];

export default function RegisterScreen() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    const handleRoleSelect = (role) => {
        setSelectedRole(role.key);
        setTimeout(() => navigate(role.navigate), 280);
    };

    return (
        <div style={styles.root}>
            {/* Navy header */}
            <div style={styles.header}>
                <div style={styles.headerRing} />

                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <IoArrowBack size={22} color="rgba(255,255,255,0.9)" />
                </button>

                <div style={styles.headerContent}>
                    <div style={styles.emblem}>
                        <span style={{ fontSize: 32 }}>⚖️</span>
                    </div>
                    <div style={styles.headerTitle}>Create Account</div>
                    <div style={styles.headerSub}>Select your role to get started</div>
                </div>

                {/* Step breadcrumb */}
                <div style={styles.stepRow}>
                    {['Role', 'Details', 'Security', 'Confirm'].map((label, i) => (
                        <React.Fragment key={label}>
                            <div style={styles.stepItem}>
                                <div style={{ ...styles.stepCircle, ...(i === 0 && styles.stepCircleActive) }}>
                  <span style={{ ...styles.stepNum, ...(i === 0 && styles.stepNumActive) }}>
                    {i + 1}
                  </span>
                                </div>
                                <div style={{ ...styles.stepLabel, ...(i === 0 && styles.stepLabelActive) }}>
                                    {label}
                                </div>
                            </div>
                            {i < 3 && <div style={styles.stepConnector} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Scrollable body */}
            <div style={styles.scroll}>
                <div style={styles.scrollContent}>
                    <div style={styles.chooseSub}>Who are you registering as?</div>

                    {ROLES.map((role) => {
                        const isActive = selectedRole === role.key;
                        const Icon = role.icon;
                        return (
                            <button
                                key={role.key}
                                style={{
                                    ...styles.roleCard,
                                    ...(isActive && { borderColor: role.color }),
                                }}
                                onClick={() => handleRoleSelect(role)}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.988)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = ''}
                                onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                            >
                                {/* Header row */}
                                <div style={styles.roleTop}>
                                    <div style={{ ...styles.roleIcon, backgroundColor: role.bg }}>
                                        <Icon size={26} color={role.color} />
                                    </div>
                                    <div style={styles.roleTopText}>
                                        <div style={styles.roleTitle}>{role.title}</div>
                                        <div style={styles.roleSub}>{role.subtitle}</div>
                                    </div>
                                    <div style={{ ...styles.arrowCircle, ...(isActive && { backgroundColor: role.color, borderColor: role.color }) }}>
                                        <IoArrowForward size={16} color={isActive ? '#fff' : C.mutedLight} />
                                    </div>
                                </div>

                                {/* Description */}
                                <div style={styles.roleDesc}>{role.desc}</div>

                                {/* Features */}
                                <div style={styles.roleFeatures}>
                                    {role.features.map((f, idx) => {
                                        const FeatureIcon = f.icon;
                                        return (
                                            <div key={idx} style={styles.featureRow}>
                                                <div style={{ ...styles.featureIconWrap, backgroundColor: role.bg }}>
                                                    <FeatureIcon size={13} color={role.color} />
                                                </div>
                                                <div style={styles.featureText}>{f.text}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* CTA footer strip */}
                                <div style={{ ...styles.roleCta, backgroundColor: role.bg }}>
                                    <div style={{ ...styles.roleCtaText, color: role.color }}>
                                        Register as {role.title}
                                    </div>
                                    <IoChevronForward size={14} color={role.color} />
                                </div>
                            </button>
                        );
                    })}

                    {/* Divider */}
                    <div style={styles.divider}>
                        <div style={styles.divLine} />
                        <div style={styles.divText}>ALREADY REGISTERED?</div>
                        <div style={styles.divLine} />
                    </div>

                    <button style={styles.loginBtn} onClick={() => navigate('/login')}>
                        <IoLogInOutline size={18} color={C.navy} style={{ marginRight: 8 }} />
                        <span style={styles.loginBtnText}>Sign In to Existing Account</span>
                    </button>

                    <div style={styles.footerNote}>Need help? Contact support@dojcd.gov.za</div>
                </div>
            </div>
        </div>
    );
}

// ─── Styles (converted from StyleSheet) ───────────────────────────────
const styles = {
    root: {
        minHeight: '100vh',
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: C.navy,
        paddingTop: 56,
        paddingBottom: 28,
        paddingLeft: 20,
        paddingRight: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    headerRing: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        border: '1px solid rgba(255,255,255,0.05)',
        top: -80,
        right: -60,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        border: 'none',
        cursor: 'pointer',
    },
    headerContent: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 28,
    },
    emblem: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 5,
    },
    headerSub: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
    },
    stepRow: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    stepItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 56,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    stepCircleActive: {
        backgroundColor: C.accent,
        borderColor: C.accent,
    },
    stepNum: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
    },
    stepNumActive: {
        color: '#fff',
    },
    stepLabel: {
        fontSize: 9,
        color: 'rgba(255,255,255,0.35)',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    stepLabelActive: {
        color: 'rgba(255,255,255,0.85)',
    },
    stepConnector: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        marginTop: 14,
        maxWidth: 20,
    },
    scroll: {
        flex: 1,
        overflowY: 'auto',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    chooseSub: {
        fontSize: 14,
        color: C.muted,
        textAlign: 'center',
        marginBottom: 20,
    },
    roleCard: {
        backgroundColor: C.surface,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: C.border,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: '0 3px 10px rgba(15,31,61,0.07)',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'transform 0.1s ease, opacity 0.1s ease',
    },
    roleTop: {
        display: 'flex',
        alignItems: 'center',
        padding: 18,
        paddingBottom: 14,
    },
    roleIcon: {
        width: 52,
        height: 52,
        borderRadius: 15,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    roleTopText: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: C.text,
        marginBottom: 3,
    },
    roleSub: {
        fontSize: 12,
        color: C.muted,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: C.bg,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: C.border,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleDesc: {
        fontSize: 13,
        color: C.muted,
        lineHeight: 1.5,
        paddingLeft: 18,
        paddingRight: 18,
        marginBottom: 16,
    },
    roleFeatures: {
        paddingLeft: 18,
        paddingRight: 18,
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    featureRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    featureIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 13,
        color: C.text,
        fontWeight: '500',
    },
    roleCta: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 13,
        gap: 6,
    },
    roleCtaText: {
        fontSize: 14,
        fontWeight: '700',
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        marginVertical: 24,
    },
    divLine: {
        flex: 1,
        height: 1,
        backgroundColor: C.border,
    },
    divText: {
        paddingLeft: 14,
        paddingRight: 14,
        fontSize: 10,
        color: C.muted,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    loginBtn: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: C.navy,
        backgroundColor: C.surface,
        marginBottom: 20,
        cursor: 'pointer',
        width: '100%',
    },
    loginBtnText: {
        color: C.navy,
        fontSize: 15,
        fontWeight: '700',
    },
    footerNote: {
        textAlign: 'center',
        fontSize: 12,
        color: C.mutedLight,
        marginBottom: 8,
    },
};
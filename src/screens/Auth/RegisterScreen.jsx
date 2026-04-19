// screens/Auth/RegisterScreen.jsx
// Updated: PublicFooter added at the bottom.
// All original role-selection logic preserved exactly.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import {
    IoPersonOutline,
    IoDocumentTextOutline,
    IoCloudUploadOutline,
    IoArrowForward,
    IoChevronForward,
    IoLogInOutline,
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
            { icon: IoPersonOutline,        text: 'Request new devices' },
            { icon: IoDocumentTextOutline,  text: 'Track application status' },
            { icon: IoCloudUploadOutline,   text: 'Upload required documents' },
        ],
        navigate: '/client-register',
    },
];

export default function RegisterScreen() {
    const navigate      = useNavigate();
    const [selectedRole, setSelectedRole] = useState(null);

    const handleRoleSelect = (role) => {
        setSelectedRole(role.key);
        setTimeout(() => navigate(role.navigate), 280);
    };

    return (
        <div style={S.root}>
            <PublicNavbar />

            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                .reg-fade { animation: fadeUp 0.35s ease both; }
            `}</style>

            {/* Page top banner */}
            <div style={S.banner}>
                <div style={S.bannerRing} />
                <div style={S.bannerContent}>
                    <div style={S.emblem}><span style={{ fontSize: 30 }}>⚖️</span></div>
                    <div>
                        <h1 style={S.bannerTitle}>Create Account</h1>
                        <p style={S.bannerSub}>Select your role to get started</p>
                    </div>
                </div>

                {/* Step breadcrumb */}
                <div style={S.stepRow}>
                    {['Role', 'Details', 'Security', 'Confirm'].map((label, i) => (
                        <React.Fragment key={label}>
                            <div style={S.stepItem}>
                                <div style={{ ...S.stepCircle, ...(i === 0 ? S.stepCircleActive : {}) }}>
                                    <span style={{ ...S.stepNum, ...(i === 0 ? S.stepNumActive : {}) }}>{i + 1}</span>
                                </div>
                                <div style={{ ...S.stepLabel, ...(i === 0 ? S.stepLabelActive : {}) }}>{label}</div>
                            </div>
                            {i < 3 && <div style={S.stepConnector} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Scrollable body — flex 1 so footer stays at bottom */}
            <div style={{ flex: 1 }}>
                <div style={S.bodyInner}>
                    <div style={S.chooseSub}>Who are you registering as?</div>

                    {ROLES.map(role => {
                        const isActive = selectedRole === role.key;
                        const Icon     = role.icon;
                        return (
                            <button
                                key={role.key}
                                className="reg-fade"
                                style={{ ...S.roleCard, ...(isActive ? { borderColor: role.color } : {}) }}
                                onClick={() => handleRoleSelect(role)}
                                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.988)'}
                                onMouseUp={e => e.currentTarget.style.transform = ''}
                                onMouseLeave={e => e.currentTarget.style.transform = ''}
                            >
                                <div style={S.roleTop}>
                                    <div style={{ ...S.roleIcon, backgroundColor: role.bg }}>
                                        <Icon size={26} color={role.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={S.roleTitle}>{role.title}</div>
                                        <div style={S.roleSub}>{role.subtitle}</div>
                                    </div>
                                    <div style={{ ...S.arrowCircle, ...(isActive ? { backgroundColor: role.color, borderColor: role.color } : {}) }}>
                                        <IoArrowForward size={16} color={isActive ? '#fff' : C.mutedLight} />
                                    </div>
                                </div>

                                <div style={S.roleDesc}>{role.desc}</div>

                                <div style={S.roleFeatures}>
                                    {role.features.map((f, idx) => {
                                        const FIcon = f.icon;
                                        return (
                                            <div key={idx} style={S.featureRow}>
                                                <div style={{ ...S.featureIconWrap, backgroundColor: role.bg }}>
                                                    <FIcon size={13} color={role.color} />
                                                </div>
                                                <div style={S.featureText}>{f.text}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{ ...S.roleCta, backgroundColor: role.bg }}>
                                    <div style={{ ...S.roleCtaText, color: role.color }}>Register as {role.title}</div>
                                    <IoChevronForward size={14} color={role.color} />
                                </div>
                            </button>
                        );
                    })}

                    <div style={S.divider}>
                        <div style={S.divLine} />
                        <div style={S.divText}>ALREADY REGISTERED?</div>
                        <div style={S.divLine} />
                    </div>

                    <button style={S.loginBtn} onClick={() => navigate('/login')}>
                        <IoLogInOutline size={18} color={C.navy} style={{ marginRight: 8 }} />
                        <span style={S.loginBtnText}>Sign In to Existing Account</span>
                    </button>

                    <div style={S.footerNote}>Need help? Contact support@dojcd.gov.za</div>
                </div>
            </div>

            {/* Shared footer */}
            <PublicFooter />
        </div>
    );
}

const S = {
    root: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' },

    banner:        { backgroundColor: C.navy, padding: '24px 20px 20px', position: 'relative', overflow: 'hidden' },
    bannerRing:    { position: 'absolute', width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -80, right: -60 },
    bannerContent: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, maxWidth: 640, margin: '0 auto 20px' },
    emblem:        { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    bannerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', margin: '0 0 3px' },
    bannerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 },

    stepRow:       { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', maxWidth: 400, margin: '0 auto' },
    stepItem:      { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56 },
    stepCircle:    { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
    stepCircleActive: { backgroundColor: C.accent, borderColor: C.accent },
    stepNum:       { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '700' },
    stepNumActive: { color: '#fff' },
    stepLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 0.3 },
    stepLabelActive: { color: 'rgba(255,255,255,0.85)' },
    stepConnector: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, maxWidth: 20 },

    bodyInner:   { maxWidth: 640, margin: '0 auto', padding: '28px 20px 40px' },
    chooseSub:   { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 20 },

    roleCard: {
        backgroundColor: C.surface, borderRadius: 20, borderWidth: 1.5,
        borderStyle: 'solid', borderColor: C.border, marginBottom: 16,
        overflow: 'hidden', boxShadow: '0 3px 10px rgba(15,31,61,0.07)',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'transform 0.1s ease',
    },
    roleTop:     { display: 'flex', alignItems: 'center', padding: 18, paddingBottom: 14 },
    roleIcon:    { width: 52, height: 52, borderRadius: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    roleTitle:   { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 3 },
    roleSub:     { fontSize: 12, color: C.muted },
    arrowCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.bg, borderWidth: 1, borderStyle: 'solid', borderColor: C.border, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    roleDesc:    { fontSize: 13, color: C.muted, lineHeight: 1.5, paddingLeft: 18, paddingRight: 18, marginBottom: 16 },
    roleFeatures:{ paddingLeft: 18, paddingRight: 18, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 },
    featureRow:  { display: 'flex', alignItems: 'center', gap: 10 },
    featureIconWrap: { width: 28, height: 28, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    featureText: { fontSize: 13, color: C.text, fontWeight: '500' },
    roleCta:     { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '13px 0', gap: 6 },
    roleCtaText: { fontSize: 14, fontWeight: '700' },

    divider:     { display: 'flex', alignItems: 'center', margin: '24px 0' },
    divLine:     { flex: 1, height: 1, backgroundColor: C.border },
    divText:     { paddingLeft: 14, paddingRight: 14, fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.2 },

    loginBtn:    { display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 16, padding: '15px 0', borderWidth: 1.5, borderStyle: 'solid', borderColor: C.navy, backgroundColor: C.surface, marginBottom: 20, cursor: 'pointer', width: '100%' },
    loginBtnText:{ color: C.navy, fontSize: 15, fontWeight: '700' },
    footerNote:  { textAlign: 'center', fontSize: 12, color: C.mutedLight },
};
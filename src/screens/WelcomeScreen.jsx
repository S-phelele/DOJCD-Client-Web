// screens/WelcomeScreen.jsx
// Redesigned: full-width modern hero, Platform Capabilities section,
// Who Uses DOJCD Connect section, CTA banner, and shared footer.
// All original API logic preserved exactly.

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../components/ToastProvider';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import {
    IoPhonePortraitOutline,
    IoCheckmarkCircleOutline,
    IoAnalyticsOutline,
    IoShieldCheckmarkOutline,
    IoArrowForward,
    IoDocumentTextOutline,
    IoNotificationsOutline,
    IoServerOutline,
    IoPeopleOutline,
    IoGlobeOutline,
    IoTimeOutline,
    IoArrowDownOutline,
} from 'react-icons/io5';

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
    navy:       '#0F1F3D',
    navyLight:  '#162C4A',
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
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    purple:     '#7C3AED',
    purpleSoft: '#EDE9FE',
};

// ─── Data ────────────────────────────────────────────────────────────────────
const CAPABILITIES = [
    {
        icon: IoPhonePortraitOutline,
        color: C.accent, bg: C.accentSoft,
        title: 'Device Procurement',
        desc: 'Browse an approved catalogue of devices, view contract details, monthly costs, and submit applications — fully paperless.',
    },
    {
        icon: IoCheckmarkCircleOutline,
        color: C.green, bg: C.greenSoft,
        title: 'Multi-Level Approval',
        desc: 'Every application passes through a structured review chain with full audit trails and real-time status updates.',
    },
    {
        icon: IoAnalyticsOutline,
        color: C.purple, bg: C.purpleSoft,
        title: 'Real-Time Tracking',
        desc: 'Monitor every stage of your request from submission to final approval through a live status dashboard.',
    },
    {
        icon: IoNotificationsOutline,
        color: C.amber, bg: C.amberSoft,
        title: 'Instant Notifications',
        desc: 'In-app alerts keep you informed when your application status changes or when action is required.',
    },
    {
        icon: IoShieldCheckmarkOutline,
        color: '#0891B2', bg: '#E0F7FA',
        title: 'Enterprise Security',
        desc: 'Secure authentication, encrypted data transmission, and role-based access control for all users.',
    },
    {
        icon: IoDocumentTextOutline,
        color: '#BE185D', bg: '#FCE7F3',
        title: 'Compliance & Audit',
        desc: 'Every action is logged with timestamps and user identifiers, ensuring full regulatory compliance.',
    },
];

const USER_TYPES = [
    { icon: '⚖️', title: 'Magistrates',           desc: 'Senior court officials eligible for departmentally-issued devices.' },
    { icon: '🧑‍⚖️', title: 'Advocates',             desc: 'State advocates and prosecutors working within DOJCD courts.' },
    { icon: '🗂️', title: 'Administrative Staff',   desc: 'Department personnel requiring devices for daily operations.' },
    { icon: '💻', title: 'ICT & Operations',       desc: 'Internal teams responsible for procurement and device management.' },
];

const STATS = [
    { value: '9',         label: 'Provinces Covered', icon: IoGlobeOutline },
    { value: '100%',      label: 'Digital Process',   icon: IoServerOutline },
    { value: 'Real-time', label: 'Status Updates',    icon: IoTimeOutline },
    { value: 'Verified',  label: 'Secure Access',     icon: IoShieldCheckmarkOutline },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
    const navigate = useNavigate();
    const toast    = useToast();
    const [status, setStatus] = useState('checking');

    useEffect(() => { testBackendConnection(); }, []);

    const testBackendConnection = async () => {
        setStatus('checking');
        try { await authAPI.testConnection(); setStatus('connected'); }
        catch { setStatus('disconnected'); }
    };

    const handleGetStarted = () => {
        if (status === 'connected') navigate('/register');
        else alert('Please ensure the backend server is running before proceeding.');
    };

    const statusMeta = {
        checking:    { color: C.amber,  dot: C.amber,   text: 'Checking connection…' },
        connected:   { color: C.green,  dot: '#4ADE80', text: 'System online' },
        disconnected:{ color: C.rose,   dot: C.rose,    text: 'Connection failed — tap to retry' },
    }[status];

    const isReady = status === 'connected';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
            <PublicNavbar />

            <style>{`
                @keyframes spin     { to { transform: rotate(360deg); } }
                @keyframes fadeUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
                @keyframes floatBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
                .wc0 { animation: fadeUp 0.5s ease both; }
                .wc1 { animation: fadeUp 0.5s ease 0.1s both; }
                .wc2 { animation: fadeUp 0.5s ease 0.2s both; }
                .wc3 { animation: fadeUp 0.5s ease 0.3s both; }
                .wcap:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(15,31,61,0.10); }
                .wcap { transition: transform 0.18s ease, box-shadow 0.18s ease; }
                .wusr:hover { border-color: ${C.accent}; background: ${C.accentSoft}; }
                .wusr { transition: border-color 0.15s ease, background 0.15s ease; }
                .wbtn-primary:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
                .wbtn-primary { transition: opacity 0.15s, transform 0.15s; }
            `}</style>

            {/* ═══════════════════════════════════════════════════════
                HERO SECTION — full width, dark navy
            ═══════════════════════════════════════════════════════ */}
            <section style={S.hero}>
                {/* Decorative background rings */}
                <div style={{ ...S.ring, width: 600, height: 600, top: -200, right: -150, opacity: 0.04 }} />
                <div style={{ ...S.ring, width: 350, height: 350, bottom: -100, left: -80, opacity: 0.05 }} />
                <div style={{ ...S.ring, width: 180, height: 180, top: 60, left: '30%', opacity: 0.04 }} />

                {/* Subtle dot-grid texture overlay */}
                <div style={S.dotGrid} />

                <div style={S.heroInner}>
                    {/* Status pill */}
                    <div className="wc0"
                         style={{ ...S.statusPill, cursor: status === 'disconnected' ? 'pointer' : 'default' }}
                         onClick={status === 'disconnected' ? testBackendConnection : undefined}
                    >
                        {status === 'checking'
                            ? <div style={spinStyle} />
                            : <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: statusMeta.dot, flexShrink: 0 }} />
                        }
                        <span style={{ fontSize: 12, fontWeight: '600', color: statusMeta.color, letterSpacing: '0.3px' }}>
                            {statusMeta.text}
                        </span>
                    </div>

                    {/* Emblem */}
                    <div className="wc0" style={S.heroEmblemWrap}>
                        <div style={S.heroGlow} />
                        <div style={S.heroEmblem}>
                            <span style={{ fontSize: 52 }}>⚖️</span>
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="wc1" style={S.heroTitle}>
                        DOJCD Connect
                    </h1>
                    <p className="wc1" style={S.heroSubtitle}>
                        Device Procurement Platform
                    </p>
                    <p className="wc2" style={S.heroDesc}>
                        A modern, end-to-end digital platform enabling magistrates and Department of Justice &amp;
                        Constitutional Development staff across South Africa to request, track, and manage
                        mobile devices — fully online, fully transparent.
                    </p>

                    {/* CTA buttons */}
                    <div className="wc3" style={S.heroBtns}>
                        <button
                            className="wbtn-primary"
                            style={{ ...S.heroPrimary, ...(!isReady ? S.heroPrimaryDisabled : {}) }}
                            onClick={handleGetStarted}
                            disabled={status === 'checking'}
                        >
                            {status === 'checking' ? (
                                <div style={{ ...spinStyle, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                            ) : (
                                <>
                                    <span style={S.heroPrimaryText}>{isReady ? 'Get Started' : 'Retry Connection'}</span>
                                    <IoArrowForward size={18} color="#fff" />
                                </>
                            )}
                        </button>

                        <button
                            style={{ ...S.heroGhost, ...(!isReady ? S.heroGhostDisabled : {}) }}
                            onClick={() => navigate('/login')}
                            disabled={!isReady}
                        >
                            <span style={{ ...S.heroGhostText, ...(!isReady ? { color: 'rgba(255,255,255,0.3)' } : {}) }}>
                                Sign In to Existing Account
                            </span>
                        </button>
                    </div>

                    {/* Stats bar */}
                    <div className="wc3" style={S.statsBar}>
                        {STATS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <React.Fragment key={i}>
                                    <div style={S.statItem}>
                                        <div style={S.statVal}>{s.value}</div>
                                        <div style={S.statLabel}>{s.label}</div>
                                    </div>
                                    {i < STATS.length - 1 && <div style={S.statDivider} />}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Scroll hint */}
                    <div style={S.scrollHint}>
                        <IoArrowDownOutline size={16} color="rgba(255,255,255,0.3)" />
                        <span style={S.scrollHintText}>Scroll to explore</span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                PLATFORM CAPABILITIES SECTION
            ═══════════════════════════════════════════════════════ */}
            <section style={S.section}>
                <div style={S.sectionInner}>
                    <div style={S.sectionMeta}>
                        <div style={S.sectionBadge}>CAPABILITIES</div>
                        <h2 style={S.sectionTitle}>Platform Capabilities</h2>
                        <p style={S.sectionDesc}>
                            Everything you need to manage device procurement — from first request to final approval.
                        </p>
                    </div>

                    <div style={S.capGrid}>
                        {CAPABILITIES.map((cap, i) => {
                            const Icon = cap.icon;
                            return (
                                <div key={i} className="wcap" style={S.capCard}>
                                    <div style={{ ...S.capIco, backgroundColor: cap.bg }}>
                                        <Icon size={22} color={cap.color} />
                                    </div>
                                    <h3 style={S.capTitle}>{cap.title}</h3>
                                    <p style={S.capDesc}>{cap.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                WHO USES DOJCD CONNECT SECTION
            ═══════════════════════════════════════════════════════ */}
            <section style={{ ...S.section, backgroundColor: C.navy }}>
                <div style={S.sectionInner}>
                    <div style={S.sectionMeta}>
                        <div style={{ ...S.sectionBadge, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            WHO IT'S FOR
                        </div>
                        <h2 style={{ ...S.sectionTitle, color: '#fff' }}>Who Uses DOJCD Connect?</h2>
                        <p style={{ ...S.sectionDesc, color: 'rgba(255,255,255,0.55)' }}>
                            Built exclusively for verified Department of Justice &amp; Constitutional Development
                            personnel across all nine provinces of South Africa.
                        </p>
                    </div>

                    <div style={S.userGrid}>
                        {USER_TYPES.map((u, i) => (
                            <div key={i} className="wusr" style={S.userCard}>
                                <div style={S.userEmoji}>{u.icon}</div>
                                <div style={S.userTitle}>{u.title}</div>
                                <div style={S.userDesc}>{u.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Eligibility note */}
                    <div style={S.eligNote}>
                        <IoShieldCheckmarkOutline size={16} color={C.green} />
                        <span style={S.eligText}>
                            All users must be registered DOJCD employees with a valid PERSAL ID and departmental email address.
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════
                FOOTER (includes CTA + footer)
            ═══════════════════════════════════════════════════════ */}
            <PublicFooter />
        </div>
    );
}

// ─── Spinner ────────────────────────────────────────────────────────────────
const spinStyle = {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.2)',
    borderTopColor: C.amber,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
    // ── Hero ──
    hero: {
        backgroundColor: C.navy,
        padding: '72px 24px 60px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        borderRadius: '50%',
        border: '1px solid #fff',
    },
    dotGrid: {
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
    },
    heroInner: {
        maxWidth: 720,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },

    statusPill: {
        display: 'flex', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        padding: '7px 14px', borderRadius: 20,
        marginBottom: 32,
    },

    heroEmblemWrap: { position: 'relative', marginBottom: 24 },
    heroGlow: {
        position: 'absolute', inset: -18, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.22) 0%, transparent 70%)',
        pointerEvents: 'none',
    },
    heroEmblem: {
        width: 104, height: 104, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
    },

    heroTitle: {
        fontSize: 44,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        margin: '0 0 8px',
        letterSpacing: '-0.5px',
        lineHeight: 1.1,
    },
    heroSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        letterSpacing: '0.6px',
        margin: '0 0 20px',
    },
    heroDesc: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 1.75,
        maxWidth: 580,
        margin: '0 0 36px',
    },

    heroBtns: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400, marginBottom: 40 },
    heroPrimary: {
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
        backgroundColor: C.accent, borderRadius: 14, padding: '16px 24px',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(30,79,216,0.45)',
        width: '100%',
    },
    heroPrimaryDisabled: { backgroundColor: '#475569', boxShadow: 'none', cursor: 'not-allowed' },
    heroPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: '0.2px' },
    heroGhost: {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        borderRadius: 14, padding: '15px 24px',
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'none', cursor: 'pointer', width: '100%',
    },
    heroGhostDisabled: { borderColor: 'rgba(255,255,255,0.08)', cursor: 'not-allowed' },
    heroGhostText: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },

    statsBar: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0, flexWrap: 'wrap',
        backgroundColor: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 14, padding: '16px 24px',
        width: '100%', maxWidth: 560,
        marginBottom: 36,
    },
    statItem:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' },
    statVal:    { fontSize: 18, fontWeight: '800', color: '#fff' },
    statLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: '0.5px', marginTop: 2 },
    statDivider:{ width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)' },

    scrollHint: { display: 'flex', alignItems: 'center', gap: 6, opacity: 0.6 },
    scrollHintText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '500', letterSpacing: '0.5px' },

    // ── Shared section layout ──
    section: { backgroundColor: C.bg, padding: '64px 24px' },
    sectionInner: { maxWidth: 1100, margin: '0 auto' },
    sectionMeta: { textAlign: 'center', marginBottom: 40 },
    sectionBadge: {
        display: 'inline-block',
        fontSize: 10, fontWeight: '700', letterSpacing: '1.4px',
        color: C.accent,
        backgroundColor: C.accentSoft,
        border: `1px solid ${C.accent}30`,
        padding: '5px 12px', borderRadius: 20,
        marginBottom: 12,
    },
    sectionTitle: { fontSize: 28, fontWeight: '800', color: C.text, margin: '0 0 10px', letterSpacing: '-0.2px' },
    sectionDesc:  { fontSize: 15, color: C.muted, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' },

    // ── Capabilities ──
    capGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
    },
    capCard: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: '22px 20px',
        border: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', gap: 10,
        cursor: 'default',
    },
    capIco: {
        width: 48, height: 48, borderRadius: 14,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    capTitle: { fontSize: 15, fontWeight: '800', color: C.text, margin: 0 },
    capDesc:  { fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0, flex: 1 },

    // ── Who uses ──
    userGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 24,
    },
    userCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: '22px 20px',
        cursor: 'default',
    },
    userEmoji: { fontSize: 28, marginBottom: 12 },
    userTitle: { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 6 },
    userDesc:  { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 },

    eligNote: {
        display: 'flex', alignItems: 'flex-start', gap: 10,
        backgroundColor: 'rgba(5,150,105,0.12)',
        border: '1px solid rgba(5,150,105,0.25)',
        padding: '14px 18px', borderRadius: 12,
    },
    eligText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 },
};
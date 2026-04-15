// screens/WelcomeScreen.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../components/ToastProvider';
import {
    IoPhonePortraitOutline,
    IoCheckmarkCircleOutline,
    IoAnalyticsOutline,
    IoShieldCheckmarkOutline,
    IoChevronForward,
    IoInformationCircleOutline,
    IoArrowForward,
} from 'react-icons/io5';

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
    amber: '#D97706',
    amberSoft: '#FEF3C7',
    rose: '#DC2626',
};

// Ensure FEATURES is always an array
const FEATURES = [
    {
        icon: IoPhonePortraitOutline,
        color: C.accent,
        bg: C.accentSoft,
        title: 'Request Devices',
        desc: 'Submit device procurement requests online',
    },
    {
        icon: IoCheckmarkCircleOutline,
        color: C.green,
        bg: C.greenSoft,
        title: 'Multi-level Approval',
        desc: 'Streamlined workflow with real-time updates',
    },
    {
        icon: IoAnalyticsOutline,
        color: '#7C3AED',
        bg: '#EDE9FE',
        title: 'Real-time Tracking',
        desc: 'Monitor every stage of your application',
    },
    {
        icon: IoShieldCheckmarkOutline,
        color: C.amber,
        bg: C.amberSoft,
        title: 'Secure Platform',
        desc: 'Enterprise-grade security & compliance',
    },
];

export default function WelcomeScreen() {
    const navigate = useNavigate();
    const toast = useToast();
    const [status, setStatus] = useState('checking');

    useEffect(() => {
        testBackendConnection();
    }, []);

    const testBackendConnection = async () => {
        setStatus('checking');
        try {
            await authAPI.testConnection();
            setStatus('connected');
        } catch {
            setStatus('disconnected');
        }
    };

    const handleGetStarted = () => {
        if (status === 'connected') {
            navigate('/register');
        } else {
            alert('Connection Issue – Please ensure the backend server is running before proceeding.');
        }
    };

    const statusMeta = {
        checking: { color: C.amber, dot: C.amber, text: 'Checking connection…' },
        connected: { color: C.green, dot: '#4ADE80', text: 'System online' },
        disconnected: { color: C.rose, dot: C.rose, text: 'Connection failed' },
    }[status];

    const isReady = status === 'connected';

    // Guard against FEATURES not being an array (should never happen, but safe)
    if (!Array.isArray(FEATURES)) {
        return <div>Error: FEATURES is not an array</div>;
    }

    return (
        <div style={styles.root}>
            {/* Hero section */}
            <div style={styles.hero}>
                <div style={styles.ring1} />
                <div style={styles.ring2} />
                <div style={styles.ring3} />

                <div style={styles.emblemOuter}>
                    <div style={styles.emblem}>
                        <span style={{ fontSize: 42 }}>⚖️</span>
                    </div>
                </div>

                <h1 style={styles.heroTitle}>DOJCD Connect</h1>
                <p style={styles.heroTagline}>Device Procurement Platform</p>

                <div
                    style={styles.statusPill}
                    onClick={status === 'disconnected' ? testBackendConnection : undefined}
                >
                    {status === 'checking' ? (
                        <div className="spinner" style={spinnerStyle} />
                    ) : (
                        <div style={{ ...styles.statusDot, backgroundColor: statusMeta.dot }} />
                    )}
                    <span style={{ ...styles.statusText, color: statusMeta.color }}>
            {statusMeta.text}
          </span>
                    {status === 'disconnected' && (
                        <div style={styles.retryChip}>
                            <span style={styles.retryText}>Tap to retry</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.scroll}>
                <div style={styles.scrollContent}>
                    <h2 style={styles.introTitle}>Mobile Procurement System</h2>
                    <p style={styles.introSub}>
                        Streamlining device requests and approvals for DOJCD staff and magistrates nationwide.
                    </p>

                    {FEATURES.map((feature, idx) => (
                        <div key={idx} style={styles.featureCard}>
                            <div style={{ ...styles.featureIco, backgroundColor: feature.bg }}>
                                <feature.icon size={22} color={feature.color} />
                            </div>
                            <div style={styles.featureBody}>
                                <h3 style={styles.featureTitle}>{feature.title}</h3>
                                <p style={styles.featureDesc}>{feature.desc}</p>
                            </div>
                            <IoChevronForward size={16} color={C.mutedLight} />
                        </div>
                    ))}

                    <div style={styles.infoBanner}>
                        <div style={styles.infoBannerRow}>
                            <div style={styles.infoBannerIcon}>
                                <IoInformationCircleOutline size={18} color={C.accent} />
                            </div>
                            <span style={styles.infoBannerTitle}>Why this platform?</span>
                        </div>
                        <p style={styles.infoBannerText}>
                            Fast processing · Real-time notifications · Regulatory compliance · Nationwide support
                        </p>
                    </div>
                </div>
            </div>

            <div style={styles.footer}>
                <button
                    style={{
                        ...styles.primaryBtn,
                        ...(!isReady && styles.primaryBtnDisabled),
                    }}
                    onClick={handleGetStarted}
                    disabled={status === 'checking'}
                >
                    {status === 'checking' ? (
                        <div className="spinner" style={{ ...spinnerStyle, borderColor: '#fff' }} />
                    ) : (
                        <>
              <span style={styles.primaryBtnText}>
                {isReady ? 'Get Started' : 'Retry Connection'}
              </span>
                            <IoArrowForward size={18} color="#fff" style={{ marginLeft: 8 }} />
                        </>
                    )}
                </button>

                <button
                    style={{
                        ...styles.secondaryBtn,
                        ...(!isReady && styles.secondaryBtnDisabled),
                    }}
                    onClick={() => navigate('/login')}
                    disabled={!isReady}
                >
          <span style={{ ...styles.secondaryBtnText, ...(!isReady && { color: C.mutedLight }) }}>
            Sign In to Existing Account
          </span>
                </button>

                <div style={styles.footerMeta}>
                    <p style={styles.footerOrg}>Department of Justice & Constitutional Development</p>
                    <p style={styles.footerVersion}>WEB · v1.0.0 · Republic of South Africa</p>
                    {status === 'disconnected' && (
                        <p style={styles.warningNote}>⚠️ Ensure the backend server is running</p>
                    )}
                </div>
            </div>

            <style>{`
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(0,0,0,0.1);
          border-top-color: ${C.amber};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

const spinnerStyle = { width: 14, height: 14 };

const styles = {
    root: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' },
    hero: { backgroundColor: C.navy, paddingTop: '64px', paddingBottom: '36px', alignItems: 'center', overflow: 'hidden', position: 'relative' },
    ring1: { position: 'absolute', width: '320px', height: '320px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: '-100px', right: '-80px' },
    ring2: { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: '-40px', left: '-60px' },
    ring3: { position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', top: '20px', left: '30px' },
    emblemOuter: { boxShadow: '0 10px 24px rgba(201,168,76,0.35)', marginBottom: '20px' },
    emblem: { width: '88px', height: '88px', borderRadius: '26px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    heroTitle: { fontSize: '30px', fontWeight: '800', color: '#fff', letterSpacing: '1.2px', marginBottom: '5px', marginTop: 0 },
    heroTagline: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px', marginBottom: '22px' },
    statusPill: { display: 'flex', alignItems: 'center', gap: '7px', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer' },
    statusDot: { width: '7px', height: '7px', borderRadius: '50%' },
    statusText: { fontSize: '12px', fontWeight: '600', letterSpacing: '0.3px' },
    retryChip: { backgroundColor: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px', display: 'flex', alignItems: 'center', fontSize: '11px', fontWeight: '600', color: '#fff' },
    retryText: { fontSize: '11px', fontWeight: '600', color: '#fff' },
    scroll: { flex: 1, overflowY: 'auto' },
    scrollContent: { padding: '20px', paddingBottom: '8px' },
    introTitle: { fontSize: '20px', fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: '8px', marginTop: '4px' },
    introSub: { fontSize: '14px', color: C.muted, textAlign: 'center', lineHeight: '1.5', paddingHorizontal: '16px', marginBottom: '24px' },
    featureCard: { display: 'flex', alignItems: 'center', backgroundColor: C.surface, borderRadius: '16px', padding: '16px', marginBottom: '10px', border: `1px solid ${C.border}`, boxShadow: '0 2px 6px rgba(15,31,61,0.05)' },
    featureIco: { width: '44px', height: '44px', borderRadius: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: '14px' },
    featureBody: { flex: 1 },
    featureTitle: { fontSize: '15px', fontWeight: '700', color: C.text, marginBottom: '3px', marginTop: 0 },
    featureDesc: { fontSize: '12px', color: C.muted, lineHeight: '1.4', margin: 0 },
    infoBanner: { backgroundColor: C.accentSoft, borderRadius: '16px', padding: '16px', border: `1px solid ${C.accent}30`, marginBottom: '12px' },
    infoBannerRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
    infoBannerIcon: { width: '30px', height: '30px', borderRadius: '9px', backgroundColor: C.surface, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    infoBannerTitle: { fontSize: '14px', fontWeight: '800', color: C.navy },
    infoBannerText: { fontSize: '12px', color: C.accent, lineHeight: '1.5', margin: 0 },
    footer: { backgroundColor: C.surface, borderTop: `1px solid ${C.border}`, padding: '20px 20px 24px' },
    primaryBtn: { display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy, borderRadius: '16px', padding: '17px', marginBottom: '12px', border: 'none', width: '100%', cursor: 'pointer', boxShadow: '0 6px 12px rgba(15,31,61,0.28)' },
    primaryBtnDisabled: { backgroundColor: '#94A3B8', boxShadow: 'none', cursor: 'not-allowed' },
    primaryBtnText: { color: '#fff', fontSize: '16px', fontWeight: '700', letterSpacing: '0.4px' },
    secondaryBtn: { display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '16px', padding: '15px', border: `1.5px solid ${C.navy}`, backgroundColor: 'transparent', width: '100%', cursor: 'pointer', marginBottom: '16px' },
    secondaryBtnDisabled: { borderColor: C.border, cursor: 'not-allowed' },
    secondaryBtnText: { color: C.navy, fontSize: '16px', fontWeight: '700' },
    footerMeta: { textAlign: 'center' },
    footerOrg: { fontSize: '12px', color: C.muted, marginBottom: '4px', marginTop: 0 },
    footerVersion: { fontSize: '10px', color: C.mutedLight, letterSpacing: '0.5px', margin: 0 },
    warningNote: { fontSize: '11px', color: C.amber, marginTop: '6px', fontWeight: '500' },
};
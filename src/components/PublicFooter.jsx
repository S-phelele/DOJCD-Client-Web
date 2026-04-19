// components/PublicFooter.jsx
// Shared footer for all public-facing pages.
// Matches the design language from the About page CTA + footer section.

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    IoPersonAddOutline,
    IoLogInOutline,
    IoMailOutline,
    IoGlobeOutline,
    IoShieldCheckmarkOutline,
    IoCallOutline,
} from 'react-icons/io5';

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
};

const REGISTER_PATHS = ['/register', '/client-register', '/operational-register'];
const LOGIN_PATHS    = ['/login'];

export default function PublicFooter() {
    const navigate = useNavigate();
    const location = useLocation();
    const path     = location.pathname;

    const onLogin    = LOGIN_PATHS.includes(path);
    const onRegister = REGISTER_PATHS.includes(path);

    // Only show CTA banner on pages where it makes sense
    const showCTA = !onLogin && !onRegister;

    return (
        <footer style={S.root}>
            {/* ── CTA banner (only on Welcome / About) ── */}
            {showCTA && (
                <div style={S.cta}>
                    <div style={S.ctaRing1} />
                    <div style={S.ctaRing2} />
                    <div style={S.ctaInner}>
                        <h2 style={S.ctaTitle}>Ready to get started?</h2>
                        <p style={S.ctaDesc}>
                            Register your account today and begin your first device application in minutes.
                        </p>
                        <div style={S.ctaBtns}>
                            <button style={S.ctaPrimary} onClick={() => navigate('/register')}>
                                <IoPersonAddOutline size={16} color="#fff" />
                                <span style={S.ctaPrimaryText}>Create Account</span>
                            </button>
                            <button style={S.ctaGhost} onClick={() => navigate('/login')}>
                                <IoLogInOutline size={16} color="rgba(255,255,255,0.8)" />
                                <span style={S.ctaGhostText}>Sign In</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Main footer ── */}
            <div style={S.main}>
                <div style={S.mainInner}>
                    {/* Brand col */}
                    <div style={S.col}>
                        <div style={S.brand}>
                            <div style={S.brandIcon}><span style={{ fontSize: 18 }}>⚖️</span></div>
                            <div>
                                <div style={S.brandName}>DOJCD Connect</div>
                                <div style={S.brandTagline}>Device Procurement Platform</div>
                            </div>
                        </div>
                        <p style={S.brandDesc}>
                            A digital procurement platform built for the Department of Justice &amp;
                            Constitutional Development of South Africa.
                        </p>
                        <div style={S.shieldRow}>
                            <IoShieldCheckmarkOutline size={13} color={C.green} />
                            <span style={S.shieldText}>Secure Government Portal</span>
                        </div>
                    </div>

                    {/* Quick links col */}
                    <div style={S.col}>
                        <div style={S.colTitle}>Navigation</div>
                        {[
                            { label: 'Home',     path: '/' },
                            { label: 'About',    path: '/about' },
                            { label: 'Sign In',  path: '/login' },
                            { label: 'Register', path: '/register' },
                        ].map(link => (
                            <button key={link.path} style={S.footerLink} onClick={() => navigate(link.path)}>
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* Contact col */}
                    <div style={S.col}>
                        <div style={S.colTitle}>Contact &amp; Support</div>
                        <div style={S.contactRow}>
                            <IoMailOutline size={14} color={C.mutedLight} />
                            <span style={S.contactText}>support@dojcd.gov.za</span>
                        </div>
                        <div style={S.contactRow}>
                            <IoGlobeOutline size={14} color={C.mutedLight} />
                            <span style={S.contactText}>www.justice.gov.za</span>
                        </div>
                        <div style={S.contactRow}>
                            <IoCallOutline size={14} color={C.mutedLight} />
                            <span style={S.contactText}>+27 12 315 1111</span>
                        </div>
                        <div style={S.contactRow}>
                            <IoGlobeOutline size={14} color={C.mutedLight} />
                            <span style={S.contactText}>All 9 provinces · Republic of South Africa</span>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={S.bottomBar}>
                    <span style={S.bottomText}>
                        © {new Date().getFullYear()} Department of Justice &amp; Constitutional Development ·
                        Republic of South Africa
                    </span>
                    <span style={S.bottomVersion}>WEB v1.0.0</span>
                </div>
            </div>
        </footer>
    );
}

const S = {
    root: { width: '100%' },

    // CTA banner
    cta: {
        backgroundColor: C.navy,
        padding: '52px 24px',
        position: 'relative',
        overflow: 'hidden',
    },
    ctaRing1: { position: 'absolute', width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -100, right: -80, pointerEvents: 'none' },
    ctaRing2: { position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', bottom: -60, left: -50, pointerEvents: 'none' },
    ctaInner: { maxWidth: 700, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 },
    ctaTitle: { fontSize: 28, fontWeight: '800', color: '#fff', margin: '0 0 10px', letterSpacing: '-0.2px' },
    ctaDesc:  { fontSize: 15, color: 'rgba(255,255,255,0.55)', margin: '0 0 28px', lineHeight: 1.7 },
    ctaBtns:  { display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
    ctaPrimary: {
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: C.accent, padding: '13px 24px', borderRadius: 12,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(30,79,216,0.4)',
    },
    ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    ctaGhost: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '13px 24px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'none', cursor: 'pointer',
    },
    ctaGhostText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },

    // Main footer body
    main: { backgroundColor: C.navyLight, padding: '40px 24px 0' },
    mainInner: {
        maxWidth: 1100, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 32,
        paddingBottom: 32,
    },

    col:      { display: 'flex', flexDirection: 'column', gap: 10 },
    colTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.2px', marginBottom: 4 },

    brand:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
    brandIcon:   { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    brandName:   { fontSize: 15, fontWeight: '800', color: '#fff' },
    brandTagline:{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: '600', letterSpacing: '0.5px' },
    brandDesc:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 },
    shieldRow:   { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
    shieldText:  { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },

    footerLink: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500',
        textAlign: 'left', padding: 0,
        transition: 'color 0.12s ease',
    },
    contactRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
    contactText:{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 },

    // Bottom bar
    bottomBar: {
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '16px 0',
    },
    bottomText:    { fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 },
    bottomVersion: { fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' },
};
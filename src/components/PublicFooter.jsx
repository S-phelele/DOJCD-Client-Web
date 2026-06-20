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
                            <div style={S.brandIcon}><IoShieldCheckmarkOutline size={18} color="rgba(255,255,255,0.85)" /></div>
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
        background: 'linear-gradient(135deg, #0A1628 0%, #0F1F3D 50%, #162C4A 100%)',
        padding: '60px 24px',
        position: 'relative',
        overflow: 'hidden',
    },
    ctaRing1: { position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', top: -130, right: -100, pointerEvents: 'none' },
    ctaRing2: { position: 'absolute', width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(30,79,216,0.12)', bottom: -70, left: -60, pointerEvents: 'none' },
    ctaInner: { maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 },
    ctaTitle: { fontSize: 32, fontWeight: '900', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.5px', lineHeight: 1.1 },
    ctaDesc:  { fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 0 32px', lineHeight: 1.75 },
    ctaBtns:  { display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
    ctaPrimary: {
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'linear-gradient(135deg, #1E4FD8 0%, #2563EB 100%)',
        padding: '15px 28px', borderRadius: 14,
        border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(30,79,216,0.45)',
        transition: 'opacity 0.15s, transform 0.15s',
    },
    ctaPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    ctaGhost: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 28px', borderRadius: 14,
        border: '1.5px solid rgba(255,255,255,0.18)',
        background: 'rgba(255,255,255,0.05)', cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        transition: 'border-color 0.15s, background 0.15s',
    },
    ctaGhostText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.82)' },

    // Main footer body
    main: { backgroundColor: C.navyLight, padding: '44px 24px 0' },
    mainInner: {
        maxWidth: 1100, margin: '0 auto', padding: '0 8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 40,
        paddingBottom: 36,
    },

    col:      { display: 'flex', flexDirection: 'column', gap: 10 },
    colTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: '1.2px', marginBottom: 4 },

    brand:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
    brandIcon:   { width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, rgba(30,79,216,0.35) 0%, rgba(255,255,255,0.08) 100%)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' },
    brandName:   { fontSize: 15, fontWeight: '800', color: '#fff' },
    brandTagline:{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: '600', letterSpacing: '0.5px' },
    brandDesc:   { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65, margin: 0 },
    shieldRow:   { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
    shieldText:  { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },

    footerLink: {
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '500',
        textAlign: 'left', padding: '3px 0',
        transition: 'color 0.15s ease',
        letterSpacing: '0.1px',
    },
    contactRow: { display: 'flex', alignItems: 'flex-start', gap: 8 },
    contactText:{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 },

    // Bottom bar
    bottomBar: {
        maxWidth: '100%', margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8,
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '16px 0',
    },
    bottomText:    { fontSize: 11, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5 },
    bottomVersion: { fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.5px' },
};
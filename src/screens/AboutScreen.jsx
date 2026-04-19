// screens/AboutScreen.jsx
// Describes the DOJCD Connect platform in detail.
// Shares the AuthNavbar with Welcome/Login/Register screens.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthNavbar from '../components/PublicNavbar';
import {
    IoPhonePortraitOutline,
    IoCheckmarkCircleOutline,
    IoAnalyticsOutline,
    IoShieldCheckmarkOutline,
    IoPeopleOutline,
    IoDocumentTextOutline,
    IoArrowForward,
    IoMailOutline,
    IoCallOutline,
    IoGlobeOutline,
    IoTimeOutline,
    IoCloudUploadOutline,
    IoLockClosedOutline,
    IoNotificationsOutline,
    IoGridOutline,
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
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    purple:     '#7C3AED',
    purpleSoft: '#EDE9FE',
};

const FEATURES = [
    { icon: IoPhonePortraitOutline,   color: C.accent,  bg: C.accentSoft,  title: 'Device Procurement',    desc: 'Staff can browse an approved catalogue of mobile devices and submit formal requests directly through the platform, eliminating paperwork and manual processes.' },
    { icon: IoCheckmarkCircleOutline, color: C.green,   bg: C.greenSoft,   title: 'Multi-level Approval',  desc: 'Applications flow through a structured approval workflow involving departmental supervisors and procurement officers, ensuring compliance at every step.' },
    { icon: IoAnalyticsOutline,       color: C.purple,  bg: C.purpleSoft,  title: 'Real-time Tracking',    desc: 'Applicants receive live status updates throughout the process — from submission to approval or rejection — with full visibility into where their application stands.' },
    { icon: IoShieldCheckmarkOutline, color: C.amber,   bg: C.amberSoft,   title: 'Secure & Compliant',    desc: 'Built on enterprise-grade security principles with role-based access control, encrypted data handling, and full audit trails to meet government compliance requirements.' },
    { icon: IoCloudUploadOutline,     color: '#0891B2', bg: '#E0F7FA',     title: 'Document Management',   desc: 'Required supporting documentation can be uploaded directly to the platform, securely stored and linked to the application for review by approvers.' },
    { icon: IoNotificationsOutline,   color: '#DC2626', bg: '#FEE2E2',     title: 'Instant Notifications', desc: 'Users receive automatic notifications when their application status changes, keeping them informed without needing to manually check the system.' },
];

const PROCESS_STEPS = [
    { num: '01', title: 'Register & Verify',     desc: 'Staff create an account using their PERSAL ID and departmental credentials. Accounts are verified by the system before access is granted.' },
    { num: '02', title: 'Browse Catalogue',      desc: 'Verified users browse the approved device catalogue, which includes eligible smartphones and tablets with associated contract plans.' },
    { num: '03', title: 'Submit Application',    desc: 'Users select a device and submit a formal application. Supporting documents are uploaded and the application enters the approval queue.' },
    { num: '04', title: 'Approval Workflow',     desc: 'The application is reviewed by the relevant supervisors and procurement officers. Each approver adds their sign-off or raises queries.' },
    { num: '05', title: 'Decision & Notification', desc: 'Once a final decision is made (approved or rejected), the applicant is notified immediately with a full explanation and next steps.' },
    { num: '06', title: 'Device Provisioning',   desc: 'Approved applications are forwarded to the relevant supplier for device provisioning and delivery to the applicant\'s office.' },
];

const WHO_USES = [
    { icon: IoPeopleOutline,       color: C.accent,  bg: C.accentSoft, title: 'Magistrates',           desc: 'Court officials who require mobile devices for case management and judicial administration.' },
    { icon: IoDocumentTextOutline, color: C.green,   bg: C.greenSoft,  title: 'Departmental Staff',    desc: 'DOJCD employees across all provinces who need devices for official departmental functions.' },
    { icon: IoGridOutline,         color: C.purple,  bg: C.purpleSoft, title: 'Admin & Procurement',   desc: 'Internal administrative teams responsible for reviewing, approving, and managing device requests.' },
];

const STATS = [
    { value: '9',      label: 'Provinces Covered' },
    { value: '100%',   label: 'Digital Process' },
    { value: '24/7',   label: 'Platform Access' },
    { value: 'Secure', label: 'Gov-grade Security' },
];

export default function AboutScreen() {
    const navigate = useNavigate();

    return (
        <div style={S.root}>
            <AuthNavbar />
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
                .about-fade { animation: fadeUp 0.45s ease both; }
            `}</style>

            {/* ── Hero section ── */}
            <section style={S.hero}>
                <div style={S.heroRing1} />
                <div style={S.heroRing2} />
                <div style={S.heroContent}>
                    <div style={S.heroEmblemWrap}>
                        <div style={S.heroGlow} />
                        <div style={S.heroEmblem}><span style={{ fontSize: 48 }}>⚖️</span></div>
                    </div>
                    <h1 style={S.heroTitle}>About DOJCD Connect</h1>
                    <p style={S.heroSub}>
                        The official device procurement platform of the<br />
                        Department of Justice &amp; Constitutional Development
                    </p>

                    {/* Stats row */}
                    <div style={S.statsRow}>
                        {STATS.map((s, i) => (
                            <div key={i} style={S.statCard}>
                                <div style={S.statValue}>{s.value}</div>
                                <div style={S.statLabel}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── What is it ── */}
            <section style={S.section}>
                <div style={S.sectionInner}>
                    <div style={S.badge}>OVERVIEW</div>
                    <h2 style={S.sectionTitle}>What is DOJCD Connect?</h2>
                    <p style={S.bodyText}>
                        DOJCD Connect is a centralised digital platform designed to modernise and streamline the mobile device
                        procurement process for the Department of Justice and Constitutional Development (DOJCD) across all
                        nine provinces of South Africa.
                    </p>
                    <p style={S.bodyText}>
                        Traditionally, device requests involved extensive paperwork, manual routing between departments, and
                        significant delays in decision-making. DOJCD Connect replaces this process entirely with a secure,
                        transparent, and efficient digital workflow — accessible from any web browser.
                    </p>
                    <p style={S.bodyText}>
                        From submission to approval, every step is tracked in real time. Applicants always know exactly where
                        their request stands, while approvers have full visibility into pending items, documentation, and
                        compliance requirements.
                    </p>

                    {/* Highlight cards */}
                    <div style={S.highlightGrid}>
                        {[
                            { icon: IoTimeOutline,       color: C.amber,  bg: C.amberSoft,  text: 'Reduces procurement time from weeks to days' },
                            { icon: IoDocumentTextOutline,color: C.accent, bg: C.accentSoft, text: 'Fully paperless — all documents are digital' },
                            { icon: IoLockClosedOutline,  color: C.green,  bg: C.greenSoft,  text: 'Secure role-based access for all user types' },
                            { icon: IoGlobeOutline,       color: C.purple, bg: C.purpleSoft, text: 'Accessible nationwide from any modern browser' },
                        ].map((h, i) => (
                            <div key={i} style={S.highlightCard}>
                                <div style={{ ...S.highlightIco, backgroundColor: h.bg }}>
                                    <h.icon size={18} color={h.color} />
                                </div>
                                <p style={S.highlightText}>{h.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section style={{ ...S.section, backgroundColor: C.bg }}>
                <div style={S.sectionInner}>
                    <div style={S.badge}>FEATURES</div>
                    <h2 style={S.sectionTitle}>Platform Capabilities</h2>
                    <p style={S.bodySub}>Everything you need to request, track, and manage device applications — in one place.</p>
                    <div style={S.featureGrid}>
                        {FEATURES.map((f, i) => (
                            <div key={i} style={S.featureCard}>
                                <div style={{ ...S.featureIco, backgroundColor: f.bg }}>
                                    <f.icon size={22} color={f.color} />
                                </div>
                                <h3 style={S.featureTitle}>{f.title}</h3>
                                <p style={S.featureDesc}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How it works ── */}
            <section style={S.section}>
                <div style={S.sectionInner}>
                    <div style={S.badge}>PROCESS</div>
                    <h2 style={S.sectionTitle}>How It Works</h2>
                    <p style={S.bodySub}>A simple six-step process from registration to device delivery.</p>
                    <div style={S.processGrid}>
                        {PROCESS_STEPS.map((step, i) => (
                            <div key={i} style={S.processCard}>
                                <div style={S.processNum}>{step.num}</div>
                                <h3 style={S.processTitle}>{step.title}</h3>
                                <p style={S.processDesc}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Who uses it ── */}
            <section style={{ ...S.section, backgroundColor: C.bg }}>
                <div style={S.sectionInner}>
                    <div style={S.badge}>USERS</div>
                    <h2 style={S.sectionTitle}>Who Uses DOJCD Connect?</h2>
                    <p style={S.bodySub}>The platform serves different roles within the Department of Justice ecosystem.</p>
                    <div style={S.whoGrid}>
                        {WHO_USES.map((w, i) => (
                            <div key={i} style={S.whoCard}>
                                <div style={{ ...S.whoIco, backgroundColor: w.bg }}>
                                    <w.icon size={26} color={w.color} />
                                </div>
                                <h3 style={S.whoTitle}>{w.title}</h3>
                                <p style={S.whoDesc}>{w.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Legal & Compliance ── */}
            <section style={S.section}>
                <div style={S.sectionInner}>
                    <div style={S.badge}>COMPLIANCE</div>
                    <h2 style={S.sectionTitle}>Legal &amp; Regulatory Framework</h2>
                    <p style={S.bodyText}>
                        DOJCD Connect operates in full compliance with South African government procurement regulations,
                        including the Public Finance Management Act (PFMA), the Supply Chain Management Framework, and the
                        Protection of Personal Information Act (POPIA).
                    </p>
                    <p style={S.bodyText}>
                        All user data is handled with strict confidentiality. Device usage is monitored to ensure approved
                        devices are used exclusively for official departmental functions. Any misuse is subject to disciplinary
                        procedures in accordance with the Public Service Act.
                    </p>
                    <div style={S.complianceGrid}>
                        {['PFMA Compliant', 'POPIA Aligned', 'SCM Framework', 'Public Service Act', 'Audit Trail', 'Role-based Access'].map((tag, i) => (
                            <div key={i} style={S.complianceTag}>{tag}</div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={S.ctaSection}>
                <div style={S.ctaInner}>
                    <div style={S.ctaEmblem}>⚖️</div>
                    <h2 style={S.ctaTitle}>Ready to get started?</h2>
                    <p style={S.ctaSub}>
                        Create your account to request devices or sign in to continue where you left off.
                    </p>
                    <div style={S.ctaBtns}>
                        <button style={S.ctaBtnPrimary} onClick={() => navigate('/register')}>
                            <span>Register Now</span>
                            <IoArrowForward size={18} color="#fff" />
                        </button>
                        <button style={S.ctaBtnOutline} onClick={() => navigate('/login')}>
                            Sign In
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={S.footer}>
                <div style={S.footerInner}>
                    <div style={S.footerBrand}>
                        <div style={S.footerLogo}>⚖️</div>
                        <div>
                            <div style={S.footerBrandName}>DOJCD Connect</div>
                            <div style={S.footerBrandSub}>Department of Justice &amp; Constitutional Development</div>
                        </div>
                    </div>
                    <div style={S.footerLinks}>
                        <div style={S.footerContact}>
                            <div style={S.footerContactItem}>
                                <IoMailOutline size={14} color={C.mutedLight} />
                                <span>support@dojcd.gov.za</span>
                            </div>
                            <div style={S.footerContactItem}>
                                <IoGlobeOutline size={14} color={C.mutedLight} />
                                <span>www.justice.gov.za</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={S.footerBottom}>
                    <span>© {new Date().getFullYear()} Republic of South Africa · Department of Justice &amp; Constitutional Development</span>
                    <span>WEB v1.0.0</span>
                </div>
            </footer>
        </div>
    );
}

const S = {
    root: { minHeight: '100vh', backgroundColor: C.surface, display: 'flex', flexDirection: 'column' },

    // Hero
    hero: {
        backgroundColor: C.navy, position: 'relative', overflow: 'hidden',
        padding: '80px 24px 60px', display: 'flex', justifyContent: 'center',
    },
    heroRing1: { position: 'absolute', width: 500, height: 500, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -180, right: -120 },
    heroRing2: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: -80, left: -80 },
    heroContent: { maxWidth: 700, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
    heroEmblemWrap: { position: 'relative', marginBottom: 24 },
    heroGlow: { position: 'absolute', inset: -16, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)' },
    heroEmblem: { width: 96, height: 96, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', textAlign: 'center', margin: '0 0 12px', letterSpacing: '-0.5px' },
    heroSub:   { fontSize: 16, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.6, marginBottom: 36 },
    statsRow:  { display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
    statCard:  { flex: '1 1 120px', maxWidth: 160, backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' },
    statValue: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 4 },
    statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '600', letterSpacing: 0.4 },

    // Sections
    section:     { padding: '64px 24px' },
    sectionInner:{ maxWidth: 1040, margin: '0 auto' },
    badge: {
        display: 'inline-block', fontSize: 10, fontWeight: '800',
        letterSpacing: '1.5px', color: C.accent,
        backgroundColor: C.accentSoft, padding: '4px 12px', borderRadius: 20,
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 30, fontWeight: '900', color: C.text, margin: '0 0 20px', letterSpacing: '-0.3px' },
    bodyText:     { fontSize: 15, color: C.muted, lineHeight: 1.75, marginBottom: 20, maxWidth: 720 },
    bodySub:      { fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 36, maxWidth: 600 },

    // Highlights
    highlightGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginTop: 8 },
    highlightCard: { display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}` },
    highlightIco:  { width: 36, height: 36, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    highlightText: { fontSize: 13, color: C.text, fontWeight: '600', lineHeight: 1.5, margin: 0 },

    // Feature cards
    featureGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
    featureCard:  { backgroundColor: C.surface, borderRadius: 18, padding: '24px 22px', border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(15,31,61,0.05)' },
    featureIco:   { width: 50, height: 50, borderRadius: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    featureTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8, marginTop: 0 },
    featureDesc:  { fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0 },

    // Process
    processGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
    processCard: { backgroundColor: C.bg, borderRadius: 16, padding: '22px 20px', border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' },
    processNum:  { fontSize: 40, fontWeight: '900', color: `${C.accent}18`, lineHeight: 1, marginBottom: 8, letterSpacing: '-1px' },
    processTitle:{ fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 8, marginTop: 0 },
    processDesc: { fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0 },

    // Who uses
    whoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
    whoCard: { backgroundColor: C.surface, borderRadius: 18, padding: '28px 24px', border: `1px solid ${C.border}`, textAlign: 'center', boxShadow: '0 2px 10px rgba(15,31,61,0.05)' },
    whoIco:  { width: 64, height: 64, borderRadius: 18, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' },
    whoTitle:{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 10, marginTop: 0 },
    whoDesc: { fontSize: 13, color: C.muted, lineHeight: 1.65, margin: 0 },

    // Compliance tags
    complianceGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 },
    complianceTag:  { backgroundColor: C.accentSoft, color: C.accent, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: '700', border: `1px solid ${C.accent}30` },

    // CTA
    ctaSection: { backgroundColor: C.navy, padding: '72px 24px', position: 'relative', overflow: 'hidden' },
    ctaInner:   { maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' },
    ctaEmblem:  { fontSize: 48, marginBottom: 20 },
    ctaTitle:   { fontSize: 32, fontWeight: '900', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.3px' },
    ctaSub:     { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 36 },
    ctaBtns:    { display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
    ctaBtnPrimary: {
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: C.accent, color: '#fff',
        border: 'none', borderRadius: 12, padding: '14px 28px',
        fontSize: 15, fontWeight: '700', cursor: 'pointer',
        boxShadow: '0 6px 16px rgba(30,79,216,0.4)',
    },
    ctaBtnOutline: {
        backgroundColor: 'transparent', color: '#fff',
        border: '1.5px solid rgba(255,255,255,0.3)',
        borderRadius: 12, padding: '14px 28px',
        fontSize: 15, fontWeight: '700', cursor: 'pointer',
    },

    // Footer
    footer:       { backgroundColor: C.navy, borderTop: '1px solid rgba(255,255,255,0.07)', padding: '40px 24px 24px' },
    footerInner:  { maxWidth: 1040, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, marginBottom: 32 },
    footerBrand:  { display: 'flex', alignItems: 'center', gap: 14 },
    footerLogo:   { fontSize: 28 },
    footerBrandName: { fontSize: 16, fontWeight: '800', color: '#fff' },
    footerBrandSub:  { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
    footerLinks:     { display: 'flex', flexDirection: 'column', gap: 8 },
    footerContact:   { display: 'flex', flexDirection: 'column', gap: 8 },
    footerContactItem:{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.45)' },
    footerBottom: {
        maxWidth: 1040, margin: '0 auto',
        paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        fontSize: 11, color: 'rgba(255,255,255,0.3)',
    },
};
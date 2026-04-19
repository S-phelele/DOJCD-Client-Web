// screens/Client/ClientDashboard.jsx
// Redesigned dashboard:
//  - Browse Devices → navigates to /device-catalog
//  - My Applications / See All → navigates to /my-applications
//  - Notifications bell → navigates to /notifications
//  - Profile completion reminder stays until profile done
//  - Account info moved to Profile tab
//  - ConfirmDialog used instead of window.confirm

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI, notificationAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    IoDocumentTextOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoNotificationsOutline,
    IoPersonAddOutline,
    IoChevronForward,
    IoPhonePortraitOutline,
    IoListOutline,
    IoRefreshOutline,
    IoGridOutline,
    IoAlertCircleOutline,
    IoCheckmarkCircle,
    IoTime,
    IoArrowForward,
    IoShieldCheckmarkOutline,
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
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    slate:      '#64748B',
    slateSoft:  '#F1F5F9',
};

const STATUS_META = {
    Approved:  { bg: C.greenSoft, text: C.green, dot: C.green, icon: IoCheckmarkCircle },
    Pending:   { bg: C.amberSoft, text: C.amber, dot: C.amber, icon: IoTime },
    Rejected:  { bg: C.roseSoft,  text: C.rose,  dot: C.rose,  icon: IoCloseCircleOutline },
    Cancelled: { bg: C.slateSoft, text: C.slate, dot: C.slate, icon: IoCloseCircleOutline },
};

const StatusChip = ({ status }) => {
    const m = STATUS_META[status] || { bg: C.slateSoft, text: C.slate, dot: C.slate };
    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, backgroundColor: m.bg }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, marginRight: 5, backgroundColor: m.dot }} />
            <span style={{ fontSize: 11, fontWeight: '700', color: m.text }}>{status}</span>
        </div>
    );
};

export default function ClientDashboard() {
    const toast    = useToast();
    const navigate = useNavigate();

    const [user,               setUser]               = useState(null);
    const [hasProfile,         setHasProfile]         = useState(false);
    const [refreshing,         setRefreshing]         = useState(false);
    const [loading,            setLoading]            = useState(true);
    const [applications,       setApplications]       = useState([]);
    const [summary,            setSummary]            = useState(null);
    const [isEligible,         setIsEligible]         = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [unreadCount,        setUnreadCount]        = useState(0);
    const [dialog,             setDialog]             = useState(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const ud = localStorage.getItem('user');
            if (!ud) { navigate('/login'); return; }
            const u = JSON.parse(ud);
            setUser(u);
            checkProfile(u);
            if (u.registration_status === 'Verified') {
                await Promise.all([
                    checkEligibility(u.client_user_id),
                    loadApplications(u.client_user_id),
                    loadSummary(u.client_user_id),
                    loadUnreadCount(u.client_user_id),
                ]);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const checkProfile = (u) => {
        const s = u.registration_status || '';
        setHasProfile(s === 'Verified' || s === 'Profile_Completed' || !!(u.network_provider && u.contract_duration_months));
    };

    const checkEligibility = async (id) => {
        try {
            setEligibilityLoading(true);
            const r = await deviceAPI.checkEligibility(id);
            const raw = r?.data;
            const eligible =
                raw?.data?.eligibility?.eligible ??
                raw?.data?.eligible ??
                raw?.eligible ??
                false;
            setIsEligible(eligible);
        } catch { setIsEligible(false); }
        finally { setEligibilityLoading(false); }
    };

    const loadApplications = async (id) => {
        try {
            const r = await deviceAPI.getUserApplications(id);
            const raw = r?.data?.data;
            let list = [];
            if (Array.isArray(raw))                       list = raw;
            else if (raw && Array.isArray(raw.applications)) list = raw.applications;
            else if (Array.isArray(r?.data))              list = r.data;
            setApplications(list);
        } catch { setApplications([]); }
    };

    const loadSummary = async (id) => {
        try {
            const r = await deviceAPI.getApplicationSummary(id);
            setSummary(r.data.data?.summary || null);
        } catch { setSummary(null); }
    };

    const loadUnreadCount = async (id) => {
        try {
            const r = await notificationAPI.getUnreadCount(id, 'Client');
            if (r.data.success) setUnreadCount(r.data.unreadCount || 0);
        } catch { /* silent */ }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const stats = [
        { label: 'Total',    value: summary?.total_applications || 0, icon: IoDocumentTextOutline,   color: C.accent, bg: C.accentSoft },
        { label: 'Pending',  value: summary?.pending            || 0, icon: IoTimeOutline,            color: C.amber,  bg: C.amberSoft },
        { label: 'Approved', value: summary?.approved           || 0, icon: IoCheckmarkCircleOutline, color: C.green,  bg: C.greenSoft },
        { label: 'Rejected', value: summary?.rejected           || 0, icon: IoCloseCircleOutline,     color: C.rose,   bg: C.roseSoft },
    ];

    // ── Loading ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 14, backgroundColor: C.bg, minHeight: '100%' }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontSize: 14, color: C.muted, fontWeight: '500' }}>Loading dashboard…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes spin   { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                .ds { animation: fadeUp 0.3s ease both; }
                .qcard:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,31,61,0.18); }
                .qcard { transition: transform 0.15s ease, box-shadow 0.15s ease; }
                .acard:hover { border-color: ${C.accent}; }
                .acard { transition: border-color 0.12s ease; }
            `}</style>

            <div style={S.root}>
                {/* ── Sticky page header ── */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={S.headerIcon}>
                            <IoGridOutline size={20} color={C.accent} />
                        </div>
                        <div>
                            <h1 style={S.headerTitle}>{greeting()}, {user?.first_name || 'User'} 👋</h1>
                            <p style={S.headerSub}>
                                {user?.registration_status === 'Verified'
                                    ? 'Here\'s an overview of your account'
                                    : 'Complete your profile to unlock device applications'}
                            </p>
                        </div>
                    </div>
                    <div style={S.headerRight}>
                        {/* Eligibility badge */}
                        {hasProfile && user?.registration_status === 'Verified' && (
                            <div style={{
                                ...S.eligBadge,
                                backgroundColor: isEligible ? C.greenSoft : C.amberSoft,
                                borderColor: isEligible ? C.green + '60' : C.amber + '60',
                            }}>
                                {isEligible
                                    ? <IoShieldCheckmarkOutline size={13} color={C.green} />
                                    : <IoTimeOutline size={13} color={C.amber} />
                                }
                                <span style={{ fontSize: 11, fontWeight: '700', color: isEligible ? C.green : C.amber, marginLeft: 5 }}>
                                    {isEligible ? 'Eligible' : eligibilityLoading ? 'Checking…' : 'Pending Eligibility'}
                                </span>
                            </div>
                        )}

                        {/* Notification bell → /notifications */}
                        <button style={S.iconBtn} onClick={() => navigate('/notifications')}>
                            <IoNotificationsOutline size={20} color={C.navy} />
                            {unreadCount > 0 && (
                                <div style={S.iconBtnBadge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
                            )}
                        </button>

                        {/* Refresh */}
                        <button style={S.iconBtn} onClick={onRefresh} disabled={refreshing}>
                            <IoRefreshOutline size={18} color={C.muted}
                                              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        </button>
                    </div>
                </div>

                {/* ── Page body ── */}
                <div style={S.body}>

                    {/* ── Profile completion reminder ── */}
                    {!hasProfile && (
                        <div className="ds" style={S.profileBanner} onClick={() => navigate('/complete-profile')}>
                            <div style={S.profileBannerLeft}>
                                <div style={S.profileBannerIco}>
                                    <IoPersonAddOutline size={20} color={C.amber} />
                                </div>
                                <div>
                                    <div style={S.profileBannerTitle}>Complete your profile to get started</div>
                                    <div style={S.profileBannerSub}>
                                        Upload your documents and preferences to unlock device applications.
                                    </div>
                                </div>
                            </div>
                            <div style={S.profileBannerArrow}>
                                <IoChevronForward size={18} color={C.amber} />
                            </div>
                        </div>
                    )}

                    {/* ── Application Summary ── */}
                    <div className="ds" style={{ animationDelay: '40ms' }}>
                        <div style={S.sectionHeader}>
                            <h2 style={S.sectionTitle}>Application Summary</h2>
                        </div>
                        <div style={S.statsGrid}>
                            {stats.map((st, i) => {
                                const Icon = st.icon;
                                return (
                                    <div key={i} style={S.statCard}>
                                        <div style={{ ...S.statIco, backgroundColor: st.bg }}>
                                            <Icon size={18} color={st.color} />
                                        </div>
                                        <div style={S.statVal}>{st.value}</div>
                                        <div style={S.statLabel}>{st.label}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Quick Actions ── */}
                    <div className="ds" style={{ animationDelay: '80ms' }}>
                        <div style={S.sectionHeader}>
                            <h2 style={S.sectionTitle}>Quick Actions</h2>
                        </div>
                        <div style={S.actionsRow}>
                            {/* Browse Devices → navigates to /device-catalog */}
                            <button
                                className="qcard"
                                style={{
                                    ...S.actionCard, ...S.actionNavy,
                                    ...(!hasProfile || !isEligible ? S.actionDisabled : {}),
                                }}
                                onClick={() => {
                                    if (!hasProfile) {
                                        navigate('/complete-profile');
                                    } else if (!isEligible) {
                                        toast.warning('Not Eligible', 'Your account is not yet eligible for device applications.');
                                    } else {
                                        navigate('/device-catalog');
                                    }
                                }}
                            >
                                <div style={{ ...S.actionIco, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                                    <IoPhonePortraitOutline size={24} color="#fff" />
                                </div>
                                <div style={S.actionTitle}>Browse Devices</div>
                                <div style={S.actionHint}>
                                    {!hasProfile ? 'Complete profile first' : !isEligible ? 'Pending eligibility' : 'View available devices'}
                                </div>
                                <IoArrowForward size={16} color="rgba(255,255,255,0.5)" style={{ marginTop: 12 }} />

                                {!hasProfile && (
                                    <div style={S.actionLockBadge}>Profile needed</div>
                                )}
                            </button>

                            {/* My Applications → navigates to /my-applications */}
                            <button
                                className="qcard"
                                style={{
                                    ...S.actionCard, ...S.actionGreen,
                                    ...(!hasProfile ? S.actionDisabled : {}),
                                }}
                                onClick={() => {
                                    if (!hasProfile) navigate('/complete-profile');
                                    else navigate('/my-applications');
                                }}
                            >
                                <div style={{ ...S.actionIco, backgroundColor: 'rgba(255,255,255,0.14)' }}>
                                    <IoListOutline size={24} color="#fff" />
                                </div>
                                <div style={S.actionTitle}>My Applications</div>
                                <div style={S.actionHint}>
                                    {applications.length > 0 ? `${applications.length} application${applications.length !== 1 ? 's' : ''}` : 'No applications yet'}
                                </div>
                                <IoArrowForward size={16} color="rgba(255,255,255,0.5)" style={{ marginTop: 12 }} />

                                {applications.length > 0 && (
                                    <div style={S.actionCountBadge}>{applications.length}</div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* ── Recent Applications ── */}
                    {applications.length > 0 && (
                        <div className="ds" style={{ animationDelay: '120ms' }}>
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>Recent Applications</h2>
                                <button style={S.seeAll} onClick={() => navigate('/my-applications')}>
                                    See all <IoChevronForward size={13} color={C.accent} style={{ marginLeft: 2 }} />
                                </button>
                            </div>

                            <div style={S.recentList}>
                                {applications.slice(0, 4).map(app => (
                                    <button
                                        key={app.application_id}
                                        className="acard"
                                        style={S.recentCard}
                                        onClick={() => navigate(`/application-details/${app.application_id}`)}
                                    >
                                        <div style={S.recentLeft}>
                                            <div style={S.recentIco}>
                                                <IoPhonePortraitOutline size={16} color={C.accent} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={S.recentDevice}>{app.device_name}</div>
                                                <div style={S.recentMeta}>
                                                    {app.model} · {new Date(app.submission_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <StatusChip status={app.application_status} />
                                            <IoChevronForward size={14} color={C.mutedLight} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state when no applications yet */}
                    {applications.length === 0 && hasProfile && isEligible && (
                        <div className="ds" style={{ animationDelay: '120ms' }}>
                            <div style={S.emptyBox}>
                                <div style={S.emptyIco}>
                                    <IoDocumentTextOutline size={28} color={C.mutedLight} />
                                </div>
                                <div style={S.emptyTitle}>No applications yet</div>
                                <div style={S.emptySub}>Browse available devices and submit your first application.</div>
                                <button style={S.emptyBtn} onClick={() => navigate('/device-catalog')}>
                                    Browse Devices
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Confirmation dialog */}
            <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
        </>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
    root: { backgroundColor: C.bg, display: 'flex', flexDirection: 'column', minHeight: '100%' },

    header: {
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 50,
    },
    headerLeft:  { display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
    headerIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    headerTitle: { fontSize: 19, fontWeight: '800', color: C.text, margin: 0 },
    headerSub:   { fontSize: 12, color: C.muted, marginTop: 2 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 8 },

    eligBadge: {
        display: 'flex', alignItems: 'center',
        padding: '5px 10px', borderRadius: 20,
        border: '1px solid',
    },

    iconBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: C.bg, border: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer', position: 'relative',
    },
    iconBtnBadge: {
        position: 'absolute', top: -4, right: -4,
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: '#EF4444',
        fontSize: 9, fontWeight: '800', color: '#fff',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '0 3px', border: `2px solid ${C.surface}`,
    },

    body: { flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 960, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },

    profileBanner: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: 14, padding: '14px 16px', cursor: 'pointer', width: '100%',
        gap: 12,
    },
    profileBannerLeft:  { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
    profileBannerIco:   { width: 42, height: 42, borderRadius: 11, backgroundColor: '#FEF3C7', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    profileBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 3 },
    profileBannerSub:   { fontSize: 12, color: '#B45309', lineHeight: 1.5 },
    profileBannerArrow: { flexShrink: 0 },

    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.text, margin: 0 },
    seeAll: {
        display: 'flex', alignItems: 'center',
        fontSize: 13, color: C.accent, fontWeight: '600',
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
    statCard:  { backgroundColor: C.surface, borderRadius: 14, padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', border: `1px solid ${C.border}`, boxShadow: '0 2px 6px rgba(15,31,61,0.04)' },
    statIco:   { width: 36, height: 36, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statVal:   { fontSize: 26, fontWeight: '900', color: C.text, lineHeight: 1 },
    statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 4, letterSpacing: '0.3px' },

    actionsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    actionCard: {
        borderRadius: 18, padding: '20px 18px',
        position: 'relative', cursor: 'pointer',
        border: 'none', textAlign: 'left',
        display: 'flex', flexDirection: 'column',
    },
    actionNavy: { backgroundColor: C.navy },
    actionGreen:{ backgroundColor: C.green },
    actionDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    actionIco:  { width: 44, height: 44, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitle:{ fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 1.3 },
    actionHint: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
    actionLockBadge: {
        position: 'absolute', top: 12, right: 12,
        backgroundColor: 'rgba(0,0,0,0.25)',
        padding: '3px 8px', borderRadius: 10,
        fontSize: 10, fontWeight: '700', color: '#fff',
    },
    actionCountBadge: {
        position: 'absolute', top: 12, right: 12,
        minWidth: 22, height: 22, borderRadius: 11,
        backgroundColor: '#EF4444',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontSize: 11, fontWeight: '800', color: '#fff',
        padding: '0 5px',
    },

    recentList: { display: 'flex', flexDirection: 'column', gap: 8 },
    recentCard: {
        backgroundColor: C.surface, borderRadius: 12, padding: '12px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: `1px solid ${C.border}`, cursor: 'pointer', width: '100%', textAlign: 'left',
    },
    recentLeft:  { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, marginRight: 12 },
    recentIco:   { width: 34, height: 34, borderRadius: 9, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    recentDevice:{ fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    recentMeta:  { fontSize: 11, color: C.muted },

    emptyBox:  { backgroundColor: C.surface, borderRadius: 16, padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: `1px solid ${C.border}` },
    emptyIco:  { width: 60, height: 60, borderRadius: 16, backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle:{ fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.6, marginBottom: 18 },
    emptyBtn:  { backgroundColor: C.navy, padding: '11px 22px', borderRadius: 11, border: 'none', color: '#fff', fontWeight: '700', fontSize: 13, cursor: 'pointer' },
};
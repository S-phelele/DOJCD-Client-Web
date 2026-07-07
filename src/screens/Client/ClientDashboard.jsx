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
import { Sk, SkeletonShimmerStyle } from '../../components/SkeletonLoader';
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

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ backgroundColor: '#F0F4FA', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <SkeletonShimmerStyle />
                {/* Dark header skeleton */}
                <div style={{ background: 'linear-gradient(135deg, #0A1628, #0F1F3D)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Sk w={38} h={38} r={11} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <Sk w={200} h={17} r={8} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                            <Sk w={130} h={11} r={5} style={{ background: 'rgba(255,255,255,0.1)', animation: 'none' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Sk w={36} h={36} r={10} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                        <Sk w={36} h={36} r={10} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                    </div>
                </div>
                {/* 2-column body */}
                <div style={{ padding: '20px 24px 40px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                        <div style={{ flex: 3, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, border: '1px solid #E2E8F2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <Sk w={80} h={14} r={7} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} style={{ backgroundColor: '#F0F4FA', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <Sk w={32} h={32} r={9} />
                                            <Sk w={40} h={22} r={7} />
                                            <Sk w={50} h={10} r={5} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, border: '1px solid #E2E8F2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <Sk w={150} h={14} r={7} />
                                <Sk w="100%" h={10} r={5} />
                                <div style={{ display: 'flex', gap: 10 }}>
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} style={{ flex: 1, backgroundColor: '#F0F4FA', borderRadius: 10, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                                            <Sk w={30} h={20} r={6} /><Sk w="60%" h={10} r={5} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} style={{ backgroundColor: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <Sk w={32} h={32} r={8} />
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <Sk w={140} h={13} r={7} /><Sk w={100} h={10} r={5} />
                                        </div>
                                    </div>
                                    <Sk w={70} h={24} r={12} />
                                </div>
                            ))}
                        </div>
                        <div style={{ flex: 2, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, border: '1px solid #E2E8F2', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                                <Sk w={60} h={60} r={18} /><Sk w={120} h={15} r={7} /><Sk w={90} h={12} r={6} /><Sk w="100%" h={6} r={3} />
                            </div>
                            {[...Array(2)].map((_, i) => (
                                <div key={i} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, border: '1px solid #E2E8F2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <Sk w={100} h={14} r={7} /><Sk w="80%" h={12} r={6} /><Sk w="100%" h={36} r={10} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes spin   { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
                .ds { animation: fadeUp 0.3s ease both; }
                .ds-cols { display: flex; flex-direction: row; gap: 20px; align-items: flex-start; }
                .ds-left  { flex: 3; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
                .ds-right { flex: 2; min-width: 260px; display: flex; flex-direction: column; gap: 16px; }
                @media (max-width: 900px) { .ds-cols { flex-direction: column; } .ds-right { min-width: 0; width: 100%; } }
                .rc:hover { background: #F5F8FF !important; }
                .rc { transition: background 0.12s ease; }
            `}</style>

            <div style={S.root}>
                {/* ── Dark sticky header ── */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={S.headerIcon}>
                            <IoGridOutline size={20} color="rgba(255,255,255,0.9)" />
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
                        {hasProfile && user?.registration_status === 'Verified' && (
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                padding: '5px 10px', borderRadius: 20,
                                backgroundColor: isEligible ? 'rgba(5,150,105,0.2)' : 'rgba(217,119,6,0.2)',
                                border: `1px solid ${isEligible ? 'rgba(5,150,105,0.35)' : 'rgba(217,119,6,0.35)'}`,
                            }}>
                                {isEligible
                                    ? <IoShieldCheckmarkOutline size={13} color="#34D399" />
                                    : <IoTimeOutline size={13} color="#FCD34D" />
                                }
                                <span style={{ fontSize: 11, fontWeight: '700', color: isEligible ? '#34D399' : '#FCD34D', marginLeft: 5 }}>
                                    {isEligible ? 'Eligible' : eligibilityLoading ? 'Checking…' : 'Pending Eligibility'}
                                </span>
                            </div>
                        )}
                        <button style={S.iconBtn} onClick={() => navigate('/notifications')}>
                            <IoNotificationsOutline size={20} color="rgba(255,255,255,0.8)" />
                            {unreadCount > 0 && (
                                <div style={S.iconBtnBadge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
                            )}
                        </button>
                        <button style={S.iconBtn} onClick={onRefresh} disabled={refreshing}>
                            <IoRefreshOutline size={18} color="rgba(255,255,255,0.7)"
                                              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        </button>
                    </div>
                </div>

                {/* ── Page body ── */}
                <div style={S.body}>

                    {/* Profile completion banner */}
                    {!hasProfile && (
                        <div className="ds" style={S.profileBanner} onClick={() => navigate('/complete-profile')}>
                            <div style={S.profileBannerLeft}>
                                <div style={S.profileBannerIco}>
                                    <IoPersonAddOutline size={20} color={C.amber} />
                                </div>
                                <div>
                                    <div style={S.profileBannerTitle}>Complete your profile to get started</div>
                                    <div style={S.profileBannerSub}>Upload your documents to unlock device applications.</div>
                                </div>
                            </div>
                            <IoChevronForward size={18} color={C.amber} />
                        </div>
                    )}

                    {/* ── 2-column layout ── */}
                    <div className="ds-cols">

                        {/* LEFT */}
                        <div className="ds-left">

                            {/* Stats overview */}
                            <div className="ds" style={S.card}>
                                <div style={S.cardHeader}>
                                    <span style={S.cardTitle}>Overview</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {stats.map((st, i) => {
                                        const Icon = st.icon;
                                        return (
                                            <div key={i} style={{ ...S.statTile, borderTop: `3px solid ${st.color}` }}>
                                                <div style={{ ...S.statIco, backgroundColor: st.bg }}>
                                                    <Icon size={16} color={st.color} />
                                                </div>
                                                <div style={{ ...S.statVal, color: st.color }}>{st.value}</div>
                                                <div style={S.statLabel}>{st.label}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Application pipeline */}
                            {summary?.total_applications > 0 && (
                                <div className="ds" style={{ ...S.card, animationDelay: '40ms' }}>
                                    <div style={S.cardHeader}>
                                        <span style={S.cardTitle}>Application Pipeline</span>
                                        <span style={S.cardSub}>{summary.total_applications} total</span>
                                    </div>
                                    <div style={{ height: 10, borderRadius: 6, backgroundColor: C.border, overflow: 'hidden', display: 'flex', marginBottom: 14 }}>
                                        {summary.approved > 0 && (
                                            <div style={{ width: `${summary.approved / summary.total_applications * 100}%`, backgroundColor: C.green }} />
                                        )}
                                        {summary.pending > 0 && (
                                            <div style={{ width: `${summary.pending / summary.total_applications * 100}%`, backgroundColor: C.amber }} />
                                        )}
                                        {summary.rejected > 0 && (
                                            <div style={{ width: `${summary.rejected / summary.total_applications * 100}%`, backgroundColor: C.rose }} />
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Approved', count: summary.approved, color: C.green, bg: C.greenSoft },
                                            { label: 'Pending',  count: summary.pending,  color: C.amber, bg: C.amberSoft },
                                            { label: 'Rejected', count: summary.rejected, color: C.rose,  bg: C.roseSoft },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 80, padding: '8px 12px', backgroundColor: item.bg, borderRadius: 10 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, flexShrink: 0 }} />
                                                <div>
                                                    <div style={{ fontSize: 20, fontWeight: '900', color: item.color, lineHeight: 1 }}>{item.count}</div>
                                                    <div style={{ fontSize: 10, color: item.color, fontWeight: '600', opacity: 0.8 }}>{item.label}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent applications */}
                            {applications.length > 0 && (
                                <div className="ds" style={{ ...S.card, animationDelay: '80ms', padding: '18px 0' }}>
                                    <div style={{ ...S.cardHeader, padding: '0 18px 0' }}>
                                        <span style={S.cardTitle}>Recent Applications</span>
                                        <button style={S.seeAll} onClick={() => navigate('/my-applications')}>
                                            See all <IoChevronForward size={12} color={C.accent} style={{ marginLeft: 2 }} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        {applications.slice(0, 4).map((app, i) => (
                                            <button
                                                key={app.application_id}
                                                className="rc"
                                                style={{ ...S.recentCard, borderTop: i === 0 ? `1px solid ${C.border}` : 'none' }}
                                                onClick={() => navigate(`/application-details/${app.application_id}`)}
                                            >
                                                <div style={S.recentLeft}>
                                                    <div style={S.recentIco}>
                                                        <IoPhonePortraitOutline size={15} color={C.accent} />
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
                                                    <IoChevronForward size={13} color={C.mutedLight} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty state */}
                            {applications.length === 0 && hasProfile && isEligible && (
                                <div className="ds" style={{ ...S.card, animationDelay: '80ms' }}>
                                    <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={S.emptyIco}>
                                            <IoDocumentTextOutline size={26} color={C.mutedLight} />
                                        </div>
                                        <div style={S.emptyTitle}>No applications yet</div>
                                        <div style={S.emptySub}>Browse available devices and submit your first application.</div>
                                        <button style={S.emptyBtn} onClick={() => navigate('/device-catalog')}>Browse Devices</button>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* RIGHT */}
                        <div className="ds-right">

                            {/* Profile card */}
                            <div className="ds" style={S.card}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 16 }}>
                                    <div style={S.avatarWrap}>
                                        <span style={S.avatarText}>{(user?.first_name?.[0] || '?').toUpperCase()}</span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 2 }}>
                                        {user?.first_name} {user?.last_name}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{user?.email}</div>
                                    <div style={{
                                        padding: '4px 12px', borderRadius: 20,
                                        backgroundColor: user?.registration_status === 'Verified' ? C.greenSoft : C.amberSoft,
                                    }}>
                                        <span style={{ fontSize: 11, fontWeight: '700', color: user?.registration_status === 'Verified' ? C.green : C.amber }}>
                                            {user?.registration_status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: '600', color: C.muted }}>Profile Completion</span>
                                        <span style={{ fontSize: 13, fontWeight: '800', color: C.accent }}>
                                            {!hasProfile ? '40%' : user?.registration_status === 'Verified' ? '100%' : '75%'}
                                        </span>
                                    </div>
                                    <div style={{ height: 6, backgroundColor: C.border, borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3,
                                            width: !hasProfile ? '40%' : user?.registration_status === 'Verified' ? '100%' : '75%',
                                            background: 'linear-gradient(90deg, #1E4FD8, #3B82F6)',
                                            transition: 'width 0.8s ease',
                                        }} />
                                    </div>
                                    {!hasProfile && (
                                        <button
                                            style={{ width: '100%', marginTop: 12, backgroundColor: C.accentSoft, padding: 9, borderRadius: 10, border: 'none', fontSize: 13, fontWeight: '700', color: C.accent, cursor: 'pointer' }}
                                            onClick={() => navigate('/complete-profile')}
                                        >
                                            Complete Profile →
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Eligibility card */}
                            <div className="ds" style={{ ...S.card, animationDelay: '40ms' }}>
                                <div style={S.cardHeader}>
                                    <span style={S.cardTitle}>Eligibility Status</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{
                                        width: 56, height: 56, borderRadius: 16, marginBottom: 10,
                                        backgroundColor: isEligible ? C.greenSoft : C.amberSoft,
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    }}>
                                        {isEligible
                                            ? <IoShieldCheckmarkOutline size={26} color={C.green} />
                                            : <IoTimeOutline size={26} color={C.amber} />
                                        }
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: '800', color: isEligible ? C.green : C.amber, marginBottom: 4 }}>
                                        {isEligible ? 'Eligible to Apply' : eligibilityLoading ? 'Checking…' : 'Not Yet Eligible'}
                                    </div>
                                    <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 12 }}>
                                        {isEligible
                                            ? 'You can browse and apply for devices.'
                                            : hasProfile ? 'Your account is pending verification.' : 'Complete your profile to become eligible.'}
                                    </div>
                                    {isEligible && (
                                        <button
                                            style={{ backgroundColor: C.navy, padding: '9px 18px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: '700', fontSize: 13, cursor: 'pointer', width: '100%' }}
                                            onClick={() => navigate('/device-catalog')}
                                        >
                                            Browse Devices
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick actions */}
                            <div className="ds" style={{ ...S.card, animationDelay: '80ms' }}>
                                <div style={S.cardHeader}>
                                    <span style={S.cardTitle}>Quick Actions</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <button
                                        style={{
                                            ...S.actionBtn,
                                            background: 'linear-gradient(135deg, #0F1F3D 0%, #1E3A5F 100%)',
                                            ...(!hasProfile || !isEligible ? { opacity: 0.55 } : {}),
                                        }}
                                        onClick={() => {
                                            if (!hasProfile) navigate('/complete-profile');
                                            else if (!isEligible) toast.warning('Not Eligible', 'Your account is not yet eligible.');
                                            else navigate('/device-catalog');
                                        }}
                                    >
                                        <div style={{ ...S.actionBtnIco, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                            <IoPhonePortraitOutline size={18} color="#fff" />
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <div style={S.actionBtnLabel}>Browse Devices</div>
                                            <div style={S.actionBtnHint}>{!hasProfile ? 'Profile needed' : !isEligible ? 'Pending eligibility' : 'View catalogue'}</div>
                                        </div>
                                        <IoArrowForward size={14} color="rgba(255,255,255,0.45)" />
                                    </button>
                                    <button
                                        style={{
                                            ...S.actionBtn,
                                            background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
                                            ...(!hasProfile ? { opacity: 0.55 } : {}),
                                        }}
                                        onClick={() => {
                                            if (!hasProfile) navigate('/complete-profile');
                                            else navigate('/my-applications');
                                        }}
                                    >
                                        <div style={{ ...S.actionBtnIco, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                            <IoListOutline size={18} color="#fff" />
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <div style={S.actionBtnLabel}>My Applications</div>
                                            <div style={S.actionBtnHint}>
                                                {applications.length > 0 ? `${applications.length} application${applications.length !== 1 ? 's' : ''}` : 'No applications yet'}
                                            </div>
                                        </div>
                                        {applications.length > 0 && (
                                            <div style={S.actionCountBadge}>{applications.length}</div>
                                        )}
                                        <IoArrowForward size={14} color="rgba(255,255,255,0.45)" />
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
        </>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
    root: { backgroundColor: '#F0F4FA', display: 'flex', flexDirection: 'column', minHeight: '100%' },

    header: {
        background: 'linear-gradient(135deg, #0A1628 0%, #0F1F3D 100%)',
        padding: '0 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        minHeight: 64, flexWrap: 'wrap',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(10,22,40,0.4)',
    },
    headerLeft:  { display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
    headerIcon:  { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.2px' },
    headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 8 },

    iconBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.18)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer', position: 'relative',
    },
    iconBtnBadge: {
        position: 'absolute', top: -4, right: -4,
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: '#EF4444',
        fontSize: 9, fontWeight: '800', color: '#fff',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '0 3px', border: '2px solid #0F1F3D',
    },

    body: { flex: 1, padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 16 },

    profileBanner: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
        borderRadius: 14, padding: '14px 16px', cursor: 'pointer', gap: 12,
    },
    profileBannerLeft:  { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 },
    profileBannerIco:   { width: 40, height: 40, borderRadius: 11, backgroundColor: '#FEF3C7', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    profileBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 2 },
    profileBannerSub:   { fontSize: 12, color: '#B45309', lineHeight: 1.4 },

    card:       { backgroundColor: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(15,31,61,0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitle:  { fontSize: 14, fontWeight: '800', color: C.text, letterSpacing: '-0.1px' },
    cardSub:    { fontSize: 12, color: C.muted },
    seeAll:     { display: 'flex', alignItems: 'center', fontSize: 12, color: C.accent, fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },

    statTile:  { backgroundColor: C.bg, borderRadius: 12, padding: '14px 12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    statIco:   { width: 32, height: 32, borderRadius: 9, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    statVal:   { fontSize: 28, fontWeight: '900', lineHeight: 1, letterSpacing: '-0.5px', marginBottom: 4 },
    statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', letterSpacing: '0.3px' },

    recentCard: {
        backgroundColor: C.surface, padding: '11px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${C.border}`, cursor: 'pointer', width: '100%', textAlign: 'left',
        border: 'none',
    },
    recentLeft:  { display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, marginRight: 12 },
    recentIco:   { width: 32, height: 32, borderRadius: 8, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    recentDevice:{ fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    recentMeta:  { fontSize: 11, color: C.muted },

    avatarWrap:  { width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg, #1E4FD8, #3B82F6)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarText:  { fontSize: 22, fontWeight: '900', color: '#fff' },

    actionBtn: {
        width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
    },
    actionBtnIco:    { width: 36, height: 36, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    actionBtnLabel:  { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 2 },
    actionBtnHint:   { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    actionCountBadge:{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 11, fontWeight: '800', color: '#fff', padding: '0 5px' },

    emptyIco:  { width: 52, height: 52, borderRadius: 14, backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    emptyTitle:{ fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 4 },
    emptySub:  { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.55, marginBottom: 14 },
    emptyBtn:  { backgroundColor: C.navy, padding: '9px 20px', borderRadius: 10, border: 'none', color: '#fff', fontWeight: '700', fontSize: 13, cursor: 'pointer' },
};
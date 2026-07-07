// screens/Client/MyApplicationsScreen.jsx
// Updated: ConfirmDialog replaces window.confirm for cancelling applications.
// All original API logic preserved exactly.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Sk, SkeletonShimmerStyle } from '../../components/SkeletonLoader';
import {
    IoAppsOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoBanOutline,
    IoDocumentTextOutline,
    IoCashOutline,
    IoCalendarOutline,
    IoAdd,
    IoChevronForward,
    IoAlertCircleOutline,
    IoRefreshOutline,
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
    Approved:        { bg: C.greenSoft, fg: C.green,   dot: C.green },
    Pending:         { bg: C.amberSoft, fg: C.amber,   dot: C.amber },
    Pending_Finance: { bg: '#EDE9FE',   fg: '#7C3AED', dot: '#7C3AED' },
    Rejected:        { bg: C.roseSoft,  fg: C.rose,    dot: C.rose },
    Cancelled:       { bg: C.slateSoft, fg: C.slate,   dot: C.slate },
};

const StatusChip = ({ status }) => {
    const m = STATUS_META[status] || { bg: C.slateSoft, fg: C.slate, dot: C.slate };
    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, backgroundColor: m.bg }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, marginRight: 5, backgroundColor: m.dot }} />
            <span style={{ fontSize: 11, fontWeight: '700', color: m.fg }}>{status}</span>
        </div>
    );
};

const FILTERS = [
    { key: 'All',             icon: IoAppsOutline },
    { key: 'Pending',         icon: IoTimeOutline },
    { key: 'Pending_Finance', icon: IoTimeOutline },
    { key: 'Approved',        icon: IoCheckmarkCircleOutline },
    { key: 'Rejected',        icon: IoCloseCircleOutline },
    { key: 'Cancelled',       icon: IoBanOutline },
];

export default function MyApplicationsScreen() {
    const toast    = useToast();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [refreshing,   setRefreshing]   = useState(false);
    const [user,         setUser]         = useState(null);
    const [filter,       setFilter]       = useState('All');
    const [dialog,       setDialog]       = useState(null);

    useEffect(() => { loadApplications(); }, []);

    const loadApplications = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) { navigate('/login'); return; }
            const u = JSON.parse(userStr);
            setUser(u);
            const r = await deviceAPI.getUserApplications(u.client_user_id);
            // Safely extract array regardless of API response shape
            const raw = r?.data?.data;
            let list = [];
            if (Array.isArray(raw)) {
                list = raw;
            } else if (raw && Array.isArray(raw.applications)) {
                list = raw.applications;
            } else if (Array.isArray(r?.data)) {
                list = r.data;
            }
            setApplications(list);
        } catch {
            toast.error('Failed to Load', 'Could not load your applications.');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadApplications();
        setRefreshing(false);
    };

    // Show confirm dialog before cancelling
    const handleCancelClick = (app) => {
        setDialog({
            title: 'Cancel Application',
            message: `Cancel your application for the ${app.device_name}?`,
            details: 'This action cannot be undone. Your application will be permanently cancelled.',
            confirmText: 'Yes, Cancel It',
            cancelText: 'Keep Application',
            variant: 'danger',
            onConfirm: () => submitCancel(app.application_id),
        });
    };

    const submitCancel = async (applicationId) => {
        if (!user?.client_user_id) { toast.error('Error', 'User not found.'); return; }
        try {
            const r = await deviceAPI.cancelApplication(user.client_user_id, applicationId);
            if (r.data.success) {
                toast.success('Cancelled', r.data.message || 'Application cancelled.');
                await loadApplications();
            } else {
                toast.error('Failed', r.data.message);
            }
        } catch (error) {
            const status = error.response?.status;
            const msg    = error.response?.data?.message;
            if (status === 409) toast.warning('Already Finalised', msg || 'Cannot cancel this application.');
            else toast.error('Failed', msg || error.message);
        }
    };

    const handleResubmitClick = (app) => {
        setDialog({
            title: 'Resubmit Application',
            message: `Resubmit your application for the ${app.device_name}?`,
            details: 'A new application will be created for the same device and sent for review.',
            confirmText: 'Yes, Resubmit',
            cancelText: 'Not Now',
            variant: 'primary',
            onConfirm: () => submitResubmit(app.application_id),
        });
    };

    const submitResubmit = async (applicationId) => {
        if (!user?.client_user_id) { toast.error('Error', 'User not found.'); return; }
        try {
            const r = await deviceAPI.resubmitApplication(user.client_user_id, applicationId);
            if (r.data.success) {
                toast.success('Resubmitted', r.data.message || 'Application resubmitted.');
                await loadApplications();
            } else {
                toast.error('Failed', r.data.message);
            }
        } catch (error) {
            const msg = error.response?.data?.message;
            toast.error('Failed', msg || error.message);
        }
    };

    // Guard: ensure applications is always an array before calling .filter
    const safeApps = Array.isArray(applications) ? applications : [];
    const filtered  = filter === 'All' ? safeApps : safeApps.filter(a => a.application_status === filter);
    const countOf   = (f) => f === 'All' ? safeApps.length : safeApps.filter(a => a.application_status === f).length;

    const renderApp = (item) => {
        const meta = STATUS_META[item.application_status] || { dot: C.muted };
        return (
            <div
                key={item.application_id}
                className="card-hover"
                style={S.appCard}
                onClick={() => navigate(`/application-details/${item.application_id}`)}
            >
                {/* Left accent bar */}
                <div style={{ ...S.accentBar, backgroundColor: meta.dot }} />

                <div style={S.appInner}>
                    <div style={S.appTop}>
                        <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                            <div style={S.appDevice}>{item.device_name}</div>
                            <div style={S.appModel}>{item.model} · {item.manufacturer}</div>
                        </div>
                        <StatusChip status={item.application_status} />
                    </div>

                    <div style={S.pillRow}>
                        <div style={S.pill}>
                            <IoDocumentTextOutline size={12} color={C.muted} />
                            <span style={S.pillText}>{item.plan_name}</span>
                        </div>
                        <div style={{ ...S.pill, backgroundColor: C.greenSoft }}>
                            <IoCashOutline size={12} color={C.green} />
                            <span style={{ ...S.pillText, color: C.green, fontWeight: '700' }}>R{item.monthly_cost}/mo</span>
                        </div>
                        <div style={S.pill}>
                            <IoCalendarOutline size={12} color={C.muted} />
                            <span style={S.pillText}>{item.contract_duration_months}mo</span>
                        </div>
                    </div>

                    <div style={S.appFooter}>
                        <div style={S.appDate}>
                            Applied {new Date(item.submission_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div style={S.appFooterRight}>
                            {item.application_status === 'Pending' && (
                                <button
                                    style={S.cancelBtn}
                                    onClick={e => { e.stopPropagation(); handleCancelClick(item); }}
                                >
                                    <IoCloseCircleOutline size={14} color={C.rose} />
                                    <span style={S.cancelBtnText}>Cancel</span>
                                </button>
                            )}
                            {(item.application_status === 'Rejected' || item.application_status === 'Cancelled') && (
                                <button
                                    style={{ ...S.cancelBtn, borderColor: C.accent }}
                                    onClick={e => { e.stopPropagation(); handleResubmitClick(item); }}
                                >
                                    <IoRefreshOutline size={14} color={C.accent} />
                                    <span style={{ ...S.cancelBtnText, color: C.accent }}>Resubmit</span>
                                </button>
                            )}
                            <div style={S.viewHint}>
                                <span style={S.viewHintText}>View</span>
                                <IoChevronForward size={12} color={C.mutedLight} />
                            </div>
                        </div>
                    </div>

                    {item.rejection_reason && (
                        <div style={S.rejectionBanner}>
                            <IoAlertCircleOutline size={14} color={C.rose} />
                            <span style={S.rejectionText}>{item.rejection_reason}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ backgroundColor: '#F0F4FA', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <SkeletonShimmerStyle />
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0A1628, #0F1F3D)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Sk w={38} h={38} r={11} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <Sk w={180} h={17} r={8} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                            <Sk w={130} h={11} r={5} style={{ background: 'rgba(255,255,255,0.1)', animation: 'none' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Sk w={36} h={36} r={10} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                        <Sk w={36} h={36} r={10} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                    </div>
                </div>
                {/* Filter chips */}
                <div style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 28px 12px', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {[...Array(6)].map((_, i) => <Sk key={i} w={82} h={34} r={22} />)}
                </div>
                {/* App cards */}
                <div style={{ padding: '18px 28px 40px', maxWidth: 1280, width: '100%', alignSelf: 'center', boxSizing: 'border-box' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} style={{ backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', overflow: 'hidden' }}>
                                <div style={{ width: 4, backgroundColor: C.border, flexShrink: 0 }} />
                                <div style={{ flex: 1, padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                            <Sk w={160} h={16} r={8} />
                                            <Sk w={120} h={12} r={6} />
                                        </div>
                                        <Sk w={72} h={24} r={12} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <Sk w={88} h={24} r={8} />
                                        <Sk w={78} h={24} r={8} />
                                        <Sk w={58} h={24} r={8} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Sk w={100} h={11} r={5} />
                                        <Sk w={42} h={16} r={6} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={S.root}>
                {/* Page header */}
                <div style={S.pageHeader}>
                    <div style={S.pageHeaderLeft}>
                        <div style={S.pageHeaderIcon}>
                            <IoDocumentTextOutline size={20} color="rgba(255,255,255,0.9)" />
                        </div>
                        <div>
                            <h1 style={S.pageTitle}>My Applications</h1>
                            <p style={S.pageSub}>{safeApps.length} total application{safeApps.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button style={S.browseBtn} onClick={() => navigate('/device-catalog')}>
                            <IoAdd size={16} color="#fff" />
                            <span style={S.browseBtnText}>Browse Devices</span>
                        </button>
                        <button style={S.iconBtn} onClick={onRefresh} disabled={refreshing}>
                            <IoRefreshOutline size={17} color="rgba(255,255,255,0.7)"
                                              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        </button>
                    </div>
                </div>

                {/* Filter chips */}
                <div style={S.filterWrap}>
                    <div style={S.filterRow}>
                        {FILTERS.map(f => {
                            const active = filter === f.key;
                            const cnt    = countOf(f.key);
                            const Icon   = f.icon;
                            return (
                                <button
                                    key={f.key}
                                    style={{ ...S.filterChip, ...(active ? S.filterChipActive : {}) }}
                                    onClick={() => setFilter(f.key)}
                                >
                                    <Icon size={13} color={active ? '#fff' : C.muted} />
                                    <span style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : C.muted }}>{f.key}</span>
                                    {cnt > 0 && (
                                        <div style={{ ...S.filterCount, ...(active ? S.filterCountActive : {}) }}>
                                            <span style={{ fontSize: 10, fontWeight: '700', color: active ? '#fff' : C.muted }}>{cnt}</span>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Application list */}
                <div style={S.list}>
                    {filtered.length === 0 ? (
                        <div style={S.empty}>
                            <div style={S.emptyIcon}><IoDocumentTextOutline size={30} color={C.mutedLight} /></div>
                            <div style={S.emptyTitle}>
                                {filter === 'All' ? 'No applications yet' : `No ${filter.toLowerCase()} applications`}
                            </div>
                            <div style={S.emptySub}>
                                {filter === 'All' ? 'Browse available devices to get started' : `You have no ${filter.toLowerCase()} applications`}
                            </div>
                            {filter === 'All' && (
                                <button style={S.emptyBtn} onClick={() => navigate('/device-catalog')}>Browse Devices</button>
                            )}
                        </div>
                    ) : (
                        <div style={S.appGrid}>
                            {filtered.map(renderApp)}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
        </>
    );
}

const S = {
    root:   { backgroundColor: '#F0F4FA', minHeight: '100%', display: 'flex', flexDirection: 'column' },
    center: { flex: 1, minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FA' },

    pageHeader:     { background: 'linear-gradient(135deg, #0A1628 0%, #0F1F3D 100%)', padding: '0 28px', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 16px rgba(10,22,40,0.4)' },
    pageHeaderLeft: { display: 'flex', alignItems: 'center', gap: 14 },
    pageHeaderIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    pageTitle:      { fontSize: 17, fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.2px' },
    pageSub:        { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
    browseBtn:      { display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer' },
    browseBtnText:  { fontSize: 13, color: '#fff', fontWeight: '600' },
    iconBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },

    filterWrap: { backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 28px 12px' },
    filterRow:  { display: 'flex', flexWrap: 'wrap', gap: 7 },
    filterChip: { display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 22, backgroundColor: C.bg, border: `1.5px solid ${C.border}`, cursor: 'pointer', transition: 'all 0.15s ease' },
    filterChipActive: { background: 'linear-gradient(135deg, #0F1F3D 0%, #1E3A5F 100%)', borderColor: 'transparent', boxShadow: '0 2px 8px rgba(15,31,61,0.2)' },
    filterCount:      { backgroundColor: C.border, padding: '1px 6px', borderRadius: 10 },
    filterCountActive:{ backgroundColor: 'rgba(255,255,255,0.2)' },

    list:    { padding: '18px 28px 40px', flex: 1, maxWidth: 1280, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },
    appGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 },

    appCard: { backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'row', overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,31,61,0.05)', cursor: 'pointer', transition: 'box-shadow 0.18s ease, transform 0.12s ease' },
    accentBar: { width: 4, flexShrink: 0 },
    appInner:  { flex: 1, padding: 15, minWidth: 0 },
    appTop:    { display: 'flex', alignItems: 'flex-start', marginBottom: 10 },
    appDevice: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    appModel:  { fontSize: 12, color: C.muted },
    pillRow:   { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    pill:      { display: 'flex', alignItems: 'center', gap: 4, backgroundColor: C.bg, padding: '4px 8px', borderRadius: 8, border: `1px solid ${C.border}` },
    pillText:  { fontSize: 11, color: C.muted, fontWeight: '500' },

    appFooter:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    appDate:        { fontSize: 11, color: C.mutedLight },
    appFooterRight: { display: 'flex', alignItems: 'center', gap: 8 },
    cancelBtn:      { display: 'flex', alignItems: 'center', gap: 4, backgroundColor: C.roseSoft, padding: '4px 8px', borderRadius: 8, border: `1px solid #FECACA`, cursor: 'pointer' },
    cancelBtnText:  { fontSize: 11, color: C.rose, fontWeight: '700' },
    viewHint:       { display: 'flex', alignItems: 'center', gap: 2 },
    viewHintText:   { fontSize: 11, color: C.mutedLight },
    rejectionBanner:{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 8, padding: 9, backgroundColor: C.roseSoft, borderRadius: 8, border: `1px solid #FECACA` },
    rejectionText:  { fontSize: 11, color: '#7F1D1D', flex: 1, lineHeight: 1.5 },

    empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' },
    emptyIcon: { width: 66, height: 66, borderRadius: 18, backgroundColor: C.surface, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle:{ fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.55, marginBottom: 20 },
    emptyBtn:  { backgroundColor: C.navy, padding: '11px 20px', borderRadius: 11, border: 'none', color: '#fff', fontWeight: '700', fontSize: 13, cursor: 'pointer' },
};
// screens/Client/MyApplicationsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
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
} from 'react-icons/io5';

// ─── Design tokens ─────────────────────────────────────────────────────────
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
    roseSoft: '#FEE2E2',
    slate: '#64748B',
    slateSoft: '#F1F5F9',
};

const STATUS_META = {
    Approved: { bg: C.greenSoft, fg: C.green, dot: C.green, icon: IoCheckmarkCircleOutline },
    Pending: { bg: C.amberSoft, fg: C.amber, dot: C.amber, icon: IoTimeOutline },
    Rejected: { bg: C.roseSoft, fg: C.rose, dot: C.rose, icon: IoCloseCircleOutline },
    Cancelled: { bg: C.slateSoft, fg: C.slate, dot: C.slate, icon: IoCloseCircleOutline },
};

const StatusChip = ({ status }) => {
    const m = STATUS_META[status] || { bg: C.slateSoft, fg: C.slate, dot: C.slate };
    return (
        <div style={chipStyles.wrap}>
            <div style={{ ...chipStyles.dot, backgroundColor: m.dot }} />
            <span style={{ ...chipStyles.text, color: m.fg }}>{status}</span>
        </div>
    );
};

const chipStyles = {
    wrap: { display: 'flex', alignItems: 'center', padding: '5px 10px', borderRadius: 20 },
    dot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
    text: { fontSize: 11, fontWeight: '700' },
};

const FILTERS = [
    { key: 'All', icon: IoAppsOutline },
    { key: 'Pending', icon: IoTimeOutline },
    { key: 'Approved', icon: IoCheckmarkCircleOutline },
    { key: 'Rejected', icon: IoCloseCircleOutline },
    { key: 'Cancelled', icon: IoBanOutline },
];

export default function MyApplicationsScreen() {
    const toast = useToast();
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const u = JSON.parse(userStr);
                setUser(u);
                const r = await deviceAPI.getUserApplications(u.client_user_id);
                setApplications(r.data.data);
            }
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

    const handleCancel = (applicationId) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        const confirmed = window.confirm('Cancel Application\n\nAre you sure? This cannot be undone.');
        if (!confirmed) return;

        deviceAPI.cancelApplication(user.client_user_id, applicationId)
            .then(async r => {
                if (r.data.success) {
                    toast.success('Cancelled', r.data.message || 'Application cancelled.');
                    await loadApplications();
                } else {
                    toast.error('Failed', r.data.message);
                }
            })
            .catch(error => {
                const status = error.response?.status;
                const msg = error.response?.data?.message;
                if (status === 409) toast.warning('Already Finalised', msg || 'Cannot cancel this application.');
                else toast.error('Failed', msg || error.message);
            });
    };

    const filtered = filter === 'All' ? applications : applications.filter(a => a.application_status === filter);
    const countOf = (f) => f === 'All' ? applications.length : applications.filter(a => a.application_status === f).length;

    const renderApp = (item) => {
        const meta = STATUS_META[item.application_status] || { dot: C.muted };
        const Icon = meta.icon;
        return (
            <div
                key={item.application_id}
                style={styles.appCard}
                onClick={() => navigate(`/application-details/${item.application_id}`)}
            >
                <div style={{ ...styles.accentBar, backgroundColor: meta.dot }} />
                <div style={styles.appInner}>
                    <div style={styles.appTop}>
                        <div style={{ flex: 1, marginRight: 10 }}>
                            <div style={styles.appDevice}>{item.device_name}</div>
                            <div style={styles.appModel}>{item.model} · {item.manufacturer}</div>
                        </div>
                        <StatusChip status={item.application_status} />
                    </div>

                    <div style={styles.pillRow}>
                        <div style={styles.pill}>
                            <IoDocumentTextOutline size={12} color={C.muted} />
                            <span style={styles.pillText}>{item.plan_name}</span>
                        </div>
                        <div style={{ ...styles.pill, backgroundColor: C.greenSoft }}>
                            <IoCashOutline size={12} color={C.green} />
                            <span style={{ ...styles.pillText, color: C.green, fontWeight: '700' }}>R{item.monthly_cost}/mo</span>
                        </div>
                        <div style={styles.pill}>
                            <IoCalendarOutline size={12} color={C.muted} />
                            <span style={styles.pillText}>{item.contract_duration_months}mo</span>
                        </div>
                    </div>

                    <div style={styles.appFooter}>
                        <div style={styles.appDate}>
                            Applied {new Date(item.submission_date).toLocaleDateString('en-ZA', {
                            day: 'numeric', month: 'short', year: 'numeric',
                        })}
                        </div>
                        <div style={styles.appFooterRight}>
                            {item.application_status === 'Pending' && (
                                <button
                                    style={styles.cancelBtn}
                                    onClick={(e) => { e.stopPropagation(); handleCancel(item.application_id); }}
                                >
                                    <IoCloseCircleOutline size={14} color={C.rose} />
                                    <span style={styles.cancelBtnText}>Cancel</span>
                                </button>
                            )}
                            <div style={styles.viewHint}>
                                <span style={styles.viewHintText}>Details</span>
                                <IoChevronForward size={13} color={C.mutedLight} />
                            </div>
                        </div>
                    </div>

                    {item.rejection_reason && (
                        <div style={styles.rejectionBanner}>
                            <IoAlertCircleOutline size={14} color={C.rose} />
                            <span style={styles.rejectionText}>{item.rejection_reason}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div className="spinner" style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <div style={styles.loadingText}>Loading applications…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={styles.root}>
            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.topBarHeader}>
                    <div>
                        <div style={styles.pageTitle}>My Applications</div>
                        <div style={styles.pageSub}>{applications.length} total application{applications.length !== 1 ? 's' : ''}</div>
                    </div>
                    <button style={styles.browseBtn} onClick={() => navigate('/device-catalog')}>
                        <IoAdd size={16} color={C.accent} />
                        <span style={styles.browseBtnText}>Browse</span>
                    </button>
                </div>

                {/* Filter chips */}
                <div style={styles.filterRow}>
                    {FILTERS.map(f => {
                        const active = filter === f.key;
                        const cnt = countOf(f.key);
                        const Icon = f.icon;
                        return (
                            <button
                                key={f.key}
                                style={{ ...styles.filterChip, ...(active && styles.filterChipActive) }}
                                onClick={() => setFilter(f.key)}
                            >
                                <Icon size={13} color={active ? '#fff' : C.muted} />
                                <span style={{ ...styles.filterChipText, ...(active && styles.filterChipTextActive) }}>{f.key}</span>
                                {cnt > 0 && (
                                    <div style={{ ...styles.filterCount, ...(active && styles.filterCountActive) }}>
                                        <span style={{ ...styles.filterCountText, ...(active && styles.filterCountTextActive) }}>{cnt}</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Application list */}
            <div style={styles.list}>
                {filtered.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}><IoDocumentTextOutline size={36} color={C.mutedLight} /></div>
                        <div style={styles.emptyTitle}>
                            {filter === 'All' ? 'No applications yet' : `No ${filter.toLowerCase()} applications`}
                        </div>
                        <div style={styles.emptySub}>
                            {filter === 'All' ? 'Browse available devices to get started' : `You have no ${filter.toLowerCase()} applications`}
                        </div>
                        {filter === 'All' && (
                            <button style={styles.emptyBtn} onClick={() => navigate('/device-catalog')}>Browse Devices</button>
                        )}
                    </div>
                ) : (
                    filtered.map(renderApp)
                )}
            </div>

            {/* Refresh button */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <button onClick={onRefresh} style={{ padding: '8px 20px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer' }}>
                    {refreshing ? 'Refreshing...' : '↻ Refresh'}
                </button>
            </div>
        </div>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
    root: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' },
    loadingScreen: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
    loadingText: { marginTop: 14, fontSize: 15, color: C.muted, fontWeight: '500' },

    topBar: {
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        paddingTop: 20,
        paddingBottom: 0,
    },
    topBarHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    pageTitle: { fontSize: 22, fontWeight: '800', color: C.text },
    pageSub: { fontSize: 13, color: C.muted, marginTop: 2 },
    browseBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        backgroundColor: C.accentSoft,
        padding: '8px 14px',
        borderRadius: 20,
        border: 'none',
        cursor: 'pointer',
    },
    browseBtnText: { fontSize: 13, color: C.accent, fontWeight: '700' },

    filterRow: { display: 'flex', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
    filterChip: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '8px 12px',
        borderRadius: 20,
        backgroundColor: C.bg,
        border: `1px solid ${C.border}`,
        cursor: 'pointer',
    },
    filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
    filterChipText: { fontSize: 13, color: C.muted, fontWeight: '600' },
    filterChipTextActive: { color: '#fff' },
    filterCount: { backgroundColor: C.border, padding: '1px 6px', borderRadius: 10 },
    filterCountActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    filterCountText: { fontSize: 10, fontWeight: '700', color: C.muted },
    filterCountTextActive: { color: '#fff' },

    list: { padding: 16, flex: 1 },

    appCard: {
        backgroundColor: C.surface,
        borderRadius: 18,
        marginBottom: 12,
        border: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(15,31,61,0.05)',
        cursor: 'pointer',
    },
    accentBar: { width: 4 },
    appInner: { flex: 1, padding: 16 },
    appTop: { display: 'flex', alignItems: 'flex-start', marginBottom: 12 },
    appDevice: { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
    appModel: { fontSize: 12, color: C.muted },
    pillRow: { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
    pill: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        backgroundColor: C.bg,
        padding: '5px 10px',
        borderRadius: 10,
        border: `1px solid ${C.border}`,
    },
    pillText: { fontSize: 11, color: C.muted, fontWeight: '500' },
    appFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    appDate: { fontSize: 11, color: C.mutedLight },
    appFooterRight: { display: 'flex', alignItems: 'center', gap: 8 },
    cancelBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        backgroundColor: C.roseSoft,
        padding: '5px 10px',
        borderRadius: 10,
        border: `1px solid #FECACA`,
        cursor: 'pointer',
    },
    cancelBtnText: { fontSize: 11, color: C.rose, fontWeight: '700' },
    viewHint: { display: 'flex', alignItems: 'center' },
    viewHintText: { fontSize: 11, color: C.mutedLight },
    rejectionBanner: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        marginTop: 10,
        padding: 10,
        backgroundColor: C.roseSoft,
        borderRadius: 10,
        border: `1px solid #FECACA`,
    },
    rejectionText: { fontSize: 11, color: '#7F1D1D', flex: 1, lineHeight: 1.5 },

    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px' },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 24 },
    emptyBtn: { backgroundColor: C.navy, padding: '13px 24px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' },
};
// screens/Client/DeviceCatalogScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoPhonePortraitOutline,
    IoCalendarOutline,
    IoArrowForward,
    IoSearchOutline,
    IoCloseCircle,
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
};

export default function DeviceCatalogScreen() {
    const toast = useToast();
    const navigate = useNavigate();

    const [devices, setDevices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    const [isEligible, setIsEligible] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        filterDevices();
    }, [search, devices]);

    const init = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const u = JSON.parse(userStr);
                setUser(u);
                const er = await deviceAPI.checkEligibility(u.client_user_id);
                setIsEligible(er.data.eligible);
                if (er.data.eligible) {
                    const dr = await deviceAPI.getAvailableDevices();
                    setDevices(dr.data.data);
                }
            }
        } catch (err) {
            toast.error('Failed to Load', 'Could not load devices. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterDevices = () => {
        if (!search.trim()) {
            setFiltered(devices);
            return;
        }
        const q = search.toLowerCase();
        setFiltered(devices.filter(d =>
            d.device_name.toLowerCase().includes(q) ||
            d.model.toLowerCase().includes(q) ||
            d.manufacturer.toLowerCase().includes(q) ||
            d.plan_name.toLowerCase().includes(q)
        ));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await init();
        setRefreshing(false);
    };

    const handleApply = (deviceId) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        const confirmed = window.confirm('Confirm Application\n\nSubmit your application for this device?');
        if (!confirmed) return;

        deviceAPI.submitApplication(user.client_user_id, deviceId)
            .then(r => {
                if (r.data.success) {
                    toast.success('Applied!', r.data.message || 'Your application is now pending review.');
                    setTimeout(() => navigate('/my-applications'), 1200);
                } else {
                    toast.error('Failed', r.data.message);
                }
            })
            .catch(error => {
                const status = error.response?.status;
                const msg = error.response?.data?.message;
                if (status === 409) toast.warning('Already Applied', msg || 'You already have an active application for this device.');
                else if (status === 422) toast.error('Not Eligible', msg || 'You are not currently eligible to apply.');
                else toast.error('Failed', msg || error.message);
            });
    };

    const renderDevice = (item) => (
        <div key={item.device_id} style={styles.card}>
            {/* Card header */}
            <div style={styles.cardHeader}>
                <div style={styles.deviceIconWrap}>
                    <IoPhonePortraitOutline size={22} color={C.accent} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={styles.deviceName}>{item.device_name}</div>
                    <div style={styles.deviceMake}>{item.manufacturer}</div>
                </div>
                <div style={styles.pricePill}>
                    <div style={styles.priceAmount}>R{item.monthly_cost}</div>
                    <div style={styles.priceUnit}>/mo</div>
                </div>
            </div>

            {/* Tags row */}
            <div style={styles.tagsRow}>
                <div style={styles.tag}><span style={styles.tagText}>{item.model}</span></div>
                <div style={{ ...styles.tag, backgroundColor: C.accentSoft }}>
                    <span style={{ ...styles.tagText, color: C.accent }}>{item.plan_name}</span>
                </div>
                <div style={styles.tag}>
                    <IoCalendarOutline size={11} color={C.muted} />
                    <span style={styles.tagText}> {item.contract_duration_months}mo</span>
                </div>
            </div>

            {/* Plan details */}
            <div style={styles.planDetail}>{item.plan_details}</div>

            {/* Footer */}
            <div style={styles.cardFooter}>
                <div style={styles.footerLeft}>
                    <div style={styles.footerLabel}>Contract total</div>
                    <div style={styles.footerValue}>R{item.monthly_cost * item.contract_duration_months}</div>
                </div>
                <button style={styles.applyBtn} onClick={() => handleApply(item.device_id)}>
                    <span style={styles.applyBtnText}>Apply Now</span>
                    <IoArrowForward size={15} color="#fff" />
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div className="spinner" style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <div style={styles.loadingText}>Loading devices…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isEligible) {
        return (
            <div style={styles.gateScreen}>
                <div style={styles.gateIcon}><IoAlertCircleOutline size={40} color={C.amber} /></div>
                <div style={styles.gateTitle}>Not Yet Eligible</div>
                <div style={styles.gateSub}>Your account must be verified before you can browse and apply for devices.</div>
                <button style={styles.gateBtn} onClick={() => navigate(-1)}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div style={styles.root}>
            {/* Top bar */}
            <div style={styles.topBar}>
                <div style={styles.topBarHeader}>
                    <div>
                        <div style={styles.pageTitle}>Device Catalogue</div>
                        <div style={styles.pageSub}>{filtered.length} device{filtered.length !== 1 ? 's' : ''} available</div>
                    </div>
                </div>
                {/* Search */}
                <div style={{ ...styles.searchBar, ...(searchFocused && styles.searchBarFocused) }}>
                    <IoSearchOutline size={18} color={searchFocused ? C.accent : C.muted} />
                    <input
                        type="text"
                        style={styles.searchInput}
                        placeholder="Search by name, model or plan…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                    {search.length > 0 && (
                        <button style={styles.clearSearchBtnIcon} onClick={() => setSearch('')}>
                            <IoCloseCircle size={18} color={C.mutedLight} />
                        </button>
                    )}
                </div>
            </div>

            {/* Device list */}
            <div style={styles.list}>
                {filtered.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}><IoSearchOutline size={32} color={C.mutedLight} /></div>
                        <div style={styles.emptyTitle}>{search ? 'No results' : 'No devices available'}</div>
                        <div style={styles.emptySub}>{search ? `No devices match "${search}"` : 'Check back later for available devices'}</div>
                        {search && (
                            <button style={styles.clearSearchBtn} onClick={() => setSearch('')}>Clear search</button>
                        )}
                    </div>
                ) : (
                    filtered.map(renderDevice)
                )}
            </div>

            {/* Refresh button (simulates pull-to-refresh) */}
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
    gateScreen: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 40 },
    gateIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.amberSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    gateTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 10 },
    gateSub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 28 },
    gateBtn: { backgroundColor: C.navy, padding: '13px 24px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' },
    topBar: { backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, paddingTop: 20, paddingHorizontal: 16, paddingBottom: 16 },
    topBarHeader: { marginBottom: 14 },
    pageTitle: { fontSize: 22, fontWeight: '800', color: C.text },
    pageSub: { fontSize: 13, color: C.muted, marginTop: 2 },
    searchBar: { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '11px 14px' },
    searchBarFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF' },
    searchInput: { flex: 1, fontSize: 15, color: C.text, border: 'none', background: 'transparent', outline: 'none' },
    clearSearchBtnIcon: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
    list: { padding: 16, flex: 1 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 18, marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 3px 10px rgba(15,31,61,0.07)' },
    cardHeader: { display: 'flex', alignItems: 'center', marginBottom: 14, gap: 12 },
    deviceIconWrap: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    deviceName: { fontSize: 17, fontWeight: '800', color: C.text },
    deviceMake: { fontSize: 12, color: C.muted, marginTop: 2 },
    pricePill: { backgroundColor: C.greenSoft, padding: '7px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' },
    priceAmount: { fontSize: 17, fontWeight: '800', color: C.green },
    priceUnit: { fontSize: 10, color: C.green, fontWeight: '600' },
    tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
    tag: { display: 'flex', alignItems: 'center', backgroundColor: C.bg, border: `1px solid ${C.border}`, padding: '5px 10px', borderRadius: 10, gap: 4 },
    tagText: { fontSize: 11, color: C.muted, fontWeight: '500' },
    planDetail: { fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 16 },
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${C.border}` },
    footerLeft: {},
    footerLabel: { fontSize: 10, color: C.mutedLight, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
    footerValue: { fontSize: 15, fontWeight: '800', color: C.text },
    applyBtn: { display: 'flex', alignItems: 'center', backgroundColor: C.navy, padding: '11px 18px', borderRadius: 14, gap: 7, border: 'none', cursor: 'pointer', boxShadow: '0 4px 8px rgba(15,31,61,0.25)' },
    applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 40px' },
    emptyIcon: { width: 68, height: 68, borderRadius: 18, backgroundColor: C.surface, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 20 },
    clearSearchBtn: { backgroundColor: C.accentSoft, padding: '10px 18px', borderRadius: 20, border: 'none', fontSize: 13, color: C.accent, fontWeight: '700', cursor: 'pointer' },
};
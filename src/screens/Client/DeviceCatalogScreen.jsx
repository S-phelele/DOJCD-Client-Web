// screens/Client/DeviceCatalogScreen.jsx
// Updated: ConfirmDialog replaces window.confirm for applying to a device.
// All original API logic preserved exactly.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    IoPhonePortraitOutline,
    IoCalendarOutline,
    IoArrowForward,
    IoSearchOutline,
    IoCloseCircle,
    IoAlertCircleOutline,
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
};

export default function DeviceCatalogScreen() {
    const toast    = useToast();
    const navigate = useNavigate();

    const [devices,       setDevices]       = useState([]);
    const [filtered,      setFiltered]      = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);
    const [search,        setSearch]        = useState('');
    const [user,          setUser]          = useState(null);
    const [isEligible,    setIsEligible]    = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [dialog,        setDialog]        = useState(null);
    const [applying,      setApplying]      = useState(null); // device being applied for

    useEffect(() => { init(); }, []);
    useEffect(() => { filterDevices(); }, [search, devices]);

    const init = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) { navigate('/login'); return; }
            const u = JSON.parse(userStr);
            setUser(u);

            const er = await deviceAPI.checkEligibility(u.client_user_id);

            // API returns eligibility nested at: r.data.data.eligibility.eligible
            // Handle all possible shapes defensively
            const rawEl = er?.data;
            const eligible =
                rawEl?.data?.eligibility?.eligible ??   // original shape: {data:{data:{eligibility:{eligible:bool}}}}
                rawEl?.data?.eligible ??                 // flatter shape:  {data:{data:{eligible:bool}}}
                rawEl?.eligible ??                       // flat shape:     {data:{eligible:bool}}
                false;

            setIsEligible(eligible);

            if (eligible) {
                const dr = await deviceAPI.getAvailableDevices();

                // API returns devices nested at: r.data.data.devices
                // Handle all possible shapes defensively
                const rawDev = dr?.data;
                let list = [];
                if (Array.isArray(rawDev?.data?.devices)) {
                    list = rawDev.data.devices;
                } else if (Array.isArray(rawDev?.data)) {
                    list = rawDev.data;
                } else if (Array.isArray(rawDev?.devices)) {
                    list = rawDev.devices;
                } else if (Array.isArray(rawDev)) {
                    list = rawDev;
                }
                setDevices(list);
            }
        } catch (err) {
            console.error('Device catalog init error:', err);
            toast.error('Failed to Load', 'Could not load devices. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filterDevices = () => {
        const safeDevices = Array.isArray(devices) ? devices : [];
        if (!search.trim()) { setFiltered(safeDevices); return; }
        const q = search.toLowerCase();
        setFiltered(safeDevices.filter(d =>
            d.device_name?.toLowerCase().includes(q) ||
            d.model?.toLowerCase().includes(q) ||
            d.manufacturer?.toLowerCase().includes(q) ||
            d.plan_name?.toLowerCase().includes(q)
        ));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await init();
        setRefreshing(false);
    };

    // Show confirm dialog before applying
    const handleApplyClick = (device) => {
        if (!user?.client_user_id) { toast.error('Error', 'User not found.'); return; }
        setDialog({
            title: 'Confirm Application',
            message: `Apply for the ${device.device_name}?`,
            details: `Plan: ${device.plan_name} · R${device.monthly_cost}/mo · ${device.contract_duration_months} month contract`,
            confirmText: 'Yes, Apply',
            cancelText: 'Cancel',
            variant: 'default',
            onConfirm: () => submitApplication(device.device_id),
        });
    };

    const submitApplication = (deviceId) => {
        setApplying(deviceId);
        deviceAPI.submitApplication(user.client_user_id, deviceId)
            .then(r => {
                if (r.data.success) {
                    toast.success('Applied!', r.data.message || 'Your application is now pending review.');
                    setTimeout(() => navigate('/my-applications'), 1000);
                } else {
                    toast.error('Failed', r.data.message);
                }
            })
            .catch(error => {
                const status = error.response?.status;
                const msg    = error.response?.data?.message;
                if (status === 409) toast.warning('Already Applied', msg || 'You already have an active application for this device.');
                else if (status === 422) toast.error('Not Eligible', msg || 'You are not currently eligible to apply.');
                else toast.error('Failed', msg || error.message);
            })
            .finally(() => setApplying(null));
    };

    const renderDevice = (item) => (
        <div key={item.device_id} style={S.card}>
            <div style={S.cardHeader}>
                <div style={S.deviceIconWrap}>
                    <IoPhonePortraitOutline size={22} color={C.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.deviceName}>{item.device_name}</div>
                    <div style={S.deviceMake}>{item.manufacturer}</div>
                </div>
                <div style={S.pricePill}>
                    <div style={S.priceAmount}>R{item.monthly_cost}</div>
                    <div style={S.priceUnit}>/mo</div>
                </div>
            </div>

            <div style={S.tagsRow}>
                <div style={S.tag}><span style={S.tagText}>{item.model}</span></div>
                <div style={{ ...S.tag, backgroundColor: C.accentSoft }}>
                    <span style={{ ...S.tagText, color: C.accent }}>{item.plan_name}</span>
                </div>
                <div style={S.tag}>
                    <IoCalendarOutline size={11} color={C.muted} />
                    <span style={S.tagText}> {item.contract_duration_months}mo</span>
                </div>
            </div>

            <div style={S.planDetail}>{item.plan_details}</div>

            <div style={S.cardFooter}>
                <div>
                    <div style={S.footerLabel}>Contract total</div>
                    <div style={S.footerValue}>R{(item.monthly_cost * item.contract_duration_months).toFixed(2)}</div>
                </div>
                <button
                    style={{ ...S.applyBtn, ...(applying === item.device_id ? S.applyBtnLoading : {}) }}
                    onClick={() => handleApplyClick(item)}
                    disabled={!!applying}
                >
                    <span style={S.applyBtnText}>
                        {applying === item.device_id ? 'Applying…' : 'Apply Now'}
                    </span>
                    {applying !== item.device_id && <IoArrowForward size={15} color="#fff" />}
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={S.center}>
                <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!isEligible) {
        return (
            <div style={S.center}>
                <div style={S.gateIcon}><IoAlertCircleOutline size={36} color={C.amber} /></div>
                <div style={S.gateTitle}>Not Yet Eligible</div>
                <div style={S.gateSub}>Your account must be verified before you can browse and apply for devices.</div>
                <button style={S.gateBtn} onClick={() => navigate('/client-dashboard')}>Back to Dashboard</button>
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
                            <IoPhonePortraitOutline size={20} color={C.accent} />
                        </div>
                        <div>
                            <h1 style={S.pageTitle}>Device Catalogue</h1>
                            <p style={S.pageSub}>{filtered.length} device{filtered.length !== 1 ? 's' : ''} available</p>
                        </div>
                    </div>
                    <button style={S.refreshBtn} onClick={onRefresh} disabled={refreshing}>
                        {refreshing ? '↻ Refreshing…' : '↻ Refresh'}
                    </button>
                </div>

                {/* Search */}
                <div style={S.searchWrap}>
                    <div style={{ ...S.searchBar, ...(searchFocused ? S.searchBarFocused : {}) }}>
                        <IoSearchOutline size={18} color={searchFocused ? C.accent : C.muted} />
                        <input
                            type="text" style={S.searchInput}
                            placeholder="Search by name, model or plan…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                        />
                        {search && (
                            <button style={S.clearBtn} onClick={() => setSearch('')}>
                                <IoCloseCircle size={18} color={C.mutedLight} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Device grid */}
                <div style={S.grid}>
                    {filtered.length === 0 ? (
                        <div style={S.empty}>
                            <div style={S.emptyIcon}><IoSearchOutline size={28} color={C.mutedLight} /></div>
                            <div style={S.emptyTitle}>{search ? 'No results' : 'No devices available'}</div>
                            <div style={S.emptySub}>{search ? `No devices match "${search}"` : 'Check back later'}</div>
                            {search && <button style={S.clearSearchBtn} onClick={() => setSearch('')}>Clear search</button>}
                        </div>
                    ) : (
                        <div style={S.cardGrid}>{filtered.map(renderDevice)}</div>
                    )}
                </div>
            </div>

            <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
        </>
    );
}

const S = {
    root:   { backgroundColor: C.bg, minHeight: '100%', display: 'flex', flexDirection: 'column' },
    center: { flex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: C.bg },

    gateIcon:  { width: 68, height: 68, borderRadius: 18, backgroundColor: C.amberSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    gateTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
    gateSub:   { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 24, maxWidth: 320 },
    gateBtn:   { backgroundColor: C.navy, padding: '12px 22px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' },

    pageHeader:     { backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'sticky', top: 0, zIndex: 50 },
    pageHeaderLeft: { display: 'flex', alignItems: 'center', gap: 14 },
    pageHeaderIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    pageTitle:      { fontSize: 19, fontWeight: '800', color: C.text, margin: 0 },
    pageSub:        { fontSize: 12, color: C.muted, marginTop: 2 },
    refreshBtn:     { padding: '8px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', fontSize: 13, color: C.muted, fontWeight: '600' },

    searchWrap: { padding: '14px 24px 0' },
    searchBar:  { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 12, padding: '10px 14px' },
    searchBarFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF' },
    searchInput:{ flex: 1, fontSize: 15, color: C.text, border: 'none', background: 'transparent', outline: 'none' },
    clearBtn:   { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },

    grid:    { flex: 1, padding: '14px 24px 32px' },
    cardGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 },

    card: { backgroundColor: C.surface, borderRadius: 16, padding: 18, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(15,31,61,0.05)', display: 'flex', flexDirection: 'column' },
    cardHeader:    { display: 'flex', alignItems: 'center', marginBottom: 12, gap: 12 },
    deviceIconWrap:{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    deviceName:    { fontSize: 15, fontWeight: '800', color: C.text },
    deviceMake:    { fontSize: 12, color: C.muted, marginTop: 2 },
    pricePill:     { backgroundColor: C.greenSoft, padding: '6px 11px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto' },
    priceAmount:   { fontSize: 15, fontWeight: '800', color: C.green },
    priceUnit:     { fontSize: 10, color: C.green, fontWeight: '600' },
    tagsRow:       { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
    tag:           { display: 'flex', alignItems: 'center', backgroundColor: C.bg, border: `1px solid ${C.border}`, padding: '4px 8px', borderRadius: 8, gap: 3 },
    tagText:       { fontSize: 11, color: C.muted, fontWeight: '500' },
    planDetail:    { fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 14, flex: 1 },
    cardFooter:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${C.border}`, marginTop: 'auto' },
    footerLabel:   { fontSize: 10, color: C.mutedLight, fontWeight: '600', letterSpacing: 0.4, marginBottom: 2 },
    footerValue:   { fontSize: 14, fontWeight: '800', color: C.text },
    applyBtn:      { display: 'flex', alignItems: 'center', backgroundColor: C.navy, padding: '10px 16px', borderRadius: 11, gap: 6, border: 'none', cursor: 'pointer' },
    applyBtnLoading:{ opacity: 0.6, cursor: 'not-allowed' },
    applyBtnText:  { color: '#fff', fontSize: 13, fontWeight: '700' },

    empty:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' },
    emptyIcon:     { width: 58, height: 58, borderRadius: 15, backgroundColor: C.surface, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle:    { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub:      { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 16 },
    clearSearchBtn:{ backgroundColor: C.accentSoft, padding: '8px 16px', borderRadius: 16, border: 'none', fontSize: 13, color: C.accent, fontWeight: '700', cursor: 'pointer' },
};
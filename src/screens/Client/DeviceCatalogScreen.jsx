// screens/Client/DeviceCatalogScreen.jsx
// Updated: ConfirmDialog replaces window.confirm for applying to a device.
// All original API logic preserved exactly.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Sk, SkeletonShimmerStyle } from '../../components/SkeletonLoader';
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
    const [detailDevice,  setDetailDevice]  = useState(null); // device open in detail modal

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
        <div key={item.device_id} className="card-hover" style={S.card}>
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
                    style={S.applyBtn}
                    onClick={() => setDetailDevice(item)}
                >
                    <span style={S.applyBtnText}>View & Apply</span>
                    <IoArrowForward size={15} color="#fff" />
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div style={{ backgroundColor: '#F0F4FA', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <SkeletonShimmerStyle />
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0A1628, #0F1F3D)', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <Sk w={38} h={38} r={11} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            <Sk w={160} h={17} r={8} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                            <Sk w={110} h={11} r={5} style={{ background: 'rgba(255,255,255,0.1)', animation: 'none' }} />
                        </div>
                    </div>
                    <Sk w={80} h={34} r={10} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                </div>
                {/* Search bar */}
                <div style={{ padding: '16px 28px 0', maxWidth: 1280, width: '100%', alignSelf: 'center', boxSizing: 'border-box' }}>
                    <Sk w="100%" h={48} r={14} />
                </div>
                {/* Device grid */}
                <div style={{ padding: '16px 28px 40px', maxWidth: 1280, width: '100%', alignSelf: 'center', boxSizing: 'border-box' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{ backgroundColor: C.surface, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Sk w={46} h={46} r={13} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        <Sk w="70%" h={16} r={7} />
                                        <Sk w="50%" h={12} r={6} />
                                    </div>
                                    <Sk w={56} h={52} r={12} />
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <Sk w={72} h={26} r={8} />
                                    <Sk w={82} h={26} r={8} />
                                    <Sk w={52} h={26} r={8} />
                                </div>
                                <Sk w="100%" h={52} r={8} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <Sk w={64} h={10} r={5} />
                                        <Sk w={80} h={18} r={7} />
                                    </div>
                                    <Sk w={100} h={40} r={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
            <style>{`
                @keyframes spin     { to { transform: rotate(360deg); } }
                @keyframes modalPop { from { opacity:0; transform:scale(0.93) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
            `}</style>
            <div style={S.root}>
                {/* Page header */}
                <div style={S.pageHeader}>
                    <div style={S.pageHeaderLeft}>
                        <div style={S.pageHeaderIcon}>
                            <IoPhonePortraitOutline size={20} color="rgba(255,255,255,0.9)" />
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

            {/* ── Device Detail Modal ─────────────────────────────────── */}
            {detailDevice && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(15,31,61,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setDetailDevice(null)} />
                    <div style={{ position: 'fixed', inset: 0, zIndex: 301, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
                        <div style={{ backgroundColor: C.surface, borderRadius: 22, width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(15,31,61,0.22)', border: `1px solid ${C.border}`, animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
                            {/* Modal header */}
                            <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 50, height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #EBF0FF 0%, #D4E0FF 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                                    <IoPhonePortraitOutline size={24} color={C.accent} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 2 }}>{detailDevice.device_name}</div>
                                    <div style={{ fontSize: 12, color: C.muted }}>{detailDevice.manufacturer}</div>
                                </div>
                                <div style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)', padding: '8px 12px', borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{ fontSize: 16, fontWeight: '900', color: '#047857' }}>R{detailDevice.monthly_cost}</div>
                                    <div style={{ fontSize: 10, color: '#059669', fontWeight: '600' }}>/mo</div>
                                </div>
                                <button style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }} onClick={() => setDetailDevice(null)}>
                                    <IoCloseCircle size={18} color={C.mutedLight} />
                                </button>
                            </div>

                            {/* Scrollable specs */}
                            <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px' }}>
                                {[
                                    { label: 'Model',          value: detailDevice.model },
                                    { label: 'Manufacturer',   value: detailDevice.manufacturer },
                                    { label: 'Plan',           value: detailDevice.plan_name },
                                    { label: 'Monthly Cost',   value: `R${detailDevice.monthly_cost}`, color: C.green },
                                    { label: 'Contract',       value: `${detailDevice.contract_duration_months} Months` },
                                    { label: 'Total Cost',     value: `R${(Number(detailDevice.monthly_cost) * Number(detailDevice.contract_duration_months)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, color: C.navy },
                                ].map((row, i, arr) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', paddingTop: 11, paddingBottom: 11, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                                        <div style={{ fontSize: 13, color: C.muted, width: 126, flexShrink: 0 }}>{row.label}</div>
                                        <div style={{ fontSize: 13, fontWeight: '700', color: row.color || C.text }}>{row.value || '—'}</div>
                                    </div>
                                ))}
                                {detailDevice.plan_details && (
                                    <div style={{ padding: '11px 13px', backgroundColor: C.bg, borderRadius: 11, margin: '10px 0 14px', border: `1px solid ${C.border}` }}>
                                        <div style={{ fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: '0.9px', marginBottom: 5 }}>PLAN DETAILS</div>
                                        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{detailDevice.plan_details}</div>
                                    </div>
                                )}
                            </div>

                            {/* Apply footer */}
                            <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.border}` }}>
                                <button
                                    style={{ width: '100%', background: 'linear-gradient(135deg, #0F1F3D 0%, #1E3A5F 100%)', padding: '14px', borderRadius: 14, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: applying ? 'not-allowed' : 'pointer', opacity: applying ? 0.6 : 1, boxShadow: '0 4px 12px rgba(15,31,61,0.25)' }}
                                    onClick={() => {
                                        setDetailDevice(null);
                                        handleApplyClick(detailDevice);
                                    }}
                                    disabled={!!applying}
                                >
                                    <span style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                                        {applying === detailDevice.device_id ? 'Applying…' : 'Apply for this Device'}
                                    </span>
                                    {applying !== detailDevice.device_id && <IoArrowForward size={16} color="#fff" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

const S = {
    root:   { backgroundColor: '#F0F4FA', minHeight: '100%', display: 'flex', flexDirection: 'column' },
    center: { flex: 1, minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#F0F4FA' },

    gateIcon:  { width: 68, height: 68, borderRadius: 18, backgroundColor: C.amberSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    gateTitle: { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 8 },
    gateSub:   { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 24, maxWidth: 320 },
    gateBtn:   { backgroundColor: C.navy, padding: '12px 22px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' },

    pageHeader:     { background: 'linear-gradient(135deg, #0A1628 0%, #0F1F3D 100%)', padding: '0 28px', minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 16px rgba(10,22,40,0.4)' },
    pageHeaderLeft: { display: 'flex', alignItems: 'center', gap: 14 },
    pageHeaderIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    pageTitle:      { fontSize: 17, fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.2px' },
    pageSub:        { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
    refreshBtn:     { padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, color: '#fff', fontWeight: '600' },

    searchWrap: { padding: '16px 28px 0', maxWidth: 1280, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },
    searchBar:  { display: 'flex', alignItems: 'center', gap: 10, backgroundColor: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '11px 16px', boxShadow: '0 1px 4px rgba(15,31,61,0.04)' },
    searchBarFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF', boxShadow: `0 0 0 3px ${C.accent}18` },
    searchInput:{ flex: 1, fontSize: 15, color: C.text, border: 'none', background: 'transparent', outline: 'none' },
    clearBtn:   { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },

    grid:    { flex: 1, padding: '16px 28px 40px', maxWidth: 1280, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },
    cardGrid:{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },

    card: { backgroundColor: C.surface, borderRadius: 18, padding: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(15,31,61,0.06)', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s ease, transform 0.15s ease' },
    cardHeader:    { display: 'flex', alignItems: 'center', marginBottom: 14, gap: 12 },
    deviceIconWrap:{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg, #EBF0FF 0%, #D4E0FF 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    deviceName:    { fontSize: 15, fontWeight: '800', color: C.text, letterSpacing: '-0.1px' },
    deviceMake:    { fontSize: 12, color: C.muted, marginTop: 2 },
    pricePill:     { background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', padding: '8px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 },
    priceAmount:   { fontSize: 15, fontWeight: '900', color: '#047857' },
    priceUnit:     { fontSize: 10, color: '#059669', fontWeight: '600' },
    tagsRow:       { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    tag:           { display: 'flex', alignItems: 'center', backgroundColor: C.bg, border: `1px solid ${C.border}`, padding: '4px 9px', borderRadius: 8, gap: 3 },
    tagText:       { fontSize: 11, color: C.muted, fontWeight: '500' },
    planDetail:    { fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16, flex: 1 },
    cardFooter:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: `1px solid ${C.border}`, marginTop: 'auto' },
    footerLabel:   { fontSize: 10, color: C.mutedLight, fontWeight: '600', letterSpacing: 0.4, marginBottom: 3 },
    footerValue:   { fontSize: 15, fontWeight: '900', color: C.text, letterSpacing: '-0.2px' },
    applyBtn:      { display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #0F1F3D 0%, #1E3A5F 100%)', padding: '11px 18px', borderRadius: 12, gap: 6, border: 'none', cursor: 'pointer', boxShadow: '0 3px 8px rgba(15,31,61,0.25)', transition: 'opacity 0.15s, transform 0.15s' },
    applyBtnLoading:{ opacity: 0.6, cursor: 'not-allowed' },
    applyBtnText:  { color: '#fff', fontSize: 13, fontWeight: '700' },

    empty:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' },
    emptyIcon:     { width: 58, height: 58, borderRadius: 15, backgroundColor: C.surface, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    emptyTitle:    { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 6 },
    emptySub:      { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.5, marginBottom: 16 },
    clearSearchBtn:{ backgroundColor: C.accentSoft, padding: '8px 16px', borderRadius: 16, border: 'none', fontSize: 13, color: C.accent, fontWeight: '700', cursor: 'pointer' },
};
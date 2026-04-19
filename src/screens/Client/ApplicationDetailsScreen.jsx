// screens/Client/ApplicationDetailsScreen.jsx
// Updated:
//  - Device section: full info (name, model, manufacturer, plan, contract, total cost, plan details)
//  - Applicant section: Full Name + Email from application data, with fallback to localStorage user
//  - Timeline: Submission date shown, Under Review shows current status badge, final step reflects outcome
//  - Cancel now uses ConfirmDialog instead of window.confirm
//  - paddingVertical replaced with paddingTop/paddingBottom for web compatibility

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoTime,
    IoCloseCircle,
    IoHelpCircle,
    IoPersonOutline,
    IoMailOutline,
    IoCalendarOutline,
    IoAlertCircleOutline,
    IoPhonePortraitOutline,
    IoCashOutline,
    IoDocumentTextOutline,
    IoBriefcaseOutline,
    IoInformationCircleOutline,
} from 'react-icons/io5';

// ─── Design tokens ─────────────────────────────────────────────────────────
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
    Approved:  { bg: C.greenSoft, fg: C.green, dot: C.green,  icon: IoCheckmarkCircle, label: 'Approved',    timelineLabel: 'Approved' },
    Pending:   { bg: C.amberSoft, fg: C.amber, dot: C.amber,  icon: IoTime,            label: 'Under Review', timelineLabel: 'Under Review' },
    Rejected:  { bg: C.roseSoft,  fg: C.rose,  dot: C.rose,   icon: IoCloseCircle,     label: 'Rejected',    timelineLabel: 'Rejected' },
    Cancelled: { bg: C.slateSoft, fg: C.slate, dot: C.slate,  icon: IoCloseCircle,     label: 'Cancelled',   timelineLabel: 'Cancelled' },
};

// ─── Reusable info row ──────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, valueColor, last = false }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingTop: 13, paddingBottom: 13,
        borderBottom: last ? 'none' : `1px solid ${C.border}`,
    }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <Icon size={15} color={C.muted} />
        </div>
        <div style={{ fontSize: 13, color: C.muted, width: 130, flexShrink: 0 }}>{label}</div>
        <div style={{ flex: 1, fontSize: 13, fontWeight: '600', color: valueColor || C.text }}>{value || '—'}</div>
    </div>
);

export default function ApplicationDetailsScreen() {
    const navigate = useNavigate();
    const { applicationId } = useParams();
    const toast = useToast();

    const [application, setApplication] = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [cancelling,  setCancelling]  = useState(false);
    const [user,        setUser]        = useState(null);
    const [dialog,      setDialog]      = useState(null);

    useEffect(() => { load(); }, [applicationId]);

    const load = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) { navigate('/login'); return; }
            const u = JSON.parse(userStr);
            setUser(u);
            const res = await deviceAPI.getApplicationDetails(u.client_user_id, parseInt(applicationId));
            // Handle nested response shape
            const raw = res?.data?.data;
            setApplication(raw || null);
        } catch {
            toast.error('Failed to Load', 'Could not load application details.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = () => {
        if (!user?.client_user_id || !application) return;
        setDialog({
            title: 'Cancel Application',
            message: `Cancel your application for the ${application.device_name}?`,
            details: 'This action cannot be undone. Your application will be permanently cancelled.',
            confirmText: 'Yes, Cancel It',
            cancelText: 'Keep Application',
            variant: 'danger',
            onConfirm: doCancel,
        });
    };

    const doCancel = () => {
        setCancelling(true);
        deviceAPI.cancelApplication(user.client_user_id, application.application_id)
            .then(res => {
                if (res.data.success) {
                    toast.success('Cancelled', res.data.message || 'Your application has been cancelled.');
                    setTimeout(() => navigate(-1), 1200);
                } else {
                    toast.error('Failed', res.data.message);
                }
            })
            .catch(error => {
                const status = error.response?.status;
                const msg    = error.response?.data?.message;
                if (status === 409) toast.warning('Already Finalised', msg || 'This application cannot be cancelled.');
                else toast.error('Failed', msg || error.message);
            })
            .finally(() => setCancelling(false));
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };
    const fmtDateShort = (d) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-ZA', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    // ── Loading ───────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ flex: 1, minHeight: '100%', backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 14 }}>
                <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 14, color: C.muted, fontWeight: '500' }}>Loading details…</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ── Not found ─────────────────────────────────────────────────────────
    if (!application) {
        return (
            <div style={{ flex: 1, minHeight: '100%', backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 40 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: C.roseSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                    <IoAlertCircleOutline size={40} color={C.rose} />
                </div>
                <div style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 6 }}>Not Found</div>
                <div style={{ fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 28 }}>This application could not be found.</div>
                <button style={{ backgroundColor: C.navy, padding: '12px 24px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' }} onClick={() => navigate(-1)}>
                    Go Back
                </button>
            </div>
        );
    }

    const meta       = STATUS_META[application.application_status] || { bg: C.slateSoft, fg: C.slate, dot: C.slate, icon: IoHelpCircle, label: application.application_status, timelineLabel: application.application_status };
    const StatusIcon = meta.icon;

    // Derive applicant name — API may provide directly or fall back to localStorage user
    const applicantName  = (application.first_name && application.last_name)
        ? `${application.first_name} ${application.last_name}`
        : (user?.first_name && user?.last_name)
            ? `${user.first_name} ${user.last_name}`
            : '—';
    const applicantEmail = application.email || user?.email || '—';

    // Contract total cost
    const contractTotal = application.monthly_cost && application.contract_duration_months
        ? `R${(application.monthly_cost * application.contract_duration_months).toLocaleString('en-ZA')}`
        : '—';

    // Build timeline steps
    const isPending   = application.application_status === 'Pending';
    const isFinalised = ['Approved', 'Rejected', 'Cancelled'].includes(application.application_status);

    const timelineSteps = [
        {
            key: 'submitted',
            label: 'Application Submitted',
            sublabel: `Application #${application.application_id} created`,
            date: application.submission_date,
            done: true,
            color: C.green,
        },
        {
            key: 'review',
            label: 'Under Review',
            sublabel: isPending
                ? `Status: ${meta.label} — awaiting decision`
                : `Status moved to: ${meta.timelineLabel}`,
            date: application.last_updated,
            done: true,   // always shown as reached once submitted
            inProgress: isPending,
            color: isPending ? C.amber : isFinalised ? C.green : C.muted,
        },
        ...(isFinalised ? [{
            key: 'outcome',
            label: meta.timelineLabel,
            sublabel: application.application_status === 'Approved'
                ? 'Your device application has been approved.'
                : application.application_status === 'Rejected'
                    ? (application.rejection_reason || 'Application was not approved.')
                    : 'Application was cancelled.',
            date: application.last_updated,
            done: true,
            color: meta.dot,
        }] : []),
    ];

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                .ad-section { animation: fadeUp 0.3s ease both; }
            `}</style>

            <div style={S.root}>
                {/* ── Sticky page header ── */}
                <div style={S.header}>
                    <button style={S.backBtn} onClick={() => navigate(-1)}>
                        <IoArrowBack size={20} color={C.navy} />
                    </button>
                    <div style={S.headerCenter}>
                        <h1 style={S.headerTitle}>Application #{application.application_id}</h1>
                        <p style={S.headerSub}>Submitted {fmtDateShort(application.submission_date)}</p>
                    </div>
                    <div style={{ width: 40 }} />
                </div>

                <div style={S.body}>
                    {/* ── Status hero ── */}
                    <div className="ad-section" style={{ ...S.statusHero, backgroundColor: meta.bg }}>
                        <div style={{ ...S.statusIcoWrap, backgroundColor: meta.dot + '22' }}>
                            <StatusIcon size={38} color={meta.dot} />
                        </div>
                        <div style={{ ...S.statusLabel, color: meta.fg }}>{meta.label}</div>
                        <div style={S.statusDate}>Last updated {fmtDateShort(application.last_updated)}</div>

                        {application.application_status === 'Pending' && (
                            <button
                                style={{ ...S.cancelBtn, ...(cancelling ? { opacity: 0.6 } : {}) }}
                                onClick={handleCancelClick}
                                disabled={cancelling}
                            >
                                {cancelling ? (
                                    <div style={{ width: 16, height: 16, border: `2px solid rgba(220,38,38,0.3)`, borderTopColor: C.rose, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                ) : (
                                    <>
                                        <IoCloseCircle size={17} color={C.rose} />
                                        <span style={S.cancelBtnText}>Cancel Application</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* ── DEVICE ── */}
                    <div className="ad-section" style={{ animationDelay: '50ms' }}>
                        <div style={S.sectionLabel}>
                            <IoPhonePortraitOutline size={14} color={C.accent} />
                            DEVICE DETAILS
                        </div>
                        <div style={S.card}>
                            {/* Device name + price */}
                            <div style={S.deviceTop}>
                                <div style={S.deviceIco}>
                                    <IoPhonePortraitOutline size={24} color={C.accent} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={S.deviceName}>{application.device_name}</div>
                                    <div style={S.deviceSub}>{application.model} · {application.manufacturer}</div>
                                </div>
                                <div style={S.pricePill}>
                                    <div style={S.priceVal}>R{application.monthly_cost?.toLocaleString('en-ZA')}</div>
                                    <div style={S.priceUnit}>/mo</div>
                                </div>
                            </div>

                            {/* All device info rows */}
                            <InfoRow icon={IoPhonePortraitOutline} label="Device Name"       value={application.device_name} />
                            <InfoRow icon={IoBriefcaseOutline}    label="Manufacturer"      value={application.manufacturer} />
                            <InfoRow icon={IoInformationCircleOutline} label="Model"         value={application.model} />
                            <InfoRow icon={IoDocumentTextOutline} label="Plan Name"          value={application.plan_name} />
                            <InfoRow icon={IoInformationCircleOutline} label="Plan Details"  value={application.plan_details} />
                            <InfoRow icon={IoCashOutline}          label="Monthly Cost"      value={`R${application.monthly_cost?.toLocaleString('en-ZA')}`} valueColor={C.green} />
                            <InfoRow icon={IoCalendarOutline}      label="Contract Duration" value={`${application.contract_duration_months} Months`} />
                            <InfoRow icon={IoCashOutline}          label="Contract Total"    value={contractTotal} valueColor={C.navy} last />
                        </div>
                    </div>

                    {/* ── APPLICANT ── */}
                    <div className="ad-section" style={{ animationDelay: '100ms' }}>
                        <div style={S.sectionLabel}>
                            <IoPersonOutline size={14} color={C.accent} />
                            APPLICANT INFORMATION
                        </div>
                        <div style={S.card}>
                            {/* Info rows */}
                            <InfoRow icon={IoPersonOutline}   label="Full Name"   value={applicantName} />
                            <InfoRow icon={IoMailOutline}     label="Email"       value={applicantEmail} />
                        </div>
                    </div>

                    {/* ── REJECTION REASON ── */}
                    {application.rejection_reason && (
                        <div className="ad-section" style={{ animationDelay: '120ms' }}>
                            <div style={S.sectionLabel}>
                                <IoAlertCircleOutline size={14} color={C.rose} />
                                REJECTION REASON
                            </div>
                            <div style={{ ...S.card, backgroundColor: C.roseSoft, borderColor: '#FECACA' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <IoAlertCircleOutline size={20} color={C.rose} style={{ flexShrink: 0, marginTop: 2 }} />
                                    <p style={{ fontSize: 14, color: '#7F1D1D', lineHeight: 1.6, margin: 0 }}>
                                        {application.rejection_reason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TIMELINE ── */}
                    <div className="ad-section" style={{ animationDelay: '150ms', paddingBottom: 40 }}>
                        <div style={S.sectionLabel}>
                            <IoCalendarOutline size={14} color={C.accent} />
                            TIMELINE
                        </div>
                        <div style={S.card}>
                            {timelineSteps.map((step, i) => (
                                <div key={step.key} style={{ display: 'flex', gap: 0 }}>
                                    {/* Left — dot + connector line */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, marginRight: 14, flexShrink: 0 }}>
                                        <div style={{
                                            width: 16, height: 16, borderRadius: 8, flexShrink: 0,
                                            backgroundColor: step.inProgress ? C.amber : step.done ? step.color : C.border,
                                            border: step.inProgress ? `3px solid ${C.amberSoft}` : step.done ? `3px solid ${step.color}22` : `2px solid ${C.mutedLight}`,
                                            boxSizing: 'border-box',
                                            animation: step.inProgress ? 'none' : undefined,
                                        }} />
                                        {i < timelineSteps.length - 1 && (
                                            <div style={{
                                                width: 2, flex: 1, minHeight: 24,
                                                backgroundColor: step.done && !step.inProgress ? step.color : C.border,
                                                margin: '3px 0',
                                            }} />
                                        )}
                                    </div>

                                    {/* Right — content */}
                                    <div style={{ flex: 1, paddingBottom: i < timelineSteps.length - 1 ? 20 : 0 }}>
                                        {/* Label + status badge */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 14, fontWeight: '700', color: step.done ? C.text : C.mutedLight }}>
                                                {step.label}
                                            </span>
                                            {/* Status badge on the "Under Review" step */}
                                            {step.key === 'review' && (
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    backgroundColor: meta.bg,
                                                    padding: '3px 9px', borderRadius: 20,
                                                }}>
                                                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: meta.dot }} />
                                                    <span style={{ fontSize: 11, fontWeight: '700', color: meta.fg }}>
                                                        {meta.label}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sub-label */}
                                        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, margin: '0 0 4px' }}>
                                            {step.sublabel}
                                        </p>

                                        {/* Date */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <IoCalendarOutline size={11} color={C.mutedLight} />
                                            <span style={{ fontSize: 11, color: C.mutedLight }}>
                                                {step.done ? fmtDate(step.date) : 'Pending…'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
    root:   { backgroundColor: C.bg, display: 'flex', flexDirection: 'column', minHeight: '100%' },

    header: {
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: C.bg, border: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer',
    },
    headerCenter: { textAlign: 'center' },
    headerTitle:  { fontSize: 16, fontWeight: '800', color: C.text, margin: 0 },
    headerSub:    { fontSize: 11, color: C.muted, marginTop: 2 },

    body: { flex: 1, padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },

    statusHero: {
        borderRadius: 18, padding: '28px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    statusIcoWrap: { width: 72, height: 72, borderRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statusLabel:   { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    statusDate:    { fontSize: 13, color: C.muted, marginBottom: 16 },
    cancelBtn: {
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: C.surface, padding: '11px 20px',
        borderRadius: 14, border: `1px solid #FECACA`, cursor: 'pointer',
    },
    cancelBtnText: { color: C.rose, fontSize: 14, fontWeight: '700' },

    sectionLabel: {
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: '700', color: C.muted,
        letterSpacing: '1.1px', marginBottom: 8,
    },

    card: {
        backgroundColor: C.surface,
        borderRadius: 16, padding: '0 16px',
        border: `1px solid ${C.border}`,
    },

    // Device card top
    deviceTop: {
        display: 'flex', alignItems: 'center', gap: 14,
        paddingTop: 16, paddingBottom: 16,
        borderBottom: `1px solid ${C.border}`,
        marginBottom: 0,
    },
    deviceIco:  { width: 48, height: 48, borderRadius: 13, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    deviceName: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 3 },
    deviceSub:  { fontSize: 12, color: C.muted },
    pricePill:  { backgroundColor: C.greenSoft, padding: '7px 12px', borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
    priceVal:   { fontSize: 17, fontWeight: '800', color: C.green },
    priceUnit:  { fontSize: 10, color: C.green, fontWeight: '600' },

    // Applicant card top
    applicantTop: {
        display: 'flex', alignItems: 'center', gap: 14,
        paddingTop: 16, paddingBottom: 16,
        borderBottom: `1px solid ${C.border}`,
    },
    applicantAvatar: {
        width: 48, height: 48, borderRadius: 13,
        backgroundColor: C.accent,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    applicantAvatarText: { fontSize: 20, fontWeight: '900', color: '#fff' },
    applicantName:  { fontSize: 16, fontWeight: '800', color: C.text, marginBottom: 3 },
    applicantEmail: { fontSize: 12, color: C.muted },
};
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
import { Sk, SkeletonShimmerStyle } from '../../components/SkeletonLoader';
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
    IoRefreshOutline,
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
    Approved:         { bg: C.greenSoft, fg: C.green, dot: C.green,  icon: IoCheckmarkCircle, label: 'Approved',          timelineLabel: 'Approved' },
    Pending:          { bg: C.amberSoft, fg: C.amber, dot: C.amber,  icon: IoTime,            label: 'Under Review',      timelineLabel: 'Under Review' },
    Pending_Finance:  { bg: '#EDE9FE',   fg: '#7C3AED', dot: '#7C3AED', icon: IoTime,         label: 'Finance Review',    timelineLabel: 'Awaiting Finance' },
    Rejected:         { bg: C.roseSoft,  fg: C.rose,  dot: C.rose,   icon: IoCloseCircle,     label: 'Rejected',          timelineLabel: 'Rejected' },
    Cancelled:        { bg: C.slateSoft, fg: C.slate, dot: C.slate,  icon: IoCloseCircle,     label: 'Cancelled',         timelineLabel: 'Cancelled' },
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
    const [reapplying,  setReapplying]  = useState(false);
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

            // Robustly unwrap — try every nesting shape the API might return
            const d = res?.data;
            let raw =
                d?.data?.application ??
                d?.data?.data        ??
                d?.data              ??
                d                    ??
                null;

            // If raw is an array (shouldn't happen but guard it), take first item
            if (Array.isArray(raw)) raw = raw[0] ?? null;

            // Normalise alternate field name variants
            if (raw && typeof raw === 'object') {
                raw.submission_date  = raw.submission_date  || raw.created_at         || raw.submitted_at || raw.date_submitted || null;
                raw.last_updated     = raw.last_updated     || raw.updated_at         || raw.last_modified || raw.date_updated  || null;
                raw.device_name      = raw.device_name      || raw.name               || raw.device       || null;
                raw.manufacturer     = raw.manufacturer     || raw.device_manufacturer || raw.brand       || null;
                raw.model            = raw.model            || raw.device_model        || null;
                raw.plan_name        = raw.plan_name        || raw.contract_plan       || raw.plan         || null;
                raw.plan_details     = raw.plan_details     || raw.plan_description    || raw.details      || null;
                raw.monthly_cost     = raw.monthly_cost     || raw.cost_per_month      || raw.price        || null;
                raw.contract_duration_months = raw.contract_duration_months || raw.duration || raw.contract_duration || null;
                raw.application_status       = raw.application_status       || raw.status   || 'Pending';
            }

            console.log('[ApplicationDetails] API raw:', raw);
            setApplication((raw && raw.application_id) ? raw : null);
        } catch (err) {
            console.error('ApplicationDetails load error:', err);
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

    const handleReapplyClick = () => {
        if (!user?.client_user_id || !application) return;
        setDialog({
            title: 'Re-apply for Device',
            message: `Re-apply for the ${application.device_name}?`,
            details: 'A new application will be created and submitted for review.',
            confirmText: 'Yes, Re-apply',
            cancelText: 'Not Now',
            variant: 'primary',
            onConfirm: doReapply,
        });
    };

    const doReapply = () => {
        setReapplying(true);
        deviceAPI.resubmitApplication(user.client_user_id, application.application_id)
            .then(res => {
                if (res.data.success) {
                    toast.success('Re-applied!', res.data.message || 'New application submitted for review.');
                    setTimeout(() => navigate('/my-applications'), 1200);
                } else {
                    toast.error('Failed', res.data.message);
                }
            })
            .catch(error => {
                const msg = error.response?.data?.message;
                toast.error('Failed', msg || error.message);
            })
            .finally(() => setReapplying(false));
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

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ backgroundColor: '#F0F4FA', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
                <SkeletonShimmerStyle />
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #0A1628, #0F1F3D)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Sk w={36} h={36} r={10} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                        <Sk w={170} h={17} r={8} style={{ background: 'rgba(255,255,255,0.15)', animation: 'none' }} />
                        <Sk w={110} h={11} r={5} style={{ background: 'rgba(255,255,255,0.1)', animation: 'none' }} />
                    </div>
                    <div style={{ width: 36 }} />
                </div>
                {/* Body */}
                <div style={{ padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820, width: '100%', alignSelf: 'center', boxSizing: 'border-box' }}>
                    {/* Status hero */}
                    <div style={{ borderRadius: 18, padding: '28px 24px', backgroundColor: C.slateSoft, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <Sk w={72} h={72} r={20} />
                        <Sk w={140} h={22} r={10} />
                        <Sk w={100} h={13} r={6} />
                    </div>
                    {/* Device card */}
                    <div style={{ backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '0 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
                            <Sk w={48} h={48} r={13} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <Sk w="60%" h={17} r={8} />
                                <Sk w="40%" h={12} r={6} />
                            </div>
                            <Sk w={60} h={52} r={11} />
                        </div>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 13, paddingBottom: 13, borderBottom: i < 5 ? `1px solid ${C.border}` : 'none' }}>
                                <Sk w={32} h={32} r={9} />
                                <Sk w={120} h={13} r={6} />
                                <Sk w="35%" h={13} r={6} style={{ marginLeft: 'auto' }} />
                            </div>
                        ))}
                    </div>
                    {/* Timeline */}
                    <div style={{ backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 3 ? 22 : 0 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                                    <Sk w={18} h={18} r={9} />
                                    {i < 3 && <div style={{ width: 2, height: 32, backgroundColor: C.border, margin: '3px 0' }} />}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    <Sk w="50%" h={14} r={7} />
                                    <Sk w="75%" h={12} r={6} />
                                    <Sk w={100} h={11} r={5} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
        ? `R${(Number(application.monthly_cost) * Number(application.contract_duration_months)).toLocaleString('en-ZA')}`
        : '—';

    // Build 4-step timeline
    const currentStepIdx = {
        Pending:         1,
        Pending_Finance: 2,
        Approved:        3,
        Rejected:        3,
        Cancelled:       3,
    }[application.application_status] ?? 1;
    const isActive = ['Pending', 'Pending_Finance'].includes(application.application_status);

    const timelineSteps = [
        {
            key: 'submitted',
            label: 'Application Submitted',
            sublabel: `Application #${application.application_id ?? applicationId} received by DoJ&CD`,
            date: application.submission_date,
            state: 'done',
            color: C.green,
            showBadge: false,
        },
        {
            key: 'review',
            label: 'Initial Review',
            sublabel: currentStepIdx === 1
                ? 'Your application is being reviewed by the DoJ&CD team'
                : currentStepIdx > 1
                    ? 'Completed — forwarded for finance assessment'
                    : 'Awaiting review',
            date: currentStepIdx >= 1 ? application.last_updated : null,
            state: currentStepIdx > 1 ? 'done' : (currentStepIdx === 1 && isActive ? 'active' : 'upcoming'),
            color: C.green,
            showBadge: currentStepIdx === 1 && isActive,
        },
        {
            key: 'finance',
            label: 'Finance Review',
            sublabel: currentStepIdx === 2
                ? 'Being assessed by the Finance department'
                : currentStepIdx > 2
                    ? 'Finance approval granted'
                    : 'Awaiting Finance review',
            date: currentStepIdx >= 2 ? application.last_updated : null,
            state: currentStepIdx > 2 ? 'done' : (currentStepIdx === 2 && isActive ? 'active' : 'upcoming'),
            color: C.green,
            showBadge: currentStepIdx === 2 && isActive,
        },
        {
            key: 'decision',
            label: application.application_status === 'Approved' ? 'Approved'
                 : application.application_status === 'Rejected' ? 'Rejected'
                 : application.application_status === 'Cancelled' ? 'Cancelled'
                 : 'Final Decision',
            sublabel: application.application_status === 'Approved'
                ? 'Your device application has been approved — device will be issued'
                : application.application_status === 'Rejected'
                    ? (application.rejection_reason || 'Application was not approved at this time')
                    : application.application_status === 'Cancelled'
                        ? 'This application was cancelled'
                        : 'Awaiting final decision from management',
            date: currentStepIdx >= 3 ? application.last_updated : null,
            state: currentStepIdx >= 3 ? 'done' : 'upcoming',
            color: application.application_status === 'Approved' ? C.green
                 : application.application_status === 'Rejected' ? C.rose
                 : application.application_status === 'Cancelled' ? C.slate
                 : C.muted,
            showBadge: false,
        },
    ];

    return (
        <>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
                @keyframes stepPulse { 0%,100% { box-shadow:0 0 0 0 rgba(217,119,6,0.45); } 50% { box-shadow:0 0 0 6px rgba(217,119,6,0); } }
                .ad-section { animation: fadeUp 0.3s ease both; }
            `}</style>

            <div style={S.root}>
                {/* ── Sticky page header ── */}
                <div style={S.header}>
                    <button style={S.backBtn} onClick={() => navigate(-1)}>
                        <IoArrowBack size={20} color="#fff" />
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

                        {(application.application_status === 'Rejected' || application.application_status === 'Cancelled') && (
                            <button
                                style={{ ...S.reapplyBtn, ...(reapplying ? { opacity: 0.6 } : {}) }}
                                onClick={handleReapplyClick}
                                disabled={reapplying}
                            >
                                {reapplying ? (
                                    <div style={{ width: 16, height: 16, border: `2px solid rgba(30,79,216,0.3)`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                ) : (
                                    <>
                                        <IoRefreshOutline size={17} color={C.accent} />
                                        <span style={S.reapplyBtnText}>Re-apply for this Device</span>
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
                                    <div style={S.deviceSub}>{[application.model, application.manufacturer].filter(Boolean).join(' · ') || '—'}</div>
                                </div>
                                <div style={S.pricePill}>
                                    <div style={S.priceVal}>{application.monthly_cost ? `R${Number(application.monthly_cost).toLocaleString('en-ZA')}` : '—'}</div>
                                    <div style={S.priceUnit}>/mo</div>
                                </div>
                            </div>

                            {/* All device info rows */}
                            <InfoRow icon={IoPhonePortraitOutline} label="Device Name"       value={application.device_name} />
                            <InfoRow icon={IoBriefcaseOutline}    label="Manufacturer"      value={application.manufacturer} />
                            <InfoRow icon={IoInformationCircleOutline} label="Model"         value={application.model} />
                            <InfoRow icon={IoDocumentTextOutline} label="Plan Name"          value={application.plan_name} />
                            <InfoRow icon={IoInformationCircleOutline} label="Plan Details"  value={application.plan_details} />
                            <InfoRow icon={IoCashOutline}          label="Monthly Cost"      value={application.monthly_cost ? `R${Number(application.monthly_cost).toLocaleString('en-ZA')}` : '—'} valueColor={C.green} />
                            <InfoRow icon={IoCalendarOutline}      label="Contract Duration" value={application.contract_duration_months ? `${application.contract_duration_months} Months` : '—'} />
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
                                    {/* Dot + connector */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 30, marginRight: 14, flexShrink: 0 }}>
                                        <div style={{
                                            width: 18, height: 18, borderRadius: 9, flexShrink: 0, boxSizing: 'border-box',
                                            backgroundColor: step.state === 'done' ? step.color : step.state === 'active' ? C.amber : C.surface,
                                            border: step.state === 'done'   ? `3px solid ${step.color}30`
                                                  : step.state === 'active' ? `3px solid ${C.amberSoft}`
                                                  : `2px solid ${C.border}`,
                                            animation: step.state === 'active' ? 'stepPulse 1.6s ease-in-out infinite' : 'none',
                                        }} />
                                        {i < timelineSteps.length - 1 && (
                                            <div style={{
                                                width: 2, flex: 1, minHeight: 28,
                                                backgroundColor: step.state === 'done' ? step.color : C.border,
                                                margin: '2px 0',
                                                opacity: step.state === 'upcoming' ? 0.3 : 1,
                                            }} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, paddingBottom: i < timelineSteps.length - 1 ? 22 : 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: 14, fontWeight: '700', color: step.state !== 'upcoming' ? C.text : C.mutedLight }}>
                                                {step.label}
                                            </span>
                                            {step.showBadge && (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: meta.bg, padding: '3px 9px', borderRadius: 20 }}>
                                                    <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: meta.dot }} />
                                                    <span style={{ fontSize: 11, fontWeight: '700', color: meta.fg }}>{meta.label}</span>
                                                </div>
                                            )}
                                            {step.state === 'upcoming' && (
                                                <div style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: C.border }}>
                                                    <span style={{ fontSize: 10, fontWeight: '700', color: C.mutedLight }}>UPCOMING</span>
                                                </div>
                                            )}
                                        </div>

                                        <p style={{ fontSize: 12, color: step.state !== 'upcoming' ? C.muted : C.mutedLight, lineHeight: 1.55, margin: '0 0 5px' }}>
                                            {step.sublabel}
                                        </p>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <IoCalendarOutline size={11} color={C.mutedLight} />
                                            <span style={{ fontSize: 11, color: C.mutedLight }}>
                                                {step.state === 'done'   ? fmtDate(step.date)
                                                : step.state === 'active' ? 'In progress…'
                                                : 'Pending'}
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
    root:   { backgroundColor: '#F0F4FA', display: 'flex', flexDirection: 'column', minHeight: '100%' },

    header: {
        background: 'linear-gradient(135deg, #0A1628 0%, #0F1F3D 100%)',
        padding: '0 24px',
        minHeight: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(10,22,40,0.4)',
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        cursor: 'pointer',
    },
    headerCenter: { textAlign: 'center' },
    headerTitle:  { fontSize: 17, fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.2px' },
    headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

    body: { flex: 1, padding: '20px 28px 40px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 820, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },

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
    cancelBtnText:  { color: C.rose, fontSize: 14, fontWeight: '700' },

    reapplyBtn: {
        display: 'flex', alignItems: 'center', gap: 8,
        backgroundColor: C.surface, padding: '11px 20px',
        borderRadius: 14, border: `1px solid ${C.accent}50`, cursor: 'pointer',
        marginTop: 8,
    },
    reapplyBtnText: { color: C.accent, fontSize: 14, fontWeight: '700' },

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
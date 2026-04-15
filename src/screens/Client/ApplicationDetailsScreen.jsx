// screens/Client/ApplicationDetailsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoArrowBack,
    IoCheckmarkCircle,
    IoTime,
    IoCloseCircle,
    IoHelpCircle,
    IoPersonOutline,
    IoMailOutline,
    IoCallOutline,
    IoLocationOutline,
    IoCardOutline,
    IoCalendarOutline,
    IoAlertCircleOutline,
} from 'react-icons/io5';

// ─── Shared design tokens ─────────────────────────────────────────────
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
    Approved: { bg: C.greenSoft, fg: C.green, dot: C.green, icon: IoCheckmarkCircle, label: 'Approved' },
    Pending: { bg: C.amberSoft, fg: C.amber, dot: C.amber, icon: IoTime, label: 'Under Review' },
    Rejected: { bg: C.roseSoft, fg: C.rose, dot: C.rose, icon: IoCloseCircle, label: 'Rejected' },
    Cancelled: { bg: C.slateSoft, fg: C.slate, dot: C.slate, icon: IoCloseCircle, label: 'Cancelled' },
};

const DetailRow = ({ icon: Icon, label, value }) => (
    <div style={detailRowStyles.row}>
        <div style={detailRowStyles.iconWrap}><Icon size={16} color={C.muted} /></div>
        <div style={detailRowStyles.label}>{label}</div>
        <div style={detailRowStyles.value}>{value}</div>
    </div>
);

const detailRowStyles = {
    row: {
        display: 'flex',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottom: `1px solid ${C.border}`,
    },
    iconWrap: { width: 28, marginRight: 10 },
    label: { width: 110, fontSize: 13, color: C.muted },
    value: { flex: 1, fontSize: 13, fontWeight: '600', color: C.text },
};

export default function ApplicationDetailsScreen() {
    const navigate = useNavigate();
    const { applicationId } = useParams(); // from route path "/application-details/:applicationId"
    const toast = useToast();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        load();
    }, [applicationId]);

    const load = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const u = JSON.parse(userStr);
                setUser(u);
                const res = await deviceAPI.getApplicationDetails(u.client_user_id, parseInt(applicationId));
                setApplication(res.data.data);
            }
        } catch (err) {
            toast.error('Failed to Load', 'Could not load application details.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (!user?.client_user_id || !application) return;
        const confirmCancel = window.confirm('Cancel Application?\n\nAre you sure? This cannot be undone.');
        if (!confirmCancel) return;

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
                const msg = error.response?.data?.message;
                if (status === 409) toast.warning('Already Finalised', msg || 'This application cannot be cancelled.');
                else toast.error('Failed', msg || error.message);
            })
            .finally(() => setCancelling(false));
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const fmtDateShort = (d) => new Date(d).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div className="spinner" style={spinnerStyle}></div>
                <div style={styles.loadingText}>Loading details…</div>
                <style>{`
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${C.border};
            border-top-color: ${C.accent};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    if (!application) {
        return (
            <div style={styles.errorScreen}>
                <div style={styles.errorIcon}><IoAlertCircleOutline size={40} color={C.rose} /></div>
                <div style={styles.errorTitle}>Not Found</div>
                <div style={styles.errorSub}>This application could not be found.</div>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    const meta = STATUS_META[application.application_status] || {
        bg: C.slateSoft, fg: C.slate, dot: C.slate, icon: IoHelpCircle, label: application.application_status,
    };
    const StatusIcon = meta.icon;

    return (
        <div style={styles.root}>
            {/* Navbar */}
            <div style={styles.navbar}>
                <button style={styles.navBack} onClick={() => navigate(-1)}><IoArrowBack size={22} /></button>
                <div style={styles.navTitle}>Application #{application.application_id}</div>
                <div style={{ width: 40 }} />
            </div>

            <div style={styles.scroll}>
                {/* Status hero */}
                <div style={{ ...styles.statusHero, backgroundColor: meta.bg }}>
                    <div style={{ ...styles.statusIcoWrap, backgroundColor: meta.dot + '25' }}>
                        <StatusIcon size={36} color={meta.dot} />
                    </div>
                    <div style={{ ...styles.statusLabel, color: meta.fg }}>{meta.label}</div>
                    <div style={styles.statusDate}>Last updated {fmtDateShort(application.last_updated)}</div>
                    {application.application_status === 'Pending' && (
                        <button
                            style={{ ...styles.cancelBtn, ...(cancelling && { opacity: 0.6 }) }}
                            onClick={handleCancel}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <div className="small-spinner" style={smallSpinnerStyle} />
                            ) : (
                                <>
                                    <IoCloseCircle size={17} color={C.rose} />
                                    <span style={styles.cancelBtnText}>Cancel Application</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Device section */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Device</div>
                    <div style={styles.deviceCard}>
                        <div style={styles.deviceCardTop}>
                            <div style={{ flex: 1 }}>
                                <div style={styles.deviceName}>{application.device_name}</div>
                                <div style={styles.deviceModel}>{application.model} · {application.manufacturer}</div>
                            </div>
                            <div style={styles.pricePill}>
                                <div style={styles.priceValue}>R{application.monthly_cost}</div>
                                <div style={styles.priceLabel}>/mo</div>
                            </div>
                        </div>
                        <div style={styles.planRow}>
                            <div style={styles.planPill}><span style={styles.planPillText}>{application.plan_name}</span></div>
                            <div style={styles.planPill}>
                                <IoCalendarOutline size={12} color={C.muted} />
                                <span style={styles.planPillText}>{application.contract_duration_months} months</span>
                            </div>
                        </div>
                        <div style={styles.planDetail}>{application.plan_details}</div>
                    </div>
                </div>

                {/* Applicant section */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Applicant</div>
                    <div style={styles.infoCard}>
                        <DetailRow icon={IoPersonOutline} label="Full Name" value={`${application.first_name} ${application.last_name}`} />
                        <DetailRow icon={IoMailOutline} label="Email" value={application.email} />
                        {application.phone_number && <DetailRow icon={IoCallOutline} label="Phone" value={application.phone_number} />}
                        {application.region && <DetailRow icon={IoLocationOutline} label="Region" value={application.region} />}
                        {application.persal_id && <DetailRow icon={IoCardOutline} label="Personal ID" value={application.persal_id} />}
                    </div>
                </div>

                {/* Rejection reason */}
                {application.rejection_reason && (
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Rejection Reason</div>
                        <div style={styles.rejectionCard}>
                            <IoAlertCircleOutline size={20} color={C.rose} />
                            <div style={styles.rejectionText}>{application.rejection_reason}</div>
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div style={{ ...styles.section, marginBottom: 40 }}>
                    <div style={styles.sectionTitle}>Timeline</div>
                    <div style={styles.timeline}>
                        {[
                            { label: 'Application Submitted', date: application.submission_date, done: true },
                            { label: 'Under Review', date: application.last_updated, done: application.application_status !== 'Pending' },
                            ...(application.application_status === 'Approved' || application.application_status === 'Rejected'
                                ? [{ label: application.application_status === 'Approved' ? 'Approved' : 'Rejected', date: application.last_updated, done: true }]
                                : []),
                        ].map((step, i, arr) => (
                            <div key={i} style={styles.timelineItem}>
                                <div style={styles.timelineLeft}>
                                    <div style={{ ...styles.timelineDot, ...(step.done ? styles.timelineDotDone : styles.timelineDotPending) }} />
                                    {i < arr.length - 1 && <div style={{ ...styles.timelineLine, ...(step.done && styles.timelineLineDone) }} />}
                                </div>
                                <div style={styles.timelineRight}>
                                    <div style={{ ...styles.timelineLabel, ...(!step.done && { color: C.muted }) }}>{step.label}</div>
                                    <div style={styles.timelineDate}>{step.done ? fmtDate(step.date) : 'In progress…'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        .small-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(220,38,38,0.3);
          border-top-color: ${C.rose};
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>
        </div>
    );
}

// ─── Styles (converted from StyleSheet) ───────────────────────────────
const styles = {
    root: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' },
    loadingScreen: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
    loadingText: { marginTop: 14, fontSize: 15, color: C.muted, fontWeight: '500' },
    errorScreen: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: 40 },
    errorIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: C.roseSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 6 },
    errorSub: { fontSize: 14, color: C.muted, textAlign: 'center', marginBottom: 28 },
    backBtn: { backgroundColor: C.navy, padding: '12px 24px', borderRadius: 14, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' },
    navbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.surface, padding: '14px 16px', borderBottom: `1px solid ${C.border}` },
    navBack: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer' },
    navTitle: { fontSize: 16, fontWeight: '700', color: C.text },
    scroll: { flex: 1, overflowY: 'auto' },
    statusHero: { margin: 16, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' },
    statusIcoWrap: { width: 72, height: 72, borderRadius: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statusLabel: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
    statusDate: { fontSize: 13, color: C.muted, marginBottom: 16 },
    cancelBtn: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, padding: '11px 18px', borderRadius: 14, border: `1px solid #FECACA`, cursor: 'pointer' },
    cancelBtnText: { color: C.rose, fontSize: 14, fontWeight: '700' },
    section: { padding: '0 16px', marginBottom: 8 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: C.muted, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
    deviceCard: { backgroundColor: C.surface, borderRadius: 18, padding: 18, border: `1px solid ${C.border}` },
    deviceCardTop: { display: 'flex', alignItems: 'flex-start', marginBottom: 12 },
    deviceName: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 4 },
    deviceModel: { fontSize: 13, color: C.muted },
    pricePill: { backgroundColor: C.greenSoft, padding: '6px 12px', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center' },
    priceValue: { fontSize: 18, fontWeight: '800', color: C.green },
    priceLabel: { fontSize: 10, color: C.green, fontWeight: '600' },
    planRow: { display: 'flex', gap: 8, marginBottom: 10 },
    planPill: { display: 'flex', alignItems: 'center', gap: 5, backgroundColor: C.bg, padding: '5px 10px', borderRadius: 10, border: `1px solid ${C.border}` },
    planPillText: { fontSize: 12, color: C.muted, fontWeight: '500' },
    planDetail: { fontSize: 13, color: C.muted, lineHeight: 1.5 },
    infoCard: { backgroundColor: C.surface, borderRadius: 16, padding: '0 16px', border: `1px solid ${C.border}` },
    rejectionCard: { display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: C.roseSoft, borderRadius: 16, padding: 16, border: `1px solid #FECACA` },
    rejectionText: { flex: 1, fontSize: 14, color: '#7F1D1D', lineHeight: 1.5 },
    timeline: { backgroundColor: C.surface, borderRadius: 16, padding: 20, border: `1px solid ${C.border}` },
    timelineItem: { display: 'flex', marginBottom: 8 },
    timelineLeft: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, marginRight: 14 },
    timelineDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
    timelineDotDone: { backgroundColor: C.green, borderColor: C.green },
    timelineDotPending: { backgroundColor: C.surface, borderColor: C.mutedLight },
    timelineLine: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 4 },
    timelineLineDone: { backgroundColor: C.green },
    timelineRight: { flex: 1, paddingBottom: 20 },
    timelineLabel: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 3 },
    timelineDate: { fontSize: 12, color: C.muted },
};

const spinnerStyle = { width: 40, height: 40 };
const smallSpinnerStyle = { width: 16, height: 16 };
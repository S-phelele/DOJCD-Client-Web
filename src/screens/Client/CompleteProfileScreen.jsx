// screens/Client/CompleteProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoArrowBack,
    IoPersonAddOutline,
    IoCheckmarkCircle,
    IoEllipseOutline,
    IoPhonePortraitOutline,
    IoDocumentsOutline,
    IoReceiptOutline,
    IoCardOutline,
    IoCashOutline,
    IoHomeOutline,
    IoCloudUploadOutline,
    IoClose,
    IoCalendarOutline,
    IoChevronDown,
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

const PROVIDERS = [
    { value: 'MTN', label: 'MTN' },
    { value: 'Vodacom', label: 'Vodacom' },
    { value: 'Cell_C', label: 'Cell C' },
    { value: 'Telkom', label: 'Telkom' },
    { value: 'Rain', label: 'Rain' },
];

const DURATIONS = [
    { value: '12', label: '12 Months' },
    { value: '24', label: '24 Months' },
    { value: '36', label: '36 Months' },
];

const DOCS = [
    { id: 'invoice', key: 'invoice_file', title: 'Service Invoice', subtitle: 'Current mobile service invoice', icon: IoReceiptOutline, required: true },
    { id: 'id', key: 'id_document', title: 'ID Document', subtitle: 'Clear copy of ID or Passport', icon: IoCardOutline, required: true },
    { id: 'payslip', key: 'payslip_document', title: 'Latest Payslip', subtitle: 'Most recent payslip', icon: IoCashOutline, required: true },
    { id: 'residence', key: 'residence_document', title: 'Proof of Residence', subtitle: 'Utility bill or bank statement', icon: IoHomeOutline, required: false },
];

// ─── Custom Select Field (uses native select but styled) ──────────────────
const SelectField = ({ label, value, placeholder, options, onSelect, disabled }) => {
    return (
        <div style={selectStyles.wrap}>
            <div style={selectStyles.label}>{label}</div>
            <select
                style={selectStyles.select}
                value={value}
                onChange={(e) => onSelect(e.target.value)}
                disabled={disabled}
            >
                <option value="" disabled>{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

const selectStyles = {
    wrap: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1, marginBottom: 8 },
    select: {
        width: '100%',
        padding: '14px 14px',
        fontSize: 15,
        backgroundColor: C.bg,
        border: `1.5px solid ${C.border}`,
        borderRadius: 14,
        color: C.text,
        cursor: 'pointer',
    },
};

export default function CompleteProfileScreen() {
    const navigate = useNavigate();
    const toast = useToast();

    const [network, setNetwork] = useState('');
    const [duration, setDuration] = useState('');
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date;
    });
    const [loading, setLoading] = useState(false);
    const [docs, setDocs] = useState({
        invoice_file: null,
        id_document: null,
        payslip_document: null,
        residence_document: null,
    });

    // Helper to handle file selection
    const handleFileSelect = (key, file) => {
        if (!file) return;
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File too large', 'Maximum file size is 10MB.');
            return;
        }
        setDocs(prev => ({ ...prev, [key]: file }));
        toast.success(`${DOCS.find(d => d.key === key)?.title} selected`);
    };

    const removeFile = (key) => {
        setDocs(prev => ({ ...prev, [key]: null }));
    };

    const validate = () => {
        if (!network) {
            toast.warning('Missing Field', 'Please select a network provider.');
            return false;
        }
        if (!duration) {
            toast.warning('Missing Field', 'Please select a contract duration.');
            return false;
        }
        for (const doc of DOCS.filter(d => d.required)) {
            if (!docs[doc.key]) {
                toast.warning('Missing Document', `${doc.title} is required.`);
                return false;
            }
        }
        return true;
    };

    const submit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                toast.error('Session Expired', 'Please login again.');
                navigate('/login');
                return;
            }
            const user = JSON.parse(userStr);
            const data = {
                network_provider: network,
                contract_duration_months: parseInt(duration, 10),
                contract_end_date: endDate.toISOString().split('T')[0],
                invoice_file: docs.invoice_file,
                id_document: docs.id_document,
                payslip_document: docs.payslip_document,
                residence_document: docs.residence_document,
            };
            const result = await authAPI.completeProfile(user.client_user_id, data);
            if (result.success) {
                // Update stored user with new status
                const updatedUser = { ...user, registration_status: 'Profile_Completed', ...result.data?.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                toast.success('Profile Completed!', result.message || 'You can now browse available devices.');
                setTimeout(() => navigate(-1), 1500);
            } else {
                toast.error('Failed', result.message || 'Profile completion failed.');
            }
        } catch (error) {
            const status = error.response?.status;
            const msg = error.response?.data?.message;
            if (!error.response) toast.error('Connection Error', 'Cannot connect to server.');
            else if (status === 409) toast.warning('Already Submitted', msg || 'Profile has already been submitted.');
            else if (status === 422) toast.error('Invalid Data', msg || 'Please check your documents and try again.');
            else toast.error('Failed', msg || error.message || 'Profile completion failed.');
        } finally {
            setLoading(false);
        }
    };

    const requiredDone = DOCS.filter(d => d.required).every(d => !!docs[d.key]);
    const totalDone = DOCS.filter(d => !!docs[d.key]).length;

    // Format date for display
    const formatDate = (date) => date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div style={styles.root}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerRing} />
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    <IoArrowBack size={22} color="rgba(255,255,255,0.9)" />
                </button>
                <div style={styles.headerContent}>
                    <div style={styles.headerIcon}><IoPersonAddOutline size={26} color="#fff" /></div>
                    <div style={styles.headerTitle}>Complete Profile</div>
                    <div style={styles.headerSub}>Upload your documents to unlock device applications</div>
                </div>
                {/* Progress */}
                <div style={styles.progressRow}>
                    <div style={styles.progressItem}>
                        {network ? <IoCheckmarkCircle size={16} color="#4ADE80" /> : <IoEllipseOutline size={16} color="rgba(255,255,255,0.4)" />}
                        <span style={styles.progressLabel}>Network</span>
                    </div>
                    <div style={styles.progressLine} />
                    <div style={styles.progressItem}>
                        {duration ? <IoCheckmarkCircle size={16} color="#4ADE80" /> : <IoEllipseOutline size={16} color="rgba(255,255,255,0.4)" />}
                        <span style={styles.progressLabel}>Contract</span>
                    </div>
                    <div style={styles.progressLine} />
                    <div style={styles.progressItem}>
                        {requiredDone ? <IoCheckmarkCircle size={16} color="#4ADE80" /> : <IoEllipseOutline size={16} color="rgba(255,255,255,0.4)" />}
                        <span style={styles.progressLabel}>Documents</span>
                    </div>
                </div>
            </div>

            <div style={styles.scroll}>
                <div style={styles.scrollContent}>
                    {/* Contract details card */}
                    <div style={styles.card}>
                        <div style={styles.cardTitleRow}>
                            <div style={styles.cardTitleIcon}><IoPhonePortraitOutline size={18} color={C.accent} /></div>
                            <div style={styles.cardTitle}>Contract Details</div>
                        </div>

                        <SelectField
                            label="NETWORK PROVIDER"
                            value={network}
                            placeholder="Select your provider"
                            options={PROVIDERS}
                            onSelect={setNetwork}
                            disabled={loading}
                        />
                        <SelectField
                            label="CONTRACT DURATION"
                            value={duration}
                            placeholder="Select contract length"
                            options={DURATIONS}
                            onSelect={setDuration}
                            disabled={loading}
                        />

                        <div style={{ marginBottom: 8 }}>
                            <div style={selectStyles.label}>CONTRACT END DATE</div>
                            <div style={styles.dateInputWrapper}>
                                <input
                                    type="date"
                                    value={endDate.toISOString().split('T')[0]}
                                    onChange={(e) => setEndDate(new Date(e.target.value))}
                                    min={new Date().toISOString().split('T')[0]}
                                    style={styles.dateInput}
                                />
                                <IoCalendarOutline size={16} color={C.muted} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                            </div>
                            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Selected: {formatDate(endDate)}</div>
                        </div>
                    </div>

                    {/* Documents card */}
                    <div style={styles.card}>
                        <div style={styles.cardTitleRow}>
                            <div style={styles.cardTitleIcon}><IoDocumentsOutline size={18} color={C.accent} /></div>
                            <div style={styles.cardTitle}>Required Documents</div>
                            <div style={styles.docCountPill}>
                                <span style={styles.docCountText}>{totalDone}/{DOCS.length}</span>
                            </div>
                        </div>
                        <div style={styles.cardSub}>Supported formats: PDF, JPG, PNG (max 10MB each)</div>

                        {DOCS.map(doc => {
                            const file = docs[doc.key];
                            const Icon = doc.icon;
                            return (
                                <div key={doc.id} style={{ ...styles.docRow, ...(file && styles.docRowDone) }}>
                                    <div style={{ ...styles.docIcon, backgroundColor: file ? C.greenSoft : C.bg }}>
                                        <Icon size={20} color={file ? C.green : C.muted} />
                                    </div>
                                    <div style={styles.docInfo}>
                                        <div style={styles.docTitleRow}>
                                            <span style={styles.docTitle}>{doc.title}</span>
                                            {doc.required && !file && <span style={styles.reqBadge}>Required</span>}
                                            {file && <IoCheckmarkCircle size={16} color={C.green} />}
                                        </div>
                                        {file ? (
                                            <div style={styles.docFileName}>{file.name}</div>
                                        ) : (
                                            <div style={styles.docSubtitle}>{doc.subtitle}</div>
                                        )}
                                    </div>
                                    {file ? (
                                        <button style={{ ...styles.docActionBtn, ...styles.docActionBtnChange }} onClick={() => removeFile(doc.key)}>
                                            <IoClose size={18} color={C.rose} />
                                        </button>
                                    ) : (
                                        <label style={styles.docActionBtn}>
                                            <IoCloudUploadOutline size={18} color={C.accent} />
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,application/pdf"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) handleFileSelect(doc.key, e.target.files[0]);
                                                    e.target.value = ''; // allow re-selection same file
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit */}
                    <div style={styles.submitWrap}>
                        <button
                            style={{
                                ...styles.submitBtn,
                                ...(((!network || !duration || !requiredDone) || loading) && styles.submitDisabled)
                            }}
                            onClick={submit}
                            disabled={loading || !network || !duration || !requiredDone}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner-small" style={spinnerStyle} />
                                    <span style={styles.submitText}>Submitting…</span>
                                </>
                            ) : (
                                <>
                                    <IoCheckmarkCircle size={20} color="#fff" />
                                    <span style={styles.submitText}>Complete Profile</span>
                                </>
                            )}
                        </button>
                        <div style={styles.submitNote}>Your profile will be reviewed before you can apply for devices</div>
                    </div>
                </div>
            </div>

            <style>{`
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
    root: { minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' },
    header: { backgroundColor: C.navy, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
    headerRing: { position: 'absolute', width: 240, height: 240, borderRadius: 120, border: '1px solid rgba(255,255,255,0.06)', top: -80, right: -60 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 20, border: 'none', cursor: 'pointer' },
    headerContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 },
    headerIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 6 },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.5, paddingHorizontal: 20 },
    progressRow: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
    progressItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
    progressLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600', letterSpacing: 0.4 },
    progressLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8, marginBottom: 16 },
    scroll: { flex: 1, overflowY: 'auto' },
    scrollContent: { padding: 16, paddingBottom: 40 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: '0 3px 10px rgba(15,31,61,0.06)' },
    cardTitleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
    cardTitleIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 17, fontWeight: '800', color: C.text, flex: 1 },
    cardSub: { fontSize: 12, color: C.muted, marginBottom: 18, marginLeft: 44 },
    docCountPill: { backgroundColor: C.accentSoft, padding: '4px 10px', borderRadius: 20 },
    docCountText: { fontSize: 12, color: C.accent, fontWeight: '700' },
    docRow: { display: 'flex', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, backgroundColor: C.bg, border: `1px solid ${C.border}` },
    docRowDone: { backgroundColor: '#F0FDF4', borderColor: `${C.green}40` },
    docIcon: { width: 42, height: 42, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    docInfo: { flex: 1 },
    docTitleRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 },
    docTitle: { fontSize: 14, fontWeight: '700', color: C.text },
    reqBadge: { fontSize: 10, color: C.amber, fontWeight: '700', backgroundColor: C.amberSoft, padding: '2px 7px', borderRadius: 8 },
    docSubtitle: { fontSize: 12, color: C.muted },
    docFileName: { fontSize: 12, color: C.green, fontWeight: '500' },
    docActionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', border: 'none' },
    docActionBtnChange: { backgroundColor: C.roseSoft },
    submitWrap: { marginTop: 4 },
    submitBtn: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: C.navy, borderRadius: 18, paddingVertical: 18, boxShadow: '0 6px 12px rgba(15,31,61,0.28)', marginBottom: 14, width: '100%', border: 'none', cursor: 'pointer' },
    submitDisabled: { backgroundColor: '#94A3B8', boxShadow: 'none', cursor: 'not-allowed' },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    submitNote: { textAlign: 'center', fontSize: 12, color: C.muted, lineHeight: 1.5 },
    dateInputWrapper: { position: 'relative' },
    dateInput: { width: '100%', padding: '14px 14px', fontSize: 15, backgroundColor: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 14, color: C.text, cursor: 'pointer' },
};

const spinnerStyle = { width: 16, height: 16 };
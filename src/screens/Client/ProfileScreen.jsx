// screens/Client/ProfileScreen.jsx
// Combined Profile tab: shows account info + profile completion form.
// Route: /complete-profile (same route, no AppNavigator change needed)
// All original CompleteProfileScreen API logic preserved exactly.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoPersonOutline,
    IoMailOutline,
    IoShieldCheckmarkOutline,
    IoCheckmarkCircle,
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
    IoCreateOutline,
    IoInformationCircleOutline,
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

const PROVIDERS = [
    { value: 'MTN',     label: 'MTN' },
    { value: 'Vodacom', label: 'Vodacom' },
    { value: 'Cell_C',  label: 'Cell C' },
    { value: 'Telkom',  label: 'Telkom' },
    { value: 'Rain',    label: 'Rain' },
];

const DURATIONS = [
    { value: '12', label: '12 Months' },
    { value: '24', label: '24 Months' },
    { value: '36', label: '36 Months' },
];

const DOCS = [
    { id: 'invoice',   key: 'invoice_file',         title: 'Service Invoice',      subtitle: 'Current mobile service invoice', icon: IoReceiptOutline,   required: true },
    { id: 'id',        key: 'id_document',           title: 'ID Document',          subtitle: 'Clear copy of ID or Passport',   icon: IoCardOutline,      required: true },
    { id: 'payslip',   key: 'payslip_document',      title: 'Latest Payslip',       subtitle: 'Most recent payslip',            icon: IoCashOutline,      required: true },
    { id: 'residence', key: 'residence_document',    title: 'Proof of Residence',   subtitle: 'Utility bill or bank statement', icon: IoHomeOutline,      required: false },
];

// ── SelectField (from original CompleteProfileScreen) ─────────────────────
const SelectField = ({ label, value, placeholder, options, onSelect, disabled }) => (
    <div style={sf.wrap}>
        <div style={sf.label}>{label}</div>
        <select style={sf.select} value={value} onChange={(e) => onSelect(e.target.value)} disabled={disabled}>
            <option value="" disabled>{placeholder}</option>
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const sf = {
    wrap:   { marginBottom: 16 },
    label:  { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: '0.8px', marginBottom: 8 },
    select: { width: '100%', padding: '12px 14px', fontSize: 14, color: C.text, backgroundColor: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 12, outline: 'none', cursor: 'pointer' },
};

export default function ProfileScreen() {
    const toast    = useToast();
    const navigate = useNavigate();

    const [user,          setUser]          = useState(null);
    const [loading,       setLoading]       = useState(false);
    const [profileDone,   setProfileDone]   = useState(false);
    const [provider,      setProvider]      = useState('');
    const [duration,      setDuration]      = useState('');
    const [files,         setFiles]         = useState({});
    const [previews,      setPreviews]      = useState({});
    const fileRefs        = useRef({});

    useEffect(() => {
        const ud = localStorage.getItem('user');
        if (!ud) { navigate('/login'); return; }
        const u = JSON.parse(ud);
        setUser(u);
        const done = u.registration_status === 'Verified' || u.registration_status === 'Profile_Completed' || !!(u.network_provider && u.contract_duration_months);
        setProfileDone(done);
        if (u.network_provider)          setProvider(u.network_provider);
        if (u.contract_duration_months)  setDuration(String(u.contract_duration_months));
    }, []);

    const handleFileSelect = (key, file) => {
        if (!file) return;
        // Validate file size — max 10MB (same as original)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File Too Large', 'Maximum file size is 10MB.');
            return;
        }
        setFiles(prev => ({ ...prev, [key]: file }));
        const docLabel = DOCS.find(d => d.key === key)?.title || 'File';
        toast.success(`${docLabel} selected`);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviews(prev => ({ ...prev, [key]: e.target.result }));
            reader.readAsDataURL(file);
        } else {
            setPreviews(prev => ({ ...prev, [key]: 'pdf' }));
        }
    };

    const removeFile = (key) => {
        setFiles(prev => { const n = { ...prev }; delete n[key]; return n; });
        setPreviews(prev => { const n = { ...prev }; delete n[key]; return n; });
    };

    const handleSubmit = async () => {
        if (!provider) { toast.warning('Missing Field', 'Please select a network provider.'); return; }
        if (!duration) { toast.warning('Missing Field', 'Please select a contract duration.'); return; }
        const requiredDocs = DOCS.filter(d => d.required);
        for (const doc of requiredDocs) {
            if (!files[doc.key]) {
                toast.warning('Missing Document', `${doc.title} is required.`);
                return;
            }
        }

        setLoading(true);
        try {
            // Re-read user from localStorage (same pattern as original)
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                toast.error('Session Expired', 'Please login again.');
                navigate('/login');
                return;
            }
            const currentUser = JSON.parse(userStr);

            // Calculate contract end date from duration (same as original)
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + parseInt(duration, 10));

            // Build plain object — same shape the original API function expects
            const data = {
                network_provider:          provider,
                contract_duration_months:  parseInt(duration, 10),
                contract_end_date:         endDate.toISOString().split('T')[0],
                invoice_file:              files.invoice_file        || null,
                id_document:               files.id_document         || null,
                payslip_document:          files.payslip_document    || null,
                residence_document:        files.residence_document  || null,
            };

            // Call with (client_user_id, data) — original two-argument signature
            const result = await authAPI.completeProfile(currentUser.client_user_id, data);

            if (result.success) {
                const updatedUser = {
                    ...currentUser,
                    registration_status:      'Profile_Completed',
                    network_provider:         provider,
                    contract_duration_months: parseInt(duration, 10),
                    ...(result.data?.user || {}),
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                setProfileDone(true);
                toast.success('Profile Completed!', result.message || 'You can now browse available devices.');
            } else {
                toast.error('Failed', result.message || 'Profile completion failed. Please try again.');
            }
        } catch (err) {
            const status = err.response?.status;
            const msg    = err.response?.data?.message;
            if (!err.response)  toast.error('Connection Error', 'Cannot connect to server.');
            else if (status === 409) toast.warning('Already Submitted', msg || 'Profile has already been submitted.');
            else if (status === 422) toast.error('Invalid Data', msg || 'Please check your documents and try again.');
            else toast.error('Failed', msg || err.message || 'Profile completion failed.');
        } finally {
            setLoading(false);
        }
    };

    const avatarInitial = user ? (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase() : 'U';

    return (
        <div style={S.root}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Page header */}
            <div style={S.header}>
                <div style={S.headerLeft}>
                    <div style={S.headerIcon}><IoPersonOutline size={20} color={C.accent} /></div>
                    <div>
                        <h1 style={S.headerTitle}>My Profile</h1>
                        <p style={S.headerSub}>Account information and profile settings</p>
                    </div>
                </div>
            </div>

            <div style={S.body}>
                {/* ── Account Info Card ── */}
                <section>
                    <h2 style={S.sectionTitle}>Account Information</h2>
                    <div style={S.accountCard}>
                        {/* Avatar row */}
                        <div style={S.avatarRow}>
                            <div style={S.avatar}>
                                <span style={S.avatarText}>{avatarInitial}</span>
                            </div>
                            <div>
                                <div style={S.accountName}>{user?.first_name} {user?.last_name}</div>
                                <div style={S.accountEmail}>{user?.email}</div>
                                <div style={{
                                    ...S.statusBadge,
                                    backgroundColor: user?.registration_status === 'Verified' ? C.greenSoft : C.amberSoft,
                                    color: user?.registration_status === 'Verified' ? C.green : C.amber,
                                }}>
                                    {(user?.registration_status || 'Pending').replace('_', ' ')}
                                </div>
                            </div>
                        </div>

                        {/* Info rows */}
                        <div style={S.infoGrid}>
                            {[
                                { label: 'Email Address',   value: user?.email || '—',                 icon: IoMailOutline },
                                { label: 'User Type',       value: user?.user_type || '—',             icon: IoPersonOutline },
                                { label: 'Account Status',  value: (user?.registration_status || '—').replace('_', ' '), icon: IoShieldCheckmarkOutline },
                                { label: 'Network Provider',value: user?.network_provider || 'Not set', icon: IoPhonePortraitOutline },
                                { label: 'Contract Duration',value: user?.contract_duration_months ? `${user.contract_duration_months} Months` : 'Not set', icon: IoCalendarOutline },
                            ].map((row, i) => {
                                const Icon = row.icon;
                                return (
                                    <div key={i} style={S.infoRow}>
                                        <div style={S.infoIco}><Icon size={15} color={C.muted} /></div>
                                        <div style={S.infoLabel}>{row.label}</div>
                                        <div style={S.infoVal}>{row.value}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Profile Completion Form ── */}
                {!profileDone && (
                    <section>
                        <div style={S.sectionHeader}>
                            <h2 style={S.sectionTitle}>Complete Your Profile</h2>
                            <div style={S.requiredBadge}>Required to apply for devices</div>
                        </div>

                        {/* Info banner */}
                        <div style={S.infoBanner}>
                            <IoInformationCircleOutline size={16} color={C.accent} />
                            <span style={S.infoBannerText}>
                                Upload the required documents and select your preferences below.
                                Your profile will be reviewed before you can apply for devices.
                            </span>
                        </div>

                        <div style={S.formCard}>
                            {/* Provider + Duration */}
                            <div style={S.formRow}>
                                <div style={{ flex: 1 }}>
                                    <SelectField label="NETWORK PROVIDER" value={provider} placeholder="Select provider" options={PROVIDERS} onSelect={setProvider} disabled={loading} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <SelectField label="CONTRACT DURATION" value={duration} placeholder="Select duration" options={DURATIONS} onSelect={setDuration} disabled={loading} />
                                </div>
                            </div>

                            {/* Documents */}
                            <div style={S.docsLabel}>DOCUMENTS</div>
                            <div style={S.docsGrid}>
                                {DOCS.map(doc => {
                                    const Icon = doc.icon;
                                    const hasFile = !!files[doc.key];
                                    const preview = previews[doc.key];
                                    return (
                                        <div key={doc.id} style={{ ...S.docCard, ...(hasFile ? S.docCardDone : {}) }}>
                                            <div style={S.docTop}>
                                                <div style={{ ...S.docIco, backgroundColor: hasFile ? C.greenSoft : C.accentSoft }}>
                                                    <Icon size={18} color={hasFile ? C.green : C.accent} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={S.docTitle}>{doc.title}</div>
                                                    <div style={S.docSub}>{doc.subtitle}</div>
                                                </div>
                                                {doc.required && !hasFile && (
                                                    <div style={S.docRequired}>Required</div>
                                                )}
                                                {hasFile && (
                                                    <div style={S.docCheck}><IoCheckmarkCircle size={18} color={C.green} /></div>
                                                )}
                                            </div>

                                            {hasFile ? (
                                                <div style={S.docFileRow}>
                                                    <div style={S.docFileName}>
                                                        {preview === 'pdf' ? '📄' : '🖼️'} {files[doc.key].name}
                                                    </div>
                                                    <button style={S.docRemove} onClick={() => removeFile(doc.key)}>
                                                        <IoClose size={14} color={C.rose} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="file"
                                                        ref={el => { fileRefs.current[doc.key] = el; }}
                                                        style={{ display: 'none' }}
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={e => handleFileSelect(doc.key, e.target.files[0])}
                                                    />
                                                    <button
                                                        style={S.uploadBtn}
                                                        onClick={() => fileRefs.current[doc.key]?.click()}
                                                        disabled={loading}
                                                    >
                                                        <IoCloudUploadOutline size={15} color={C.accent} />
                                                        <span style={S.uploadBtnText}>Upload</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Submit */}
                            <button
                                style={{ ...S.submitBtn, ...(loading ? S.submitBtnLoading : {}) }}
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div style={S.spinner} />
                                        <span>Submitting…</span>
                                    </>
                                ) : (
                                    <>
                                        <IoCheckmarkCircle size={18} color="#fff" />
                                        <span>Submit Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
                )}

                {/* Profile completed state */}
                {profileDone && (
                    <section>
                        <div style={S.completedCard}>
                            <div style={S.completedIco}><IoCheckmarkCircle size={36} color={C.green} /></div>
                            <div style={S.completedTitle}>Profile Submitted</div>
                            <div style={S.completedSub}>
                                Your profile has been submitted and is under review. You'll be notified when your
                                eligibility is confirmed.
                            </div>
                            <button style={S.completedBtn} onClick={() => navigate('/device-catalog')}>
                                Browse Devices
                            </button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

const S = {
    root: { backgroundColor: C.bg, display: 'flex', flexDirection: 'column', minHeight: '100%' },

    header: {
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
    },
    headerLeft:  { display: 'flex', alignItems: 'center', gap: 14 },
    headerIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 19, fontWeight: '800', color: C.text, margin: 0 },
    headerSub:   { fontSize: 12, color: C.muted, marginTop: 2 },

    body: { flex: 1, padding: '20px 24px 40px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, width: '100%', alignSelf: 'center', boxSizing: 'border-box' },

    sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
    sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.text, margin: '0 0 14px' },
    requiredBadge: { backgroundColor: C.amberSoft, color: C.amber, fontSize: 11, fontWeight: '700', padding: '4px 10px', borderRadius: 20 },

    // Account card
    accountCard: { backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' },
    avatarRow:   { display: 'flex', alignItems: 'center', gap: 16, padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` },
    avatar:      { width: 56, height: 56, borderRadius: 16, backgroundColor: C.accent, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    avatarText:  { fontSize: 22, fontWeight: '900', color: '#fff' },
    accountName: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 3 },
    accountEmail:{ fontSize: 13, color: C.muted, marginBottom: 6 },
    statusBadge: { display: 'inline-block', fontSize: 11, fontWeight: '700', padding: '3px 10px', borderRadius: 20 },
    infoGrid:    { display: 'flex', flexDirection: 'column' },
    infoRow:     { display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${C.border}`, gap: 12 },
    infoIco:     { width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 },
    infoLabel:   { fontSize: 13, color: C.muted, width: 160, flexShrink: 0 },
    infoVal:     { fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },

    infoBanner:     { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: C.accentSoft, border: `1px solid ${C.accent}30`, borderRadius: 12, padding: '12px 14px', marginBottom: 14 },
    infoBannerText: { fontSize: 13, color: '#1E3A8A', lineHeight: 1.6 },

    formCard: { backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px' },
    formRow:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 4 },

    docsLabel: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: '0.8px', marginBottom: 10 },
    docsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, marginBottom: 20 },
    docCard:   { backgroundColor: C.bg, borderRadius: 12, padding: 14, border: `1.5px solid ${C.border}` },
    docCardDone:{ borderColor: `${C.green}60`, backgroundColor: C.greenSoft + '50' },
    docTop:    { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
    docIco:    { width: 36, height: 36, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    docTitle:  { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
    docSub:    { fontSize: 11, color: C.muted },
    docRequired:{ fontSize: 10, fontWeight: '700', color: C.amber, backgroundColor: C.amberSoft, padding: '2px 7px', borderRadius: 10, flexShrink: 0 },
    docCheck:  { flexShrink: 0 },
    docFileRow:{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, borderRadius: 8, padding: '6px 10px', border: `1px solid ${C.border}` },
    docFileName:{ fontSize: 12, color: C.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    docRemove:  { background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 },
    uploadBtn:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 0', backgroundColor: C.accentSoft, border: `1px solid ${C.accent}40`, borderRadius: 9, cursor: 'pointer' },
    uploadBtnText:{ fontSize: 13, fontWeight: '700', color: C.accent },

    submitBtn:       { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%', backgroundColor: C.navy, padding: '14px 0', borderRadius: 12, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,31,61,0.25)' },
    submitBtnLoading:{ opacity: 0.6, cursor: 'not-allowed' },
    spinner:         { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

    completedCard: { backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
    completedIco:  { width: 68, height: 68, borderRadius: 20, backgroundColor: C.greenSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    completedTitle:{ fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
    completedSub:  { fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 20, maxWidth: 400 },
    completedBtn:  { backgroundColor: C.navy, padding: '12px 24px', borderRadius: 12, border: 'none', color: '#fff', fontWeight: '700', fontSize: 14, cursor: 'pointer' },
};
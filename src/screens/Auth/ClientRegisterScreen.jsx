// screens/Auth/ClientRegisterScreen.jsx
// Updated: PublicFooter added at the bottom of the page.
// All original multi-step form logic, validation, and API calls preserved exactly.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import {
    IoPersonOutline,
    IoTextOutline,
    IoMailOutline,
    IoCallOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoChevronDown,
    IoCheckmark,
    IoLocationOutline,
    IoCardOutline,
    IoBusinessOutline,
    IoBriefcaseOutline,
    IoDocumentTextOutline,
    IoShieldCheckmarkOutline,
    IoArrowBack,
    IoArrowForward,
    IoCheckmarkCircleOutline,
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
    error:      '#DC2626',
    errorSoft:  '#FEF2F2',
    disabled:   '#94A3B8',
};

const TITLES = [
    { value: 'Mr',   label: 'Mr' },
    { value: 'Mrs',  label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms',   label: 'Ms' },
    { value: 'Dr',   label: 'Dr' },
    { value: 'Prof', label: 'Professor' },
];

const SOUTH_AFRICAN_REGIONS = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
].map(v => ({ value: v, label: v }));

const COUNTRY_CODE = '+27';

const validateSouthAfricanID = (idNumber) => {
    const cleanId = idNumber.replace(/\s/g, '');
    if (!/^\d{13}$/.test(cleanId)) return 'ID number must be 13 digits';
    const year  = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const day   = parseInt(cleanId.substring(4, 6));
    if (month < 1 || month > 12) return 'Invalid month in ID number';
    if (day < 1 || day > 31)     return 'Invalid day in ID number';
    const fullYear = year < 22 ? 2000 + year : 1900 + year;
    const date = new Date(fullYear, month - 1, day);
    if (date.getFullYear() !== fullYear || date.getMonth() + 1 !== month || date.getDate() !== day)
        return 'Invalid date of birth in ID number';
    if (date > new Date()) return 'Date of birth cannot be in the future';
    return null;
};

// ─── Sub-components (all original, untouched) ───────────────────────────────
const Field = ({ label, error, onBlur, icon, hint, onChangeText, editable = true, ...props }) => {
    const [focused, setFocused] = useState(false);
    const Icon = icon === 'text-outline'           ? IoTextOutline
        : icon === 'mail-outline'           ? IoMailOutline
            : icon === 'call-outline'           ? IoCallOutline
                : icon === 'card-outline'           ? IoCardOutline
                    : icon === 'business-outline'       ? IoBusinessOutline
                        : icon === 'person-circle-outline'  ? IoPersonOutline : null;
    const handleChange = (e) => { if (onChangeText) onChangeText(e.target.value); };
    return (
        <div style={fieldStyles.wrap}>
            <div style={fieldStyles.label}>{label.toUpperCase()}</div>
            <div style={{ ...fieldStyles.inputRow, ...(focused && fieldStyles.inputFocused), ...(error && fieldStyles.inputError) }}>
                {Icon && <Icon size={17} style={fieldStyles.ico} color={error ? C.error : focused ? C.accent : C.muted} />}
                <input style={fieldStyles.input} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); onBlur?.(); }} onChange={handleChange} disabled={!editable} {...props} />
            </div>
            {error && <div style={fieldStyles.errorText}>{error}</div>}
            {hint && !error && <div style={fieldStyles.hintText}>{hint}</div>}
        </div>
    );
};

const fieldStyles = {
    wrap: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1, marginBottom: 8 },
    inputRow: { display: 'flex', alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderStyle: 'solid', borderColor: C.border, borderRadius: 14 },
    inputFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF' },
    inputError:   { borderColor: C.error, backgroundColor: C.errorSoft },
    ico:   { marginLeft: 14, marginRight: 4 },
    input: { flex: 1, padding: '13px 10px', fontSize: 15, color: C.text, border: 'none', background: 'transparent', outline: 'none' },
    errorText: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 4 },
    hintText:  { fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 4, fontStyle: 'italic' },
};

const PasswordField = ({ label, value, onChangeText, error, showPassword, onToggleVisibility, onBlur, editable = true }) => {
    const [focused, setFocused] = useState(false);
    const handleChange = (e) => onChangeText(e.target.value);
    return (
        <div style={fieldStyles.wrap}>
            <div style={fieldStyles.label}>{label.toUpperCase()}</div>
            <div style={{ ...fieldStyles.inputRow, ...(focused && fieldStyles.inputFocused), ...(error && fieldStyles.inputError) }}>
                <IoLockClosedOutline size={17} style={fieldStyles.ico} color={error ? C.error : focused ? C.accent : C.muted} />
                <input type={showPassword ? 'text' : 'password'} style={fieldStyles.input} placeholder="Enter password" value={value} onChange={handleChange} disabled={!editable} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); onBlur?.(); }} autoCapitalize="off" autoCorrect="off" />
                <button type="button" onClick={onToggleVisibility} disabled={!editable} style={{ padding: '0 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                </button>
            </div>
            {error && <div style={fieldStyles.errorText}>{error}</div>}
        </div>
    );
};

const SelectField = ({ label, value, placeholder, onSelect, editable, options, error, icon }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const IconComp = icon === 'person-circle-outline' ? IoPersonOutline
        : icon === 'location-outline'      ? IoLocationOutline
            : icon === 'briefcase-outline'     ? IoBriefcaseOutline : null;
    return (
        <div ref={ref} style={{ ...fieldStyles.wrap, position: 'relative' }}>
            <div style={fieldStyles.label}>{label.toUpperCase()}</div>
            <button type="button" disabled={!editable} onClick={() => editable && setOpen(v => !v)}
                    style={{ ...fieldStyles.inputRow, width: '100%', cursor: editable ? 'pointer' : 'default', justifyContent: 'flex-start', ...(error && fieldStyles.inputError) }}>
                {IconComp && <IconComp size={17} style={fieldStyles.ico} color={error ? C.error : C.muted} />}
                <span style={{ ...fieldStyles.input, color: value ? C.text : C.mutedLight, textAlign: 'left' }}>{value || placeholder}</span>
                <IoChevronDown size={16} color={C.muted} style={{ marginRight: 14, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {error && <div style={fieldStyles.errorText}>{error}</div>}
            {open && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 8px 20px rgba(15,31,61,0.15)', maxHeight: 220, overflowY: 'auto', marginTop: 4 }}>
                    {options.map(opt => (
                        <button key={opt.value} type="button" style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: value === opt.value ? C.accentSoft : 'none', cursor: 'pointer', fontSize: 14, color: value === opt.value ? C.accent : C.text, fontWeight: value === opt.value ? '700' : '400' }}
                                onClick={() => { onSelect(opt.value); setOpen(false); }}>
                            {opt.label}
                            {value === opt.value && <IoCheckmark size={14} style={{ float: 'right', marginTop: 2 }} color={C.accent} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const StepBar = ({ current, total }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        {Array.from({ length: total }, (_, i) => {
            const n = i + 1;
            const done   = n < current;
            const active = n === current;
            return (
                <React.Fragment key={n}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 52 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: done ? C.green : active ? C.accent : 'rgba(255,255,255,0.15)', border: done || active ? 'none' : '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                            {done ? <IoCheckmark size={14} color="#fff" /> : <span style={{ fontSize: 11, color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{n}</span>}
                        </div>
                        <span style={{ fontSize: 9, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', fontWeight: '600' }}>
                            {['Info', 'Details', 'Security', 'Review'][i] || `Step ${n}`}
                        </span>
                    </div>
                    {i < total - 1 && <div style={{ flex: 1, height: 2, backgroundColor: done ? C.green : 'rgba(255,255,255,0.15)', maxWidth: 20, marginBottom: 18, transition: 'background 0.3s' }} />}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function ClientRegisterScreen() {
    const toast    = useToast();
    const navigate = useNavigate();

    const totalSteps = 4;
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '', firstName: '', lastName: '', email: '',
        phoneNumber: '', region: '', persalId: '', departmentId: '',
        userType: 'Advocate',
        password: '', confirmPassword: '',
    });
    const [errors,              setErrors]              = useState({});
    const [loading,             setLoading]             = useState(false);
    const [showPassword,        setShowPassword]        = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateCurrentStep = () => {
        const newErrors = {};
        let isValid = true;
        switch (currentStep) {
            case 1:
                if (!formData.title)     { newErrors.title = 'Title is required'; isValid = false; }
                if (!formData.firstName) { newErrors.firstName = 'First name is required'; isValid = false; }
                if (!formData.lastName)  { newErrors.lastName = 'Last name is required'; isValid = false; }
                if (!formData.email)     { newErrors.email = 'Email is required'; isValid = false; }
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = 'Please enter a valid email address'; isValid = false; }
                if (formData.phoneNumber) {
                    const clean = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                    if (!/^[0-9]{9}$/.test(clean)) { newErrors.phoneNumber = 'Please enter a valid South African phone number (9 digits after +27)'; isValid = false; }
                }
                break;
            case 2:
                if (!formData.region)       { newErrors.region = 'Region is required'; isValid = false; }
                if (!formData.persalId)     { newErrors.persalId = 'Personal ID is required'; isValid = false; }
                else { const idErr = validateSouthAfricanID(formData.persalId); if (idErr) { newErrors.persalId = idErr; isValid = false; } }
                if (!formData.departmentId) { newErrors.departmentId = 'Department ID is required'; isValid = false; }
                break;
            case 3:
                if (!formData.password)        { newErrors.password = 'Password is required'; isValid = false; }
                else if (formData.password.length < 8) { newErrors.password = 'Password must be at least 8 characters'; isValid = false; }
                if (!formData.confirmPassword)  { newErrors.confirmPassword = 'Please confirm your password'; isValid = false; }
                else if (formData.confirmPassword !== formData.password) { newErrors.confirmPassword = 'Passwords do not match'; isValid = false; }
                break;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleNextStep = () => {
        if (validateCurrentStep()) { if (currentStep < totalSteps) setCurrentStep(currentStep + 1); }
        else toast.warning('Please fix the errors before continuing');
    };

    const handlePrevStep = () => {
        if (currentStep > 1) { setCurrentStep(currentStep - 1); setErrors({}); }
    };

    const handlePhoneNumberChange = (text) => {
        let cleaned = text.replace(/\D/g, '');
        if (cleaned.startsWith('27')) cleaned = cleaned.slice(0, 11);
        else cleaned = '27' + cleaned.slice(0, 9);
        let formatted = COUNTRY_CODE + ' ';
        if (cleaned.length > 2) formatted += cleaned.slice(2, 5);
        if (cleaned.length > 5) formatted += ' ' + cleaned.slice(5, 8);
        if (cleaned.length > 8) formatted += ' ' + cleaned.slice(8);
        setFormData({ ...formData, phoneNumber: formatted });
    };

    const handleRegister = async () => {
        if (!validateCurrentStep()) { toast.warning('Please review the terms before submitting'); return; }
        setLoading(true);
        try {
            const registrationData = {
                title:         formData.title,
                first_name:    formData.firstName,
                last_name:     formData.lastName,
                email:         formData.email,
                phone_number:  formData.phoneNumber,
                region:        formData.region,
                persal_id:     formData.persalId,
                department_id: formData.departmentId,
                user_type:     formData.userType,
                password:      formData.password,
            };
            const response = await authAPI.registerClient(registrationData);
            localStorage.setItem('user', JSON.stringify(response.user));
            toast.success('Registration Submitted!', response.message || 'Your account is pending verification.');
            setFormData({ title: '', firstName: '', lastName: '', email: '', phoneNumber: '', region: '', persalId: '', departmentId: '', userType: 'Advocate', password: '', confirmPassword: '' });
            setErrors({});
            setCurrentStep(1);
            setTimeout(() => navigate('/login'), 1800);
        } catch (error) {
            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;
            if (!error.response)  { toast.error('Connection Error', 'Network error. Please check your connection.'); }
            else if (status === 409) { toast.error('Account Already Exists', serverMessage || 'An account with this email already exists.'); setErrors(prev => ({ ...prev, email: 'This email is already registered' })); setCurrentStep(1); }
            else if (status === 422) { toast.error('Invalid Data', serverMessage || 'Please check your information and try again.'); }
            else { toast.error('Registration Failed', serverMessage || 'Registration failed. Please try again.'); }
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return (
                <>
                    <div style={stepContentStyles.stepIntro}>
                        <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.accentSoft }}><IoPersonOutline size={20} color={C.accent} /></div>
                        <div><div style={stepContentStyles.stepTitle}>Personal Information</div><div style={stepContentStyles.stepSub}>Tell us about yourself</div></div>
                    </div>
                    <SelectField label="Title" value={formData.title} placeholder="Select your title" onSelect={v => { setFormData({ ...formData, title: v }); setErrors(p => ({ ...p, title: '' })); }} editable={!loading} options={TITLES} error={errors.title} icon="person-circle-outline" />
                    <Field label="First Name *" placeholder="Enter your first name" value={formData.firstName} editable={!loading} onChangeText={t => setFormData({ ...formData, firstName: t })} onBlur={() => setErrors(p => ({ ...p, firstName: !formData.firstName ? 'First name is required' : '' }))} error={errors.firstName} icon="text-outline" />
                    <Field label="Last Name *" placeholder="Enter your last name" value={formData.lastName} editable={!loading} onChangeText={t => setFormData({ ...formData, lastName: t })} onBlur={() => setErrors(p => ({ ...p, lastName: !formData.lastName ? 'Last name is required' : '' }))} error={errors.lastName} icon="text-outline" />
                    <Field label="Email Address *" placeholder="your.email@dojcd.gov.za" type="email" value={formData.email} editable={!loading} onChangeText={t => setFormData({ ...formData, email: t })} onBlur={() => { if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) setErrors(p => ({ ...p, email: 'Please enter a valid email address' })); }} error={errors.email} icon="mail-outline" />
                    <Field label="Phone Number" placeholder="+27 XXX XXX XXX" type="tel" value={formData.phoneNumber} editable={!loading} onChangeText={handlePhoneNumberChange} error={errors.phoneNumber} icon="call-outline" hint="South African number — 9 digits after +27" />
                </>
            );
            case 2: return (
                <>
                    <div style={stepContentStyles.stepIntro}>
                        <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.accentSoft }}><IoLocationOutline size={20} color={C.accent} /></div>
                        <div><div style={stepContentStyles.stepTitle}>Department Details</div><div style={stepContentStyles.stepSub}>Your official credentials</div></div>
                    </div>
                    <SelectField label="Region / Province *" value={formData.region} placeholder="Select your region" onSelect={v => { setFormData({ ...formData, region: v }); setErrors(p => ({ ...p, region: '' })); }} editable={!loading} options={SOUTH_AFRICAN_REGIONS} error={errors.region} icon="location-outline" />
                    <Field label="PERSAL / SA ID Number *" placeholder="Enter your 13-digit ID" value={formData.persalId} editable={!loading} onChangeText={t => setFormData({ ...formData, persalId: t })} onBlur={() => { if (formData.persalId) { const e = validateSouthAfricanID(formData.persalId); if (e) setErrors(p => ({ ...p, persalId: e })); } }} error={errors.persalId} icon="card-outline" hint="Your South African ID / PERSAL number (13 digits)" />
                    <Field label="Department ID *" placeholder="Enter your department ID" value={formData.departmentId} editable={!loading} onChangeText={t => setFormData({ ...formData, departmentId: t })} error={errors.departmentId} icon="business-outline" />
                    <div style={stepContentStyles.stepIntro}>
                        <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.accentSoft }}><IoBriefcaseOutline size={20} color={C.accent} /></div>
                        <div><div style={stepContentStyles.stepTitle}>User Type</div><div style={stepContentStyles.stepSub}>Select your role in the department</div></div>
                    </div>
                    <div style={stepContentStyles.typeRow}>
                        {['Advocate', 'Magistrate'].map(type => (
                            <button key={type} type="button" disabled={loading} style={{ ...stepContentStyles.typeBtn, ...(formData.userType === type ? stepContentStyles.typeBtnActive : {}) }} onClick={() => setFormData({ ...formData, userType: type })}>
                                <IoBriefcaseOutline size={16} color={formData.userType === type ? '#fff' : C.muted} />
                                <span style={{ ...stepContentStyles.typeBtnText, ...(formData.userType === type ? stepContentStyles.typeBtnTextActive : {}) }}>{type}</span>
                            </button>
                        ))}
                    </div>
                </>
            );
            case 3: return (
                <>
                    <div style={stepContentStyles.stepIntro}>
                        <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.accentSoft }}><IoLockClosedOutline size={20} color={C.accent} /></div>
                        <div><div style={stepContentStyles.stepTitle}>Create Password</div><div style={stepContentStyles.stepSub}>Secure your account</div></div>
                    </div>
                    <PasswordField label="Password *" value={formData.password} onChangeText={t => { setFormData({ ...formData, password: t }); setErrors(p => ({ ...p, password: '' })); }} error={errors.password} showPassword={showPassword} onToggleVisibility={() => setShowPassword(v => !v)} editable={!loading} />
                    <PasswordField label="Confirm Password *" value={formData.confirmPassword} onChangeText={t => { setFormData({ ...formData, confirmPassword: t }); setErrors(p => ({ ...p, confirmPassword: '' })); }} error={errors.confirmPassword} showPassword={showConfirmPassword} onToggleVisibility={() => setShowConfirmPassword(v => !v)} editable={!loading} />
                    <div style={stepContentStyles.reqCard}>
                        <div style={stepContentStyles.reqTitle}>Password must:</div>
                        {[
                            { met: formData.password.length >= 8,                                                     text: 'Be at least 8 characters' },
                            { met: /[A-Z]/.test(formData.password),                                                   text: 'Contain an uppercase letter' },
                            { met: /[0-9]/.test(formData.password),                                                   text: 'Contain a number' },
                            { met: formData.confirmPassword !== '' && formData.confirmPassword === formData.password, text: 'Passwords match' },
                        ].map((r, i) => (
                            <div key={i} style={stepContentStyles.reqRow}>
                                <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: r.met ? C.greenSoft : C.bg, border: `1.5px solid ${r.met ? C.green : C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {r.met && <IoCheckmark size={11} color={C.green} />}
                                </div>
                                <span style={{ ...stepContentStyles.reqText, ...(r.met ? stepContentStyles.reqTextMet : {}) }}>{r.text}</span>
                            </div>
                        ))}
                    </div>
                </>
            );
            case 4: return (
                <>
                    <div style={stepContentStyles.stepIntro}>
                        <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.accentSoft }}><IoDocumentTextOutline size={20} color={C.accent} /></div>
                        <div><div style={stepContentStyles.stepTitle}>Terms &amp; Conditions</div><div style={stepContentStyles.stepSub}>Please read before creating your account</div></div>
                    </div>
                    <div style={stepContentStyles.termsBox}>
                        <div style={stepContentStyles.termsScroll}>
                            {[
                                { title: '1. Authorized Use',      text: 'This platform is exclusively for DOJCD employees. Unauthorized use is prohibited and may result in disciplinary or legal action.' },
                                { title: '2. Data Accuracy',       text: 'You are responsible for ensuring all information provided is accurate. False or misleading information may result in account termination.' },
                                { title: '3. Device Responsibility',text: 'Approved devices remain government property. Users are responsible for their safekeeping and appropriate use.' },
                                { title: '4. Confidentiality',     text: 'Do not share your login credentials. You are responsible for all activities conducted under your account.' },
                                { title: '5. Compliance',          text: 'Use of this platform must comply with DOJCD policies, the Electronic Communications Act, and all applicable government regulations.' },
                            ].map((term, i) => (
                                <div key={i} style={stepContentStyles.termItem}>
                                    <div style={stepContentStyles.termDot} />
                                    <div style={stepContentStyles.termText}><strong>{term.title}: </strong>{term.text}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={stepContentStyles.acceptBanner}>
                        <IoShieldCheckmarkOutline size={18} color={C.green} />
                        <span style={stepContentStyles.acceptText}>By creating your account, you agree to all the terms and conditions listed above.</span>
                    </div>
                </>
            );
            default: return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
            <PublicNavbar />

            <div style={headerStyles.wrap}>
                <div style={headerStyles.ring} />
                <div style={headerStyles.titleRow}>
                    <button style={headerStyles.backBtn} onClick={() => navigate(-1)}>
                        <IoArrowBack size={22} color="rgba(255,255,255,0.9)" />
                    </button>
                    <div style={headerStyles.emblem}><span style={{ fontSize: 22 }}>⚖️</span></div>
                    <div>
                        <div style={headerStyles.title}>Client Registration</div>
                        <div style={headerStyles.sub}>Create your account to request devices</div>
                    </div>
                </div>
                <StepBar current={currentStep} total={totalSteps} />
            </div>

            {/* Form area — flex 1 to push footer to bottom */}
            <div style={{ flex: 1, backgroundColor: C.bg, overflowY: 'auto', padding: '20px' }}>
                <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                    <div style={stepContentStyles.formCard}>
                        {renderStep()}
                    </div>
                    <div style={navStyles.row}>
                        {currentStep > 1 && (
                            <button style={navStyles.back} onClick={handlePrevStep} disabled={loading}>
                                <IoArrowBack size={18} /> <span>Back</span>
                            </button>
                        )}
                        {currentStep < totalSteps ? (
                            <button style={{ ...navStyles.next, ...(currentStep === 1 ? navStyles.nextFull : {}) }} onClick={handleNextStep} disabled={loading}>
                                <span>Continue</span> <IoArrowForward size={18} />
                            </button>
                        ) : (
                            <button style={{ ...navStyles.submit, ...(loading ? navStyles.submitLoading : {}) }} onClick={handleRegister} disabled={loading}>
                                {loading ? (
                                    <><div style={spinnerStyle} /><span>Creating Account…</span></>
                                ) : (
                                    <><IoCheckmarkCircleOutline size={20} /><span>Create Account</span></>
                                )}
                            </button>
                        )}
                    </div>
                    <button style={navStyles.loginLink} onClick={() => navigate('/login')} disabled={loading}>
                        <span style={navStyles.loginText}>Already have an account? <strong style={{ color: C.accent }}>Sign In</strong></span>
                    </button>
                </div>
            </div>

            {/* Shared footer */}
            <PublicFooter />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const headerStyles = {
    wrap:      { backgroundColor: C.navy, paddingTop: 12, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, position: 'relative', overflow: 'hidden' },
    ring:      { position: 'absolute', width: 240, height: 240, borderRadius: 120, border: '1px solid rgba(255,255,255,0.05)', top: -80, right: -60 },
    backBtn:   { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 },
    titleRow:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, maxWidth: '100%', margin: '0 auto 16px' },
    emblem:    { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    title:     { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 2 },
    sub:       { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
};

const stepContentStyles = {
    formCard:     { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 3px 10px rgba(15,31,61,0.06)' },
    stepIntro:    { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` },
    stepIco:      { width: 42, height: 42, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    stepTitle:    { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
    stepSub:      { fontSize: 12, color: C.muted },
    typeRow:      { display: 'flex', gap: 10 },
    typeBtn:      { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '13px 0', borderRadius: 14, border: `1.5px solid ${C.border}`, backgroundColor: C.bg, cursor: 'pointer' },
    typeBtnActive:{ backgroundColor: C.navy, borderColor: C.navy },
    typeBtnText:  { fontSize: 15, fontWeight: '600', color: C.muted },
    typeBtnTextActive: { color: '#fff' },
    reqCard:      { backgroundColor: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 },
    reqTitle:     { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4 },
    reqRow:       { display: 'flex', alignItems: 'center', gap: 10 },
    reqText:      { fontSize: 13, color: C.mutedLight },
    reqTextMet:   { color: C.green, fontWeight: '600' },
    termsBox:     { borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 14 },
    termsScroll:  { maxHeight: 240, padding: 16, backgroundColor: C.bg, overflowY: 'auto' },
    termItem:     { display: 'flex', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
    termDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 6, flexShrink: 0 },
    termText:     { flex: 1, fontSize: 12, color: C.muted, lineHeight: 1.5 },
    acceptBanner: { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: C.greenSoft, borderRadius: 14, padding: 14, border: `1px solid ${C.green}50` },
    acceptText:   { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 1.5, fontWeight: '500' },
};

const navStyles = {
    row:          { display: 'flex', gap: 12, marginBottom: 16, maxWidth: '100%', margin: '0 auto 16px' },
    back:         { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '15px 0', borderRadius: 16, border: `1.5px solid ${C.navy}`, backgroundColor: C.surface, cursor: 'pointer', fontWeight: '700', color: C.navy },
    next:         { flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: C.navy, padding: '16px 0', borderRadius: 16, boxShadow: '0 5px 10px rgba(15,31,61,0.25)', cursor: 'pointer', color: '#fff', fontWeight: '700', border: 'none' },
    nextFull:     { flex: 1 },
    submit:       { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: C.green, padding: '16px 0', borderRadius: 16, boxShadow: '0 5px 10px rgba(5,150,105,0.25)', cursor: 'pointer', color: '#fff', fontWeight: '700', border: 'none' },
    submitLoading:{ backgroundColor: C.disabled, boxShadow: 'none', cursor: 'not-allowed' },
    loginLink:    { width: '100%', textAlign: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer', display: 'block', margin: '0 auto', maxWidth: '100%' },
    loginText:    { fontSize: 14, color: C.muted },
};

const spinnerStyle = { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8 };
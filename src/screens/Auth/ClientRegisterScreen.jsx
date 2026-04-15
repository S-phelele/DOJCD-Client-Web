// screens/Auth/ClientRegisterScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoPersonOutline,
    IoTextOutline,
    IoMailOutline,
    IoCallOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoChevronDown,
    IoClose,
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
import { FiRefreshCw } from 'react-icons/fi';

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
    error: '#DC2626',
    errorSoft: '#FEF2F2',
    disabled: '#94A3B8',
};

// ─── Static data ──────────────────────────────────────────────────────
const TITLES = [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Miss', label: 'Miss' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Dr', label: 'Dr' },
    { value: 'Prof', label: 'Professor' },
];

const SOUTH_AFRICAN_REGIONS = [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
    'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
].map(v => ({ value: v, label: v }));

const COUNTRY_CODE = '+27';

// ─── SA ID validation (unchanged) ────────────────────────────────────
const validateSouthAfricanID = (idNumber) => {
    const cleanId = idNumber.replace(/\s/g, '');
    if (!/^\d{13}$/.test(cleanId)) return 'ID number must be 13 digits';
    const year = parseInt(cleanId.substring(0, 2));
    const month = parseInt(cleanId.substring(2, 4));
    const day = parseInt(cleanId.substring(4, 6));
    if (month < 1 || month > 12) return 'Invalid month in ID number';
    if (day < 1 || day > 31) return 'Invalid day in ID number';
    const fullYear = year < 22 ? 2000 + year : 1900 + year;
    const date = new Date(fullYear, month - 1, day);
    if (date.getFullYear() !== fullYear || date.getMonth() + 1 !== month || date.getDate() !== day)
        return 'Invalid date of birth in ID number';
    if (date > new Date()) return 'Date of birth cannot be in the future';
    return null;
};

// ─── Sub-components (FIXED: onChangeText → onChange, added disabled) ──

const Field = ({ label, error, onBlur, icon, hint, onChangeText, editable = true, ...props }) => {
    const [focused, setFocused] = useState(false);
    const Icon = icon === 'text-outline' ? IoTextOutline :
        icon === 'mail-outline' ? IoMailOutline :
            icon === 'call-outline' ? IoCallOutline :
                icon === 'card-outline' ? IoCardOutline :
                    icon === 'business-outline' ? IoBusinessOutline :
                        icon === 'person-circle-outline' ? IoPersonOutline : null;

    const handleChange = (e) => {
        if (onChangeText) onChangeText(e.target.value);
    };

    return (
        <div style={fieldStyles.wrap}>
            <div style={fieldStyles.label}>{label.toUpperCase()}</div>
            <div style={{
                ...fieldStyles.inputRow,
                ...(focused && fieldStyles.inputFocused),
                ...(error && fieldStyles.inputError),
            }}>
                {Icon && <Icon size={17} style={fieldStyles.ico} color={error ? C.error : focused ? C.accent : C.muted} />}
                <input
                    style={fieldStyles.input}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); onBlur?.(); }}
                    onChange={handleChange}
                    disabled={!editable}
                    {...props}
                />
            </div>
            {error && <div style={fieldStyles.errorText}>{error}</div>}
            {hint && !error && <div style={fieldStyles.hintText}>{hint}</div>}
        </div>
    );
};

const fieldStyles = {
    wrap: { marginBottom: 16 },
    label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1, marginBottom: 8 },
    inputRow: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: C.border,
        borderRadius: 14,
    },
    inputFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF' },
    inputError: { borderColor: C.error, backgroundColor: C.errorSoft },
    ico: { marginLeft: 14, marginRight: 4 },
    input: {
        flex: 1,
        padding: '13px 10px',
        fontSize: 15,
        color: C.text,
        border: 'none',
        background: 'transparent',
        outline: 'none',
    },
    errorText: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 4 },
    hintText: { fontSize: 11, color: C.muted, marginTop: 4, marginLeft: 4, fontStyle: 'italic' },
};

const PasswordField = ({ label, value, onChangeText, error, showPassword, onToggleVisibility, onBlur, editable = true }) => {
    const [focused, setFocused] = useState(false);
    const handleChange = (e) => onChangeText(e.target.value);
    return (
        <div style={fieldStyles.wrap}>
            <div style={fieldStyles.label}>{label.toUpperCase()}</div>
            <div style={{
                ...fieldStyles.inputRow,
                ...(focused && fieldStyles.inputFocused),
                ...(error && fieldStyles.inputError),
            }}>
                <IoLockClosedOutline size={17} style={fieldStyles.ico} color={error ? C.error : focused ? C.accent : C.muted} />
                <input
                    type={showPassword ? 'text' : 'password'}
                    style={fieldStyles.input}
                    placeholder="Enter password"
                    value={value}
                    onChange={handleChange}
                    disabled={!editable}
                    onFocus={() => setFocused(true)}
                    onBlur={() => { setFocused(false); onBlur?.(); }}
                    autoCapitalize="off"
                    autoCorrect="off"
                />
                <button
                    type="button"
                    onClick={onToggleVisibility}
                    disabled={!editable}
                    style={passwordStyles.eye}
                >
                    {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
                </button>
            </div>
            {error && <div style={fieldStyles.errorText}>{error}</div>}
        </div>
    );
};

const passwordStyles = {
    eye: {
        padding: '0 14px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
};

const SelectField = ({ label, value, placeholder, onSelect, editable, options, error, icon }) => {
    const [open, setOpen] = useState(false);
    const found = options.find(o => o.value === value)?.label || '';
    const Icon = icon === 'location-outline' ? IoLocationOutline : null;

    return (
        <>
            <div style={fieldStyles.wrap}>
                <div style={fieldStyles.label}>{label.toUpperCase()}</div>
                <button
                    style={{
                        ...selectStyles.btn,
                        ...(error && fieldStyles.inputError),
                        ...(!editable && { opacity: 0.55 }),
                    }}
                    onClick={() => editable && setOpen(true)}
                    disabled={!editable}
                >
                    {Icon && <Icon size={17} style={fieldStyles.ico} color={value ? C.text : C.muted} />}
                    <span style={{ ...selectStyles.btnText, ...(!value && selectStyles.placeholder) }}>
                        {found || placeholder}
                    </span>
                    <IoChevronDown size={16} style={{ marginRight: 14 }} />
                </button>
                {error && <div style={fieldStyles.errorText}>{error}</div>}
            </div>

            {open && (
                <div style={modalStyles.overlay} onClick={() => setOpen(false)}>
                    <div style={modalStyles.sheet} onClick={e => e.stopPropagation()}>
                        <div style={modalStyles.handle} />
                        <div style={modalStyles.sheetHeader}>
                            <span style={modalStyles.sheetTitle}>Select {label}</span>
                            <button onClick={() => setOpen(false)} style={modalStyles.closeBtn}>
                                <IoClose size={22} />
                            </button>
                        </div>
                        <div style={modalStyles.optionsList}>
                            {options.map(opt => (
                                <button
                                    key={opt.value}
                                    style={modalStyles.option}
                                    onClick={() => { onSelect(opt.value); setOpen(false); }}
                                >
                                    <span style={{ ...modalStyles.optionText, ...(value === opt.value && modalStyles.optionActive) }}>
                                        {opt.label}
                                    </span>
                                    {value === opt.value && <IoCheckmark size={18} color={C.accent} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const selectStyles = {
    btn: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        backgroundColor: C.bg,
        borderWidth: 1.5,
        borderStyle: 'solid',
        borderColor: C.border,
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    btnText: { flex: 1, padding: '13px 10px', fontSize: 15, color: C.text, textAlign: 'left' },
    placeholder: { color: C.mutedLight },
};

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15,31,61,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
    },
    sheet: {
        backgroundColor: C.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        width: '100%',
        maxHeight: '65%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
    },
    handle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, margin: '12px auto 0' },
    sheetHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottom: `1px solid ${C.border}`,
    },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: C.text },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex' },
    optionsList: { overflowY: 'auto', flex: 1 },
    option: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: 18,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        borderBottom: `1px solid ${C.border}`,
    },
    optionText: { fontSize: 16, color: C.text },
    optionActive: { color: C.accent, fontWeight: '700' },
};

const StepBar = ({ current, total }) => {
    const STEP_LABELS = ['Personal', 'Employment', 'Security', 'Terms'];
    return (
        <div style={stepBarStyles.wrap}>
            {STEP_LABELS.map((label, i) => {
                const done = i < current - 1;
                const active = i === current - 1;
                return (
                    <React.Fragment key={label}>
                        <div style={stepBarStyles.item}>
                            <div style={{
                                ...stepBarStyles.circle,
                                ...(done && stepBarStyles.circleDone),
                                ...(active && stepBarStyles.circleActive),
                            }}>
                                {done ? <IoCheckmark size={12} color="#fff" /> : <span style={{ ...stepBarStyles.num, ...(active && stepBarStyles.numActive) }}>{i + 1}</span>}
                            </div>
                            <div style={{ ...stepBarStyles.label, ...(active && stepBarStyles.labelActive), ...(done && stepBarStyles.labelDone) }}>{label}</div>
                        </div>
                        {i < total - 1 && (
                            <div style={{ ...stepBarStyles.connector, ...((done || active) && stepBarStyles.connectorFilled) }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const stepBarStyles = {
    wrap: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', marginTop: 8 },
    item: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 54 },
    circle: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 5,
    },
    circleDone: { backgroundColor: C.green, borderColor: C.green },
    circleActive: { backgroundColor: C.accent, borderColor: C.accent },
    num: { fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: '700' },
    numActive: { color: '#fff' },
    label: { fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' },
    labelActive: { color: 'rgba(255,255,255,0.9)' },
    labelDone: { color: 'rgba(255,255,255,0.6)' },
    connector: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 14, maxWidth: 18 },
    connectorFilled: { backgroundColor: C.accent },
};

// ─── Main Screen ─────────────────────────────────────────────────────
export default function ClientRegisterScreen() {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        title: '', firstName: '', lastName: '', email: '',
        phoneNumber: '', region: '', persalId: '', departmentId: '',
        userType: 'Advocate',
        password: '', confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation (same logic)
    const validateCurrentStep = () => {
        const newErrors = {};
        let isValid = true;

        switch (currentStep) {
            case 1:
                if (!formData.title) { newErrors.title = 'Title is required'; isValid = false; }
                if (!formData.firstName) { newErrors.firstName = 'First name is required'; isValid = false; }
                if (!formData.lastName) { newErrors.lastName = 'Last name is required'; isValid = false; }
                if (!formData.email) { newErrors.email = 'Email is required'; isValid = false; }
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { newErrors.email = 'Please enter a valid email address'; isValid = false; }
                if (formData.phoneNumber) {
                    const clean = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, '');
                    if (!/^[0-9]{9}$/.test(clean)) { newErrors.phoneNumber = 'Please enter a valid South African phone number (9 digits after +27)'; isValid = false; }
                }
                break;
            case 2:
                if (!formData.region) { newErrors.region = 'Region is required'; isValid = false; }
                if (!formData.persalId) { newErrors.persalId = 'Personal ID is required'; isValid = false; }
                else {
                    const idErr = validateSouthAfricanID(formData.persalId);
                    if (idErr) { newErrors.persalId = idErr; isValid = false; }
                }
                if (!formData.departmentId) { newErrors.departmentId = 'Department ID is required'; isValid = false; }
                break;
            case 3:
                if (!formData.password) { newErrors.password = 'Password is required'; isValid = false; }
                else if (formData.password.length < 8) { newErrors.password = 'Password must be at least 8 characters'; isValid = false; }
                if (!formData.confirmPassword) { newErrors.confirmPassword = 'Please confirm your password'; isValid = false; }
                else if (formData.confirmPassword !== formData.password) { newErrors.confirmPassword = 'Passwords do not match'; isValid = false; }
                break;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleNextStep = () => {
        if (validateCurrentStep()) {
            if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
        } else {
            toast.warning('Please fix the errors before continuing');
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            setErrors({});
        }
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
        if (!validateCurrentStep()) {
            toast.warning('Please review the terms before submitting');
            return;
        }
        setLoading(true);
        try {
            const registrationData = {
                title: formData.title,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone_number: formData.phoneNumber,
                region: formData.region,
                persal_id: formData.persalId,
                department_id: formData.departmentId,
                user_type: formData.userType,
                password: formData.password,
            };
            const response = await authAPI.registerClient(registrationData);
            localStorage.setItem('user', JSON.stringify(response.user));
            toast.success('Registration Submitted!', response.message || 'Your account is pending verification.');
            setFormData({
                title: '', firstName: '', lastName: '', email: '',
                phoneNumber: '', region: '', persalId: '', departmentId: '',
                userType: 'Advocate', password: '', confirmPassword: '',
            });
            setErrors({});
            setCurrentStep(1);
            setTimeout(() => navigate('/login'), 1800);
        } catch (error) {
            const status = error.response?.status;
            const serverMessage = error.response?.data?.message;
            if (!error.response) {
                toast.error('Connection Error', 'Network error. Please check your connection.');
            } else if (status === 409) {
                toast.error('Account Already Exists', serverMessage || 'An account with this email already exists.');
                setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
                setCurrentStep(1);
            } else if (status === 422) {
                toast.error('Invalid Data', serverMessage || 'Please check your information and try again.');
            } else {
                toast.error('Registration Failed', serverMessage || 'Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step renderers
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <div style={stepContentStyles.stepIntro}>
                            <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.accentSoft }}><IoPersonOutline size={20} color={C.accent} /></div>
                            <div><div style={stepContentStyles.stepTitle}>Personal Information</div><div style={stepContentStyles.stepSub}>Tell us about yourself</div></div>
                        </div>
                        <SelectField label="Title" value={formData.title} placeholder="Select your title" onSelect={v => { setFormData({ ...formData, title: v }); setErrors(p => ({ ...p, title: '' })); }} editable={!loading} options={TITLES} error={errors.title} icon="person-circle-outline" />
                        <Field label="First Name *" placeholder="Enter your first name" value={formData.firstName} editable={!loading} onChangeText={t => setFormData({ ...formData, firstName: t })} onBlur={() => setErrors(p => ({ ...p, firstName: !formData.firstName ? 'First name is required' : '' }))} error={errors.firstName} icon="text-outline" />
                        <Field label="Last Name *" placeholder="Enter your last name" value={formData.lastName} editable={!loading} onChangeText={t => setFormData({ ...formData, lastName: t })} onBlur={() => setErrors(p => ({ ...p, lastName: !formData.lastName ? 'Last name is required' : '' }))} error={errors.lastName} icon="text-outline" />
                        <Field label="Email Address *" placeholder="Enter your email" type="email" autoCapitalize="none" value={formData.email} editable={!loading} onChangeText={t => setFormData({ ...formData, email: t })} onBlur={() => { if (!formData.email) setErrors(p => ({ ...p, email: 'Email is required' })); else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) setErrors(p => ({ ...p, email: 'Please enter a valid email address' })); else setErrors(p => ({ ...p, email: '' })); }} error={errors.email} icon="mail-outline" />
                        <Field label="Phone Number (Optional)" placeholder={`${COUNTRY_CODE} 00 000 0000`} type="tel" value={formData.phoneNumber} editable={!loading} onChangeText={handlePhoneNumberChange} onBlur={() => { if (formData.phoneNumber) { const clean = formData.phoneNumber.replace(COUNTRY_CODE, '').replace(/\D/g, ''); if (!/^[0-9]{9}$/.test(clean)) setErrors(p => ({ ...p, phoneNumber: 'Please enter a valid South African phone number (9 digits after +27)' })); else setErrors(p => ({ ...p, phoneNumber: '' })); } }} error={errors.phoneNumber} icon="call-outline" />
                    </>
                );
            case 2:
                return (
                    <>
                        <div style={stepContentStyles.stepIntro}>
                            <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.amberSoft }}><IoBriefcaseOutline size={20} color={C.amber} /></div>
                            <div><div style={stepContentStyles.stepTitle}>Employment Information</div><div style={stepContentStyles.stepSub}>Your work details</div></div>
                        </div>
                        <SelectField label="Region *" value={formData.region} placeholder="Select your region" onSelect={v => { setFormData({ ...formData, region: v }); setErrors(p => ({ ...p, region: '' })); }} editable={!loading} options={SOUTH_AFRICAN_REGIONS} error={errors.region} icon="location-outline" />
                        <Field label="Personal ID Number *" placeholder="Enter 13-digit ID number" type="text" value={formData.persalId} editable={!loading} onChangeText={t => { const digits = t.replace(/\D/g, '').slice(0, 13); setFormData({ ...formData, persalId: digits }); if (errors.persalId) setErrors(p => ({ ...p, persalId: '' })); }} onBlur={() => { if (!formData.persalId.trim()) setErrors(p => ({ ...p, persalId: 'Personal ID is required' })); else if (formData.persalId.length !== 13) setErrors(p => ({ ...p, persalId: 'ID number must be exactly 13 digits' })); else setErrors(p => ({ ...p, persalId: validateSouthAfricanID(formData.persalId) || '' })); }} error={errors.persalId} icon="card-outline" />
                        <Field label="Department ID *" placeholder="Enter your department ID" value={formData.departmentId} editable={!loading} onChangeText={t => setFormData({ ...formData, departmentId: t })} onBlur={() => setErrors(p => ({ ...p, departmentId: !formData.departmentId ? 'Department ID is required' : '' }))} error={errors.departmentId} icon="business-outline" />
                        <div style={{ marginBottom: 16 }}>
                            <div style={fieldStyles.label}>USER TYPE *</div>
                            <div style={stepContentStyles.typeRow}>
                                {(['Advocate', 'Magistrate']).map(type => {
                                    const active = formData.userType === type;
                                    return (
                                        <button
                                            key={type}
                                            style={{
                                                ...stepContentStyles.typeBtn,
                                                ...(active && stepContentStyles.typeBtnActive),
                                                ...(loading && { opacity: 0.5 }),
                                            }}
                                            onClick={() => setFormData({ ...formData, userType: type })}
                                            disabled={loading}
                                        >
                                            {type === 'Advocate' ? <IoPersonOutline size={16} color={active ? '#fff' : C.muted} style={{ marginRight: 6 }} /> : <IoBriefcaseOutline size={16} color={active ? '#fff' : C.muted} style={{ marginRight: 6 }} />}
                                            <span style={{ ...stepContentStyles.typeBtnText, ...(active && stepContentStyles.typeBtnTextActive) }}>{type}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <div style={stepContentStyles.stepIntro}>
                            <div style={{ ...stepContentStyles.stepIco, backgroundColor: '#EDE9FE' }}><IoLockClosedOutline size={20} color="#7C3AED" /></div>
                            <div><div style={stepContentStyles.stepTitle}>Account Security</div><div style={stepContentStyles.stepSub}>Create your login credentials</div></div>
                        </div>
                        <PasswordField label="Password *" value={formData.password} onChangeText={t => setFormData({ ...formData, password: t })} error={errors.password} showPassword={showPassword} onToggleVisibility={() => setShowPassword(!showPassword)} onBlur={() => { if (!formData.password) setErrors(p => ({ ...p, password: 'Password is required' })); else if (formData.password.length < 8) setErrors(p => ({ ...p, password: 'Password must be at least 8 characters' })); else setErrors(p => ({ ...p, password: '' })); }} editable={!loading} />
                        <PasswordField label="Confirm Password *" value={formData.confirmPassword} onChangeText={t => setFormData({ ...formData, confirmPassword: t })} error={errors.confirmPassword} showPassword={showConfirmPassword} onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} onBlur={() => { if (!formData.confirmPassword) setErrors(p => ({ ...p, confirmPassword: 'Please confirm your password' })); else if (formData.confirmPassword !== formData.password) setErrors(p => ({ ...p, confirmPassword: 'Passwords do not match' })); else setErrors(p => ({ ...p, confirmPassword: '' })); }} editable={!loading} />
                        <div style={stepContentStyles.reqCard}>
                            <div style={stepContentStyles.reqTitle}>Password Requirements</div>
                            <div style={stepContentStyles.reqRow}>
                                {formData.password.length >= 8 ? <IoCheckmarkCircleOutline size={16} color={C.green} /> : <FiRefreshCw size={16} color={C.mutedLight} />}
                                <span style={{ ...stepContentStyles.reqText, ...(formData.password.length >= 8 && stepContentStyles.reqTextMet) }}>At least 8 characters long</span>
                            </div>
                            <div style={stepContentStyles.reqRow}>
                                {formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? <IoCheckmarkCircleOutline size={16} color={C.green} /> : <FiRefreshCw size={16} color={C.mutedLight} />}
                                <span style={{ ...stepContentStyles.reqText, ...(formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 && stepContentStyles.reqTextMet) }}>Passwords match</span>
                            </div>
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <div style={stepContentStyles.stepIntro}>
                            <div style={{ ...stepContentStyles.stepIco, backgroundColor: C.greenSoft }}><IoDocumentTextOutline size={20} color={C.green} /></div>
                            <div><div style={stepContentStyles.stepTitle}>Terms & Conditions</div><div style={stepContentStyles.stepSub}>Please review and accept before submitting</div></div>
                        </div>
                        <div style={stepContentStyles.termsBox}>
                            <div style={stepContentStyles.termsScroll}>
                                {[
                                    { bold: 'Account Creation:', text: 'By registering, you confirm that all information provided is accurate and verifiable.' },
                                    { bold: 'Eligibility:', text: 'You must maintain active employment with the Department of Justice and Constitutional Development.' },
                                    { bold: 'Verification:', text: 'Your registration is subject to verification against departmental records.' },
                                    { bold: 'Data Privacy:', text: 'Your personal information will be used solely for account verification and device allocation purposes.' },
                                    { bold: 'Communications:', text: 'You agree to receive email and SMS notifications regarding your account status and device requests.' },
                                    { bold: 'Account Security:', text: 'You are responsible for maintaining the confidentiality of your login credentials.' },
                                    { bold: 'Device Usage:', text: 'Approved devices must be used for official departmental work only.' },
                                ].map((t, i) => (
                                    <div key={i} style={stepContentStyles.termItem}>
                                        <div style={stepContentStyles.termDot} />
                                        <div style={stepContentStyles.termText}><strong>{t.bold}</strong> {t.text}</div>
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
        <div style={{ minHeight: '100vh', backgroundColor: C.navy, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={headerStyles.wrap}>
                <div style={headerStyles.ring} />
                <button style={headerStyles.backBtn} onClick={() => navigate(-1)}><IoArrowBack size={22} /></button>
                <div style={headerStyles.titleRow}>
                    <div style={headerStyles.emblem}><span style={{ fontSize: 26 }}>⚖️</span></div>
                    <div>
                        <div style={headerStyles.title}>Client Registration</div>
                        <div style={headerStyles.sub}>Create your account to request devices</div>
                    </div>
                </div>
                <StepBar current={currentStep} total={totalSteps} />
            </div>

            {/* Form area */}
            <div style={{ flex: 1, backgroundColor: C.bg, overflowY: 'auto', padding: '20px' }}>
                <div style={stepContentStyles.formCard}>
                    {renderStep()}
                </div>

                {/* Navigation buttons */}
                <div style={navStyles.row}>
                    {currentStep > 1 && (
                        <button style={navStyles.back} onClick={handlePrevStep} disabled={loading}>
                            <IoArrowBack size={18} /> <span>Back</span>
                        </button>
                    )}
                    {currentStep < totalSteps ? (
                        <button style={{ ...navStyles.next, ...(currentStep === 1 && navStyles.nextFull) }} onClick={handleNextStep} disabled={loading}>
                            <span>Continue</span> <IoArrowForward size={18} />
                        </button>
                    ) : (
                        <button style={{ ...navStyles.submit, ...(loading && navStyles.submitLoading) }} onClick={handleRegister} disabled={loading}>
                            {loading ? (
                                <><div className="spinner-small" style={spinnerStyle} /><span>Creating Account…</span></>
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

            <style>{`
                .spinner-small {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

// Styles objects (header, stepContent, nav)
const headerStyles = {
    wrap: { backgroundColor: C.navy, paddingTop: 12, paddingBottom: 20, paddingLeft: 20, paddingRight: 20, position: 'relative', overflow: 'hidden' },
    ring: { position: 'absolute', width: 240, height: 240, borderRadius: 120, border: '1px solid rgba(255,255,255,0.05)', top: -80, right: -60 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: 'none', cursor: 'pointer', marginBottom: 16, color: 'rgba(255,255,255,0.9)' },
    titleRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 },
    emblem: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 3 },
    sub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
};

const stepContentStyles = {
    formCard: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 16, border: `1px solid ${C.border}`, boxShadow: '0 3px 10px rgba(15,31,61,0.06)' },
    stepIntro: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` },
    stepIco: { width: 42, height: 42, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    stepTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 2 },
    stepSub: { fontSize: 12, color: C.muted },
    typeRow: { display: 'flex', gap: 10 },
    typeBtn: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '13px 0', borderRadius: 14, border: `1.5px solid ${C.border}`, backgroundColor: C.bg, cursor: 'pointer' },
    typeBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
    typeBtnText: { fontSize: 15, fontWeight: '600', color: C.muted },
    typeBtnTextActive: { color: '#fff' },
    reqCard: { backgroundColor: C.bg, borderRadius: 14, padding: 16, border: `1px solid ${C.border}`, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 },
    reqTitle: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 4 },
    reqRow: { display: 'flex', alignItems: 'center', gap: 10 },
    reqText: { fontSize: 13, color: C.mutedLight },
    reqTextMet: { color: C.green, fontWeight: '600' },
    termsBox: { borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 14 },
    termsScroll: { maxHeight: 240, padding: 16, backgroundColor: C.bg, overflowY: 'auto' },
    termItem: { display: 'flex', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
    termDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 6, flexShrink: 0 },
    termText: { flex: 1, fontSize: 12, color: C.muted, lineHeight: 1.5 },
    acceptBanner: { display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: C.greenSoft, borderRadius: 14, padding: 14, border: `1px solid ${C.green}50` },
    acceptText: { flex: 1, fontSize: 13, color: '#065F46', lineHeight: 1.5, fontWeight: '500' },
};

const navStyles = {
    row: { display: 'flex', gap: 12, marginBottom: 16 },
    back: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '15px 0', borderRadius: 16, border: `1.5px solid ${C.navy}`, backgroundColor: C.surface, cursor: 'pointer', fontWeight: '700', color: C.navy },
    next: { flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: C.navy, padding: '16px 0', borderRadius: 16, boxShadow: '0 5px 10px rgba(15,31,61,0.25)', cursor: 'pointer', color: '#fff', fontWeight: '700' },
    nextFull: { flex: 1 },
    submit: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: C.green, padding: '16px 0', borderRadius: 16, boxShadow: '0 5px 10px rgba(5,150,105,0.25)', cursor: 'pointer', color: '#fff', fontWeight: '700' },
    submitLoading: { backgroundColor: C.disabled, boxShadow: 'none', cursor: 'not-allowed' },
    loginLink: { width: '100%', textAlign: 'center', padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer' },
    loginText: { fontSize: 14, color: C.muted },
};

const spinnerStyle = {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: 8,
};
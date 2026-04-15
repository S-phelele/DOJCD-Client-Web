// screens/Auth/LoginScreen.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoMailOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmark,
    IoArrowForward,
    IoPersonOutline,
} from 'react-icons/io5';

// Design tokens
const C = {
    navy: '#0F1F3D',
    navyLight: '#1E3A5F',
    accent: '#1E4FD8',
    accentSoft: '#EBF0FF',
    surface: '#FFFFFF',
    bg: '#F4F6FA',
    border: '#E2E8F2',
    text: '#0F1F3D',
    muted: '#64748B',
    error: '#DC2626',
    errorSoft: '#FEF2F2',
    success: '#059669',
};

export default function LoginScreen() {
    const toast = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [focused, setFocused] = useState(null);

    const validate = () => {
        const newErrors = { email: '', password: '' };
        let ok = true;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
            ok = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Enter a valid email address';
            ok = false;
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
            ok = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'At least 6 characters required';
            ok = false;
        }
        setErrors(newErrors);
        return ok;
    };

    const handleLogin = async () => {
        if (!validate()) {
            toast.warning('Please fix the errors before continuing');
            return;
        }
        setLoading(true);
        setErrors({ email: '', password: '' });
        try {
            console.log('🔵 [LOGIN] Attempting login for:', formData.email);
            const response = await authAPI.login({ email: formData.email, password: formData.password });
            const body = response;

            if (!body.success) {
                toast.error('Login Failed', body.message);
                return;
            }

            const user = body.data?.user;
            if (!user) throw new Error('No user data received from server');

            localStorage.setItem('user', JSON.stringify(user));

            if (formData.rememberMe) {
                localStorage.setItem('rememberedEmail', formData.email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }

            toast.success('Welcome back!', body.message || 'Login successful');

            setTimeout(() => {
                const userType = user.user_type || null;
                if (userType === 'client') {
                    navigate('/client-dashboard', { replace: true });
                } else if (userType === 'operational' && user.user_role === 'Admin') {
                    navigate('/admin-dashboard', { replace: true });
                } else {
                    toast.warning('Access Restricted', "Your role doesn't have mobile access yet.");
                }
            }, 900);
        } catch (error) {
            console.error('🔴 [LOGIN] Error:', error);
            const status = error.response?.status;
            const message = error.response?.data?.message;
            if (!error.response) {
                toast.error('Connection Error', 'Cannot connect to server. Check your connection.');
            } else if (status === 401) {
                toast.error('Login Failed', message || 'Invalid credentials. Please try again.');
            } else if (status === 404) {
                toast.error('Account Not Found', message || 'No account found with this email.');
            } else {
                toast.error('Login Failed', message || 'Invalid email or password.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Styles as plain object
    const styles = {
        root: { minHeight: '100vh', backgroundColor: C.navy, display: 'flex', flexDirection: 'column' },
        hero: { backgroundColor: C.navy, paddingTop: 60, paddingBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' },
        ring1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, border: '1px solid rgba(255,255,255,0.05)', top: -60, right: -60 },
        ring2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, border: '1px solid rgba(255,255,255,0.07)', bottom: 20, left: -50 },
        emblemOuter: { boxShadow: '0 8px 20px rgba(201,168,76,0.35)', marginBottom: 20 },
        emblem: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
        heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 1.5, marginBottom: 6 },
        heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: 0.3, paddingHorizontal: 40, marginBottom: 16 },
        badge: { display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: '6px 14px', borderRadius: 20 },
        badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 7 },
        badgeText: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 0.5 },
        card: { backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: '36px 28px 24px', flex: 1 },
        cardTitle: { fontSize: 26, fontWeight: '800', color: C.text, marginBottom: 4 },
        cardSub: { fontSize: 14, color: C.muted, marginBottom: 32 },
        fieldWrap: { marginBottom: 20 },
        label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 8 },
        inputRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', border: `1.5px solid ${C.border}`, borderRadius: 14, backgroundColor: C.bg },
        inputFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF' },
        inputError: { borderColor: C.error, backgroundColor: C.errorSoft },
        icoL: { marginLeft: 14, marginRight: 4 },
        input: { flex: 1, padding: '14px 8px', fontSize: 15, color: C.text, border: 'none', background: 'transparent', outline: 'none' },
        eyeBtn: { paddingHorizontal: 14, cursor: 'pointer' },
        errText: { fontSize: 11, color: C.error, marginTop: 5, marginLeft: 4 },
        remRow: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
        remBtn: { display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer' },
        checkBox: { width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: C.bg },
        checkBoxOn: { backgroundColor: C.accent, borderColor: C.accent },
        remLabel: { fontSize: 14, color: C.text },
        forgotText: { fontSize: 14, color: C.accent, fontWeight: '600', cursor: 'pointer' },
        submitBtn: { display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy, borderRadius: 16, paddingVertical: 17, boxShadow: '0 6px 12px rgba(15,31,61,0.28)', marginBottom: 28, cursor: 'pointer', border: 'none', width: '100%' },
        submitDisabled: { backgroundColor: '#94A3B8', boxShadow: 'none', cursor: 'not-allowed' },
        submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
        divider: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
        divLine: { flex: 1, height: 1, backgroundColor: C.border },
        divText: { paddingHorizontal: 14, fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.2 },
        regRow: { display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 8 },
        regCard: { flex: 1, border: `1.5px solid ${C.accent}50`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: C.bg, cursor: 'pointer' },
        regIco: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
        regTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2, color: C.accent },
        regSub: { fontSize: 11, color: C.muted, textAlign: 'center' },
        footer: { backgroundColor: C.surface, paddingVertical: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', borderTop: `1px solid ${C.border}` },
        footerText: { fontSize: 12, color: C.muted, marginBottom: 4 },
        footerVersion: { fontSize: 10, color: '#B0BCCF', letterSpacing: 0.5 },
        spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    };

    return (
        <div style={styles.root}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Hero */}
                <div style={styles.hero}>
                    <div style={styles.ring1} />
                    <div style={styles.ring2} />
                    <div style={styles.emblemOuter}>
                        <div style={styles.emblem}><span style={{ fontSize: 38 }}>⚖️</span></div>
                    </div>
                    <div style={styles.heroTitle}>DOJCD Connect</div>
                    <div style={styles.heroSub}>Department of Justice & Constitutional Development</div>
                    <div style={styles.badge}>
                        <div style={styles.badgeDot} />
                        <span style={styles.badgeText}>Secure Portal</span>
                    </div>
                </div>

                {/* Card */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Sign In</div>
                    <div style={styles.cardSub}>Enter your credentials to continue</div>

                    {/* Email field */}
                    <div style={styles.fieldWrap}>
                        <div style={styles.label}>EMAIL ADDRESS</div>
                        <div style={{
                            ...styles.inputRow,
                            ...(focused === 'email' && styles.inputFocused),
                            ...(errors.email && styles.inputError)
                        }}>
                            <IoMailOutline size={18} color={errors.email ? C.error : focused === 'email' ? C.accent : C.muted} style={styles.icoL} />
                            <input
                                type="email"
                                style={styles.input}
                                placeholder="your.email@dojcd.gov.za"
                                autoCapitalize="off"
                                autoCorrect="off"
                                value={formData.email}
                                onFocus={() => setFocused('email')}
                                onBlur={() => setFocused(null)}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (errors.email) setErrors({ ...errors, email: '' });
                                }}
                                disabled={loading}
                            />
                        </div>
                        {errors.email && <div style={styles.errText}>{errors.email}</div>}
                    </div>

                    {/* Password field */}
                    <div style={styles.fieldWrap}>
                        <div style={styles.label}>PASSWORD</div>
                        <div style={{
                            ...styles.inputRow,
                            ...(focused === 'pass' && styles.inputFocused),
                            ...(errors.password && styles.inputError)
                        }}>
                            <IoLockClosedOutline size={18} color={errors.password ? C.error : focused === 'pass' ? C.accent : C.muted} style={styles.icoL} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                style={styles.input}
                                placeholder="Enter your password"
                                value={formData.password}
                                onFocus={() => setFocused('pass')}
                                onBlur={() => setFocused(null)}
                                onChange={(e) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (errors.password) setErrors({ ...errors, password: '' });
                                }}
                                disabled={loading}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                {showPassword ? <IoEyeOffOutline size={20} color={C.muted} /> : <IoEyeOutline size={20} color={C.muted} />}
                            </button>
                        </div>
                        {errors.password && <div style={styles.errText}>{errors.password}</div>}
                    </div>

                    {/* Remember / Forgot */}
                    <div style={styles.remRow}>
                        <button type="button" style={styles.remBtn} onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}>
                            <div style={{ ...styles.checkBox, ...(formData.rememberMe && styles.checkBoxOn) }}>
                                {formData.rememberMe && <IoCheckmark size={12} color="#fff" />}
                            </div>
                            <span style={styles.remLabel}>Remember me</span>
                        </button>
                        <button type="button" style={styles.forgotText} onClick={() => toast.info('Coming Soon', 'Password reset will be available soon.')}>
                            Forgot password?
                        </button>
                    </div>

                    {/* Submit */}
                    <button type="button" style={{ ...styles.submitBtn, ...(loading && styles.submitDisabled) }} onClick={handleLogin} disabled={loading}>
                        {loading ? (
                            <div className="login-spinner" style={styles.spinner} />
                        ) : (
                            <>
                                <span style={styles.submitText}>Sign In</span>
                                <IoArrowForward size={18} color="#fff" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div style={styles.divider}>
                        <div style={styles.divLine} />
                        <span style={styles.divText}>NEW USER?</span>
                        <div style={styles.divLine} />
                    </div>

                    {/* Register cards */}
                    <div style={styles.regRow}>
                        <button type="button" style={styles.regCard} onClick={() => navigate('/client-register')} disabled={loading}>
                            <div style={styles.regIco}><IoPersonOutline size={22} color={C.accent} /></div>
                            <span style={styles.regTitle}>Client</span>
                            <span style={styles.regSub}>Device requests</span>
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <span style={styles.footerText}>support@dojcd.gov.za</span>
                    <span style={styles.footerVersion}>v1.0.0 • Republic of South Africa</span>
                </div>
            </div>

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
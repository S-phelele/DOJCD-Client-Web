// screens/Auth/LoginScreen.jsx
// Updated: PublicFooter added at the bottom.
// All original form logic preserved exactly.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import {
    IoMailOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoCheckmark,
    IoArrowForward,
    IoPersonOutline,
    IoShieldCheckmarkOutline,
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
    error:      '#DC2626',
    errorSoft:  '#FEF2F2',
    green:      '#059669',
};

export default function LoginScreen() {
    const toast    = useToast();
    const navigate = useNavigate();

    const [formData,     setFormData]     = useState({ email: '', password: '', rememberMe: false });
    const [loading,      setLoading]      = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors,       setErrors]       = useState({ email: '', password: '' });
    const [focused,      setFocused]      = useState(null);

    const validate = () => {
        const e = { email: '', password: '' };
        let ok = true;
        if (!formData.email.trim()) { e.email = 'Email is required'; ok = false; }
        else if (!/\S+@\S+\.\S+/.test(formData.email)) { e.email = 'Enter a valid email address'; ok = false; }
        if (!formData.password) { e.password = 'Password is required'; ok = false; }
        else if (formData.password.length < 6) { e.password = 'At least 6 characters required'; ok = false; }
        setErrors(e);
        return ok;
    };

    const handleLogin = async () => {
        if (!validate()) { toast.warning('Please fix the errors before continuing'); return; }
        setLoading(true);
        setErrors({ email: '', password: '' });
        try {
            const response = await authAPI.login({ email: formData.email, password: formData.password });
            const body = response;
            if (!body.success) { toast.error('Login Failed', body.message); return; }
            const user = body.data?.user;
            if (!user) throw new Error('No user data received from server');
            localStorage.setItem('user', JSON.stringify(user));
            if (formData.rememberMe) localStorage.setItem('rememberedEmail', formData.email);
            else localStorage.removeItem('rememberedEmail');
            toast.success('Welcome back!', body.message || 'Login successful');
            setTimeout(() => {
                if (user.user_type === 'client') navigate('/client-dashboard', { replace: true });
                else if (user.user_type === 'operational' && user.user_role === 'Admin') navigate('/admin-dashboard', { replace: true });
                else toast.warning('Access Restricted', "Your role doesn't have access yet.");
            }, 900);
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message;
            if (!error.response) toast.error('Connection Error', 'Cannot connect to server.');
            else if (status === 401) toast.error('Login Failed', message || 'Invalid credentials.');
            else if (status === 404) toast.error('Account Not Found', message || 'No account found with this email.');
            else toast.error('Login Failed', message || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
            <PublicNavbar />

            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
                .login-card { animation: slideUp 0.35s ease both; }
            `}</style>

            {/* Slim navy top banner */}
            <div style={S.banner}>
                <div style={S.bannerRing1} />
                <div style={S.bannerRing2} />
                <div style={S.bannerContent}>
                    <div style={S.bannerEmblem}><span style={{ fontSize: 28 }}>⚖️</span></div>
                    <div>
                        <h1 style={S.bannerTitle}>Welcome Back</h1>
                        <p style={S.bannerSub}>Sign in to your DOJCD Connect account</p>
                    </div>
                    <div style={S.secureBadge}>
                        <div style={S.secureDot} />
                        <span style={S.secureText}>Secure Portal</span>
                    </div>
                </div>
            </div>

            {/* Form area — grows to fill available space */}
            <div style={{ flex: 1 }}>
                <div style={S.pageBody}>
                    <div className="login-card" style={S.card}>
                        <h2 style={S.cardTitle}>Sign In</h2>
                        <p style={S.cardSub}>Enter your credentials to continue</p>

                        {/* Email */}
                        <div style={S.fieldWrap}>
                            <label style={S.label}>EMAIL ADDRESS</label>
                            <div style={{ ...S.inputRow, ...(focused === 'email' ? S.inputFocused : {}), ...(errors.email ? S.inputError : {}) }}>
                                <IoMailOutline size={18} color={errors.email ? C.error : focused === 'email' ? C.accent : C.muted} style={S.icoL} />
                                <input
                                    type="email" style={S.input}
                                    placeholder="your.email@dojcd.gov.za"
                                    autoCapitalize="off" value={formData.email}
                                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                                    onChange={e => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                                    disabled={loading}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                />
                            </div>
                            {errors.email && <div style={S.errText}>{errors.email}</div>}
                        </div>

                        {/* Password */}
                        <div style={S.fieldWrap}>
                            <label style={S.label}>PASSWORD</label>
                            <div style={{ ...S.inputRow, ...(focused === 'pass' ? S.inputFocused : {}), ...(errors.password ? S.inputError : {}) }}>
                                <IoLockClosedOutline size={18} color={errors.password ? C.error : focused === 'pass' ? C.accent : C.muted} style={S.icoL} />
                                <input
                                    type={showPassword ? 'text' : 'password'} style={S.input}
                                    placeholder="Enter your password" value={formData.password}
                                    onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                                    onChange={e => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }); }}
                                    disabled={loading}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={S.eyeBtn}>
                                    {showPassword ? <IoEyeOffOutline size={20} color={C.muted} /> : <IoEyeOutline size={20} color={C.muted} />}
                                </button>
                            </div>
                            {errors.password && <div style={S.errText}>{errors.password}</div>}
                        </div>

                        {/* Remember / Forgot */}
                        <div style={S.remRow}>
                            <button type="button" style={S.remBtn} onClick={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}>
                                <div style={{ ...S.checkBox, ...(formData.rememberMe ? S.checkBoxOn : {}) }}>
                                    {formData.rememberMe && <IoCheckmark size={12} color="#fff" />}
                                </div>
                                <span style={S.remLabel}>Remember me</span>
                            </button>
                            <button type="button" style={S.forgotText} onClick={() => toast.info('Coming Soon', 'Password reset coming soon.')}>
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit */}
                        <button type="button" style={{ ...S.submitBtn, ...(loading ? S.submitDisabled : {}) }} onClick={handleLogin} disabled={loading}>
                            {loading ? (
                                <div style={S.spinner} />
                            ) : (
                                <>
                                    <span style={S.submitText}>Sign In</span>
                                    <IoArrowForward size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div style={S.divider}>
                            <div style={S.divLine} />
                            <span style={S.divText}>NEW USER?</span>
                            <div style={S.divLine} />
                        </div>

                        {/* Register card */}
                        <button type="button" style={S.regCard} onClick={() => navigate('/client-register')} disabled={loading}>
                            <div style={S.regIco}><IoPersonOutline size={22} color={C.accent} /></div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={S.regTitle}>Register as Client</div>
                                <div style={S.regSub}>Request and track devices</div>
                            </div>
                            <IoArrowForward size={16} color={C.accent} />
                        </button>
                    </div>

                    {/* Trust indicators */}
                    <div style={S.trustRow}>
                        {[
                            { icon: IoShieldCheckmarkOutline, text: 'Secure Authentication' },
                            { icon: IoLockClosedOutline,       text: 'Encrypted Connection' },
                        ].map((t, i) => {
                            const Icon = t.icon;
                            return (
                                <div key={i} style={S.trustItem}>
                                    <Icon size={13} color={C.muted} />
                                    <span style={S.trustText}>{t.text}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Shared footer */}
            <PublicFooter />
        </div>
    );
}

const S = {
    banner: { backgroundColor: C.navy, padding: '28px 20px 28px', position: 'relative', overflow: 'hidden' },
    bannerRing1: { position: 'absolute', width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -80, right: -60 },
    bannerRing2: { position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: -50, left: -50 },
    bannerContent: { maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap' },
    bannerEmblem:  { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    bannerTitle:   { fontSize: 22, fontWeight: '800', color: '#fff', margin: '0 0 3px' },
    bannerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 },
    secureBadge:   { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '6px 12px', borderRadius: 20 },
    secureDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
    secureText:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

    pageBody:  { maxWidth: 560, margin: '0 auto', padding: '32px 20px 40px' },
    card:      { backgroundColor: C.surface, borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(15,31,61,0.08)', border: `1px solid ${C.border}`, marginBottom: 20 },
    cardTitle: { fontSize: 24, fontWeight: '800', color: C.text, margin: '0 0 4px' },
    cardSub:   { fontSize: 14, color: C.muted, marginBottom: 28 },

    fieldWrap: { marginBottom: 18 },
    label:     { display: 'block', fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.2, marginBottom: 8 },
    inputRow:  { display: 'flex', alignItems: 'center', border: `1.5px solid ${C.border}`, borderRadius: 12, backgroundColor: C.bg },
    inputFocused: { borderColor: C.accent, backgroundColor: '#FAFBFF' },
    inputError:   { borderColor: C.error, backgroundColor: C.errorSoft },
    icoL:  { marginLeft: 14, marginRight: 4, flexShrink: 0 },
    input: { flex: 1, padding: '14px 8px', fontSize: 15, color: C.text, border: 'none', background: 'transparent', outline: 'none' },
    eyeBtn:{ paddingLeft: 10, paddingRight: 14, cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center' },
    errText:{ fontSize: 11, color: C.error, marginTop: 5, marginLeft: 4 },

    remRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    remBtn:    { display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'none', border: 'none', padding: 0 },
    checkBox:  { width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginRight: 10, backgroundColor: C.bg },
    checkBoxOn:{ backgroundColor: C.accent, borderColor: C.accent },
    remLabel:  { fontSize: 13, color: C.muted },
    forgotText:{ fontSize: 13, color: C.accent, fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' },

    submitBtn:     { display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy, borderRadius: 12, padding: '15px', border: 'none', width: '100%', cursor: 'pointer', marginBottom: 24, boxShadow: '0 6px 14px rgba(15,31,61,0.25)' },
    submitDisabled:{ opacity: 0.6, cursor: 'not-allowed' },
    submitText:    { color: '#fff', fontSize: 15, fontWeight: '700' },
    spinner:       { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

    divider:  { display: 'flex', alignItems: 'center', marginBottom: 18 },
    divLine:  { flex: 1, height: 1, backgroundColor: C.border },
    divText:  { padding: '0 14px', fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.2 },

    regCard:  { display: 'flex', alignItems: 'center', gap: 14, width: '100%', border: `1.5px solid ${C.accent}50`, borderRadius: 14, padding: '13px 16px', backgroundColor: C.bg, cursor: 'pointer' },
    regIco:   { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    regTitle: { fontSize: 14, fontWeight: '700', color: C.accent, marginBottom: 2 },
    regSub:   { fontSize: 11, color: C.muted },

    trustRow:   { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 8 },
    trustItem:  { display: 'flex', alignItems: 'center', gap: 5 },
    trustText:  { fontSize: 11, color: C.mutedLight },
};
// screens/Auth/LoginScreen.jsx
// Updated: PublicFooter added at the bottom.
// All original form logic preserved exactly.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuthConfig } from '../../services/useAuthConfig';
import { microsoftSignInUrl } from '../../services/authConfig';
import { saveClientSession } from '../../services/session';
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
} from 'react-icons/io5';
import dojLogo from '../../assets/images/Department-of-Justice-logo.jpg';

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
    const { config } = useAuthConfig();
    const usesDomainAccount = config.provider === 'ldap';
    // With Microsoft sign-in the email/password form is only for clients who registered here (when that is allowed).
    const showPasswordForm = config.loginMethod !== 'microsoft' || config.selfRegistration;
    const directoryWithRegistration = config.directory && config.selfRegistration;

    const [formData,     setFormData]     = useState({ email: '', password: '', rememberMe: false });
    const [loading,      setLoading]      = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors,       setErrors]       = useState({ email: '', password: '' });
    const [focused,      setFocused]      = useState(null);

    const validate = () => {
        const e = { email: '', password: '' };
        let ok = true;
        if (!formData.email.trim()) { e.email = usesDomainAccount ? 'Username or email is required' : 'Email is required'; ok = false; }
        else if (!usesDomainAccount && !/\S+@\S+\.\S+/.test(formData.email)) { e.email = 'Enter a valid email address'; ok = false; }
        if (!formData.password) { e.password = 'Password is required'; ok = false; }
        // The directory decides what a valid password is; only our own passwords have a minimum length here.
        else if (!usesDomainAccount && formData.password.length < 6) { e.password = 'At least 6 characters required'; ok = false; }
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
            const accessToken  = body.data?.accessToken;
            const refreshToken = body.data?.refreshToken;
            if (!user) throw new Error('No user data received from server');
            saveClientSession({ user, accessToken, refreshToken });
            if (formData.rememberMe) localStorage.setItem('rememberedEmail', formData.email);
            else localStorage.removeItem('rememberedEmail');
            toast.success('Welcome back!', body.message || 'Login successful');
            setTimeout(() => navigate('/client-dashboard', { replace: true }), 900);
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
                    <div style={S.bannerEmblem}><img src={dojLogo} alt="DoJ&CD" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block' }} /></div>
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
                        <p style={S.cardSub}>{config.loginMethod === 'microsoft'
                            ? (config.selfRegistration ? 'Use your organisation account, or the account you registered' : 'Use your organisation account to continue')
                            : 'Enter your credentials to continue'}</p>

                        {config.loginMethod === 'microsoft' && (
                            <a href={microsoftSignInUrl()} style={S.msBtn}>
                                <span aria-hidden style={S.msLogo}>
                                    <i style={{ ...S.msSq, background: '#F25022' }} /><i style={{ ...S.msSq, background: '#7FBA00' }} />
                                    <i style={{ ...S.msSq, background: '#00A4EF' }} /><i style={{ ...S.msSq, background: '#FFB900' }} />
                                </span>
                                Sign in with Microsoft
                            </a>
                        )}
                        {config.loginMethod === 'microsoft' && config.selfRegistration && (
                            <div style={S.divider}>
                                <div style={S.divLine} />
                                <span style={S.divText}>OR USE A REGISTERED ACCOUNT</span>
                                <div style={S.divLine} />
                            </div>
                        )}
                        {showPasswordForm && (
                        <>
                        {/* Wrapping in <form> lets the browser offer "Save password?" on success */}
                        <form onSubmit={e => { e.preventDefault(); handleLogin(); }} autoComplete="on">

                        {/* Email */}
                        <div style={S.fieldWrap}>
                            <label style={S.label}>{usesDomainAccount ? 'USERNAME OR EMAIL' : 'EMAIL ADDRESS'}</label>
                            <div style={{ ...S.inputRow, ...(focused === 'email' ? S.inputFocused : {}), ...(errors.email ? S.inputError : {}) }}>
                                <IoMailOutline size={18} color={errors.email ? C.error : focused === 'email' ? C.accent : C.muted} style={S.icoL} />
                                <input
                                    type={usesDomainAccount ? 'text' : 'email'} name="email" autoComplete={usesDomainAccount ? 'username' : 'email'}
                                    style={S.input}
                                    placeholder={usesDomainAccount ? 'username, email or DOMAIN\\username' : 'your.email@dojcd.gov.za'}
                                    autoCapitalize="off" value={formData.email}
                                    onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                                    onChange={e => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                                    disabled={loading}
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
                                    type={showPassword ? 'text' : 'password'}
                                    name="password" autoComplete="current-password"
                                    style={S.input}
                                    placeholder="Enter your password" value={formData.password}
                                    onFocus={() => setFocused('pass')} onBlur={() => setFocused(null)}
                                    onChange={e => { setFormData({ ...formData, password: e.target.value }); if (errors.password) setErrors({ ...errors, password: '' }); }}
                                    disabled={loading}
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
                            {config.passwordManagedLocally && (
                                <button type="button" style={S.forgotText} onClick={() => toast.info('Coming Soon', 'Password reset coming soon.')}>
                                    Forgot password?
                                </button>
                            )}
                        </div>

                        {/* Submit — type="submit" triggers the browser password-save prompt */}
                        <button type="submit" style={{ ...S.submitBtn, ...(loading ? S.submitDisabled : {}) }} disabled={loading}>
                            {loading ? (
                                <div style={S.spinner} />
                            ) : (
                                <>
                                    <span style={S.submitText}>Sign In</span>
                                    <IoArrowForward size={18} color="#fff" style={{ marginLeft: 8 }} />
                                </>
                            )}
                        </button>

                        </form>
                        </>
                        )}

                        {config.selfRegistration ? (
                            <>
                                {/* Divider */}
                                <div style={S.divider}>
                                    <div style={S.divLine} />
                                    <span style={S.divText}>{directoryWithRegistration ? 'NOT IN THE DIRECTORY?' : 'NEW USER?'}</span>
                                    <div style={S.divLine} />
                                </div>

                                {/* Register card */}
                                <button type="button" style={S.regCard} onClick={() => navigate('/client-register')} disabled={loading}>
                                    <div style={S.regIco}><IoPersonOutline size={22} color={C.accent} /></div>
                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                        <div style={S.regTitle}>Register as Client</div>
                                        <div style={S.regSub}>{directoryWithRegistration ? 'For clients without an organisation account' : 'Request and track devices'}</div>
                                    </div>
                                    <IoArrowForward size={16} color={C.accent} />
                                </button>
                            </>
                        ) : (
                            <p style={S.noRegister}>
                                First time here? There is nothing to register: sign in with your organisation account and your
                                DOJCD Connect profile is created for you.
                            </p>
                        )}
                    </div>

                    {/* Trust indicators */}
                    <div style={S.trustRow}>
                        {[
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
    banner: { background: 'linear-gradient(135deg, #0D1B35 0%, #0F1F3D 100%)', padding: '28px 24px', position: 'relative', overflow: 'hidden' },
    bannerRing1: { position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: -100, right: -80 },
    bannerRing2: { position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', bottom: -60, left: -60 },
    bannerContent: { maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap' },
    bannerEmblem:  { width: 56, height: 56, borderRadius: 16, backgroundColor: '#fff', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.25)', overflow: 'hidden' },
    bannerTitle:   { fontSize: 24, fontWeight: '800', color: '#fff', margin: '0 0 3px', letterSpacing: '-0.3px' },
    bannerSub:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 },
    secureBadge:   { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', padding: '6px 12px', borderRadius: 20 },
    secureDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80', boxShadow: '0 0 6px rgba(74,222,128,0.5)' },
    secureText:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

    pageBody:  { maxWidth: 560, margin: '0 auto', padding: '36px 20px 48px' },
    card:      { backgroundColor: C.surface, borderRadius: 22, padding: '36px 32px', boxShadow: '0 8px 32px rgba(15,31,61,0.1)', border: `1px solid ${C.border}`, marginBottom: 20 },
    cardTitle: { fontSize: 26, fontWeight: '800', color: C.text, margin: '0 0 5px', letterSpacing: '-0.3px' },
    cardSub:   { fontSize: 14, color: C.muted, marginBottom: 30 },

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

    submitBtn:     { display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #0F1F3D 0%, #1E3A5F 100%)', borderRadius: 14, padding: '16px', border: 'none', width: '100%', cursor: 'pointer', marginBottom: 24, boxShadow: '0 6px 18px rgba(15,31,61,0.3)', transition: 'opacity 0.15s, transform 0.15s' },
    submitDisabled:{ opacity: 0.6, cursor: 'not-allowed' },
    submitText:    { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: '0.2px' },
    spinner:       { width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },

    divider:  { display: 'flex', alignItems: 'center', marginBottom: 18 },
    divLine:  { flex: 1, height: 1, backgroundColor: C.border },
    divText:  { padding: '0 14px', fontSize: 10, color: C.muted, fontWeight: '700', letterSpacing: 1.2 },

    regCard:  { display: 'flex', alignItems: 'center', gap: 14, width: '100%', border: `1.5px solid ${C.accent}50`, borderRadius: 14, padding: '13px 16px', backgroundColor: C.bg, cursor: 'pointer' },
    regIco:   { width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    regTitle: { fontSize: 14, fontWeight: '700', color: C.accent, marginBottom: 2 },
    regSub:   { fontSize: 11, color: C.muted },

    msBtn:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', boxSizing: 'border-box', padding: '15px', border: `1.5px solid ${C.border}`, borderRadius: 14, backgroundColor: C.surface, color: C.text, fontSize: 15, fontWeight: '700', textDecoration: 'none', cursor: 'pointer', marginBottom: 24 },
    msLogo:  { display: 'grid', gridTemplateColumns: '10px 10px', gap: 2 },
    msSq:    { display: 'block', width: 10, height: 10 },
    noRegister: { fontSize: 12, color: C.muted, lineHeight: 1.6, textAlign: 'center', margin: 0 },

    trustRow:   { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 8 },
    trustItem:  { display: 'flex', alignItems: 'center', gap: 5 },
    trustText:  { fontSize: 11, color: C.mutedLight },
};
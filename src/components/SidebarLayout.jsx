// components/SidebarLayout.jsx
// Key fixes:
//  1. Sidebar is position:sticky / fixed — never scrolls with content.
//  2. Notifications bell navigates to /notifications (dedicated page).
//  3. Logout uses ConfirmDialog instead of window.confirm.
//  4. Tablet mini-sidebar no longer shifts content when hovering.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmDialog from './ConfirmDialog';
import {
    IoGridOutline,
    IoPhonePortraitOutline,
    IoDocumentTextOutline,
    IoPersonOutline,
    IoNotificationsOutline,
    IoLogOutOutline,
    IoMenuOutline,
    IoCloseOutline,
    IoChevronForward,
} from 'react-icons/io5';

// ─── Design tokens ────────────────────────────────────────────────────────
export const C = {
    navy:        '#0F1F3D',
    navyDark:    '#0A1628',
    navyLight:   '#162C4A',
    navyMid:     '#1E3A5F',
    accent:      '#1E4FD8',
    accentSoft:  '#EBF0FF',
    surface:     '#FFFFFF',
    bg:          '#F4F6FA',
    bgAlt:       '#EEF2F8',
    border:      '#E2E8F2',
    text:        '#0F1F3D',
    muted:       '#64748B',
    mutedLight:  '#94A3B8',
    green:       '#059669',
    greenSoft:   '#D1FAE5',
    amber:       '#D97706',
    amberSoft:   '#FEF3C7',
    rose:        '#DC2626',
    roseSoft:    '#FEE2E2',
    slate:       '#64748B',
    slateSoft:   '#F1F5F9',
    white:       '#FFFFFF',
};

const NAV_ITEMS = [
    { key: 'dashboard',     label: 'Dashboard',     path: '/client-dashboard', icon: IoGridOutline },
    { key: 'devices',       label: 'Devices',        path: '/device-catalog',   icon: IoPhonePortraitOutline },
    { key: 'applications',  label: 'Applications',   path: '/my-applications',  icon: IoDocumentTextOutline },
    { key: 'notifications', label: 'Notifications',  path: '/notifications',    icon: IoNotificationsOutline, isBell: true },
    { key: 'profile',       label: 'Profile',        path: '/complete-profile', icon: IoPersonOutline },
];

const SIDEBAR_WIDE = 240;
const SIDEBAR_MINI = 64;

function useWindowWidth() {
    const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
    useEffect(() => {
        const h = () => setW(window.innerWidth);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);
    return w;
}

export default function SidebarLayout({ children, unreadCount = 0, user }) {
    const navigate   = useNavigate();
    const location   = useLocation();
    const width      = useWindowWidth();
    const drawerRef  = useRef(null);

    const isDesktop = width >= 1024;
    const isTablet  = width >= 768 && width < 1024;
    const isMobile  = width < 768;

    const [drawerOpen,   setDrawerOpen]   = useState(false);
    const [miniExpanded, setMiniExpanded] = useState(false);
    const [logoutDialog, setLogoutDialog] = useState(false);

    useEffect(() => { setDrawerOpen(false); setMiniExpanded(false); }, [location.pathname]);

    // Close mini on outside click (tablet)
    useEffect(() => {
        if (!isTablet) return;
        const h = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target))
                setMiniExpanded(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [isTablet]);

    const activeKey = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.key ?? 'dashboard';

    const avatarInitial = user
        ? (user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()
        : 'U';

    const handleNav = (path) => {
        navigate(path);
        setDrawerOpen(false);
        setMiniExpanded(false);
    };

    const handleLogoutRequest = () => {
        setLogoutDialog(true);
        setDrawerOpen(false);
    };

    const doLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('profile_skipped');
        navigate('/login');
    };

    // ── Sidebar content renderer ──────────────────────────────────────────
    const renderSidebarContent = (collapsed = false) => (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Brand */}
            <div style={sb.brand}>
                <div style={sb.brandIcon}>
                    <span style={{ fontSize: collapsed ? 18 : 22 }}>⚖️</span>
                </div>
                {!collapsed && (
                    <div>
                        <div style={sb.brandTitle}>DOJCD</div>
                        <div style={sb.brandSub}>Connect Portal</div>
                    </div>
                )}
            </div>

            {/* User card */}
            {user && !collapsed && (
                <div style={sb.userCard}>
                    <div style={sb.userAvatar}>
                        <span style={sb.userAvatarText}>{avatarInitial}</span>
                        <div style={{ ...sb.userDot, backgroundColor: C.green }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={sb.userName} title={`${user.first_name} ${user.last_name}`}>
                            {user.first_name} {user.last_name}
                        </div>
                        <div style={sb.userRole}>{user.registration_status || 'Client'}</div>
                    </div>
                </div>
            )}
            {user && collapsed && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                    <div style={{ ...sb.userAvatar, width: 34, height: 34 }}>
                        <span style={{ ...sb.userAvatarText, fontSize: 12 }}>{avatarInitial}</span>
                        <div style={{ ...sb.userDot, backgroundColor: C.green }} />
                    </div>
                </div>
            )}

            {/* Nav section label */}
            {!collapsed && <div style={sb.navSection}>MENU</div>}

            {/* Nav items */}
            <nav style={{ flex: 1, padding: collapsed ? '6px 0' : '0 10px', overflowY: 'auto' }}>
                {NAV_ITEMS.map(item => {
                    const Icon   = item.icon;
                    const active = activeKey === item.key;
                    const badge  = item.isBell && unreadCount > 0;
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleNav(item.path)}
                            title={collapsed ? item.label : ''}
                            style={{
                                ...sb.navBtn,
                                ...(collapsed ? sb.navBtnCollapsed : {}),
                                ...(active ? sb.navBtnActive : {}),
                            }}
                        >
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Icon size={18} color={active ? C.white : C.mutedLight} />
                                {badge && (
                                    <div style={sb.badge}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </div>
                            {!collapsed && (
                                <>
                                    <span style={{ ...sb.navLabel, color: active ? C.white : C.mutedLight }}>
                                        {item.label}
                                    </span>
                                    {badge && !active && (
                                        <div style={sb.countPill}>{unreadCount}</div>
                                    )}
                                    {active && <IoChevronForward size={12} color="rgba(255,255,255,0.45)" style={{ marginLeft: 'auto' }} />}
                                </>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Sign out */}
            <div style={collapsed
                ? { padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.07)' }
                : sb.logoutWrap
            }>
                <button
                    onClick={handleLogoutRequest}
                    title={collapsed ? 'Sign Out' : ''}
                    style={{
                        ...sb.logoutBtn,
                        ...(collapsed ? sb.navBtnCollapsed : {}),
                    }}
                >
                    <IoLogOutOutline size={18} color="rgba(220,38,38,0.75)" />
                    {!collapsed && <span style={sb.logoutText}>Sign Out</span>}
                </button>
            </div>
        </div>
    );

    // ── Shared sidebar element styles ─────────────────────────────────────
    const SidebarEl = ({ width: w, style = {}, ref: r, onMouseEnter, onMouseLeave }) => (
        <aside
            ref={r}
            style={{ ...sb.sidebar, width: w, ...style }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {renderSidebarContent(w <= SIDEBAR_MINI + 4)}
        </aside>
    );

    // ── Desktop ──────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <>
                <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: C.bg }}>
                    {/* Sidebar: fixed height, never scrolls */}
                    <aside style={{ ...sb.sidebar, width: SIDEBAR_WIDE, flexShrink: 0 }}>
                        {renderSidebarContent(false)}
                    </aside>
                    {/* Content: independent scroll */}
                    <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {children}
                    </main>
                </div>

                <ConfirmDialog
                    config={logoutDialog ? {
                        title: 'Sign Out',
                        message: 'Are you sure you want to sign out of DOJCD Connect?',
                        confirmText: 'Yes, Sign Out',
                        cancelText: 'Stay',
                        variant: 'logout',
                        onConfirm: doLogout,
                    } : null}
                    onClose={() => setLogoutDialog(false)}
                />
            </>
        );
    }

    // ── Tablet ────────────────────────────────────────────────────────────
    if (isTablet) {
        return (
            <>
                <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: C.bg }}>
                    {/* Mini sidebar — always occupies SIDEBAR_MINI width, overlay when expanded */}
                    <div style={{ width: SIDEBAR_MINI, flexShrink: 0, position: 'relative', zIndex: 50 }}>
                        <aside
                            ref={drawerRef}
                            style={{
                                ...sb.sidebar,
                                width: miniExpanded ? SIDEBAR_WIDE : SIDEBAR_MINI,
                                position: 'fixed', top: 0, left: 0, bottom: 0,
                                transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
                                overflow: 'hidden',
                                zIndex: 200,
                            }}
                            onMouseEnter={() => setMiniExpanded(true)}
                            onMouseLeave={() => setMiniExpanded(false)}
                        >
                            {renderSidebarContent(!miniExpanded)}
                        </aside>
                    </div>

                    {/* Backdrop when expanded */}
                    {miniExpanded && (
                        <div
                            style={{ position: 'fixed', inset: 0, zIndex: 190, backgroundColor: 'rgba(15,31,61,0.25)' }}
                            onClick={() => setMiniExpanded(false)}
                        />
                    )}

                    {/* Content scrolls independently */}
                    <main style={{ flex: 1, minWidth: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                        {children}
                    </main>
                </div>

                <ConfirmDialog
                    config={logoutDialog ? {
                        title: 'Sign Out',
                        message: 'Are you sure you want to sign out of DOJCD Connect?',
                        confirmText: 'Yes, Sign Out',
                        cancelText: 'Stay',
                        variant: 'logout',
                        onConfirm: doLogout,
                    } : null}
                    onClose={() => setLogoutDialog(false)}
                />
            </>
        );
    }

    // ── Mobile ────────────────────────────────────────────────────────────
    return (
        <>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: C.bg }}>
                {/* Sticky top bar */}
                <div style={sb.mobileTopBar}>
                    <button style={sb.mobileIconBtn} onClick={() => setDrawerOpen(true)}>
                        <IoMenuOutline size={24} color={C.white} />
                    </button>
                    <div style={sb.mobileBrand}>
                        <span style={{ fontSize: 17, marginRight: 8 }}>⚖️</span>
                        <span style={sb.mobileBrandText}>DOJCD Connect</span>
                    </div>
                    <button style={sb.mobileIconBtn} onClick={() => navigate('/notifications')}>
                        <IoNotificationsOutline size={22} color={C.white} />
                        {unreadCount > 0 && (
                            <div style={sb.mobileBadge}>{unreadCount > 9 ? '9+' : unreadCount}</div>
                        )}
                    </button>
                </div>

                {/* Scrollable content */}
                <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    {children}
                </main>
            </div>

            {/* Drawer backdrop */}
            {drawerOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(15,31,61,0.55)' }}
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Slide-in drawer */}
            <aside style={{
                ...sb.sidebar,
                position: 'fixed', top: 0, left: drawerOpen ? 0 : -(SIDEBAR_WIDE + 20),
                bottom: 0, width: SIDEBAR_WIDE, zIndex: 400,
                transition: 'left 0.26s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: drawerOpen ? '4px 0 24px rgba(15,31,61,0.35)' : 'none',
            }}>
                <button style={sb.drawerClose} onClick={() => setDrawerOpen(false)}>
                    <IoCloseOutline size={20} color={C.mutedLight} />
                </button>
                {renderSidebarContent(false)}
            </aside>

            <ConfirmDialog
                config={logoutDialog ? {
                    title: 'Sign Out',
                    message: 'Are you sure you want to sign out of DOJCD Connect?',
                    confirmText: 'Yes, Sign Out',
                    cancelText: 'Stay',
                    variant: 'logout',
                    onConfirm: doLogout,
                } : null}
                onClose={() => setLogoutDialog(false)}
            />
        </>
    );
}

// ─── Sidebar styles ───────────────────────────────────────────────────────
const sb = {
    sidebar: {
        backgroundColor: C.navy,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        flexShrink: 0,
    },
    brand: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '18px 14px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
    },
    brandIcon: {
        width: 38, height: 38, borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    brandTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: '0.4px' },
    brandSub:   { fontSize: 9,  fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px', marginTop: 1 },

    userCard: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
    },
    userAvatar: {
        width: 38, height: 38, borderRadius: 11,
        backgroundColor: C.accent,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0, position: 'relative',
    },
    userAvatarText: { fontSize: 14, fontWeight: '800', color: '#fff' },
    userDot: {
        position: 'absolute', bottom: -2, right: -2,
        width: 10, height: 10, borderRadius: 5,
        border: `2px solid ${C.navy}`,
    },
    userName: { fontSize: 13, fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    userRole: { fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 1 },

    navSection: {
        fontSize: 9, fontWeight: '700', letterSpacing: '1.3px',
        color: 'rgba(255,255,255,0.28)',
        padding: '14px 16px 5px',
    },

    navBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 12px', borderRadius: 10,
        border: 'none', backgroundColor: 'transparent',
        cursor: 'pointer', marginBottom: 2,
        textAlign: 'left',
        transition: 'background 0.12s ease',
    },
    navBtnCollapsed: {
        justifyContent: 'center', padding: '11px 0',
        borderRadius: 0, marginBottom: 0,
    },
    navBtnActive: { backgroundColor: C.accent },
    navLabel:     { fontSize: 13, fontWeight: '600', flex: 1 },
    badge: {
        position: 'absolute', top: -5, right: -8,
        minWidth: 15, height: 15, borderRadius: 8,
        backgroundColor: '#EF4444',
        fontSize: 9, fontWeight: '800', color: '#fff',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '0 3px',
    },
    countPill: {
        marginLeft: 'auto', backgroundColor: '#EF4444',
        color: '#fff', fontSize: 10, fontWeight: '800',
        padding: '2px 6px', borderRadius: 10,
    },

    logoutWrap: { padding: '6px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' },
    logoutBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 12px', borderRadius: 10,
        border: 'none', backgroundColor: 'rgba(220,38,38,0.08)',
        cursor: 'pointer',
    },
    logoutText: { fontSize: 13, fontWeight: '600', color: 'rgba(220,38,38,0.75)' },

    mobileTopBar: {
        height: 56, backgroundColor: C.navy,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
        boxShadow: '0 2px 8px rgba(15,31,61,0.2)',
        flexShrink: 0,
    },
    mobileIconBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        padding: 4, display: 'flex', alignItems: 'center',
        position: 'relative',
    },
    mobileBrand: { flex: 1, display: 'flex', alignItems: 'center' },
    mobileBrandText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: '0.2px' },
    mobileBadge: {
        position: 'absolute', top: 0, right: 0,
        minWidth: 15, height: 15, borderRadius: 8,
        backgroundColor: '#EF4444',
        fontSize: 9, fontWeight: '800', color: '#fff',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '0 2px',
    },

    drawerClose: {
        position: 'absolute', top: 12, right: 10, zIndex: 10,
        background: 'rgba(255,255,255,0.08)', border: 'none',
        borderRadius: 8, width: 30, height: 30,
        cursor: 'pointer',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
};
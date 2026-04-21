// screens/Client/NotificationsScreen.jsx
// Dedicated notifications page reached from /notifications.
// - Lists all notifications
// - Clicking an unread notification opens a popup showing full content, marks it read on close
// - Delete button with ConfirmDialog
// - Mark all read button

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    IoNotificationsOutline,
    IoCheckmarkDoneOutline,
    IoTrashOutline,
    IoClose,
    IoRefreshOutline,
    IoCheckmarkCircleOutline,
    IoInformationCircleOutline,
    IoAlertCircleOutline,
    IoTimeOutline,
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
    slateSoft:  '#F1F5F9',
};

function formatTime(d) {
    const diff = Date.now() - new Date(d).getTime();
    const m  = Math.floor(diff / 60000);
    const h  = Math.floor(diff / 3600000);
    const dy = Math.floor(diff / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (dy < 7) return `${dy}d ago`;
    return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Notification popup — shown when an unread notification is clicked
function NotificationPopup({ notif, onClose }) {
    // Hook must be called before any early return
    useEffect(() => {
        if (!notif) return;
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [notif, onClose]);

    if (!notif) return null;

    return (
        <>
            <div style={PS.backdrop} onClick={onClose} />
            <div style={PS.wrap}>
                <div style={PS.dialog} onClick={e => e.stopPropagation()}>
                    <button style={PS.closeBtn} onClick={onClose}>
                        <IoClose size={18} color={C.mutedLight} />
                    </button>
                    <div style={PS.iconCircle}>
                        <IoNotificationsOutline size={26} color={C.accent} />
                    </div>
                    <h2 style={PS.title}>{notif.title}</h2>
                    <p style={PS.time}>{formatTime(notif.created_at)}</p>
                    <div style={PS.msgBox}>
                        <p style={PS.msg}>{notif.message}</p>
                    </div>
                    <div style={PS.readNote}>
                        <IoCheckmarkCircleOutline size={14} color={C.green} />
                        <span style={PS.readNoteText}>This notification has been marked as read</span>
                    </div>
                    <button style={PS.closeFullBtn} onClick={onClose}>Close</button>
                </div>
            </div>
        </>
    );
}

const PS = {
    backdrop: { position: 'fixed', inset: 0, zIndex: 900, backgroundColor: 'rgba(15,31,61,0.5)', backdropFilter: 'blur(2px)' },
    wrap:     { position: 'fixed', inset: 0, zIndex: 901, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' },
    dialog:   { backgroundColor: C.surface, borderRadius: 20, padding: '32px 28px 24px', width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(15,31,61,0.2)', border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', pointerEvents: 'auto', animation: 'dialogPop 0.2s cubic-bezier(0.34,1.56,0.64,1)' },
    closeBtn: { position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 8, backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
    iconCircle: { width: 60, height: 60, borderRadius: 18, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    title:    { fontSize: 18, fontWeight: '800', color: C.text, margin: '0 0 4px', textAlign: 'center' },
    time:     { fontSize: 12, color: C.mutedLight, margin: '0 0 16px' },
    msgBox:   { backgroundColor: C.bg, borderRadius: 12, padding: '14px 16px', width: '100%', marginBottom: 14, border: `1px solid ${C.border}` },
    msg:      { fontSize: 14, color: C.muted, lineHeight: 1.65, margin: 0 },
    readNote: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 },
    readNoteText: { fontSize: 12, color: C.green, fontWeight: '600' },
    closeFullBtn: { backgroundColor: C.navy, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: '700', cursor: 'pointer', width: '100%' },
};

export default function NotificationsScreen() {
    const toast    = useToast();
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);
    const [user,          setUser]          = useState(null);
    const [openNotif,     setOpenNotif]     = useState(null); // popup
    const [dialog,        setDialog]        = useState(null); // confirm

    useEffect(() => { init(); }, []);

    const init = async () => {
        const ud = localStorage.getItem('user');
        if (!ud) { navigate('/login'); return; }
        const u = JSON.parse(ud);
        setUser(u);
        await fetchNotifications(u.client_user_id);
        setLoading(false);
    };

    const fetchNotifications = async (id) => {
        try {
            const r = await notificationAPI.getUserNotifications(id, 'Client');
            if (r.data.success) setNotifications(r.data.data || []);
        } catch { toast.error('Error', 'Could not load notifications.'); }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (user) await fetchNotifications(user.client_user_id);
        setRefreshing(false);
    };

    // Click on a notification: open popup, mark read
    const handleClickNotif = async (notif) => {
        setOpenNotif(notif);
        if (!notif.is_read && user) {
            try {
                await notificationAPI.markAsRead(notif.notification_id, user.client_user_id, 'Client');
                setNotifications(prev =>
                    prev.map(n => n.notification_id === notif.notification_id ? { ...n, is_read: true } : n)
                );
            } catch { /* silent */ }
        }
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        try {
            const r = await notificationAPI.markAllAsRead(user.client_user_id, 'Client');
            if (r.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                toast.success('Done', 'All notifications marked as read.');
            }
        } catch { toast.error('Error', 'Failed to mark all as read.'); }
    };

    const handleDelete = (nid) => {
        setDialog({
            title: 'Delete Notification',
            message: 'Remove this notification? This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'delete',
            onConfirm: async () => {
                try {
                    const r = await notificationAPI.deleteNotification(nid, user.client_user_id, 'Client');
                    if (r.data.success) {
                        setNotifications(prev => prev.filter(n => n.notification_id !== nid));
                        toast.success('Deleted', 'Notification removed.');
                    }
                } catch { toast.error('Error', 'Failed to delete notification.'); }
            },
        });
    };

    const unread = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 14, backgroundColor: C.bg, minHeight: '100%' }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes dialogPop { from { opacity:0; transform:scale(0.92) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
                .ncard:hover { background: #F8FAFF; }
                .ncard { transition: background 0.12s ease; }
            `}</style>

            <div style={S.root}>
                {/* Page header */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={S.headerIcon}>
                            <IoNotificationsOutline size={20} color={C.accent} />
                        </div>
                        <div>
                            <h1 style={S.headerTitle}>Notifications</h1>
                            <p style={S.headerSub}>
                                {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up'}
                            </p>
                        </div>
                    </div>
                    <div style={S.headerRight}>
                        {unread > 0 && (
                            <button style={S.markAllBtn} onClick={handleMarkAllRead}>
                                <IoCheckmarkDoneOutline size={15} color={C.accent} />
                                <span style={S.markAllText}>Mark all read</span>
                            </button>
                        )}
                        <button style={S.iconBtn} onClick={onRefresh} disabled={refreshing}>
                            <IoRefreshOutline size={18} color={C.muted}
                                              style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div style={S.body}>
                    {notifications.length === 0 ? (
                        <div style={S.empty}>
                            <div style={S.emptyIco}>
                                <IoNotificationsOutline size={32} color={C.mutedLight} />
                            </div>
                            <div style={S.emptyTitle}>No notifications yet</div>
                            <div style={S.emptySub}>You'll be notified here when your application status changes.</div>
                        </div>
                    ) : (
                        <div style={S.list}>
                            {notifications.map(notif => (
                                <div
                                    key={notif.notification_id}
                                    className="ncard"
                                    style={{
                                        ...S.card,
                                        ...(notif.is_read ? {} : S.cardUnread),
                                    }}
                                >
                                    {/* Unread indicator */}
                                    {!notif.is_read && <div style={S.unreadBar} />}

                                    <button
                                        style={S.cardInner}
                                        onClick={() => handleClickNotif(notif)}
                                    >
                                        {/* Icon */}
                                        <div style={{ ...S.notifIco, backgroundColor: notif.is_read ? C.slateSoft : C.accentSoft }}>
                                            <IoNotificationsOutline size={16} color={notif.is_read ? C.muted : C.accent} />
                                        </div>

                                        {/* Content */}
                                        <div style={S.cardContent}>
                                            <div style={S.cardTop}>
                                                <span style={{ ...S.cardTitle, fontWeight: notif.is_read ? '600' : '800' }}>
                                                    {notif.title}
                                                </span>
                                                {!notif.is_read && (
                                                    <div style={S.newPill}>New</div>
                                                )}
                                            </div>
                                            <p style={S.cardMsg}>{notif.message}</p>
                                            <div style={S.cardTime}>
                                                <IoTimeOutline size={11} color={C.mutedLight} />
                                                <span style={S.cardTimeText}>{formatTime(notif.created_at)}</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Delete */}
                                    <button
                                        style={S.deleteBtn}
                                        onClick={() => handleDelete(notif.notification_id)}
                                        title="Delete notification"
                                    >
                                        <IoTrashOutline size={16} color={C.mutedLight} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Notification popup */}
            <NotificationPopup notif={openNotif} onClose={() => setOpenNotif(null)} />

            {/* Delete confirm dialog */}
            <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
        </>
    );
}

const S = {
    root: { backgroundColor: C.bg, display: 'flex', flexDirection: 'column', minHeight: '100%' },

    header: {
        backgroundColor: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        position: 'sticky', top: 0, zIndex: 50, flexWrap: 'wrap',
    },
    headerLeft:  { display: 'flex', alignItems: 'center', gap: 14 },
    headerIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 19, fontWeight: '800', color: C.text, margin: 0 },
    headerSub:   { fontSize: 12, color: C.muted, marginTop: 2 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 10 },

    markAllBtn:  { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.accentSoft, padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer' },
    markAllText: { fontSize: 13, color: C.accent, fontWeight: '700' },
    iconBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: C.bg, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },

    body: { flex: 1, padding: '16px 24px 32px', maxWidth: '100%', width: '100%', alignSelf: 'center', boxSizing: 'border-box' },

    list: { display: 'flex', flexDirection: 'column', gap: 8 },

    card: {
        backgroundColor: C.surface,
        borderRadius: 14, border: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'stretch',
        overflow: 'hidden', cursor: 'pointer',
        position: 'relative',
    },
    cardUnread: { backgroundColor: '#F5F8FF', borderColor: `${C.accent}30` },
    unreadBar:  { width: 4, backgroundColor: C.accent, flexShrink: 0 },
    cardInner:  { flex: 1, display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 12px 14px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },

    notifIco: { width: 36, height: 36, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },

    cardContent: { flex: 1, minWidth: 0 },
    cardTop:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardTitle:   { fontSize: 14, color: C.text, flex: 1, minWidth: 0 },
    newPill:     { backgroundColor: C.accentSoft, color: C.accent, fontSize: 10, fontWeight: '700', padding: '2px 7px', borderRadius: 10, flexShrink: 0 },
    cardMsg:     { fontSize: 13, color: C.muted, lineHeight: 1.55, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
    cardTime:    { display: 'flex', alignItems: 'center', gap: 4 },
    cardTimeText:{ fontSize: 11, color: C.mutedLight },

    deleteBtn: {
        padding: '0 14px', border: 'none', background: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        borderLeft: `1px solid ${C.border}`,
        transition: 'background 0.12s ease',
    },

    empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '72px 20px' },
    emptyIco:  { width: 68, height: 68, borderRadius: 20, backgroundColor: C.surface, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    emptyTitle:{ fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8 },
    emptySub:  { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 1.6, maxWidth: 300 },
};
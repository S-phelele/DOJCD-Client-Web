// screens/Client/ClientDashboard.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceAPI, notificationAPI } from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import {
    IoDocumentTextOutline,
    IoTimeOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoNotificationsOutline,
    IoLogOutOutline,
    IoPersonAddOutline,
    IoChevronForward,
    IoPhonePortraitOutline,
    IoListOutline,
    IoCalendarOutline,
    IoArrowForward,
    IoClose,
    IoAlertCircleOutline,
    IoCheckmarkCircle,
    IoTime,
} from 'react-icons/io5';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
    navy: '#0F1F3D',
    navyLight: '#162C4A',
    navyMid: '#1E3A5F',
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

// ─── Status chip ───────────────────────────────────────────────────────────
const STATUS_META = {
    Approved: { bg: C.greenSoft, text: C.green, dot: C.green, icon: IoCheckmarkCircle },
    Pending: { bg: C.amberSoft, text: C.amber, dot: C.amber, icon: IoTime },
    Rejected: { bg: C.roseSoft, text: C.rose, dot: C.rose, icon: IoCloseCircleOutline },
    Cancelled: { bg: C.slateSoft, text: C.slate, dot: C.slate, icon: IoCloseCircleOutline },
};

const StatusChip = ({ status }) => {
    const m = STATUS_META[status] || { bg: C.slateSoft, text: C.slate, dot: C.slate };
    return (
        <div style={chipStyles.wrap}>
            <div style={{ ...chipStyles.dot, backgroundColor: m.dot }} />
            <span style={{ ...chipStyles.text, color: m.text }}>{status}</span>
        </div>
    );
};

const chipStyles = {
    wrap: { display: 'flex', alignItems: 'center', padding: '5px 10px', borderRadius: 20 },
    dot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
    text: { fontSize: 11, fontWeight: '700' },
};

export default function ClientDashboard() {
    const toast = useToast();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [hasProfile, setHasProfile] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState([]);
    const [applications, setApplications] = useState([]);
    const [summary, setSummary] = useState(null);
    const [isEligible, setIsEligible] = useState(false);
    const [eligibilityLoading, setEligibilityLoading] = useState(false);
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [showApplicationsModal, setShowApplicationsModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotificationsModal, setShowNotificationsModal] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [bellScale, setBellScale] = useState(1);
    const [dotOpacity, setDotOpacity] = useState(0);

    useEffect(() => {
        loadUser();
    }, []);

    useEffect(() => {
        if (user?.client_user_id) {
            loadNotifications();
            loadUnreadCount();
        }
    }, [user]);

    const loadUser = async () => {
        try {
            const ud = localStorage.getItem('user');
            if (ud) {
                const u = JSON.parse(ud);
                setUser(u);
                checkProfile(u);
                if (u.registration_status === 'Verified') {
                    await Promise.all([
                        checkEligibility(u.client_user_id),
                        loadApplications(u.client_user_id),
                        loadSummary(u.client_user_id),
                        loadNotificationsForUser(u.client_user_id),
                        loadUnreadCountForUser(u.client_user_id),
                    ]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadNotificationsForUser = async (id) => {
        try {
            setNotificationsLoading(true);
            const r = await notificationAPI.getUserNotifications(id, 'Client');
            if (r.data.success) setNotifications(r.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setNotificationsLoading(false);
        }
    };
    const loadNotifications = () => user?.client_user_id && loadNotificationsForUser(user.client_user_id);

    const loadUnreadCountForUser = async (id) => {
        try {
            const r = await notificationAPI.getUnreadCount(id, 'Client');
            if (r.data.success) {
                const c = r.data.unreadCount || 0;
                setUnreadCount(c);
                setDotOpacity(c > 0 ? 1 : 0);
            }
        } catch (err) {
            console.error(err);
        }
    };
    const loadUnreadCount = () => user?.client_user_id && loadUnreadCountForUser(user.client_user_id);

    const handleMarkAllAsRead = async () => {
        if (!user?.client_user_id) return;
        try {
            const r = await notificationAPI.markAllAsRead(user.client_user_id, 'Client');
            if (r.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
                setDotOpacity(0);
                toast.success('All notifications marked as read');
            }
        } catch {
            toast.error('Error', 'Failed to mark notifications as read.');
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const r = await notificationAPI.markAsRead(id, user.client_user_id, 'Client');
            if (r.data.success) {
                setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteNotification = (nid) => {
        if (!user?.client_user_id) return;
        if (!window.confirm('Delete Notification?\n\nAre you sure?')) return;
        notificationAPI.deleteNotification(nid, user.client_user_id, 'Client')
            .then(r => {
                if (r.data.success) {
                    const notif = notifications.find(n => n.notification_id === nid);
                    setNotifications(prev => prev.filter(n => n.notification_id !== nid));
                    if (notif && !notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));
                    toast.success('Notification deleted');
                }
            })
            .catch(() => toast.error('Error', 'Failed to delete notification.'));
    };

    const animateBell = () => {
        setBellScale(1.25);
        setTimeout(() => setBellScale(1), 150);
        setShowNotificationsModal(true);
    };

    const checkEligibility = async (id) => {
        try {
            setEligibilityLoading(true);
            const r = await deviceAPI.checkEligibility(id);
            setIsEligible(r.data.data.eligibility?.eligible || false);
            if (r.data.data.eligibility?.eligible) await loadDevices();
        } catch (error) {
            console.error('Error checking eligibility:', error);
            setIsEligible(false);
        } finally {
            setEligibilityLoading(false);
        }
    };

    const loadDevices = async () => {
        try {
            const r = await deviceAPI.getAvailableDevices();
            setDevices(r.data.data.devices || []);
        } catch (error) {
            console.error('Error loading devices:', error);
            setDevices([]);
        }
    };

    const loadApplications = async (id) => {
        try {
            const r = await deviceAPI.getUserApplications(id);
            setApplications(r.data.data.applications || []);
        } catch (error) {
            console.error('Error loading applications:', error);
            setApplications([]);
        }
    };

    const loadSummary = async (id) => {
        try {
            const r = await deviceAPI.getApplicationSummary(id);
            setSummary(r.data.data.summary || null);
        } catch (error) {
            console.error('Error loading summary:', error);
            setSummary(null);
        }
    };

    const checkProfile = (u) => {
        const s = u.registration_status || '';
        setHasProfile(s === 'Verified' || s === 'Profile_Completed' || !!(u.network_provider && u.contract_duration_months));
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUser();
        setRefreshing(false);
    };

    const handleApplyForDevice = (deviceId) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        if (!window.confirm('Confirm Application\n\nApply for this device?')) return;
        deviceAPI.submitApplication(user.client_user_id, deviceId)
            .then(async r => {
                if (r.data.success) {
                    toast.success('Application Submitted!', r.data.message || 'Your application is now pending review.');
                    setShowDevicesModal(false);
                    await loadApplications(user.client_user_id);
                    await loadSummary(user.client_user_id);
                } else {
                    toast.error('Submission Failed', r.data.message);
                }
            })
            .catch(error => {
                const status = error.response?.status;
                const msg = error.response?.data?.message;
                if (status === 409) toast.warning('Already Applied', msg || 'You already have an active application for this device.');
                else if (status === 422) toast.error('Not Eligible', msg || 'You are not currently eligible to apply.');
                else toast.error('Submission Failed', msg || error.message || 'Failed to submit application.');
            });
    };

    const handleCancelApplication = (applicationId) => {
        if (!user?.client_user_id) {
            toast.error('Error', 'User not found.');
            return;
        }
        if (!window.confirm('Cancel Application?\n\nAre you sure? This cannot be undone.')) return;
        deviceAPI.cancelApplication(user.client_user_id, applicationId)
            .then(async r => {
                if (r.data.success) {
                    toast.success('Application Cancelled', r.data.message);
                    await loadApplications(user.client_user_id);
                    await loadSummary(user.client_user_id);
                } else {
                    toast.error('Cancel Failed', r.data.message);
                }
            })
            .catch(error => {
                const status = error.response?.status;
                const msg = error.response?.data?.message;
                if (status === 409) toast.warning('Already Finalised', msg || 'This application cannot be cancelled.');
                else toast.error('Cancel Failed', msg || error.message || 'Failed to cancel application.');
            });
    };

    const handleLogout = () => {
        if (!window.confirm('Confirm Logout\n\nAre you sure you want to sign out?')) return;
        localStorage.removeItem('user');
        localStorage.removeItem('profile_skipped');
        navigate('/login');
    };

    const formatTime = (d) => {
        const diff = Date.now() - new Date(d).getTime();
        const m = Math.floor(diff / 60000);
        const h = Math.floor(diff / 3600000);
        const dy = Math.floor(diff / 86400000);
        if (m < 60) return `${m}m ago`;
        if (h < 24) return `${h}h ago`;
        if (dy < 7) return `${dy}d ago`;
        return new Date(d).toLocaleDateString();
    };

    const stats = [
        { label: 'Total', value: summary?.total_applications || 0, icon: IoDocumentTextOutline, color: C.accent, bg: C.accentSoft },
        { label: 'Pending', value: summary?.pending || 0, icon: IoTimeOutline, color: C.amber, bg: C.amberSoft },
        { label: 'Approved', value: summary?.approved || 0, icon: IoCheckmarkCircleOutline, color: C.green, bg: C.greenSoft },
        { label: 'Rejected', value: summary?.rejected || 0, icon: IoCloseCircleOutline, color: C.rose, bg: C.roseSoft },
    ];

    const renderNotification = (item) => (
        <div key={item.notification_id} style={{ ...styles.notifCard, ...(!item.is_read && styles.notifUnread) }} onClick={() => handleMarkAsRead(item.notification_id)}>
            <div style={styles.notifHeader}>
                <div style={styles.notifLeft}>
                    <div style={{ ...styles.notifIconWrap, backgroundColor: item.is_read ? C.slateSoft : C.accentSoft }}>
                        <IoNotificationsOutline size={16} color={item.is_read ? C.muted : C.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={styles.notifTitle}>{item.title}</div>
                        <div style={styles.notifTime}>{formatTime(item.created_at)}</div>
                    </div>
                </div>
                <button style={styles.notifDelete} onClick={(e) => { e.stopPropagation(); handleDeleteNotification(item.notification_id); }}>
                    <IoClose size={18} color={C.mutedLight} />
                </button>
            </div>
            <div style={styles.notifMsg}>{item.message}</div>
            {!item.is_read && <div style={styles.unreadPill}><span style={styles.unreadPillText}>New</span></div>}
        </div>
    );

    const renderDevice = (item) => (
        <div key={item.device_id} style={styles.deviceCard}>
            <div style={styles.deviceCardTop}>
                <div style={{ flex: 1 }}>
                    <div style={styles.deviceCardName}>{item.device_name}</div>
                    <div style={styles.deviceCardModel}>{item.model} · {item.manufacturer}</div>
                </div>
                <div style={styles.devicePricePill}>
                    <div style={styles.devicePrice}>R{item.monthly_cost}</div>
                    <div style={styles.devicePriceLabel}>/mo</div>
                </div>
            </div>
            <div style={styles.devicePlan}>{item.plan_name}</div>
            <div style={styles.devicePlanDetail}>{item.plan_details}</div>
            <div style={styles.deviceCardFooter}>
                <div style={styles.deviceContractPill}>
                    <IoCalendarOutline size={13} color={C.muted} />
                    <span style={styles.deviceContractText}>{item.contract_duration_months} months</span>
                </div>
                <button style={styles.applyBtn} onClick={() => handleApplyForDevice(item.device_id)}>
                    <span style={styles.applyBtnText}>Apply Now</span>
                    <IoArrowForward size={14} color="#fff" />
                </button>
            </div>
        </div>
    );

    const renderApplication = (item) => (
        <div key={item.application_id} style={styles.appCard}>
            <div style={styles.appCardHeader}>
                <div style={{ flex: 1 }}>
                    <div style={styles.appDeviceName}>{item.device_name}</div>
                    <div style={styles.appDeviceModel}>{item.model}</div>
                </div>
                <StatusChip status={item.application_status} />
            </div>
            <div style={styles.appRow}>
                <div style={styles.appDetail}>
                    <div style={styles.appDetailLabel}>Plan</div>
                    <div style={styles.appDetailValue}>{item.plan_name}</div>
                </div>
                <div style={styles.appDetail}>
                    <div style={styles.appDetailLabel}>Monthly</div>
                    <div style={{ ...styles.appDetailValue, color: C.green, fontWeight: '700' }}>R{item.monthly_cost}</div>
                </div>
            </div>
            <div style={styles.appCardFooter}>
                <div style={styles.appDate}>{new Date(item.submission_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                {item.application_status === 'Pending' && (
                    <button style={styles.cancelAppBtn} onClick={() => handleCancelApplication(item.application_id)}>
                        <IoCloseCircleOutline size={15} color={C.rose} />
                        <span style={styles.cancelAppText}>Cancel</span>
                    </button>
                )}
            </div>
            {item.rejection_reason && (
                <div style={styles.rejectionBanner}>
                    <IoAlertCircleOutline size={14} color={C.rose} />
                    <span style={styles.rejectionText}>{item.rejection_reason}</span>
                </div>
            )}
        </div>
    );

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <div className="spinner" style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <div style={styles.loadingText}>Loading dashboard…</div>
                <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
            </div>
        );
    }

    return (
        <>
            <div style={styles.root}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerRing} />
                    <div style={styles.headerTop}>
                        <div style={styles.avatarWrap}>
                            <div style={styles.avatar}>
                                <span style={styles.avatarText}>{(user?.first_name?.[0] || 'U')}{(user?.last_name?.[0] || '')}</span>
                            </div>
                            <div style={styles.avatarBadge}>
                                <div style={{ ...styles.avatarBadgeDot, backgroundColor: user?.registration_status === 'Verified' ? '#4ADE80' : C.amber }} />
                            </div>
                        </div>
                        <div style={styles.headerInfo}>
                            <div style={styles.headerGreeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</div>
                            <div style={styles.headerName}>{user?.first_name || 'User'} {user?.last_name || ''}</div>
                            <div style={styles.headerStatusPill}>
                                <div style={{ ...styles.headerStatusDot, backgroundColor: user?.registration_status === 'Verified' ? '#4ADE80' : C.amber }} />
                                <span style={styles.headerStatusText}>{(user?.registration_status || 'Unknown').replace('_', ' ')}</span>
                            </div>
                        </div>
                        <div style={styles.headerActions}>
                            <button style={styles.headerIconBtn} onClick={animateBell}>
                                <div style={{ transform: `scale(${bellScale})`, transition: 'transform 0.1s ease' }}>
                                    <IoNotificationsOutline size={22} color="rgba(255,255,255,0.9)" />
                                </div>
                                {unreadCount > 0 && (
                                    <div style={{ ...styles.notifBadge, opacity: dotOpacity }}>
                                        <span style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    </div>
                                )}
                            </button>
                            <button style={styles.headerIconBtn} onClick={handleLogout}>
                                <IoLogOutOutline size={22} color="rgba(255,255,255,0.9)" />
                            </button>
                        </div>
                    </div>

                    {hasProfile && user?.registration_status === 'Verified' && (
                        <div style={{ ...styles.eligBanner, ...(isEligible ? styles.eligBannerGreen : styles.eligBannerAmber) }}>
                            {isEligible ? <IoCheckmarkCircleOutline size={18} color={C.green} /> : <IoTimeOutline size={18} color={C.amber} />}
                            <span style={{ ...styles.eligText, color: isEligible ? C.green : C.amber }}>
                {isEligible ? 'Eligible to apply for devices' : eligibilityLoading ? 'Checking eligibility…' : 'Eligibility pending verification'}
              </span>
                        </div>
                    )}
                </div>

                {/* Profile banner */}
                {!hasProfile && (
                    <button style={styles.profileBanner} onClick={() => navigate('/complete-profile')}>
                        <div style={styles.profileBannerLeft}>
                            <div style={styles.profileBannerIcon}><IoPersonAddOutline size={20} color={C.amber} /></div>
                            <div>
                                <div style={styles.profileBannerTitle}>Complete your profile</div>
                                <div style={styles.profileBannerSub}>Required to access device applications</div>
                            </div>
                        </div>
                        <IoChevronForward size={18} color={C.amber} />
                    </button>
                )}

                {/* Stats */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Application Summary</div>
                    <div style={styles.statsGrid}>
                        {stats.map((st, i) => {
                            const Icon = st.icon;
                            return (
                                <div key={i} style={styles.statCard}>
                                    <div style={{ ...styles.statIcon, backgroundColor: st.bg }}><Icon size={18} color={st.color} /></div>
                                    <div style={styles.statValue}>{st.value}</div>
                                    <div style={styles.statLabel}>{st.label}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Quick Actions</div>
                    <div style={styles.actionsRow}>
                        <button
                            style={{ ...styles.actionCard, ...styles.actionCardPrimary, ...((!hasProfile || !isEligible) && styles.actionCardDisabled) }}
                            onClick={() => {
                                if (!hasProfile) navigate('/complete-profile');
                                else if (!isEligible) toast.warning('Not Eligible', 'Your account is not currently eligible for device applications.');
                                else setShowDevicesModal(true);
                            }}
                        >
                            <div style={{ ...styles.actionIco, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                <IoPhonePortraitOutline size={24} color="#fff" />
                            </div>
                            <div style={styles.actionTitleWhite}>Browse Devices</div>
                            {!hasProfile && <div style={styles.actionHint}>Profile needed</div>}
                        </button>

                        <button
                            style={{ ...styles.actionCard, ...styles.actionCardGreen, ...(!hasProfile && styles.actionCardDisabled) }}
                            onClick={() => { if (hasProfile) setShowApplicationsModal(true); }}
                        >
                            <div style={{ ...styles.actionIco, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                <IoListOutline size={24} color="#fff" />
                            </div>
                            <div style={styles.actionTitleWhite}>My Applications</div>
                            {applications.length > 0 && (
                                <div style={styles.actionBadge}><span style={styles.actionBadgeText}>{applications.length}</span></div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Recent Applications */}
                {applications.length > 0 && (
                    <div style={styles.section}>
                        <div style={styles.sectionRow}>
                            <div style={styles.sectionTitle}>Recent Applications</div>
                            <button style={styles.seeAll} onClick={() => setShowApplicationsModal(true)}>See all</button>
                        </div>
                        {applications.slice(0, 3).map(app => (
                            <div key={app.application_id} style={styles.recentCard}>
                                <div style={styles.recentLeft}>
                                    <div style={styles.recentIco}><IoPhonePortraitOutline size={18} color={C.accent} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={styles.recentDevice}>{app.device_name}</div>
                                        <div style={styles.recentDate}>{new Date(app.submission_date).toLocaleDateString('en-ZA')}</div>
                                    </div>
                                </div>
                                <StatusChip status={app.application_status} />
                            </div>
                        ))}
                    </div>
                )}

                {/* Account Info */}
                <div style={{ ...styles.section, marginBottom: 40 }}>
                    <div style={styles.sectionTitle}>Account</div>
                    <div style={styles.infoCard}>
                        {[
                            { label: 'Email', value: user?.email || '—' },
                            { label: 'User Type', value: user?.user_type || '—' },
                            { label: 'Eligibility', value: eligibilityLoading ? 'Checking…' : isEligible ? 'Eligible' : 'Not Eligible', color: isEligible ? C.green : C.rose },
                        ].map((row, i, arr) => (
                            <div key={i} style={{ ...styles.infoRow, ...(i < arr.length - 1 && styles.infoRowBorder) }}>
                                <div style={styles.infoLabel}>{row.label}</div>
                                <div style={{ ...styles.infoValue, ...(row.color && { color: row.color, fontWeight: '700' }) }}>{row.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pull-to-refresh simulation via button */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <button onClick={onRefresh} style={{ padding: '8px 20px', borderRadius: 20, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer' }}>
                        {refreshing ? 'Refreshing...' : '↻ Refresh'}
                    </button>
                </div>
            </div>

            {/* Notifications Modal */}
            {showNotificationsModal && (
                <div style={modalStyles.overlay} onClick={() => setShowNotificationsModal(false)}>
                    <div style={modalStyles.sheet} onClick={e => e.stopPropagation()}>
                        <div style={modalStyles.sheetHandle} />
                        <div style={modalStyles.sheetHeader}>
                            <div>
                                <div style={modalStyles.sheetTitle}>Notifications</div>
                                {unreadCount > 0 && <div style={modalStyles.sheetSub}>{unreadCount} unread</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {unreadCount > 0 && (
                                    <button style={modalStyles.sheetAction} onClick={handleMarkAllAsRead}>Mark all read</button>
                                )}
                                <button onClick={() => setShowNotificationsModal(false)}><IoClose size={24} color={C.muted} /></button>
                            </div>
                        </div>
                        <div style={modalStyles.modalContent}>
                            {notificationsLoading ? (
                                <div className="spinner" style={{ width: 30, height: 30, margin: '40px auto' }} />
                            ) : notifications.length === 0 ? (
                                <div style={styles.empty}>
                                    <IoNotificationsOutline size={52} color={C.border} />
                                    <div style={styles.emptyTitle}>All caught up</div>
                                    <div style={styles.emptyText}>No notifications yet</div>
                                </div>
                            ) : (
                                <div style={modalStyles.list}>{notifications.map(renderNotification)}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Devices Modal */}
            {showDevicesModal && (
                <div style={modalStyles.overlay} onClick={() => setShowDevicesModal(false)}>
                    <div style={modalStyles.sheet} onClick={e => e.stopPropagation()}>
                        <div style={modalStyles.sheetHandle} />
                        <div style={modalStyles.sheetHeader}>
                            <div>
                                <div style={modalStyles.sheetTitle}>Available Devices</div>
                                <div style={modalStyles.sheetSub}>{devices.length} device{devices.length !== 1 ? 's' : ''}</div>
                            </div>
                            <button onClick={() => setShowDevicesModal(false)}><IoClose size={24} color={C.muted} /></button>
                        </div>
                        <div style={modalStyles.modalContent}>
                            {devices.length === 0 ? (
                                <div style={styles.empty}>
                                    <IoPhonePortraitOutline size={52} color={C.border} />
                                    <div style={styles.emptyTitle}>No devices available</div>
                                    <div style={styles.emptyText}>Check back later</div>
                                </div>
                            ) : (
                                <div style={modalStyles.list}>{devices.map(renderDevice)}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Applications Modal */}
            {showApplicationsModal && (
                <div style={modalStyles.overlay} onClick={() => setShowApplicationsModal(false)}>
                    <div style={modalStyles.sheet} onClick={e => e.stopPropagation()}>
                        <div style={modalStyles.sheetHandle} />
                        <div style={modalStyles.sheetHeader}>
                            <div>
                                <div style={modalStyles.sheetTitle}>My Applications</div>
                                <div style={modalStyles.sheetSub}>{applications.length} total</div>
                            </div>
                            <button onClick={() => setShowApplicationsModal(false)}><IoClose size={24} color={C.muted} /></button>
                        </div>
                        <div style={modalStyles.modalContent}>
                            {applications.length === 0 ? (
                                <div style={styles.empty}>
                                    <IoDocumentTextOutline size={52} color={C.border} />
                                    <div style={styles.emptyTitle}>No applications yet</div>
                                    <button style={styles.emptyBtn} onClick={() => { setShowApplicationsModal(false); setShowDevicesModal(true); }}>Browse Devices</button>
                                </div>
                            ) : (
                                <div style={modalStyles.list}>{applications.map(renderApplication)}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
    root: { backgroundColor: C.bg, minHeight: '100vh', paddingBottom: 20 },
    loadingScreen: { minHeight: '100vh', backgroundColor: C.navy, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
    loadingText: { color: 'rgba(255,255,255,0.7)', marginTop: 16, fontSize: 15, fontWeight: '500' },

    header: { backgroundColor: C.navy, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
    headerRing: { position: 'absolute', width: 260, height: 260, borderRadius: 130, border: '1px solid rgba(255,255,255,0.05)', top: -80, right: -60 },
    headerTop: { display: 'flex', alignItems: 'center' },
    avatarWrap: { position: 'relative', marginRight: 14 },
    avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
    avatarBadge: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: C.navy, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    avatarBadgeDot: { width: 8, height: 8, borderRadius: 4 },
    headerInfo: { flex: 1 },
    headerGreeting: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },
    headerName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
    headerStatusPill: { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 20 },
    headerStatusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
    headerStatusText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 0.5 },
    headerActions: { display: 'flex', gap: 8, marginLeft: 8 },
    headerIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', border: 'none', cursor: 'pointer' },
    notifBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', minWidth: 16, height: 16, borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1.5px solid ${C.navy}` },
    notifBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
    eligBanner: { display: 'flex', alignItems: 'center', marginTop: 16, padding: '10px 14px', borderRadius: 12, gap: 8 },
    eligBannerGreen: { backgroundColor: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)' },
    eligBannerAmber: { backgroundColor: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)' },
    eligText: { fontSize: 13, fontWeight: '600' },

    profileBanner: { margin: '16px 16px 0', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: 'calc(100% - 32px)', cursor: 'pointer' },
    profileBannerLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1 },
    profileBannerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FEF3C7', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    profileBannerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 2 },
    profileBannerSub: { fontSize: 12, color: '#B45309' },

    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: -0.3, marginBottom: 14 },
    sectionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    seeAll: { fontSize: 13, color: C.accent, fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' },

    statsGrid: { display: 'flex', gap: 10 },
    statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, alignItems: 'center', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(15,31,61,0.06)' },
    statIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 22, fontWeight: '800', color: C.text },
    statLabel: { fontSize: 10, color: C.muted, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },

    actionsRow: { display: 'flex', gap: 12 },
    actionCard: { flex: 1, borderRadius: 20, padding: 20, position: 'relative', cursor: 'pointer', border: 'none', textAlign: 'left' },
    actionCardPrimary: { backgroundColor: C.navy },
    actionCardGreen: { backgroundColor: C.green },
    actionCardDisabled: { opacity: 0.5, cursor: 'not-allowed' },
    actionIco: { width: 44, height: 44, borderRadius: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    actionTitleWhite: { fontSize: 15, fontWeight: '800', color: '#fff', lineHeight: 1.4 },
    actionHint: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
    actionBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 5px' },
    actionBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },

    recentCard: { backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${C.border}` },
    recentLeft: { display: 'flex', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
    recentIco: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.accentSoft, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    recentDevice: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
    recentDate: { fontSize: 12, color: C.muted },

    infoCard: { backgroundColor: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' },
    infoRowBorder: { borderBottom: `1px solid ${C.border}` },
    infoLabel: { fontSize: 13, color: C.muted },
    infoValue: { fontSize: 13, fontWeight: '600', color: C.text },

    notifCard: { backgroundColor: C.bg, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${C.border}`, cursor: 'pointer' },
    notifUnread: { backgroundColor: '#F0F5FF', borderColor: `${C.accent}40` },
    notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    notifLeft: { display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 },
    notifIconWrap: { width: 32, height: 32, borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    notifTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
    notifTime: { fontSize: 11, color: C.mutedLight },
    notifMsg: { fontSize: 13, color: C.muted, lineHeight: 1.5 },
    notifDelete: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
    unreadPill: { alignSelf: 'flex-start', backgroundColor: C.accentSoft, padding: '3px 8px', borderRadius: 20, marginTop: 8 },
    unreadPillText: { fontSize: 10, fontWeight: '700', color: C.accent },

    deviceCard: { backgroundColor: C.bg, borderRadius: 16, padding: 18, marginBottom: 12, border: `1px solid ${C.border}` },
    deviceCardTop: { display: 'flex', alignItems: 'flex-start', marginBottom: 12 },
    deviceCardName: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 4 },
    deviceCardModel: { fontSize: 12, color: C.muted },
    devicePricePill: { backgroundColor: C.greenSoft, padding: '6px 12px', borderRadius: 12, alignItems: 'center' },
    devicePrice: { fontSize: 18, fontWeight: '800', color: C.green },
    devicePriceLabel: { fontSize: 10, color: C.green, fontWeight: '600' },
    devicePlan: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
    devicePlanDetail: { fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 14 },
    deviceCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    deviceContractPill: { display: 'flex', alignItems: 'center', gap: 5, backgroundColor: C.surface, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: 10 },
    deviceContractText: { fontSize: 12, color: C.muted, fontWeight: '500' },
    applyBtn: { display: 'flex', alignItems: 'center', backgroundColor: C.navy, padding: '10px 16px', borderRadius: 12, gap: 6, border: 'none', cursor: 'pointer' },
    applyBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    appCard: { backgroundColor: C.bg, borderRadius: 16, padding: 16, marginBottom: 12, border: `1px solid ${C.border}` },
    appCardHeader: { display: 'flex', alignItems: 'flex-start', marginBottom: 14 },
    appDeviceName: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 3 },
    appDeviceModel: { fontSize: 12, color: C.muted },
    appRow: { display: 'flex', gap: 12, marginBottom: 12 },
    appDetail: { flex: 1, backgroundColor: C.surface, padding: 12, borderRadius: 12, border: `1px solid ${C.border}` },
    appDetailLabel: { fontSize: 10, color: C.muted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
    appDetailValue: { fontSize: 13, fontWeight: '600', color: C.text },
    appCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    appDate: { fontSize: 12, color: C.mutedLight },
    cancelAppBtn: { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', backgroundColor: C.roseSoft, borderRadius: 10, border: `1px solid #FECACA`, cursor: 'pointer' },
    cancelAppText: { fontSize: 12, color: C.rose, fontWeight: '700' },
    rejectionBanner: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, padding: 12, backgroundColor: C.roseSoft, borderRadius: 10, border: `1px solid #FECACA` },
    rejectionText: { fontSize: 12, color: '#7F1D1D', flex: 1, lineHeight: 1.4 },

    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: C.muted, marginTop: 16, marginBottom: 6 },
    emptyText: { fontSize: 14, color: C.mutedLight, textAlign: 'center' },
    emptyBtn: { backgroundColor: C.navy, padding: '12px 24px', borderRadius: 12, marginTop: 20, border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer' },
};

const modalStyles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,31,61,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 },
    sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, width: '100%', maxHeight: '88%', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    sheetHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, margin: '12px auto 4px' },
    sheetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, borderBottom: `1px solid ${C.border}` },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: C.text },
    sheetSub: { fontSize: 13, color: C.muted, marginTop: 2 },
    sheetAction: { backgroundColor: C.accentSoft, padding: '6px 12px', borderRadius: 20, border: 'none', fontSize: 12, color: C.accent, fontWeight: '700', cursor: 'pointer' },
    modalContent: { flex: 1, overflowY: 'auto' },
    list: { padding: 16 },
};
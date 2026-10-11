// navigation/AppNavigator.jsx
// Updated:
//  - /notifications route added → NotificationsScreen
//  - SidebarLayout no longer needs onNotificationsClick (it navigates internally)
//  - /complete-profile now renders ProfileScreen (combined account + profile)

import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ToastProvider } from "../components/ToastProvider";
import SidebarLayout from "../components/SidebarLayout";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { notificationAPI } from "../services/api";
import { useAuthConfig } from "../services/useAuthConfig";

// Public screens
import WelcomeScreen        from "../screens/WelcomeScreen";
import AboutScreen          from "../screens/AboutScreen";
import RegisterScreen       from "../screens/Auth/RegisterScreen";
import ClientRegisterScreen from "../screens/Auth/ClientRegisterScreen";
import LoginScreen          from "../screens/Auth/LoginScreen";
import AuthCallbackScreen   from "../screens/Auth/AuthCallbackScreen";

// Client screens
import ClientDashboard          from "../screens/Client/ClientDashboard";
import ProfileScreen            from "../screens/Client/ProfileScreen";          // ← replaces CompleteProfileScreen
import DeviceCatalogScreen      from "../screens/Client/DeviceCatalogScreen";
import MyApplicationsScreen     from "../screens/Client/MyApplicationsScreen";
import NotificationsScreen      from "../screens/Client/NotificationsScreen";   // ← NEW
import ApplicationDetailsScreen from "../screens/Client/ApplicationDetailsScreen";

const AUTH_ROUTES = ['/', '/about', '/register', '/client-register', '/login', '/auth/callback'];

// With directory sign-in (Active Directory / Microsoft) nobody registers: the account is created on first sign-in.
function RegistrationGate({ children }) {
    const { config, loaded } = useAuthConfig();
    if (!loaded) return null;
    return config.selfRegistration ? children : <Navigate to="/login" replace />;
}

function AppShell() {
    const location = useLocation();
    const navigate = useNavigate();

    const isAuthRoute = AUTH_ROUTES.includes(location.pathname);

    const [user,        setUser]        = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const ud = localStorage.getItem('user');
        if (ud) {
            try { setUser(JSON.parse(ud)); } catch { /* ignore */ }
        }
    }, [location.pathname]);

    useEffect(() => {
        if (!isAuthRoute && user?.client_user_id) {
            notificationAPI.getUnreadCount(user.client_user_id, 'Client')
                .then(r => { if (r.data.success) setUnreadCount(r.data.unreadCount || 0); })
                .catch(() => {});
        }
    }, [user, location.pathname]);

    const routes = (
        <Routes>
            {/* ── Public ── */}
            <Route path="/"                  element={<WelcomeScreen />} />
            <Route path="/about"             element={<AboutScreen />} />
            <Route path="/register"          element={<RegistrationGate><RegisterScreen /></RegistrationGate>} />
            <Route path="/client-register"   element={<RegistrationGate><ClientRegisterScreen /></RegistrationGate>} />
            <Route path="/login"             element={<LoginScreen />} />
            <Route path="/auth/callback"     element={<AuthCallbackScreen />} />

            {/* ── Client (authenticated) ── */}
            <Route path="/client-dashboard"  element={<ClientDashboard />} />
            <Route path="/complete-profile"  element={<ProfileScreen />} />
            <Route path="/device-catalog"    element={<DeviceCatalogScreen />} />
            <Route path="/my-applications"   element={<MyApplicationsScreen />} />
            <Route path="/notifications"     element={<NotificationsScreen />} />
            <Route path="/application-details/:applicationId" element={<ApplicationDetailsScreen />} />
        </Routes>
    );

    if (isAuthRoute) {
        return <div style={{ minHeight: '100vh' }}>{routes}</div>;
    }

    return (
        <SidebarLayout user={user} unreadCount={unreadCount}>
            {routes}
        </SidebarLayout>
    );
}

export default function AppNavigator() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AppShell />
            </ToastProvider>
        </BrowserRouter>
    );
}
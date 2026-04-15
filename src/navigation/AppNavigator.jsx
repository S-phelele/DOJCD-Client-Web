// AppNavigator.js (or directly in app.js)
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastProvider } from "../components/ToastProvider"; // keep if web-compatible

// Screens – ensure these are adapted to React (no React Native dependencies)
import WelcomeScreen from "../screens/WelcomeScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import ClientRegisterScreen from "../screens/Auth/ClientRegisterScreen";
//import OperationalRegisterScreen from "../screens/Auth/OperationalRegisterScreen";
import LoginScreen from "../screens/Auth/LoginScreen";
//import AdminDashboard from "../screens/Admin/AdminDashboard";
import ClientDashboard from "../screens/Client/ClientDashboard";
import CompleteProfileScreen from "../screens/Client/CompleteProfileScreen";
import DeviceCatalogScreen from "../screens/Client/DeviceCatalogScreen";
import MyApplicationsScreen from "../screens/Client/MyApplicationsScreen";
import ApplicationDetailsScreen from "../screens/Client/ApplicationDetailsScreen";

// Simple header that mimics the native stack header styling
function PageHeader() {
    const location = useLocation();
    const getTitle = () => {
        switch (location.pathname) {
            case "/":
                return "";
            case "/register":
                return "Choose Registration";
            case "/client-register":
                return "Client Registration";
            case "/operational-register":
                return "Operational Registration";
            case "/login":
                return "Sign In";
            case "/admin-dashboard":
                return "Admin Dashboard";
            case "/client-dashboard":
                return "Client Dashboard";
            case "/complete-profile":
                return "Complete Profile";
            case "/device-catalog":
                return "Device Catalog";
            case "/my-applications":
                return "My Applications";
            default:
                if (location.pathname.startsWith("/application-details/"))
                    return "Application Details";
                return "App";
        }
    };
    const title = getTitle();
    if (!title) return null;
    return (
        <header
            style={{
                backgroundColor: "#1e3a8a",
                color: "#fff",
                padding: "16px 20px",
                fontWeight: "600",
                fontSize: "1.2rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
        >
            {title}
        </header>
    );
}

// Main navigator component for web
export default function AppNavigator() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
                    <PageHeader />
                    <Routes>
                        <Route path="/" element={<WelcomeScreen />} />
                        <Route path="/register" element={<RegisterScreen />} />
                        <Route path="/client-register" element={<ClientRegisterScreen />} />
                        {/*<Route*/}
                        {/*    path="/operational-register"*/}
                        {/*    element={<OperationalRegisterScreen />}*/}
                        {/*/>*/}
                        <Route path="/login" element={<LoginScreen />} />
                        {/*<Route path="/admin-dashboard" element={<AdminDashboard />} />*/}
                        <Route path="/client-dashboard" element={<ClientDashboard />} />
                        <Route
                            path="/complete-profile"
                            element={<CompleteProfileScreen />}
                        />
                        <Route path="/device-catalog" element={<DeviceCatalogScreen />} />
                        <Route path="/my-applications" element={<MyApplicationsScreen />} />
                        <Route
                            path="/application-details/:applicationId"
                            element={<ApplicationDetailsScreen />}
                        />
                    </Routes>
                </div>
            </ToastProvider>
        </BrowserRouter>
    );
}
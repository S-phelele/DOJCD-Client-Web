import { authAPI, API_BASE_URL } from './api';

// How people sign in is a server setting (AUTH_PROVIDER): "local" email + password, "ldap" domain credentials,
// or "entra" Microsoft sign-in. This is what we assume until the server says otherwise, and what an older
// server (without /auth/config) is treated as.
export const LOCAL_AUTH = Object.freeze({
    provider: 'local',
    directory: false,
    loginMethod: 'password',
    selfRegistration: true,
    passwordManagedLocally: true,
    usernameLabel: 'Email',
});

let cached = null;

export async function fetchAuthConfig({ force = false } = {}) {
    if (cached && !force) return cached;
    try {
        const body = await authAPI.getConfig();
        if (body?.data && typeof body.data.provider === 'string') {
            cached = { ...LOCAL_AUTH, ...body.data };
            return cached;
        }
    } catch (_) { /* unreachable, or an older server: fall through */ }
    return LOCAL_AUTH;        // not cached, so the next screen asks again
}

export const resetAuthConfigCache = () => { cached = null; };

// Where the browser goes to start the Microsoft sign-in. The server sends the person back to /auth/callback here.
export function microsoftSignInUrl(origin = window.location.origin) {
    const redirect = `${origin}/auth/callback`;
    return `${API_BASE_URL}/auth/entra/login?audience=client&redirect=${encodeURIComponent(redirect)}`;
}

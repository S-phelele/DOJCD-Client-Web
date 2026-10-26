// Stores a successful sign-in the same way for every way of signing in (password form, Microsoft callback).
export function saveClientSession({ user, accessToken, refreshToken }) {
    localStorage.setItem('user', JSON.stringify(user));
    if (accessToken)  localStorage.setItem('clientToken', accessToken);
    if (refreshToken) localStorage.setItem('clientRefreshToken', refreshToken);
}

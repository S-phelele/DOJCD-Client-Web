import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useLocation: () => ({ pathname: '/login' }) }), { virtual: true });
jest.mock('../../components/PublicNavbar', () => () => <nav data-testid="navbar" />);
jest.mock('../../components/PublicFooter', () => () => <footer />);

const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn(), info: jest.fn() };
jest.mock('../../components/ToastProvider', () => ({ useToast: () => mockToast }));

const mockLogin = jest.fn();
jest.mock('../../services/api', () => ({
    API_BASE_URL: 'https://api.example.gov.za/api',
    authAPI: { login: (...a) => mockLogin(...a) },
}));

const mockFetchConfig = jest.fn();
jest.mock('../../services/authConfig', () => ({
    ...jest.requireActual('../../services/authConfig'),
    fetchAuthConfig: (...a) => mockFetchConfig(...a),
}));
const { LOCAL_AUTH } = jest.requireActual('../../services/authConfig');

const LoginScreen = require('./LoginScreen').default;

const serverSays = (over) => mockFetchConfig.mockResolvedValue({ ...LOCAL_AUTH, ...over });
const DIRECTORY = { directory: true, passwordManagedLocally: false, selfRegistration: false };

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); });

describe('LoginScreen', () => {
    it('local mode: email, password, forgot-password and the register card, as before', async () => {
        serverSays({});
        render(<LoginScreen />);
        expect(await screen.findByText('EMAIL ADDRESS')).toBeInTheDocument();
        await waitFor(() => expect(mockFetchConfig).toHaveBeenCalled());
        expect(screen.getByText('Forgot password?')).toBeInTheDocument();
        expect(screen.getByText('Register as Client')).toBeInTheDocument();
    });

    it('local mode still insists on a valid email and a 6-character password', async () => {
        serverSays({});
        render(<LoginScreen />);
        await screen.findByText('EMAIL ADDRESS');
        fireEvent.change(screen.getByPlaceholderText('your.email@dojcd.gov.za'), { target: { value: 'jsmith' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'abc' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
        expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
        expect(screen.getByText('At least 6 characters required')).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('ldap mode: accepts a username (the directory decides what is valid) and signs in with the same call', async () => {
        serverSays({ provider: 'ldap', loginMethod: 'password', ...DIRECTORY });
        mockLogin.mockResolvedValue({ success: true, message: 'Login successful', data: { user: { client_user_id: 9 }, accessToken: 'a', refreshToken: 'r' } });
        render(<LoginScreen />);

        expect(await screen.findByText('USERNAME OR EMAIL')).toBeInTheDocument();
        expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
        expect(screen.queryByText('Register as Client')).not.toBeInTheDocument();
        expect(screen.getByText(/nothing to register/i)).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/DOMAIN/), { target: { value: 'EXAMPLE\\jsmith' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'abc' } });   // short: still sent
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: 'EXAMPLE\\jsmith', password: 'abc' }));
        await waitFor(() => expect(localStorage.getItem('clientToken')).toBe('a'));
    });

    it('entra mode: a Microsoft button that starts the sign-in on the API, and no password form', async () => {
        serverSays({ provider: 'entra', loginMethod: 'microsoft', ...DIRECTORY });
        render(<LoginScreen />);

        const link = await screen.findByRole('link', { name: /sign in with microsoft/i });
        const url = new URL(link.getAttribute('href'));
        expect(url.origin + url.pathname).toBe('https://api.example.gov.za/api/auth/entra/login');
        expect(url.searchParams.get('audience')).toBe('client');
        expect(url.searchParams.get('redirect')).toBe(`${window.location.origin}/auth/callback`);

        expect(screen.queryByPlaceholderText('Enter your password')).not.toBeInTheDocument();
        expect(screen.queryByText('Register as Client')).not.toBeInTheDocument();
    });
});

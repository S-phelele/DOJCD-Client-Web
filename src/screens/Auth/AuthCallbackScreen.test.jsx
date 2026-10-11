import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

const mockExchange = jest.fn();
jest.mock('../../services/api', () => ({ authAPI: { exchangeTicket: (...a) => mockExchange(...a) } }));

const AuthCallbackScreen = require('./AuthCallbackScreen').default;

const visit = (search) => window.history.pushState({}, '', `/auth/callback${search}`);
const sessionBody = () => ({
    success: true,
    data: { user: { client_user_id: 5, first_name: 'Pat', registration_status: 'Pending' }, accessToken: 'access-1', refreshToken: 'refresh-1' },
});

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); });

describe('AuthCallbackScreen', () => {
    it('swaps the ticket for a session, takes it out of the address bar and opens the dashboard', async () => {
        visit('?ticket=one-time');
        mockExchange.mockResolvedValue(sessionBody());

        render(<AuthCallbackScreen />);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/client-dashboard', { replace: true }));
        expect(mockExchange).toHaveBeenCalledWith('one-time');
        expect(window.location.search).toBe('');
        expect(localStorage.getItem('clientToken')).toBe('access-1');
        expect(localStorage.getItem('clientRefreshToken')).toBe('refresh-1');
        expect(JSON.parse(localStorage.getItem('user'))).toMatchObject({ client_user_id: 5 });
    });

    it('swaps the ticket only once even when React runs the effect twice', async () => {
        visit('?ticket=once');
        mockExchange.mockResolvedValue(sessionBody());
        render(<React.StrictMode><AuthCallbackScreen /></React.StrictMode>);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
        expect(mockExchange).toHaveBeenCalledTimes(1);
    });

    it('explains why Microsoft or the server refused the sign-in, and offers a way back', async () => {
        visit('?error=NOT_ALLOWED&error_description=Your%20account%20is%20not%20permitted%20to%20use%20the%20client%20portal.');
        render(<AuthCallbackScreen />);

        expect(await screen.findByRole('alert')).toHaveTextContent(/not permitted to use the client portal/);
        expect(mockExchange).not.toHaveBeenCalled();
        expect(localStorage.getItem('clientToken')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('says so when there is neither a ticket nor an error', async () => {
        visit('');
        render(<AuthCallbackScreen />);
        expect(await screen.findByRole('alert')).toHaveTextContent(/not valid/);
    });

    it('shows the server\'s message when the ticket is refused', async () => {
        visit('?ticket=stale');
        mockExchange.mockRejectedValue(Object.assign(new Error('x'), { response: { data: { message: 'This sign-in link has expired. Please sign in again.' } } }));
        render(<AuthCallbackScreen />);
        expect(await screen.findByRole('alert')).toHaveTextContent(/expired/);
        expect(localStorage.getItem('clientToken')).toBeNull();
    });
});

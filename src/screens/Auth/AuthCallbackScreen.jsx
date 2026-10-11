// screens/Auth/AuthCallbackScreen.jsx
// Where Microsoft sign-in lands. The server has already checked the person with Microsoft and sent the browser
// here with a one-time ticket (?ticket=) or an explanation (?error=). The ticket is swapped for the session, so
// tokens never appear in an address bar or the browser history.

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { saveClientSession } from '../../services/session';

const C = { navy: '#0F1F3D', accent: '#1E4FD8', bg: '#F4F6FA', border: '#E2E8F2', muted: '#64748B', error: '#DC2626', errorSoft: '#FEF2F2' };

export default function AuthCallbackScreen() {
    const navigate = useNavigate();
    const started = useRef(false);            // a ticket works once: never swap it twice (React may run effects twice in development)
    const [problem, setProblem] = useState('');

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const params = new URLSearchParams(window.location.search);
        const ticket = params.get('ticket');
        const error = params.get('error');

        if (!ticket) {
            setProblem(params.get('error_description') ||
                (error ? 'Microsoft sign-in was not completed.' : 'This sign-in link is not valid. Please sign in again.'));
            return;
        }

        window.history.replaceState(null, '', window.location.pathname);   // take the ticket out of the address bar at once

        authAPI.exchangeTicket(ticket)
            .then((body) => {
                if (!body?.success || !body.data?.user) throw new Error(body?.message || 'Sign-in could not be completed.');
                saveClientSession(body.data);
                navigate('/client-dashboard', { replace: true });
            })
            .catch((err) => setProblem(err.response?.data?.message || err.message || 'Sign-in could not be completed. Please try again.'));
    }, [navigate]);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {problem ? (
                <div role="alert" style={{ maxWidth: 440, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, textAlign: 'center' }}>
                    <h1 style={{ fontSize: 20, margin: '0 0 8px', color: C.navy }}>Sign-in failed</h1>
                    <p style={{ fontSize: 14, color: C.error, background: C.errorSoft, borderRadius: 10, padding: 12, margin: '0 0 18px' }}>{problem}</p>
                    <button type="button" onClick={() => navigate('/login', { replace: true })}
                            style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 22px', fontWeight: 700, cursor: 'pointer' }}>
                        Back to sign in
                    </button>
                </div>
            ) : (
                <p style={{ color: C.muted, fontSize: 14 }}>Signing you in…</p>
            )}
        </div>
    );
}

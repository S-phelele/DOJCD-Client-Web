// components/AuthNavbar.jsx
// Shared navbar for Welcome, About, Login, Register, ClientRegister.
// Smart tab hiding: hides "Login" on /login, hides "Register" on /register or /client-register, etc.
// Responsive: full links ≥641px, hamburger drawer ≤640px.

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoMenuOutline, IoCloseOutline } from 'react-icons/io5';

const C = {
    navy: '#0F1F3D', accent: '#1E4FD8', surface: '#FFFFFF',
    border: '#E2E8F2', muted: '#64748B',
};
const NAVBAR_H = 64;

export default function PublicNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const p = location.pathname;

    useEffect(() => {
        const h = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', h);
        return () => window.removeEventListener('scroll', h);
    }, []);
    useEffect(() => { setOpen(false); }, [p]);

    const isLogin    = p === '/login';
    const isRegister = p === '/register' || p === '/client-register';
    const isAbout    = p === '/about';
    const isHome     = p === '/';

    const links = [
        { id: 'home',     label: 'Home',     to: '/',         show: !isHome,     type: 'text' },
        { id: 'about',    label: 'About',    to: '/about',    show: !isAbout,    type: 'text' },
        { id: 'login',    label: 'Login',    to: '/login',    show: !isLogin,    type: 'outline' },
        { id: 'register', label: 'Register', to: '/register', show: !isRegister, type: 'filled' },
    ].filter(l => l.show);

    const go = (to) => { navigate(to); setOpen(false); };

    return (
        <>
            <style>{navbarCSS}</style>
            <nav className={`anb-nav${scrolled ? ' anb-scrolled' : ''}`}>
                <div className="anb-inner">
                    {/* Logo */}
                    <button className="anb-logo" onClick={() => go('/')}>
                        <span className="anb-logo-icon">⚖️</span>
                        <span className="anb-logo-text">
                            <strong>DOJCD</strong>
                            <small>Connect</small>
                        </span>
                    </button>

                    {/* Desktop links */}
                    <div className="anb-links">
                        {links.map(link => (
                            <button
                                key={link.id}
                                className={`anb-btn anb-btn-${link.type}${p === link.to ? ' anb-active' : ''}`}
                                onClick={() => go(link.to)}
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* Hamburger */}
                    <button className="anb-burger" onClick={() => setOpen(v => !v)}>
                        {open ? <IoCloseOutline size={26} color={C.navy} /> : <IoMenuOutline size={26} color={C.navy} />}
                    </button>
                </div>

                {/* Mobile drawer */}
                {open && (
                    <div className="anb-drawer">
                        {links.map(link => (
                            <button
                                key={link.id}
                                className={`anb-mob-item anb-mob-${link.type}${p === link.to ? ' anb-mob-active' : ''}`}
                                onClick={() => go(link.to)}
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>
                )}
            </nav>
            <div style={{ height: NAVBAR_H }} />
        </>
    );
}

const navbarCSS = `
  .anb-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 600;
    background: #fff;
    box-shadow: 0 1px 0 rgba(15,31,61,0.08);
    transition: box-shadow 0.2s ease;
  }
  .anb-scrolled { box-shadow: 0 2px 18px rgba(15,31,61,0.13); }

  .anb-inner {
    max-width: 100%; margin: 0 auto; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px;
  }

  /* Logo */
  .anb-logo {
    display: flex; align-items: center; gap: 10px;
    background: none; border: none; cursor: pointer; padding: 0; text-decoration: none;
  }
  .anb-logo-icon {
    width: 38px; height: 38px; border-radius: 10px;
    background: #0F1F3D;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .anb-logo-text {
    display: flex; flex-direction: column; align-items: flex-start; line-height: 1;
  }
  .anb-logo-text strong { font-size: 16px; font-weight: 900; color: #0F1F3D; letter-spacing: 0.4px; }
  .anb-logo-text small  { font-size: 10px; font-weight: 600; color: #64748B; letter-spacing: 0.3px; margin-top: 2px; }

  /* Desktop links */
  .anb-links { display: flex; align-items: center; gap: 8px; }

  /* Base button reset */
  .anb-btn {
    font-family: inherit; cursor: pointer; border: none;
    font-size: 14px; font-weight: 600;
    border-radius: 10px; padding: 7px 14px;
    transition: background 0.15s, opacity 0.15s, color 0.15s;
    position: relative;
  }

  /* Text variant */
  .anb-btn-text { background: none; color: #64748B; border: none; }
  .anb-btn-text:hover { background: #F8FAFC; color: #0F1F3D; }
  .anb-btn-text.anb-active { color: #0F1F3D; }
  .anb-btn-text.anb-active::after {
    content: ''; display: block;
    position: absolute; bottom: 2px; left: 14px; right: 14px;
    height: 2px; border-radius: 1px; background: #1E4FD8;
  }

  /* Outline variant */
  .anb-btn-outline {
    background: transparent; color: #0F1F3D;
    border: 1.5px solid #0F1F3D !important;
  }
  .anb-btn-outline:hover { background: #F4F6FA; }

  /* Filled variant */
  .anb-btn-filled {
    background: #0F1F3D; color: #fff;
    box-shadow: 0 3px 8px rgba(15,31,61,0.22);
    border: none !important;
  }
  .anb-btn-filled:hover { opacity: 0.88; }

  /* Hamburger — hidden on desktop */
  .anb-burger {
    display: none; align-items: center; justify-content: center;
    background: none; border: none; cursor: pointer;
    padding: 6px; border-radius: 8px;
  }

  /* Mobile drawer */
  .anb-drawer {
    border-top: 1px solid #E2E8F2; background: #fff;
    padding: 12px 20px 20px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .anb-mob-item {
    font-family: inherit; text-align: left; background: none;
    border: none; cursor: pointer;
    font-size: 15px; font-weight: 600; color: #64748B;
    padding: 13px 12px; border-radius: 10px;
    transition: background 0.15s ease;
  }
  .anb-mob-item:hover { background: #F4F6FA; }
  .anb-mob-active { color: #0F1F3D; }
  .anb-mob-filled {
    background: #0F1F3D; color: #fff;
    border-radius: 12px; padding: 14px 16px; margin-top: 6px;
    box-shadow: 0 3px 8px rgba(15,31,61,0.2);
  }
  .anb-mob-filled:hover { opacity: 0.88; background: #0F1F3D; }
  .anb-mob-outline {
    border: 1.5px solid #0F1F3D;
    color: #0F1F3D; border-radius: 10px;
  }

  /* Responsive breakpoint */
  @media (max-width: 640px) {
    .anb-links  { display: none; }
    .anb-burger { display: flex; }
  }
`;
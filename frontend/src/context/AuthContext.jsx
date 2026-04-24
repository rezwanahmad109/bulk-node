import { createContext, useContext, useEffect, useState } from 'react';

/**
 * AuthContext
 * Single source of truth for the authenticated user across the entire app.
 * Reads from localStorage on mount so the session persists across page refreshes.
 */
const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('bulknode_user');
        if (!stored) return null;

        try {
            return JSON.parse(stored);
        } catch {
            localStorage.removeItem('bulknode_user');
            return null;
        }
    });
    const [authChecking, setAuthChecking] = useState(true);

    const clearSession = () => {
        localStorage.removeItem('bulknode_token');
        localStorage.removeItem('bulknode_user');
        setUser(null);
    };

    useEffect(() => {
        const verifyStoredSession = async () => {
            const token = localStorage.getItem('bulknode_token');
            if (!token) {
                clearSession();
                setAuthChecking(false);
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();
                if (!res.ok || !data?.user) {
                    clearSession();
                    setAuthChecking(false);
                    return;
                }

                setUser(data.user);
                localStorage.setItem('bulknode_user', JSON.stringify(data.user));
            } catch {
                clearSession();
            } finally {
                setAuthChecking(false);
            }
        };

        void verifyStoredSession();
    }, []);

    // Call after a successful login or register API response
    const login = (userData, token) => {
        localStorage.setItem('bulknode_token', token);
        localStorage.setItem('bulknode_user', JSON.stringify(userData));
        setUser(userData);
        setAuthChecking(false);
    };

    // Clear all session data and redirect handled by the caller
    const logout = () => {
        clearSession();
        setAuthChecking(false);
    };

    // Helper: generate initials from fullName (e.g. "Rezwan Ahmad" → "RA")
    const getInitials = () => {
        if (!user?.fullName) return '?';
        return user.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, getInitials, authChecking }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook — use this in any component instead of useContext directly
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

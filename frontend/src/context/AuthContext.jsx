import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext
 * Single source of truth for the authenticated user across the entire app.
 * Reads from localStorage on mount so the session persists across page refreshes.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Hydrate user from localStorage on first load
        const stored = localStorage.getItem('bulknode_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('bulknode_user');
            }
        }
    }, []);

    // Call after a successful login or register API response
    const login = (userData, token) => {
        localStorage.setItem('bulknode_token', token);
        localStorage.setItem('bulknode_user', JSON.stringify(userData));
        setUser(userData);
    };

    // Clear all session data and redirect handled by the caller
    const logout = () => {
        localStorage.removeItem('bulknode_token');
        localStorage.removeItem('bulknode_user');
        setUser(null);
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
        <AuthContext.Provider value={{ user, login, logout, getInitials }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook — use this in any component instead of useContext directly
export const useAuth = () => useContext(AuthContext);

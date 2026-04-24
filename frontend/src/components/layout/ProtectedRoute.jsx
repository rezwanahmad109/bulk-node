import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute() {
    const location = useLocation();
    const { user, authChecking } = useAuth();
    const token = localStorage.getItem('bulknode_token');

    if (authChecking) {
        return (
            <div className="min-h-screen bg-[#111B21] text-slate-300 flex items-center justify-center">
                Validating session...
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet />;
}

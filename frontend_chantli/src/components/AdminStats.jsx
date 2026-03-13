import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Home as HomeIcon, Wallet, 
    TrendingUp, Users, CalendarCheck, Star, Heart, Activity
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const AdminStats = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAdminStats = async () => {
            const token = localStorage.getItem('chantli_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/admin-stats/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });

                if (res.status === 403) {
                    throw new Error("Acceso denegado. No tienes permisos de administrador.");
                }
                
                if (!res.ok) throw new Error("Error al cargar las métricas.");

                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminStats();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold mb-4">{error}</div>
                <button onClick={() => navigate('/home')} className="text-brand-600 hover:underline">Regresar al Inicio</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            
            {/* ======================================================== */}
            {/* HEADER UNIFICADO CHANTLI                                 */}
            {/* ======================================================== */}
            <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm sticky top-0 z-30 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center pointer-events-auto">
                    <div className="bg-white rounded-full shadow-sm flex items-center p-1 border border-gray-200 transition hover:bg-gray-50">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 rounded-full hover:bg-gray-100 transition active:scale-95"
                            title="Volver"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        
                        <div className="h-5 w-px bg-gray-200 mx-1"></div>
                        
                        <div 
                            onClick={() => navigate('/home')} 
                            className="flex items-center gap-1.5 justify-center px-3 pr-4 cursor-pointer group transition"
                            title="Ir a Inicio"
                        >
                            <HomeIcon strokeWidth={1.5} className="h-5 w-5 text-brand-600 group-hover:scale-105 transition-transform" />
                            <span className="font-logo text-lg tracking-[0.15em] text-gray-900 group-hover:text-brand-700 transition uppercase pt-0.5">
                                Chantli
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-brand-600" />
                    <h1 className="text-lg font-bold text-gray-900 mr-2 hidden sm:block">Métricas Generales</h1>
                </div>
            </div>

            {/* ======================================================== */}
            {/* PANEL DE CONTROL (DASHBOARD)                             */}
            {/* ======================================================== */}
            <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
                
                {/* --- 1. REVENUE Y SEPARACIÓN DE INGRESOS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Ingresos Totales (Gross Volume) */}
                    <div className="bg-gray-900 rounded-3xl p-6 shadow-xl text-white md:col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-between relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 opacity-10">
                            <TrendingUp className="h-48 w-48" />
                        </div>
                        <div className="relative z-10 mb-6 sm:mb-0">
                            <h2 className="text-gray-400 font-bold text-sm tracking-wider uppercase mb-1">Volumen Bruto Generado (GMV)</h2>
                            <p className="text-4xl md:text-5xl font-extrabold">${stats.ingresos_totales.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                            <p className="text-xs text-gray-500 mt-2">Total de reservas pagadas en la plataforma.</p>
                        </div>
                        
                        {/* Split de Ganancias */}
                        <div className="relative z-10 w-full sm:w-auto flex gap-4 bg-gray-800 p-4 rounded-2xl border border-gray-700">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Wallet className="h-3 w-3" /> Chantli (10%)</p>
                                <p className="text-xl font-bold text-green-400">${stats.ganancias_chantli.toLocaleString('es-MX')}</p>
                            </div>
                            <div className="w-px bg-gray-600"></div>
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase mb-1 flex items-center gap-1"><Users className="h-3 w-3" /> Anfitriones (90%)</p>
                                <p className="text-xl font-bold text-white">${stats.ganancias_anfitriones.toLocaleString('es-MX')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2. MÉTRICAS OPERATIVAS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Ocupación Mensual */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                                <CalendarCheck className="h-6 w-6" />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-900">{stats.ocupacion_porcentaje}%</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Ocupación Mensual</h3>
                            <p className="text-xs text-gray-500 mt-1">Propiedades activas este mes vs inventario total ({stats.propiedades_totales}).</p>
                        </div>
                        {/* Barra de progreso visual */}
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.ocupacion_porcentaje}%` }}></div>
                        </div>
                    </div>

                    {/* Salud de Reputación */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600">
                                <Star className="h-6 w-6 fill-current" />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-900">{stats.promedio_rating}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Salud de Reputación</h3>
                            <p className="text-xs text-gray-500 mt-1">Calificación promedio global basada en <strong>{stats.total_resenas}</strong> reseñas reales.</p>
                        </div>
                    </div>

                    {/* Rendimiento de Favoritos */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition sm:col-span-2 lg:col-span-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-red-50 p-3 rounded-xl text-red-500">
                                <Heart className="h-6 w-6 fill-current" />
                            </div>
                            <span className="text-3xl font-extrabold text-gray-900">{stats.total_favoritos}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Interés (Favoritos)</h3>
                            <p className="text-xs text-gray-500 mt-1">Veces que los usuarios han guardado propiedades en su Wishlist.</p>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminStats;
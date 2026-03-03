import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Calendar, MapPin, DollarSign, 
    CheckCircle, Clock, XCircle, Home, User, FileText 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const HistorialRentas = () => {
    const navigate = useNavigate();
    const [reservas, setReservas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reservaActiva, setReservaActiva] = useState(null);

    useEffect(() => {
        fetchHistorial();
    }, []);

    const fetchHistorial = async () => {
        const token = localStorage.getItem('chantli_token');
        try {
            const res = await fetch(`${API_URL}/api/reservas/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                const misRentas = data.filter(r => r.huesped !== null); 
                misRentas.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                setReservas(misRentas);
            }
        } catch (error) {
            console.error("Error cargando historial:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fechaString) => {
        if (!fechaString) return 'Fecha sin definir';
        const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-MX', opciones);
    };

    const getEstadoInfo = (estado) => {
        switch (estado) {
            case 'pagada':
            case 'finalizada':
                return { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" />, texto: 'Confirmada / Pagada' };
            case 'aceptada':
            case 'esperando_pago':
                return { color: 'bg-orange-100 text-orange-700', icon: <Clock className="h-4 w-4" />, texto: 'Pendiente de Pago' };
            case 'rechazada':
            case 'cancelada':
                return { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" />, texto: 'Cancelada' };
            default:
                return { color: 'bg-gray-100 text-gray-700', icon: <Clock className="h-4 w-4" />, texto: 'En Revisión' };
        }
    };

    const getFileUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${API_URL}${path}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                <p className="mt-4 text-gray-500 font-medium">Buscando tu historial...</p>
            </div>
        );
    }

    // ==========================================
    // VISTA 2: DETALLE DE LA RENTA SELECCIONADA
    // ==========================================
    if (reservaActiva) {
        const estadoInfo = getEstadoInfo(reservaActiva.estado);

        return (
            <div className="min-h-screen bg-gray-50 pb-20 animate-fade-in">
                <div className="bg-white sticky top-0 z-30 px-4 py-4 shadow-sm flex items-center gap-4">
                    <button onClick={() => setReservaActiva(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Detalles de tu renta</h1>
                </div>

                <div className="w-full h-64 bg-gray-200 relative">
                    <img 
                        src={reservaActiva.propiedad_imagen ? getFileUrl(reservaActiva.propiedad_imagen) : 'https://via.placeholder.com/600x400?text=Sin+Imagen'} 
                        className="w-full h-full object-cover" 
                        alt="Propiedad" 
                    />
                    <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md ${estadoInfo.color.replace('100', '900').replace('700', '100')}`}>
                            {estadoInfo.icon} {estadoInfo.texto}
                        </span>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10 space-y-4">
                    
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-2">{reservaActiva.propiedad_titulo || 'Propiedad sin nombre'}</h2>
                        <p className="text-gray-500 text-sm flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" /> 
                            {reservaActiva.propiedad_direccion || 'Dirección no especificada'}
                        </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Llegada</p>
                                <p className="font-bold text-gray-800">{formatearFecha(reservaActiva.fecha_inicio)}</p>
                            </div>
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Salida</p>
                            <p className="font-bold text-gray-800">{formatearFecha(reservaActiva.fecha_fin)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="h-14 w-14 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                            {reservaActiva.anfitrion_foto ? (
                                <img src={getFileUrl(reservaActiva.anfitrion_foto)} className="w-full h-full object-cover" alt="Anfitrión" />
                            ) : (
                                <User className="text-gray-400 h-6 w-6" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-bold uppercase">Anfitrión</p>
                            <h3 className="font-bold text-gray-900 text-lg truncate">
                                {reservaActiva.anfitrion_nombre ? `${reservaActiva.anfitrion_nombre} ${reservaActiva.anfitrion_apellido || ''}` : (reservaActiva.anfitrion_username || 'Usuario')}
                            </h3>
                        </div>
                        <button 
                            onClick={() => navigate('/inbox')}
                            className="px-4 py-2 bg-brand-50 text-brand-700 font-bold text-sm rounded-lg hover:bg-brand-100 transition"
                        >
                            Mensaje
                        </button>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                            <DollarSign className="h-5 w-5 text-green-600" /> Detalles de Pago
                        </h3>
                        
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Renta Mensual Base</span>
                                <span className="font-medium">${reservaActiva.propiedad_precio ? parseFloat(reservaActiva.propiedad_precio).toLocaleString() : '0.00'}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                <span className="font-bold text-gray-900">Estado Financiero</span>
                                <span className={`font-bold ${estadoInfo.color.split(' ')[1]}`}>
                                    {estadoInfo.texto.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {reservaActiva.estado === 'esperando_pago' && (
                            <button 
                                onClick={() => navigate('/checkout', { 
                                    state: { 
                                        reservaId: reservaActiva.id, 
                                        titulo: reservaActiva.propiedad_titulo, 
                                        precio: reservaActiva.propiedad_precio 
                                    } 
                                })} 
                                className="w-full mt-5 bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition shadow-md"
                            >
                                Proceder al Pago
                            </button>
                        )}
                        {reservaActiva.estado === 'pagada' && (
                            <button 
                                onClick={() => navigate('/invoices')} 
                                className="w-full mt-5 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition shadow-md"
                            >
                                <FileText className="h-4 w-4" /> Ver Recibos Oficiales
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // VISTA 1: LISTA DEL HISTORIAL DE RENTAS
    // ==========================================
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* --- HEADER MODIFICADO CON ICONO DE RECIBOS --- */}
            <div className="bg-white sticky top-0 z-30 px-4 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/home')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                        <ArrowLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Mi Historial</h1>
                </div>
                <button 
                    onClick={() => navigate('/invoices')}
                    className="p-2 bg-brand-50 text-brand-700 rounded-full hover:bg-brand-100 transition shadow-sm flex items-center justify-center"
                    title="Ver Historial de Recibos"
                >
                    <FileText className="h-5 w-5" />
                </button>
            </div>

            <div className="max-w-3xl mx-auto px-4 mt-6">
                {reservas.length === 0 ? (
                    <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-dashed border-gray-300 mt-10">
                        <Home className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h2 className="text-lg font-bold text-gray-800 mb-1">Aún no tienes rentas</h2>
                        <p className="text-sm text-gray-500 mb-6">Tus futuras reservaciones y rentas activas aparecerán aquí.</p>
                        <button onClick={() => navigate('/home')} className="bg-brand-50 text-brand-700 font-bold px-6 py-2 rounded-lg hover:bg-brand-100 transition">
                            Explorar Alojamientos
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reservas.map(reserva => {
                            const estadoInfo = getEstadoInfo(reserva.estado);
                            
                            return (
                                <div 
                                    key={reserva.id} 
                                    onClick={() => setReservaActiva(reserva)}
                                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex gap-4"
                                >
                                    <div className="h-24 w-24 bg-gray-200 rounded-xl overflow-hidden flex-shrink-0 relative">
                                        <img 
                                            src={reserva.propiedad_imagen ? getFileUrl(reserva.propiedad_imagen) : 'https://via.placeholder.com/150'} 
                                            className="w-full h-full object-cover" 
                                            alt="Miniatura" 
                                        />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm truncate">{reserva.propiedad_titulo || 'Propiedad sin nombre'}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" /> 
                                                {formatearFecha(reserva.fecha_inicio)}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={`text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1 w-max ${estadoInfo.color}`}>
                                                {estadoInfo.icon} {estadoInfo.texto}
                                            </span>
                                            <span className="text-xs font-bold text-brand-600 flex items-center">
                                                Ver detalle &rarr;
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorialRentas;
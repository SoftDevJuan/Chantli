import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Edit, Trash2, MessageCircle, User, BarChart, TrendingUp, Star, Wallet, Plus, CreditCard, Loader2, ShieldCheck, MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const HostDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('propiedades'); 
  
  // Estados de datos
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [misTarjetas, setMisTarjetas] = useState([]); 
  const [estadisticas, setEstadisticas] = useState({
      ganancias_totales: 0,
      reservas_pagadas: 0,
      calificacion_promedio: 5.0,
      grafica_mensual: []
  });
  
  const [loading, setLoading] = useState(true);

  // --- LOGOS TARJETA ---
  const VisaLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 w-auto bg-white px-1 rounded-sm border border-gray-200" />;
  const MastercardLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 w-auto" />;
  const AmexLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-4 w-auto" />;

  const getCardLogo = (numero) => {
      if (numero.startsWith('4')) return <VisaLogo />;
      if (numero.startsWith('5')) return <MastercardLogo />;
      if (numero.startsWith('3')) return <AmexLogo />;
      return <CreditCard className="h-5 w-5 text-gray-600" />;
  };

  const getFileUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `${API_URL}${path}`;
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    const token = localStorage.getItem('chantli_token');
    const headers = { 'Authorization': `Token ${token}` };

    try {
        const [resProp, resRes, resCards, resStats] = await Promise.all([
            fetch(`${API_URL}/api/propiedades/mis_propiedades/`, { headers }),
            fetch(`${API_URL}/api/reservas/solicitudes_recibidas/`, { headers }),
            fetch(`${API_URL}/api/tarjetas/`, { headers }),
            fetch(`${API_URL}/api/propiedades/resumen_anfitrion/`, { headers }) 
        ]);

        const dataProp = await resProp.json();
        const dataRes = await resRes.json();
        const dataCards = await resCards.json();
        let dataStats = { ganancias_totales: 0, reservas_pagadas: 0, calificacion_promedio: 5.0, grafica_mensual: [] };
        
        if (resStats.ok) {
            dataStats = await resStats.json();
        }

        setMisPropiedades(Array.isArray(dataProp) ? dataProp : []);
        setSolicitudes(Array.isArray(dataRes) ? dataRes : []);
        setMisTarjetas(Array.isArray(dataCards) ? dataCards : []);
        setEstadisticas(dataStats);
        
        setLoading(false);
    } catch (error) {
        console.error("Error cargando dashboard:", error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // NUEVAS FUNCIONES DE GESTIÓN DE PROPIEDADES
  // ==========================================
  const handleEliminarPropiedad = async (id, titulo) => {
      if (window.confirm(`¿Estás completamente seguro de que deseas eliminar la propiedad "${titulo}"?\n\nEsta acción no se puede deshacer y se perderán todas las reservas y opiniones asociadas.`)) {
          const token = localStorage.getItem('chantli_token');
          try {
              const res = await fetch(`${API_URL}/api/propiedades/${id}/`, {
                  method: 'DELETE',
                  headers: { 'Authorization': `Token ${token}` }
              });

              if (res.ok) {
                  // Eliminamos la propiedad de la vista sin recargar la página entera
                  setMisPropiedades(prev => prev.filter(prop => prop.id !== id));
                  alert("Propiedad eliminada con éxito.");
              } else {
                  alert("Hubo un problema al intentar eliminar la propiedad. Inténtalo de nuevo.");
              }
          } catch (error) {
              alert("Error de conexión con el servidor.");
          }
      }
  };

  const handleEditarPropiedad = (id) => {
      navigate(`/edit-property/${id}`);
  };

  // ==========================================
  // FUNCIÓN PARA RESPONDER SOLICITUDES
  // ==========================================
  const handleResponder = async (id, estado) => {
    const token = localStorage.getItem('chantli_token');
    try {
        const res = await fetch(`${API_URL}/api/reservas/${id}/responder/`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Token ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ estado })
        });

        if (res.ok) {
            setSolicitudes(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
            if (estado === 'pagada') fetchData(); 
        } else {
            alert("Error al actualizar.");
        }
    } catch (error) {
        alert("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 text-gray-900">
      
      {/* HEADER */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-1">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition">
                            <ArrowLeft className="h-6 w-6 text-gray-700" />
                        </button>
                        <button 
                            onClick={() => navigate('/home')} 
                            className="p-2 rounded-full hover:bg-brand-50 transition text-brand-600"
                            title="Ir al Inicio"
                        >
                            <Home className="h-6 w-6" />
                        </button>
                    </div>
            <h1 className="text-lg font-bold text-gray-900">Panel de Anfitrión</h1>
            <div className="w-8"></div>
        </div>

        {/* TABS */}
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {['propiedades', 'reservas', 'estadisticas', 'billetera'].map((tab) => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[90px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all capitalize 
                    ${activeTab === tab ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    {tab === 'reservas' && solicitudes.filter(r => r.estado === 'pendiente').length > 0 ? (
                        <span className="flex items-center justify-center gap-1">
                            Solicitudes
                            <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                {solicitudes.filter(r => r.estado === 'pendiente').length}
                            </span>
                        </span>
                    ) : tab}
                </button>
            ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="p-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                Cargando...
            </div>
        ) : (
            <>
                {/* --- TAB 1: MIS PROPIEDADES --- */}
                {activeTab === 'propiedades' && (
                    <div className="space-y-4 animate-fade-in">
                        {misPropiedades.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                                <Home className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No tienes propiedades.</p>
                                <button onClick={() => navigate('/create')} className="mt-2 text-blue-600 font-bold text-sm hover:underline">Crear una</button>
                            </div>
                        ) : (
                            misPropiedades.map(prop => (
                                <div key={prop.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 transition-transform hover:shadow-md">
                                    <img 
                                        src={prop.imagen ? getFileUrl(prop.imagen) : "https://via.placeholder.com/150"} 
                                        className="h-24 w-24 rounded-lg object-cover bg-gray-200 cursor-pointer" 
                                        alt="Propiedad" 
                                        onClick={() => navigate(`/property/${prop.id}`)}
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="cursor-pointer" onClick={() => navigate(`/property/${prop.id}`)}>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{prop.titulo}</h3>
                                            <p className="text-xs text-gray-400 flex items-center mt-0.5 mb-1 line-clamp-1"><MapPin className="h-3 w-3 mr-1"/> {prop.direccion}</p>
                                            <p className="text-sm font-bold text-brand-600">${parseFloat(prop.precio).toLocaleString()} / mes</p>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {/* BOTONES FUNCIONALES */}
                                            <button onClick={() => handleEditarPropiedad(prop.id)} className="flex-1 flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-lg border border-gray-200 transition">
                                                <Edit className="h-3 w-3 mr-1" /> Editar
                                            </button>
                                            <button onClick={() => handleEliminarPropiedad(prop.id, prop.titulo)} className="flex-1 flex items-center justify-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 py-1.5 rounded-lg border border-red-100 transition">
                                                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <button onClick={() => navigate('/create')} className="w-full py-4 bg-brand-50 text-brand-700 font-bold rounded-xl flex items-center justify-center gap-2 mt-4 hover:bg-brand-100 transition border border-brand-200">
                            <Plus className="h-5 w-5" /> Publicar Propiedad Nueva
                        </button>
                    </div>
                )}

                {/* --- TAB 2: SOLICITUDES (MEJORADO CON INFO DEL HUÉSPED) --- */}
                {activeTab === 'reservas' && (
                    <div className="space-y-4 animate-fade-in">
                         {solicitudes.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                                No tienes solicitudes ni reservas activas.
                            </div>
                        ) : (
                            solicitudes.map(reserva => (
                                <div key={reserva.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 transition hover:shadow-md">
                                    
                                    {/* Encabezado del Estado */}
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide
                                            ${reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${reserva.estado === 'esperando_pago' ? 'bg-blue-100 text-blue-800' : ''}
                                            ${(reserva.estado === 'pagada' || reserva.estado === 'aceptada') ? 'bg-green-100 text-green-800' : ''}
                                            ${reserva.estado === 'rechazada' ? 'bg-red-100 text-red-800' : ''}
                                        `}>
                                            {reserva.estado.replace('_', ' ')}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fechas</p>
                                            <span className="text-xs font-bold text-gray-700">{new Date(reserva.fecha_inicio).toLocaleDateString()} - {new Date(reserva.fecha_fin).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    {/* INFO DEL HUÉSPED (Mejorada y Clicable) */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                                        <div 
                                            className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0" 
                                            onClick={() => navigate(`/public-profile/${reserva.huesped}`)}
                                        >
                                            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover:border-brand-200 transition">
                                                {reserva.huesped_foto ? (
                                                    <img src={getFileUrl(reserva.huesped_foto)} className="w-full h-full object-cover" alt="Huésped" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="h-6 w-6"/></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="font-bold text-gray-900 text-sm truncate group-hover:text-brand-600 transition">
                                                    {reserva.huesped_nombre ? `${reserva.huesped_nombre} ${reserva.huesped_apellido || ''}` : `Usuario #${reserva.huesped}`}
                                                </p>
                                                
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {/* Rating del Huésped */}
                                                    <span className="flex items-center text-xs font-bold text-gray-700">
                                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-0.5" /> 5.0
                                                    </span>
                                                    
                                                    {/* Badge de Verificado (asumiendo que viene en la API o es true temporalmente) */}
                                                    <span className="flex items-center text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                                                        <ShieldCheck className="h-3 w-3 mr-0.5" /> Validado
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Botón de Mensaje Rápido */}
                                        <button 
                                            onClick={() => navigate(`/chat/${reserva.huesped}`)}
                                            className="p-2.5 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition flex-shrink-0"
                                            title="Enviar mensaje"
                                        >
                                            <MessageCircle className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Resumen de la Propiedad Solicitada */}
                                    <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                             <img src={reserva.propiedad_imagen ? getFileUrl(reserva.propiedad_imagen) : "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Propiedad Solicitada</p>
                                            <p className="text-xs font-bold text-gray-800 truncate">{reserva.propiedad_titulo}</p>
                                        </div>
                                    </div>

                                    {/* Botones de Acción */}
                                    {reserva.estado === 'pendiente' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleResponder(reserva.id, 'rechazada')} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-xs hover:bg-gray-50 transition">
                                                Rechazar
                                            </button>
                                            <button onClick={() => handleResponder(reserva.id, 'esperando_pago')} className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md hover:bg-brand-700 transition">
                                                Aceptar Solicitud
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- TAB 3: ESTADÍSTICAS --- */}
                {activeTab === 'estadisticas' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm font-medium text-blue-100 mb-1">Ganancias Totales (Billetera)</p>
                                <h2 className="text-3xl font-bold tracking-tight text-white">
                                    ${parseFloat(estadisticas.ganancias_totales).toLocaleString(undefined, {minimumFractionDigits: 2})} MXN
                                </h2>
                                <p className="text-[10px] mt-2 text-blue-200 bg-white/10 inline-block px-2 py-1 rounded">
                                    * Saldo disponible en tarjetas
                                </p>
                            </div>
                            <BarChart className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10 text-white rotate-12" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                                <div className="bg-green-100 p-2 rounded-full mb-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Reservas</p>
                                <p className="text-2xl font-bold text-gray-900">{estadisticas.reservas_pagadas}</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
                                <div className="bg-yellow-100 p-2 rounded-full mb-2">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                </div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Rating</p>
                                <p className="text-2xl font-bold text-gray-900">{estadisticas.calificacion_promedio} ★</p>
                             </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                                <BarChart className="h-4 w-4 text-blue-600" /> Ocupación Mensual
                            </h3>
                            
                            {estadisticas.grafica_mensual.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-xs text-gray-400">Sin datos suficientes.</p>
                                </div>
                            ) : (
                                <div className="flex items-end justify-between h-40 gap-3">
                                    {estadisticas.grafica_mensual.map((mes, idx) => (
                                        <div key={idx} className="flex flex-col items-center justify-end h-full w-full group relative">
                                            <div className="absolute -top-8 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                {mes.cantidad} reservas ({Math.round(mes.porcentaje)}%)
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-t-md relative h-full flex items-end overflow-hidden">
                                                <div 
                                                    className="w-full bg-blue-500 group-hover:bg-blue-600 transition-all duration-500 rounded-t-md"
                                                    style={{ height: `${mes.porcentaje === 0 ? 2 : mes.porcentaje}%` }} 
                                                ></div>
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-gray-500 mt-2">
                                                {mes.mes.substring(0, 3)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB 4: BILLETERA --- */}
                {activeTab === 'billetera' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                            <Wallet className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm">Métodos de Cobro</h3>
                                <p className="text-xs text-blue-700 mt-1">
                                    Aquí recibirás los pagos.
                                </p>
                            </div>
                        </div>

                        {misTarjetas.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                                No hay tarjetas registradas.
                            </div>
                        ) : (
                            misTarjetas.map(card => (
                                <div key={card.id} className="relative overflow-hidden rounded-xl h-40 shadow-sm border border-gray-200 bg-gradient-to-br from-gray-800 to-black p-6 flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white opacity-10 rounded-full blur-2xl"></div>
                                    <div className="relative z-10 flex justify-between items-start">
                                        {getCardLogo(card.numero)}
                                        <span className="text-[10px] font-bold text-gray-400 border border-gray-600 px-2 py-1 rounded">Recepción</span>
                                    </div>
                                    <div className="relative z-10 text-white">
                                        <p className="font-mono text-lg tracking-widest font-bold">•••• {card.numero.slice(-4)}</p>
                                        <div className="flex justify-between items-end mt-4">
                                            <p className="text-xs font-bold uppercase">{card.nombre_titular || 'USUARIO'}</p>
                                            <p className="text-xs font-bold opacity-80">{card.fecha_vencimiento}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <button onClick={() => navigate('/add-card', { state: { from: 'host' } })} className="w-full py-3 bg-white border border-dashed border-gray-300 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 flex justify-center items-center gap-2">
                            <Plus className="h-4 w-4" /> Agregar Tarjeta
                        </button>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
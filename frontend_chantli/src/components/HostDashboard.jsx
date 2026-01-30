import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Edit, Trash2, MessageCircle, User, BarChart, TrendingUp, Star, Wallet, Plus, CreditCard } from 'lucide-react';

const HostDashboard = () => {
  const navigate = useNavigate();
  // Estado para controlar las pestañas: 'propiedades', 'reservas', 'estadisticas', 'billetera'
  const [activeTab, setActiveTab] = useState('propiedades'); 
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [misTarjetas, setMisTarjetas] = useState([]); 
  const [loading, setLoading] = useState(true);

  // --- LOGOS PARA BILLETERA ---
  const VisaLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4 w-auto bg-white px-1 rounded-sm border border-gray-200" />;
  const MastercardLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 w-auto" />; // Mastercard ya tiene sus colores
  const AmexLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-4 w-auto" />;

  const getCardLogo = (numero) => {
      if (numero.startsWith('4')) return <VisaLogo />;
      if (numero.startsWith('5')) return <MastercardLogo />;
      if (numero.startsWith('3')) return <AmexLogo />;
      return <CreditCard className="h-5 w-5 text-gray-600" />;
  };

  // --- Carga de Datos ---
  const fetchData = async () => {
    const token = localStorage.getItem('chantli_token');
    const headers = { 'Authorization': `Token ${token}` };

    try {
        // 1. Cargar Mis Propiedades
        const resProp = await fetch('http://127.0.0.1:8000/api/propiedades/mis_propiedades/', { headers });
        const dataProp = await resProp.json();
        setMisPropiedades(dataProp);

        // 2. Cargar Solicitudes Recibidas
        const resRes = await fetch('http://127.0.0.1:8000/api/reservas/solicitudes_recibidas/', { headers });
        const dataRes = await resRes.json();
        setSolicitudes(dataRes);

        // 3. Cargar Mis Tarjetas
        const resCards = await fetch('http://127.0.0.1:8000/api/tarjetas/', { headers });
        const dataCards = await resCards.json();
        setMisTarjetas(dataCards);
        
        setLoading(false);
    } catch (error) {
        console.error("Error cargando dashboard:", error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Manejar Respuesta (Aceptar/Rechazar) ---
  const handleResponder = async (id, estado) => {
    const token = localStorage.getItem('chantli_token');
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/reservas/${id}/responder/`, {
            method: 'PATCH',
            headers: { 
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado })
        });

        if (res.ok) {
            setSolicitudes(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
        } else {
            alert("Hubo un error al actualizar la reserva.");
        }
    } catch (error) {
        alert("Error de conexión");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* --- HEADER --- */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Panel de Anfitrión</h1>
            <div className="w-8"></div>
        </div>

        {/* --- TABS --- */}
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab('propiedades')}
                className={`flex-1 min-w-[90px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'propiedades' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
            >
                Mis Propiedades
            </button>
            <button 
                onClick={() => setActiveTab('reservas')}
                className={`flex-1 min-w-[90px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'reservas' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
            >
                Solicitudes
                {solicitudes.filter(r => r.estado === 'pendiente').length > 0 && (
                    <span className="ml-1.5 bg-red-500 text-gray-800 text-[10px] px-1.5 py-0.5 rounded-full">
                        {solicitudes.filter(r => r.estado === 'pendiente').length}
                    </span>
                )}
            </button>
            <button 
                onClick={() => setActiveTab('estadisticas')}
                className={`flex-1 min-w-[90px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'estadisticas' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
            >
                Estadísticas
            </button>
            <button 
                onClick={() => setActiveTab('billetera')}
                className={`flex-1 min-w-[90px] py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'billetera' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
            >
                Billetera
            </button>
        </div>
      </div>

      {/* --- CONTENIDO --- */}
      <div className="p-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600 mb-2"></div>
                Cargando...
            </div>
        ) : (
            <>
                {/* --- TAB 1: MIS PROPIEDADES --- */}
                {activeTab === 'propiedades' && (
                    <div className="space-y-4">
                        {misPropiedades.length === 0 ? (
                            <div className="text-center py-10">
                                <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No has publicado nada aún.</p>
                                <button onClick={() => navigate('/create')} className="mt-4 text-brand-600 font-bold text-sm hover:underline">Publicar ahora</button>
                            </div>
                        ) : (
                            misPropiedades.map(prop => (
                                <div key={prop.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                                    <img 
                                        src={prop.imagen || "https://via.placeholder.com/150"} 
                                        className="h-24 w-24 rounded-lg object-cover bg-gray-200" 
                                        alt={prop.titulo}
                                    />
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{prop.titulo}</h3>
                                            <p className="text-sm text-gray-500">${prop.precio} / mes</p>
                                        </div>
                                        <div className="flex gap-3 mt-2">
                                            <button className="flex items-center text-xs font-bold text-gray-600 hover:text-brand-600 bg-gray-50 px-2 py-1 rounded">
                                                <Edit className="h-3 w-3 mr-1" /> Editar
                                            </button>
                                            <button className="flex items-center text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">
                                                <Trash2 className="h-3 w-3 mr-1" /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- TAB 2: SOLICITUDES --- */}
                {activeTab === 'reservas' && (
                    <div className="space-y-4">
                         {solicitudes.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">No tienes solicitudes pendientes.</div>
                        ) : (
                            solicitudes.map(reserva => (
                                <div key={reserva.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                    
                                    {/* 1. Encabezado de la Tarjeta (Estado) */}
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide
                                            ${reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${reserva.estado === 'esperando_pago' ? 'bg-blue-100 text-blue-700' : ''}
                                            
                                            {/* CORRECCIÓN: Verde para Pagada o Aceptada */}
                                            ${(reserva.estado === 'pagada' || reserva.estado === 'aceptada') ? 'bg-green-100 text-green-700' : ''}
                                            
                                            ${reserva.estado === 'rechazada' ? 'bg-red-100 text-red-700' : ''}
                                            ${reserva.estado === 'cancelada' ? 'bg-gray-100 text-gray-500' : ''}
                                        `}>
                                            {reserva.estado.replace('_', ' ')}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900">{reserva.fecha_inicio}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">Inicio</div>
                                        </div>
                                    </div>

                                    {/* 2. Información del Huésped */}
                                    <div className="flex items-center mb-4 pb-4 border-b border-gray-50">
                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 mr-3 border border-gray-200">
                                            {reserva.huesped_foto ? (
                                                <img src={reserva.huesped_foto} className="h-full w-full object-cover" alt="Huesped" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-brand-100 text-brand-600 font-bold">
                                                    {reserva.huesped_nombre ? reserva.huesped_nombre.charAt(0) : 'H'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">
                                                {reserva.huesped_nombre ? `${reserva.huesped_nombre} ${reserva.huesped_apellido}` : `Usuario #${reserva.huesped}`}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                                Solicita: <span className="font-medium text-brand-600">{reserva.propiedad_titulo}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3. Acciones de Contacto */}
                                    <div className="flex gap-2 mb-4">
                                        <button 
                                            onClick={() => navigate(`/public-profile/${reserva.huesped_id}`)}
                                            className="flex-1 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center justify-center hover:bg-gray-50 transition-colors"
                                        >
                                            <User className="h-3 w-3 mr-1.5" /> Ver Perfil
                                        </button>
                                        
                                        <button 
                                            onClick={() => navigate(`/chat/${reserva.huesped_id}`)}
                                            className="flex-1 py-1.5 border border-brand-200 bg-brand-50 rounded-lg text-xs font-bold text-brand-700 flex items-center justify-center hover:bg-brand-100 transition-colors"
                                        >
                                            <MessageCircle className="h-3 w-3 mr-1.5" /> Mensaje
                                        </button>
                                    </div>

                                    {/* 4. Botones de Decisión */}
                                    {reserva.estado === 'pendiente' && (
                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                onClick={() => handleResponder(reserva.id, 'rechazada')}
                                                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition active:scale-95"
                                            >
                                                Rechazar
                                            </button>
                                            <button 
                                                onClick={() => handleResponder(reserva.id, 'esperando_pago')}
                                                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-gray-800 font-bold text-sm hover:bg-brand-700 shadow-md shadow-brand-200 transition active:scale-95"
                                            >
                                                Aceptar y Cobrar
                                            </button>
                                        </div>
                                    )}

                                    {/* Mensaje Informativo */}
                                    {reserva.estado === 'esperando_pago' && (
                                        <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex items-center">
                                            <TrendingUp className="h-4 w-4 mr-2" />
                                            Esperando a que el huésped realice el pago.
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- TAB 3: ESTADÍSTICAS --- */}
                {activeTab === 'estadisticas' && (
                    <div className="space-y-4">
                        <div className="bg-gradient-to-r from-brand-600 to-indigo-600 p-6 rounded-2xl text-gray-800 shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-sm font-medium opacity-80 mb-1">Ganancias Totales (Netas)</p>
                                <h2 className="text-3xl font-bold tracking-tight">$0.00 MXN</h2>
                                <p className="text-[10px] mt-2 opacity-60 bg-black/20 inline-block px-2 py-1 rounded">
                                    * Ya descontando el 5% de comisión de la App
                                </p>
                            </div>
                            <BarChart className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10 rotate-12" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="bg-green-100 p-2 rounded-full mb-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Reservas Pagadas</p>
                                <p className="text-2xl font-bold text-gray-800">0</p>
                             </div>
                             <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="bg-yellow-100 p-2 rounded-full mb-2">
                                    <Star className="h-5 w-5 text-yellow-600" />
                                </div>
                                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Calificación</p>
                                <p className="text-2xl font-bold text-gray-800">5.0 ★</p>
                             </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-gray-500 text-xs">
                                Las gráficas detalladas estarán disponibles con 3 pagos confirmados.
                            </p>
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
                                    Configura las tarjetas donde recibirás los pagos de tus huéspedes.
                                </p>
                            </div>
                        </div>

                        {misTarjetas.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No tienes cuentas registradas.</p>
                            </div>
                        ) : (
                            misTarjetas.map(card => (
                                <div key={card.id} className="relative overflow-hidden rounded-xl h-40 shadow-sm border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex flex-col justify-between transition-transform hover:scale-[1.02]">
                                    {/* CORRECCIÓN: Fondo claro y texto oscuro (Nada de text-gray-800) */}
                                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white opacity-40 rounded-full blur-2xl"></div>
                                    
                                    {/* Contenido Tarjeta */}
                                    <div className="relative z-10 flex justify-between items-start">
                                        {getCardLogo(card.numero)}
                                        <span className="text-[10px] font-bold text-gray-500 bg-white/50 px-2 py-1 rounded">Débito / Crédito</span>
                                    </div>

                                    <div className="relative z-10">
                                        <p className="font-mono text-lg tracking-widest text-gray-800 font-bold">
                                            •••• •••• •••• {card.numero.slice(-4)}
                                        </p>
                                        <div className="flex justify-between items-end mt-4 text-gray-700">
                                            <div>
                                                <p className="text-[9px] uppercase opacity-60 font-bold">Titular</p>
                                                <p className="text-xs font-bold tracking-wide uppercase">{card.nombre_titular || 'USUARIO'}</p>
                                            </div>
                                            <p className="text-xs font-bold">{card.fecha_vencimiento}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        <button 
                            onClick={() => navigate('/add-card', { state: { from: 'host' } })}
                            className="w-full py-3 bg-white border-2 border-dashed border-brand-200 rounded-xl text-brand-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-50 transition"
                        >
                            <Plus className="h-4 w-4" /> Agregar Nueva Tarjeta
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
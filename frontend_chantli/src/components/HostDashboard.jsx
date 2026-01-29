import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Edit, Trash2, MessageCircle, User } from 'lucide-react';

const HostDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('propiedades'); // 'propiedades' o 'reservas'
  const [misPropiedades, setMisPropiedades] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        setLoading(false);
    } catch (error) {
        console.error("Error cargando dashboard:", error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Manejar Aceptar / Rechazar ---
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
            // Actualización optimista: cambiamos el estado localmente para que se vea rápido
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
            <div className="w-8"></div> {/* Espaciador visual */}
        </div>

        {/* Tabs de Navegación */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
                onClick={() => setActiveTab('propiedades')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'propiedades' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
            >
                Mis Propiedades
            </button>
            <button 
                onClick={() => setActiveTab('reservas')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'reservas' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}
            >
                Solicitudes
                {/* Badge de contador si hay pendientes */}
                {solicitudes.filter(r => r.estado === 'pendiente').length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                        {solicitudes.filter(r => r.estado === 'pendiente').length}
                    </span>
                )}
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
                                    
                                    {/* 1. Encabezado de la Tarjeta */}
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide
                                            ${reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : ''}
                                            ${reserva.estado === 'aceptada' ? 'bg-green-100 text-green-700' : ''}
                                            ${reserva.estado === 'rechazada' ? 'bg-red-100 text-red-700' : ''}
                                            ${reserva.estado === 'cancelada' ? 'bg-gray-100 text-gray-500' : ''}
                                        `}>
                                            {reserva.estado}
                                        </span>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900">{reserva.fecha_inicio}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">Fecha Inicio</div>
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
                                            onClick={() => alert("Próximamente: Ver perfil público")}
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

                                    {/* 4. Botones de Decisión (Solo si está pendiente) */}
                                    {reserva.estado === 'pendiente' && (
                                        <div className="flex gap-3 pt-2">
                                            <button 
                                                onClick={() => handleResponder(reserva.id, 'rechazada')}
                                                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition active:scale-95"
                                            >
                                                Rechazar
                                            </button>
                                            <button 
                                                onClick={() => handleResponder(reserva.id, 'aceptada')}
                                                className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white font-bold text-sm hover:bg-brand-700 shadow-md shadow-brand-200 transition active:scale-95"
                                            >
                                                Aceptar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
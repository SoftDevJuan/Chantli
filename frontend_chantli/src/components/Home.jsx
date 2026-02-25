import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MapPin, Search, Home as HomeIcon, Heart, MessageSquare, 
    LogOut, Filter, Plus, User, LayoutDashboard, Bell, ShieldCheck, Loader2 
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// --- 1. CONFIGURACIÓN DE NOTIFICACIONES PUSH ---
// Reemplaza esto con la LLAVE PÚBLICA que generaste en vapidkeys.com
const PUBLIC_VAPID_KEY = 'BFNNtkj2cYP6XF7DhCKi637rSmn5orTcWMHiFFZCQQAdNoihC_pgr7Q0Gr2XYi6T1S5h74-AgbcvagVw1C5Qf-o'; 

const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map((char) => char.charCodeAt(0)));
};

const subscribeToPush = async (token) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        // --- EL ARREGLO ESTÁ AQUÍ ---
        // Extraemos las partes exactas que Django WebPush pide
        const subData = subscription.toJSON();
        
        const payload = {
            status_type: 'subscribe',
            subscription: {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subData.keys.p256dh,
                    auth: subData.keys.auth
                }
            },
            browser: navigator.userAgent
        };

        await fetch(`${API_URL}/api/webpush/save_information`, { // <- Le regresamos la barrita final aquí
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        console.log("📱 Suscripción Push guardada en Django!");
    } catch (error) {
        console.error("Error al suscribir a Push:", error);
    }
};
// --------------------------------------------------------


const Home = () => {
  const navigate = useNavigate();
  
  // --- ESTADOS DE ROLES ---
  const [isHost, setIsHost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // NUEVO ESTADO PARA NOTIFICACIONES GENERALES
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // --- ESTADOS DE BÚSQUEDA ---
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  // Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm("¿Seguro que quieres salir?")) {
        localStorage.removeItem('chantli_token');
        navigate('/');
    }
  };

  // --- FUNCIÓN PRINCIPAL DE CARGA (Con Filtros) ---
  const fetchProperties = (queryParams = '') => {
      setLoading(true);
      const token = localStorage.getItem('chantli_token');
      const headers = token ? { 'Authorization': `Token ${token}` } : {};

      fetch(`${API_URL}/api/propiedades/${queryParams}`, { headers })
        .then(res => {
            if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
            return res.json();
        })
        .then(data => {
            let lista = [];
            if (Array.isArray(data)) {
                lista = data;
            } else if (data && data.results && Array.isArray(data.results)) {
                lista = data.results; 
            }
            setPropiedades(lista);
            setLoading(false);
        })
        .catch(err => {
            console.error("❌ Error cargando propiedades:", err);
            setPropiedades([]);
            setLoading(false);
        });
  };

  // Carga inicial
  useEffect(() => {
    fetchProperties(); // Carga todo al inicio

    // Cargar Usuario y verificar Roles
    const token = localStorage.getItem('chantli_token');
    if (token) {
        // --- 2. REGISTRAR EL DISPOSITIVO PARA NOTIFICACIONES ---
        subscribeToPush(token);
        // -------------------------------------------------------

        const headers = { 'Authorization': `Token ${token}` };
        fetch(`${API_URL}/api/me/`, { headers })
        .then(res => res.ok ? res.json() : null)
        .then(userData => {
            if (userData) {
                const rol = userData.rol || userData.perfil?.rol;
                if (rol === 'anfitrion') setIsHost(true);
                if (userData.is_staff || userData.is_superuser) setIsAdmin(true);
            }
        })
        .catch(console.error);

        fetch(`${API_URL}/api/mensajes/unread_count/`, { headers })
            .then(r => r.ok ? r.json() : { count: 0 })
            .then(data => setUnreadMessages(data.count))
            .catch(console.error);
            
        // EJEMPLO: Verificar si hay notificaciones generales (Ajusta el endpoint si tienes uno)
        // fetch(`${API_URL}/api/notificaciones/unread/`, { headers })
        //    .then(r => r.ok ? r.json() : { has_unread: false })
        //    .then(data => setHasUnreadNotifications(data.has_unread))
        //    .catch(console.error);
    } else {
        setIsHost(false);
        setIsAdmin(false);
    }
  }, [navigate]);

  // --- MANEJADORES DE BÚSQUEDA ---

  // 1. Ejecutar búsqueda manual (Input)
  const handleSearch = () => {
      setActiveFilter('Custom'); // Desactivar chips visualmente
      fetchProperties(`?search=${searchText}`);
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          handleSearch();
      }
  };

  // 2. Ejecutar filtros rápidos (Botones)
  const applyQuickFilter = (filtro) => {
      setActiveFilter(filtro);
      setSearchText(''); // Limpiar barra de búsqueda al usar chip

      switch (filtro) {
          case 'Todos':
              fetchProperties();
              break;
          case 'Económicos':
              // Ordenar por precio ascendente
              fetchProperties('?ordering=precio'); 
              break;
          case 'Cerca de CUCEI':
              // Buscar coincidencias de texto
              fetchProperties('?search=CUCEI');
              break;
          case 'Amueblados':
              fetchProperties('?search=Amueblado');
              break;
          case 'Solo Mujeres':
              fetchProperties('?search=Mujeres');
              break;
          case 'Pet Friendly':
              fetchProperties('?search=Mascotas'); // O 'Pet Friendly' según cómo lo guardes
              break;
          default:
              fetchProperties();
      }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-28 font-sans select-none">
      
      {/* --- HEADER SUPERIOR (Sticky) --- */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
            
            <div className="flex justify-between items-center mb-3">
                {/* Ubicación */}
                <div className="flex items-center text-brand-900 bg-brand-50 px-3 py-1 rounded-full cursor-pointer hover:bg-brand-100 transition">
                    <MapPin className="h-4 w-4 mr-1 text-brand-600" />
                    <span className="font-bold text-xs sm:text-sm">Guadalajara, ZMG</span>
                </div>

                {/* Botones Derecha */}
                <div className="flex items-center gap-3">
                    {isAdmin && (
                        <button 
                            onClick={() => navigate('/admin-panel')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-bold shadow-md hover:bg-black transition active:scale-95 animate-fade-in border border-gray-700"
                        >
                            <ShieldCheck className="h-3 w-3" />
                            <span className="hidden sm:inline">Validar</span>
                        </button>
                    )}

                    <button 
                        onClick={() => navigate('/notifications')}
                        className="p-2 bg-white rounded-full border border-gray-100 shadow-sm relative active:scale-95 transition-transform hover:bg-gray-50"
                    >
                        <Bell className="h-5 w-5 text-gray-600" />
                        {/* SOLO MUESTRA EL PUNTO SI HAY NOTIFICACIONES */}
                        {hasUnreadNotifications && (
                            <span className="absolute top-1 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>

                    <div 
                        onClick={() => navigate('/profile')} 
                        className="h-9 w-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold border border-brand-200 cursor-pointer hover:bg-brand-200 transition"
                    >
                        U
                    </div>
                </div>
            </div>
            
            {/* --- BARRA DE BÚSQUEDA ACTIVA --- */}
            <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-brand-500" />
                <input 
                    type="text" 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Busca por zona, escuela o amenidad..." 
                    className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm"
                />
                <button 
                    onClick={handleSearch}
                    className="absolute right-2 top-1.5 p-1 bg-white rounded-lg border shadow-sm active:bg-gray-50 hover:text-brand-600"
                >
                    <Filter className="h-4 w-4 text-gray-600" />
                </button>
            </div>
        </div>
      </div>

      {/* --- FILTROS RÁPIDOS ACTIVOS --- */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-[105px] z-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex overflow-x-auto gap-3 px-4 py-3 scrollbar-hide">
            {['Todos', 'Económicos', 'Cerca de CUCEI', 'Amueblados', 'Solo Mujeres', 'Pet Friendly'].map((filtro, i) => (
                <button 
                    key={i} 
                    onClick={() => applyQuickFilter(filtro)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm 
                    ${activeFilter === filtro 
                        ? 'bg-brand-600 text-gray-900 shadow-brand-200 ring-2 ring-brand-300' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-600'}`}
                >
                    {filtro}
                </button>
            ))}
          </div>
      </div>

      {/* --- LISTA DE PROPIEDADES --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4 ml-1">
            {activeFilter === 'Todos' ? 'Explorar alojamientos' : `Resultados para: "${activeFilter === 'Custom' ? searchText : activeFilter}"`}
        </h3>
        
        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                 <Loader2 className="h-10 w-10 animate-spin text-brand-600 mb-4" />
                 <p className="text-sm">Buscando espacios ideales...</p>
             </div>
        ) : propiedades.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2 font-medium">No encontramos coincidencias.</p>
                <p className="text-xs text-gray-400 mb-4">Intenta con otros términos o limpia los filtros.</p>
                <button onClick={() => applyQuickFilter('Todos')} className="bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-100 transition">
                    Ver todo
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {propiedades.map(prop => (
                    <div key={prop.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col group">
                        
                        {/* CARRUSEL DE FOTOS */}
                        <div className="relative h-56 bg-gray-200 cursor-pointer" onClick={() => navigate(`/propiedad/${prop.id}`)}>
                            <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide">
                                <div className="flex-shrink-0 w-full h-full snap-center">
                                    <img 
                                        src={prop.imagen || "https://via.placeholder.com/400?text=Sin+Foto"} 
                                        className="w-full h-full object-cover" 
                                        alt={prop.titulo}
                                    />
                                </div>
                                {prop.album && prop.album.map((foto) => (
                                    <div key={foto.id} className="flex-shrink-0 w-full h-full snap-center">
                                        <img src={foto.imagen} className="w-full h-full object-cover" alt="Detalle" />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                                {prop.album?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>}
                            </div>

                            <button 
                                onClick={(e) => { e.stopPropagation(); /* Lógica Fav */ }}
                                className="absolute top-3 right-3 p-2 bg-white/70 backdrop-blur-md rounded-full text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors z-10"
                            >
                                <Heart className="h-4 w-4" />
                            </button>
                        </div>
                        
                        <div className="p-4 flex flex-col flex-grow cursor-pointer" onClick={() => navigate(`/propiedad/${prop.id}`)}>
                            <div className="mb-2">
                                <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{prop.titulo}</h2>
                                <p className="text-gray-500 text-xs mt-1 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-gray-400" /> {prop.direccion}
                                </p>
                            </div>
                            
                            <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                                <div>
                                    <span className="text-xl font-extrabold text-brand-950">${parseFloat(prop.precio).toLocaleString()}</span>
                                    <span className="text-gray-400 text-xs font-medium ml-1">/mes</span>
                                </div>
                                <button className="bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-gray-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- FAB (CREAR) SOLO PARA ANFITRIONES --- */}
      {isHost && (
          <button 
            onClick={() => navigate('/create')}
            className="fixed bottom-24 right-4 h-14 w-14 bg-brand-600 text-gray-800 rounded-full shadow-xl shadow-brand-200 flex items-center justify-center hover:bg-brand-700 hover:scale-105 active:scale-95 transition-all z-40"
          >
            <Plus className="h-8 w-8" />
          </button>
      )}

      {/* --- NAVBAR INFERIOR --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-2 flex justify-around items-center z-50 h-[70px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        <button className="flex flex-col items-center text-brand-900 w-14">
            <HomeIcon className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-bold">Inicio</span>
        </button>

        {/* --- NAVEGACIÓN A FAVORITOS --- */}
        <button 
            onClick={() => navigate('/favorites')}
            className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group"
        >
            <Heart className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
            <span className="text-[10px] font-medium">Favs</span>
        </button>

        {isHost && (
            <button 
                onClick={() => navigate('/host')}
                className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group relative"
            >
                <div className="relative">
                    <LayoutDashboard className="h-6 w-6 mb-1 group-active:scale-90 transition-transform text-brand-900" />
                    {/* SOLO MUESTRA ALERTA SI HAY MENSAJES PENDIENTES */}
                    {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </div>
                <span className="text-[10px] font-bold text-brand-900">Panel</span>
            </button>
        )}

        <button 
            onClick={() => navigate('/inbox')}
            className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group relative"
        >
            <div className="relative">
                <MessageSquare className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
                {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium">Chat</span>
        </button>
        
        <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group"
        >
            <User className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
            <span className="text-[10px] font-medium">Perfil</span>
        </button>

        <button 
            onClick={handleLogout}
            className="flex flex-col items-center text-gray-900 hover:text-red-500 transition-colors w-14 group"
        >
            <LogOut className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
            <span className="text-[10px] font-medium">Salir</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
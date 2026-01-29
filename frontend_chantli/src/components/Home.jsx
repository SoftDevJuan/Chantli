import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Home as HomeIcon, Heart, MessageSquare, LogOut, Filter, Plus, User, LayoutDashboard, Bell } from 'lucide-react';

const Home = () => {
  const [isHost, setIsHost] = useState(false);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm("¿Seguro que quieres salir?")) {
        localStorage.removeItem('chantli_token');
        navigate('/');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    // if (!token) { navigate('/'); return; } 

    const headers = token ? { 'Authorization': `Token ${token}` } : {};

    // 1. Cargar Propiedades
    fetch('http://127.0.0.1:8000/api/propiedades/', { headers })
      .then(res => res.json())
      .then(data => {
          setPropiedades(data);
          setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });

    // 2. Cargar Usuario para verificar si es ANFITRIÓN
    if (token) {
        fetch('http://127.0.0.1:8000/api/me/', { headers })
        .then(res => res.json())
        .then(userData => {
            // Verificamos el rol (puede venir directo o dentro de perfil)
            if (userData.rol === 'anfitrion' || userData.perfil?.rol === 'anfitrion') {
                setIsHost(true);
            }
        })
        .catch(err => console.error("Error al verificar rol:", err));
    }

  }, [navigate]);

  return (
    <div className="bg-gray-50 min-h-screen pb-28 font-sans select-none">
      
      {/* --- HEADER SUPERIOR (Sticky) --- */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
            

            <div className="flex justify-between items-center mb-3">
                
                {/* --- IZQUIERDA: Ubicación --- */}
                <div className="flex items-center text-brand-900 bg-brand-50 px-3 py-1 rounded-full">
                    <MapPin className="h-4 w-4 mr-1 text-brand-600" />
                    <span className="font-bold text-xs sm:text-sm">Guadalajara, ZMG</span>
                </div>

                {/* --- DERECHA: Grupo Notificaciones + Perfil --- */}
                <div className="flex items-center gap-3">
                    
                    {/* Botón Notificaciones */}
                    <button 
                        onClick={() => navigate('/notifications')}
                        className="p-2 bg-white rounded-full border border-gray-100 shadow-sm relative active:scale-95 transition-transform"
                    >
                        <Bell className="h-5 w-5 text-gray-600" />
                        {/* Puntito rojo (puedes poner lógica condicional aquí luego) */}
                        <span className="absolute top-1 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    {/* Avatar simple */}
                    <div 
                        onClick={() => navigate('/profile')} 
                        className="h-9 w-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold border border-brand-200 cursor-pointer hover:bg-brand-200 transition"
                    >
                        U
                    </div>
                    
                </div>
            </div>
            
            {/* Barra de Búsqueda */}
            <div className="relative group">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-brand-500" />
                <input 
                    type="text" 
                    placeholder="¿Cerca de qué universidad buscas?" 
                    className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-sm"
                />
                <button className="absolute right-2 top-1.5 p-1 bg-white rounded-lg border shadow-sm active:bg-gray-50 hover:text-brand-600">
                    <Filter className="h-4 w-4 text-gray-600" />
                </button>
            </div>
        </div>
      </div>

      {/* --- FILTROS RÁPIDOS (Scroll Horizontal) --- */}
      <div className="bg-white/80 backdrop-blur-sm sticky top-[105px] z-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex overflow-x-auto gap-3 px-4 py-3 scrollbar-hide">
            {['Todos', 'Económicos', 'Cerca de CUCEI', 'Amueblados', 'Solo Mujeres', 'Pet Friendly'].map((filtro, i) => (
                <button key={i} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm ${i === 0 ? 'bg-brand-600 text-white shadow-brand-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-600'}`}>
                    {filtro}
                </button>
            ))}
          </div>
      </div>

      {/* --- LISTA DE PROPIEDADES (GRID) --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4 ml-1">Explorar alojamientos</h3>
        
        {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="bg-white rounded-2xl h-72 animate-pulse shadow-sm border border-gray-100"></div>
                ))}
             </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {propiedades.map(prop => (
                    <div key={prop.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300 flex flex-col group">
                        
                        {/* CARRUSEL DE FOTOS (Scroll Snap) */}
                        <div className="relative h-56 bg-gray-200">
                            <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide">
                                {/* Portada */}
                                <div className="flex-shrink-0 w-full h-full snap-center">
                                    <img 
                                        src={prop.imagen || "https://via.placeholder.com/400?text=Sin+Foto"} 
                                        className="w-full h-full object-cover" 
                                        alt={prop.titulo}
                                    />
                                </div>
                                {/* Álbum */}
                                {prop.album && prop.album.map((foto) => (
                                    <div key={foto.id} className="flex-shrink-0 w-full h-full snap-center">
                                        <img src={foto.imagen} className="w-full h-full object-cover" alt="Detalle" />
                                    </div>
                                ))}
                            </div>
                            
                            {/* Indicador visual de scroll */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                                {prop.album?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>}
                            </div>

                            {/* Botón Like */}
                            <button className="absolute top-3 right-3 p-2 bg-white/70 backdrop-blur-md rounded-full text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors">
                                <Heart className="h-4 w-4" />
                            </button>
                        </div>
                        
                        {/* INFO DE LA TARJETA */}
                        <div className="p-4 flex flex-col flex-grow">
                            <div className="mb-2">
                                <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{prop.titulo}</h2>
                                <p className="text-gray-500 text-xs mt-1 flex items-center">
                                    <MapPin className="h-3 w-3 mr-1 text-gray-400" /> {prop.direccion}
                                </p>
                            </div>
                            
                            <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-3">
                                <div>
                                    <span className="text-xl font-extrabold text-brand-600">${prop.precio}</span>
                                    <span className="text-gray-400 text-xs font-medium ml-1">/mes</span>
                                </div>
                                <button 
                                    onClick={() => navigate(`/propiedad/${prop.id}`)}
                                    className="bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                                >
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- BOTÓN FLOTANTE (FAB) --- */}
      <button 
        onClick={() => navigate('/create')}
        className="fixed bottom-24 right-4 h-14 w-14 bg-brand-600 text-white rounded-full shadow-xl shadow-brand-200 flex items-center justify-center hover:bg-brand-700 hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus className="h-8 w-8" />
      </button>

      {/* --- BOTTOM NAVIGATION BAR (FIXED) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-2 flex justify-around items-center z-50 h-[70px] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        
        <button className="flex flex-col items-center text-brand-600 w-14">
            <HomeIcon className="h-6 w-6 mb-1" />
            <span className="text-[10px] font-bold">Inicio</span>
        </button>

        <button className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group">
            <Heart className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
            <span className="text-[10px] font-medium">Favs</span>
        </button>

        {/* --- BOTÓN PANEL (SOLO PARA ANFITRIONES) --- */}
        {isHost && (
            <button 
                onClick={() => navigate('/host')}
                className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group relative"
            >
                <div className="relative">
                    <LayoutDashboard className="h-6 w-6 mb-1 group-active:scale-90 transition-transform text-brand-600" />
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </div>
                <span className="text-[10px] font-bold text-brand-700">Panel</span>
            </button>
        )}

        <button className="flex flex-col items-center text-gray-400 hover:text-brand-600 transition-colors w-14 group">
            <MessageSquare className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
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
            className="flex flex-col items-center text-gray-400 hover:text-red-500 transition-colors w-14 group"
        >
            <LogOut className="h-6 w-6 mb-1 group-active:scale-90 transition-transform" />
            <span className="text-[10px] font-medium">Salir</span>
        </button>
      </div>
    </div>
  );
};

export default Home;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Plus, Heart } from 'lucide-react';

const Home = () => {
  const [propiedades, setPropiedades] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    // if (!token) { navigate('/'); return; } // Descomenta si quieres forzar login

    fetch('http://127.0.0.1:8000/api/propiedades/', {
        headers: token ? { 'Authorization': `Token ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => setPropiedades(data))
      .catch(err => console.error(err));
  }, [navigate]);

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      
      {/* Header Fijo */}
      <div className="bg-white sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto w-full"> {/* Contenedor para centrar en PC */}
            <div className="flex items-center text-brand-900 mb-3">
                <MapPin className="h-4 w-4 mr-1 text-brand-600" />
                <span className="font-bold text-sm">Guadalajara, ZMG</span>
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" placeholder="Buscar cerca de..." className="w-full bg-gray-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
        </div>
      </div>

      {/* --- CONTENEDOR PRINCIPAL (GRID) --- */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <h3 className="font-bold text-lg text-gray-800 mb-4">Alojamientos Recientes</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {propiedades.map(prop => (
                <div key={prop.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
                    
                    {/* --- CARRUSEL DE FOTOS (SCROLL SNAP) --- */}
                    <div className="relative h-60 bg-gray-200 group">
                        <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide">
                            {/* 1. Foto de Portada */}
                            <div className="flex-shrink-0 w-full h-full snap-center relative">
                                <img 
                                    src={prop.imagen || "https://via.placeholder.com/400?text=Sin+Foto"} 
                                    className="w-full h-full object-cover" 
                                    alt="Portada"
                                />
                            </div>
                            
                            {/* 2. Fotos del Álbum (Si existen) */}
                            {prop.album && prop.album.map((foto) => (
                                <div key={foto.id} className="flex-shrink-0 w-full h-full snap-center relative">
                                    <img 
                                        src={foto.imagen} 
                                        className="w-full h-full object-cover" 
                                        alt="Galeria"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Indicador visual de que es deslizable */}
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                            {(prop.album?.length > 0) && <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>}
                        </div>

                        <button className="absolute top-3 right-3 p-2 bg-white/70 backdrop-blur-md rounded-full text-gray-600 hover:text-red-500 transition-colors">
                            <Heart className="h-4 w-4" />
                        </button>
                    </div>
                    
                    {/* --- INFO --- */}
                    <div className="p-4 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="font-bold text-gray-900 text-lg leading-tight truncate w-full">{prop.titulo}</h2>
                        </div>
                        <p className="text-gray-500 text-sm flex items-center mb-4 truncate">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" /> {prop.direccion}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between border-t pt-3 border-gray-50">
                            <div>
                                <span className="text-xl font-extrabold text-brand-600">${prop.precio}</span>
                                <span className="text-gray-400 text-xs">/mes</span>
                            </div>
                            <button 
                                onClick={() => navigate(`/propiedad/${prop.id}`)} // <--- Acción Ver Detalles
                                className="bg-brand-50 text-brand-700 hover:bg-brand-100 text-sm font-bold px-4 py-2 rounded-lg transition-colors"
                            >
                                Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Botón flotante */}
      <button 
        onClick={() => navigate('/create')}
        className="fixed bottom-8 right-6 h-14 w-14 bg-brand-600 text-white rounded-full shadow-xl hover:bg-brand-700 flex items-center justify-center transition-transform active:scale-90 z-40"
      >
        <Plus className="h-8 w-8" />
      </button>

    </div>
  );
};

export default Home;
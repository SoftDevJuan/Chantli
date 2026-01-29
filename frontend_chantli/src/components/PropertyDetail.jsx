import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, CheckCircle, Share2, Star, MessageCircle, Heart, Calendar, X } from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [propiedad, setPropiedad] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fechas, setFechas] = useState({ inicio: '', fin: '' });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    const headers = token ? { 'Authorization': `Token ${token}` } : {};

    // 1. Cargar Propiedad
    const fetchPropiedad = fetch(`http://127.0.0.1:8000/api/propiedades/${id}/`, { headers }).then(r => r.json());
    
    // 2. Cargar Usuario Actual ("¿Quién soy?")
    const fetchUser = token 
        ? fetch(`http://127.0.0.1:8000/api/me/`, { headers }).then(r => r.json())
        : Promise.resolve(null);

    Promise.all([fetchPropiedad, fetchUser])
      .then(([propData, userData]) => {
          setPropiedad(propData);
          setCurrentUser(userData);
          setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  // Manejar solicitud de reserva
  const handleReserva = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    const token = localStorage.getItem('chantli_token');

    try {
        const response = await fetch('http://127.0.0.1:8000/api/reservas/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                propiedad: propiedad.id,
                fecha_inicio: fechas.inicio,
                fecha_fin: fechas.fin,
                huesped: currentUser.id, // Opcional si el backend lo toma del token
                total: propiedad.precio // Simplificado, aquí iría cálculo de días
            })
        });

        if (response.ok) {
            alert("¡Solicitud enviada al anfitrión!");
            setIsModalOpen(false);
        } else {
            alert("Error al reservar. Verifica las fechas.");
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;
  if (!propiedad) return <div>No encontrada</div>;

  // Unir fotos para el carrusel
  const todasLasFotos = [{ id: 'cover', imagen: propiedad.imagen }, ...(propiedad.album || [])].filter(f => f.imagen);

  return (
    <div className="min-h-screen bg-white pb-28">
      
      {/* --- HEADER FLOTANTE --- */}
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between z-20 pointer-events-none">
        <button onClick={() => navigate(-1)} className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md pointer-events-auto hover:bg-white transition">
            <ArrowLeft className="h-6 w-6 text-gray-800" />
        </button>
        <div className="flex gap-3 pointer-events-auto">
            <button className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md hover:text-red-500 transition">
                <Heart className="h-6 w-6 text-gray-800 hover:text-red-500" />
            </button>
            <button className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md">
                <Share2 className="h-6 w-6 text-gray-800" />
            </button>
        </div>
      </div>

      {/* --- GALERÍA --- */}
      <div className="h-[45vh] bg-gray-200 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide">
        {todasLasFotos.map((foto, idx) => (
            <img key={idx} src={foto.imagen} className="w-full h-full object-cover snap-center flex-shrink-0" />
        ))}
      </div>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="max-w-4xl mx-auto -mt-6 relative bg-white rounded-t-3xl px-6 py-8 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] min-h-[50vh]">
        
        {/* Título y Header */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{propiedad.titulo}</h1>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1 text-brand-600" />
                    {propiedad.direccion}
                </div>
            </div>
            {/* Rating Box */}
            <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 text-center min-w-[60px]">
                <div className="flex items-center justify-center font-bold text-gray-900">
                    <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" /> 4.8
                </div>
                <div className="text-[10px] text-gray-400 underline">24 reseñas</div>
            </div>
        </div>

        <hr className="border-gray-100 my-6" />

        {/* Info del Anfitrión */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg mr-4 border-2 border-white shadow-sm">
                    {propiedad.anfitrion.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-bold text-gray-900">Anfitrión: {propiedad.anfitrion}</p>
                    <p className="text-xs text-gray-500">Miembro desde 2024</p>
                </div>
            </div>
            <button className="p-2 bg-gray-100 rounded-full text-brand-600 hover:bg-brand-50 transition">
                <MessageCircle className="h-6 w-6" />
            </button>
        </div>

        {/* Descripción */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-2 text-gray-900">Acerca del lugar</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
                {propiedad.descripcion}
            </p>
        </div>

        {/* Lo que ofrece */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Lo que ofrece</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                {['Wifi de alta velocidad', 'Cocina equipada', 'Lavadora', 'Entrada privada', 'Cámaras de seguridad', 'Agua caliente'].map(s => (
                    <div key={s} className="flex items-center text-gray-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-brand-500 flex-shrink-0" />
                        {s}
                    </div>
                ))}
            </div>
        </div>

        {/* Mapa (Placeholder) */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Ubicación</h3>
            <div className="h-48 bg-gray-200 rounded-xl overflow-hidden relative">
                {/* Aquí iría el componente de Google Maps Real */}
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src="https://maps.google.com/maps?q=Guadalajara,Jalisco&t=&z=13&ie=UTF8&iwloc=&output=embed"
                    className="opacity-80"
                ></iframe>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center">
                        <div className="h-2 w-2 bg-brand-500 rounded-full mr-2 animate-pulse"></div>
                        Ubicación aproximada
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* --- BARRA INFERIOR FIJA --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-end">
                    <span className="font-bold text-xl text-gray-900">${propiedad.precio}</span>
                    <span className="text-xs text-gray-500 mb-1 ml-1">/ mes</span>
                </div>
                <span className="text-[10px] text-green-600 font-bold">Disponible ahora</span>
            </div>
            
            {currentUser && currentUser.username === propiedad.anfitrion ? (
                <button className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl opacity-50 cursor-not-allowed">
                    Es tu propiedad
                </button>
            ) : (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-black font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-200 transition-all active:scale-95"
                >
                    Solicitar Renta
                </button>
            )}
        </div>
      </div>

      {/* --- MODAL DE RESERVA --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop oscuro */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            
            {/* Contenido del Modal */}
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up sm:animate-fade-in shadow-2xl">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                    <X className="h-5 w-5 text-gray-600" />
                </button>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">Solicitar Reserva</h2>
                <p className="text-sm text-gray-500 mb-6">El anfitrión confirmará tu solicitud en menos de 24hrs.</p>

                <form onSubmit={handleReserva} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Fecha de Inicio</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="date" 
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-brand-500"
                                onChange={(e) => setFechas({...fechas, inicio: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">Fecha de Fin (Opcional si es mensual)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="date" 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-brand-500"
                                onChange={(e) => setFechas({...fechas, fin: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="bg-brand-50 p-4 rounded-xl flex justify-between items-center mt-4">
                        <span className="text-brand-900 font-medium">Total estimado (1 mes)</span>
                        <span className="text-brand-700 font-bold text-lg">${propiedad.precio}</span>
                    </div>

                    <button 
                        type="submit" 
                        disabled={bookingLoading}
                        className="w-full bg-brand-600 text-green-400 font-bold py-4 rounded-xl mt-4 hover:bg-brand-700 transition disabled:opacity-50"
                    >
                        {bookingLoading ? 'Enviando...' : 'Confirmar Solicitud'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default PropertyDetail;
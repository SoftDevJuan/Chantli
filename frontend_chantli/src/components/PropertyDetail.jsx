import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Share2, Star, MessageCircle, Heart, X, AlertCircle, Clock, User, Send, ChevronRight } from 'lucide-react';

// --- IMPORTACIONES MAPA GOOGLE ---
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// --- IMPORTACIONES CALENDARIO ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Tu API Key del .env

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [propiedad, setPropiedad] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [resenas, setResenas] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // Array de fechas ocupadas
  const [diasBloqueados, setDiasBloqueados] = useState([]);

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados del Calendario
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Estados para Nueva Reseña
  const [newReview, setNewReview] = useState({ rating: 5, comentario: '' });
  const [canReview, setCanReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  
  // Cálculo Financiero
  const [calculo, setCalculo] = useState({
      dias: 0, renta: 0, iva: 0, deposito: 0, total: 0, error: ''
  });

  // --- HOOK DE GOOGLE MAPS ---
  const { isLoaded } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: GOOGLE_API_KEY
  });

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    const headers = token ? { 'Authorization': `Token ${token}` } : {};

    const fetchPropiedad = fetch(`${API_URL}/api/propiedades/${id}/`, { headers }).then(r => r.json());
    
    const fetchUser = token 
        ? fetch(`${API_URL}/api/me/`, { headers }).then(r => r.json())
        : Promise.resolve(null);

    const fetchFechas = fetch(`${API_URL}/api/propiedades/${id}/fechas_ocupadas/`, { headers })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);

    const fetchReviews = fetch(`${API_URL}/api/resenas/?propiedad=${id}`, { headers })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);

    const checkHistory = token 
        ? fetch(`${API_URL}/api/reservas/?huesped_actual=true&propiedad=${id}`, { headers }).then(r => r.json())
        : Promise.resolve([]);

    Promise.all([fetchPropiedad, fetchUser, fetchFechas, fetchReviews, checkHistory])
      .then(([propData, userData, fechasData, reviewsData, historyData]) => {
          setPropiedad(propData);
          setCurrentUser(userData);
          setResenas(reviewsData);
          
          if (userData && Array.isArray(historyData)) {
             const hasPaid = historyData.some(r => r.estado === 'pagada' || r.estado === 'finalizada');
             setCanReview(hasPaid);
          }

          const blockedDates = [];
          fechasData.forEach(rango => {
              let current = new Date(rango.inicio);
              current.setHours(12,0,0,0);
              const end = new Date(rango.fin);
              end.setHours(12,0,0,0);
              while(current <= end) {
                  blockedDates.push(new Date(current));
                  current.setDate(current.getDate() + 1);
              }
          });
          setDiasBloqueados(blockedDates);
          setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  useEffect(() => {
    if (!startDate || !endDate || !propiedad) return;
    if (startDate >= endDate) {
        setCalculo(prev => ({ ...prev, error: 'La fecha de salida debe ser después de la llegada.', total: 0 }));
        return;
    }
    const diffTime = Math.abs(endDate - startDate);
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const precioMensual = parseFloat(propiedad.precio);
    const precioDiario = precioMensual / 30;
    const rentaCalculada = precioDiario * dias;
    const impuesto = rentaCalculada * 0.16;
    const deposito = precioMensual;
    const totalFinal = rentaCalculada + impuesto + deposito;

    setCalculo({ dias, renta: rentaCalculada, iva: impuesto, deposito, total: totalFinal, error: '' });
  }, [startDate, endDate, propiedad]);

  const handleReserva = async (e) => {
    // ... (Tu lógica de reserva existente) ...
    e.preventDefault();
    if (calculo.error || calculo.total === 0) return;
    setBookingLoading(true);
    const token = localStorage.getItem('chantli_token');
    const format = (date) => date.toISOString().split('T')[0];

    try {
        const response = await fetch(`${API_URL}/api/reservas/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                propiedad: propiedad.id,
                fecha_inicio: format(startDate),
                fecha_fin: format(endDate),
                huesped: currentUser.id,
                total: calculo.total 
            })
        });
        if (response.ok) {
            const data = await response.json();
            navigate('/checkout', { state: { reservaId: data.id, titulo: propiedad.titulo, precio: calculo.renta } });
            setIsModalOpen(false);
        } else {
            alert("Error al reservar.");
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setBookingLoading(false);
    }
  };

  const handleSubmitResena = async (e) => {
      // ... (Tu lógica de reseña existente) ...
      e.preventDefault();
      setReviewLoading(true);
      const token = localStorage.getItem('chantli_token');
      
      try {
          const res = await fetch(`${API_URL}/api/resenas/`, {
              method: 'POST',
              headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  propiedad: propiedad.id,
                  calificacion: newReview.rating,
                  comentario: newReview.comentario
              })
          });
          
          if (res.ok) {
              const nuevaResenaGuardada = await res.json();
              const resenaVisual = {
                  ...nuevaResenaGuardada,
                  autor_nombre: currentUser.first_name,
                  autor_foto: currentUser.foto_perfil
              };
              setResenas(prev => [resenaVisual, ...prev]);
              setNewReview({ rating: 5, comentario: '' });
              alert("¡Gracias por tu opinión!");
          } else {
              alert("No pudimos guardar tu reseña.");
          }
      } catch (error) {
          console.error(error);
      } finally {
          setReviewLoading(false);
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;
  if (!propiedad) return <div>No encontrada</div>;

  const todasLasFotos = [{ id: 'cover', imagen: propiedad.imagen }, ...(propiedad.album || [])].filter(f => f.imagen);
  const promedioRating = resenas.length > 0 
        ? (resenas.reduce((acc, curr) => acc + curr.calificacion, 0) / resenas.length).toFixed(1) 
        : "Nuevo";

  // --- LÓGICA DE COORDENADAS ---
  const hasCoordinates = propiedad.latitud && propiedad.longitud;
  const mapCenter = hasCoordinates ? { lat: parseFloat(propiedad.latitud), lng: parseFloat(propiedad.longitud) } : null;

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Estilos para DatePicker */}
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; background-color: #f9fafb; outline: none; }
        .react-datepicker__input-container input:focus { border-color: #4F46E5; box-shadow: 0 0 0 2px #c7d2fe; }
        .react-datepicker__day--disabled { background-color: #f3f4f6 !important; color: #d1d5db !important; cursor: not-allowed; opacity: 0.6; }
        .react-datepicker__day--excluded { background-color: #fef08a !important; color: #854d0e !important; font-weight: bold; text-decoration: line-through; border-radius: 0.3rem; opacity: 1 !important; }
        .react-datepicker__day--selected { background-color: #4F46E5 !important; color: white !important; border-radius: 50%; }
        .react-datepicker__day--in-range { background-color: #e0e7ff !important; color: #4338ca !important; }
        .react-datepicker__header { background-color: white; border-bottom: 1px solid #f3f4f6; }
        .react-datepicker { border: 1px solid #e5e7eb; border-radius: 1rem; font-family: inherit; overflow: hidden; }
      `}</style>

      {/* HEADER FLOTANTE */}
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between z-20 pointer-events-none">
        <button onClick={() => navigate(-1)} className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md pointer-events-auto hover:bg-white transition">
            <ArrowLeft className="h-6 w-6 text-gray-800" />
        </button>
        <div className="flex gap-3 pointer-events-auto">
            <button className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md hover:text-red-500 transition"><Heart className="h-6 w-6" /></button>
            <button className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md"><Share2 className="h-6 w-6" /></button>
        </div>
      </div>

      {/* GALERÍA */}
      <div className="h-[45vh] bg-gray-200 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide">
        {todasLasFotos.map((foto, idx) => (
            <img key={idx} src={foto.imagen} className="w-full h-full object-cover snap-center flex-shrink-0" alt="Propiedad" />
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto -mt-6 relative bg-white rounded-t-3xl px-6 py-8 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] min-h-[50vh]">
        
        {/* Título y Rating */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{propiedad.titulo}</h1>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1 text-brand-600" /> {propiedad.direccion}
                </div>
            </div>
            <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 text-center min-w-[60px]">
                <div className="flex items-center justify-center font-bold text-gray-900">
                    <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" /> {promedioRating}
                </div>
                <div className="text-[10px] text-gray-400 underline">{resenas.length} reseñas</div>
            </div>
        </div>

        <hr className="border-gray-100 my-6" />

        {/* --- ANFITRIÓN --- */}
        <div className="flex items-center justify-between mb-6">
            <div 
                onClick={() => navigate(`/public-profile/${propiedad.anfitrion_id}`)}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 -ml-2 rounded-xl transition-colors group"
            >
                <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg mr-4 border-2 border-white shadow-sm group-hover:shadow-md transition-all">
                    {propiedad.anfitrion_nombre ? propiedad.anfitrion_nombre.charAt(0).toUpperCase() : 'A'} 
                </div>
                <div>
                    <p className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors flex items-center gap-1">
                        Anfitrión: {propiedad.anfitrion_nombre || "Usuario"} 
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-gray-500">Miembro verificado</p>
                </div>
            </div>
            
            {currentUser && currentUser.id !== propiedad.anfitrion_id && (
                <button 
                    onClick={() => navigate(`/chat/${propiedad.anfitrion_id}`)}
                    className="p-2 bg-gray-100 rounded-full text-brand-600 hover:bg-brand-50 transition"
                >
                    <MessageCircle className="h-6 w-6" />
                </button>
            )}
        </div>

        {/* Detalles */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-2 text-gray-900">Acerca del lugar</h3>
            <p className="text-gray-600 leading-relaxed text-sm">{propiedad.descripcion}</p>
        </div>

        {/* Amenidades */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Lo que ofrece</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                {propiedad.amenidades ? JSON.parse(propiedad.amenidades).map(s => (
                    <div key={s} className="flex items-center text-gray-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-brand-500 flex-shrink-0" /> {s}
                    </div>
                )) : <span className="text-sm text-gray-400">Sin amenidades listadas.</span>}
            </div>
        </div>

        {/* --- MAPA DE UBICACIÓN --- */}
        <div className="mb-10">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Ubicación</h3>
            <div className="h-64 bg-gray-200 rounded-xl overflow-hidden relative shadow-sm border border-gray-100">
                
                {/* LÓGICA DE MAPA INTERACTIVO */}
                {isLoaded && hasCoordinates ? (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={15}
                        options={{ 
                            disableDefaultUI: true,
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            
                            // --- AGREGA ESTA LÍNEA ---
                            mapId: "DEMO_MAP_ID" 
                            // "DEMO_MAP_ID" es un ID gratuito de Google para pruebas. 
                            // Hace que el mapa cargue vectores (más fluido) en lugar de imágenes (cuadritos).
                            // -------------------------
                        }}
                    >
                        <Marker position={mapCenter} />
                    </GoogleMap>
                ) : (
                    // FALLBACK: Si no hay coordenadas o no cargó, mostramos iframe genérico buscando por dirección
                    <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(propiedad.direccion || "Guadalajara")}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                        className="w-full h-full" 
                    ></iframe>
                )}

                {!hasCoordinates && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <div className="h-2 w-2 bg-brand-600 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-gray-700">Ubicación aproximada (Dirección)</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* SECCIÓN DE OPINIONES */}
        <div className="mb-8 pt-6 border-t border-gray-100">
            <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /> 
                Opiniones ({resenas.length})
            </h3>

            {/* FORMULARIO */}
            {canReview && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
                    <h4 className="font-bold text-sm text-gray-800 mb-2">¡Cuéntanos tu experiencia!</h4>
                    <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })}>
                                <Star className={`h-6 w-6 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea 
                        className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-200 outline-none resize-none"
                        rows="3"
                        placeholder="¿Qué tal estuvo tu estancia?"
                        value={newReview.comentario}
                        onChange={(e) => setNewReview({...newReview, comentario: e.target.value})}
                    ></textarea>
                    <button 
                        onClick={handleSubmitResena}
                        disabled={reviewLoading || !newReview.comentario}
                        className="mt-2 bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 ml-auto hover:bg-brand-700 disabled:opacity-50 transition"
                    >
                        {reviewLoading ? 'Enviando...' : <><Send className="h-3 w-3" /> Publicar Opinión</>}
                    </button>
                </div>
            )}

            {/* LISTA DE RESEÑAS */}
            <div className="space-y-4">
                {resenas.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm text-gray-400 italic">Aún no hay opiniones.</p>
                    </div>
                ) : (
                    resenas.map((review) => (
                        <div key={review.id} className="border-b border-gray-50 pb-4 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-gray-200 rounded-full overflow-hidden">
                                        {review.autor_foto ? (
                                            <img src={review.autor_foto} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-bold">
                                                {review.autor_nombre ? review.autor_nombre.charAt(0) : 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{review.autor_nombre || 'Usuario'}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(review.fecha).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex text-yellow-400">
                                    {[...Array(review.calificacion)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                                </div>
                            </div>
                            <p className="text-gray-600 text-sm leading-snug">{review.comentario}</p>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>

      {/* BARRA INFERIOR (RESERVAR) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-end">
                    <span className="font-bold text-xl text-gray-900">${parseFloat(propiedad.precio).toLocaleString()}</span>
                    <span className="text-xs text-gray-500 mb-1 ml-1">/ mes</span>
                </div>
                <span className="text-[10px] text-green-600 font-bold">Disponible ahora</span>
            </div>
            
            {currentUser && currentUser.id === propiedad.anfitrion_id ? ( 
                <button className="bg-gray-900 text-white font-bold py-3 px-8 rounded-xl opacity-50 cursor-not-allowed">Es tu propiedad</button>
            ) : (
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-200 transition-all active:scale-95">
                    Solicitar Renta
                </button>
            )}
        </div>
      </div>

      {/* MODAL RESERVA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up sm:animate-fade-in shadow-2xl min-h-[600px] flex flex-col">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-20"><X className="h-5 w-5 text-gray-600" /></button>
                <div className="flex-1 overflow-y-auto pr-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Selecciona tus Fechas</h2>
                    <p className="text-xs text-gray-500 mb-6 flex items-center gap-1"><Clock className="h-3 w-3" /> Las fechas en amarillo ya están ocupadas.</p>
                    <form onSubmit={handleReserva} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Llegada</label>
                                <DatePicker selected={startDate} onChange={setStartDate} selectsStart startDate={startDate} endDate={endDate} minDate={new Date()} excludeDates={diasBloqueados} placeholderText="Seleccionar" className="w-full cursor-pointer" dateFormat="dd/MM/yyyy" popperPlacement="bottom-start" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Salida</label>
                                <DatePicker selected={endDate} onChange={setEndDate} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || new Date()} excludeDates={diasBloqueados} placeholderText="Seleccionar" className="w-full cursor-pointer" dateFormat="dd/MM/yyyy" popperPlacement="bottom-end" />
                            </div>
                        </div>
                        {calculo.error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center border border-red-100 font-medium"><AlertCircle className="h-4 w-4 mr-2" />{calculo.error}</div>}
                        {!calculo.error && calculo.total > 0 && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4 animate-fade-in">
                                <div className="flex justify-between text-xs text-gray-600"><span>Renta ({calculo.dias} días)</span><span>${calculo.renta.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs text-gray-600"><span>IVA (16%)</span><span>${calculo.iva.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs text-gray-600"><span>Depósito</span><span>${calculo.deposito.toLocaleString()}</span></div>
                                <div className="border-t border-gray-200 pt-2 flex justify-between items-center"><span className="font-bold text-brand-900 text-sm">Total</span><span className="font-bold text-brand-700 text-lg">${calculo.total.toLocaleString()}</span></div>
                            </div>
                        )}
                        <div className="pt-4">
                            <button type="submit" disabled={bookingLoading || !!calculo.error || calculo.total === 0} className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition disabled:opacity-50 shadow-lg">
                                {bookingLoading ? 'Procesando...' : (calculo.total > 0 ? `Reservar por $${calculo.total.toLocaleString(undefined, {maximumFractionDigits: 0})}` : 'Selecciona fechas')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
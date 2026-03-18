import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Share2, Star, MessageCircle, Heart, X, AlertCircle, Clock, Send, ChevronRight, ChevronLeft, ShieldCheck, Image as ImageIcon, Search, Filter, Home as HomeIcon, } from 'lucide-react';

// --- IMPORTACIONES MAPA GOOGLE ---
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

// --- IMPORTACIONES CALENDARIO ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const getFileUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${API_URL}${path}`;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [propiedad, setPropiedad] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [anfitrionInfo, setAnfitrionInfo] = useState(null); 
  const [resenas, setResenas] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [diasBloqueados, setDiasBloqueados] = useState([]);

  // Estados de Favoritos
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Estados para la Galería Inline
  const [viewMode, setViewMode] = useState('grid'); 
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Estados del Calendario
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [newReview, setNewReview] = useState({ rating: 5, comentario: '' });
  const [canReview, setCanReview] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  
  const [calculo, setCalculo] = useState({
      dias: 0, renta: 0, iva: 0, deposito: 0, total: 0, error: ''
  });

  // --- ESTADO PARA BÚSQUEDA ---
  const [searchText, setSearchText] = useState('');

  const { isLoaded } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: GOOGLE_API_KEY
  });

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    const headers = token ? { 'Authorization': `Token ${token}` } : {};

    const fetchPropiedad = fetch(`${API_URL}/api/propiedades/${id}/`, { headers }).then(r => r.json());
    const fetchUser = token ? fetch(`${API_URL}/api/me/`, { headers }).then(r => r.json()) : Promise.resolve(null);
    const fetchFechas = fetch(`${API_URL}/api/propiedades/${id}/fechas_ocupadas/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []);
    const fetchReviews = fetch(`${API_URL}/api/resenas/?propiedad=${id}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []);
    const checkHistory = token ? fetch(`${API_URL}/api/reservas/?huesped_actual=true&propiedad=${id}`, { headers }).then(r => r.json()) : Promise.resolve([]);
    const checkFavorite = token ? fetch(`${API_URL}/api/favoritos/check/?propiedad=${id}`, { headers }).then(r => r.ok ? r.json() : { is_favorite: false }).catch(() => ({ is_favorite: false })) : Promise.resolve({ is_favorite: false });

    Promise.all([fetchPropiedad, fetchUser, fetchFechas, fetchReviews, checkHistory, checkFavorite])
      .then(async ([propData, userData, fechasData, reviewsData, historyData, favData]) => {
          setPropiedad(propData);
          setCurrentUser(userData);
          setResenas(reviewsData);
          setIsFavorite(favData.is_favorite);
          
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

          const hostId = propData.anfitrion_id || propData.anfitrion;
          if (hostId) {
              try {
                  const resHost = await fetch(`${API_URL}/api/public-profile/${hostId}/`);
                  if (resHost.ok) setAnfitrionInfo(await resHost.json());
              } catch (e) { console.error(e); }
          }
          setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
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
    
    const isVerifiedGuest = currentUser?.perfil?.es_huesped_verificado === true;
    const deposito = isVerifiedGuest ? 0 : precioMensual;
    
    const totalFinal = rentaCalculada + impuesto + deposito;

    setCalculo({ dias, renta: rentaCalculada, iva: impuesto, deposito, total: totalFinal, error: '' });
  }, [startDate, endDate, propiedad, currentUser]); 

  // Lógica Galería
  const todasLasFotos = propiedad ? [{ id: 'cover', imagen: getFileUrl(propiedad.imagen) }, ...(propiedad.album || []).map(f => ({...f, imagen: getFileUrl(f.imagen)}))].filter(f => f.imagen) : [];

  const handleNextPhoto = () => {
      if (viewMode === 'grid') {
          setViewMode('carousel');
          setCurrentPhotoIndex(1 % todasLasFotos.length); 
      } else {
          setCurrentPhotoIndex(prev => (prev === todasLasFotos.length - 1 ? 0 : prev + 1));
      }
  };

  const handlePrevPhoto = () => {
      if (viewMode === 'grid') {
          setViewMode('carousel');
          setCurrentPhotoIndex(todasLasFotos.length - 1);
      } else {
          setCurrentPhotoIndex(prev => (prev === 0 ? todasLasFotos.length - 1 : prev - 1));
      }
  };

  const openCarouselAt = (index) => {
      setCurrentPhotoIndex(index);
      setViewMode('carousel');
  };

  useEffect(() => {
      const handleKeyDown = (e) => {
          if (viewMode === 'carousel') {
              if (e.key === 'Escape') setViewMode('grid');
              if (e.key === 'ArrowRight') handleNextPhoto();
              if (e.key === 'ArrowLeft') handlePrevPhoto();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, todasLasFotos.length]);


  const handleToggleFavorite = async () => {
      if (!currentUser) { alert("Debes iniciar sesión para guardar favoritos."); return; }
      if (favLoading) return;
      setFavLoading(true); setIsFavorite(!isFavorite);
      const token = localStorage.getItem('chantli_token');
      try {
          const res = await fetch(`${API_URL}/api/favoritos/toggle/`, {
              method: 'POST', headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ propiedad_id: propiedad.id })
          });
          if (!res.ok) { setIsFavorite(isFavorite); alert("Error al actualizar favoritos."); }
      } catch (error) { setIsFavorite(isFavorite); } finally { setFavLoading(false); }
  };

  const handleReserva = async (e) => {
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
                propiedad: propiedad.id, fecha_inicio: format(startDate), fecha_fin: format(endDate),
                huesped: currentUser.id, total: calculo.total 
            })
        });
        if (response.ok) { setIsModalOpen(false); setShowSuccessModal(true); } 
        else { alert("Error al solicitar la reserva."); }
    } catch (error) { alert("Error de conexión"); } finally { setBookingLoading(false); }
  };

  const handleSubmitResena = async (e) => {
      e.preventDefault();
      setReviewLoading(true);
      const token = localStorage.getItem('chantli_token');
      try {
          const res = await fetch(`${API_URL}/api/resenas/`, {
              method: 'POST', headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ propiedad: propiedad.id, calificacion: newReview.rating, comentario: newReview.comentario })
          });
          if (res.ok) {
              const nuevaResenaGuardada = await res.json();
              setResenas(prev => [{...nuevaResenaGuardada, autor_nombre: currentUser.first_name, autor_foto: currentUser.foto_perfil}, ...prev]);
              setNewReview({ rating: 5, comentario: '' });
              alert("¡Gracias por tu opinión!");
          } else { alert("No pudimos guardar tu reseña."); }
      } catch (error) { console.error(error); } finally { setReviewLoading(false); }
  };

  // --- MANEJADORES DE BÚSQUEDA ---
  const handleSearchAction = () => {
      if (searchText.trim()) {
          navigate('/home', { state: { searchQuery: searchText } });
      }
  };

  const handleSearchKeyDown = (e) => {
      if (e.key === 'Enter') handleSearchAction();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;
  if (!propiedad) return <div>No encontrada</div>;

  const promedioRating = resenas.length > 0 ? (resenas.reduce((acc, curr) => acc + curr.calificacion, 0) / resenas.length).toFixed(1) : "Nuevo";
  const hasCoordinates = propiedad.latitud && propiedad.longitud;
  const mapCenter = hasCoordinates ? { lat: parseFloat(propiedad.latitud), lng: parseFloat(propiedad.longitud) } : null;
  const hostId = propiedad.anfitrion_id || propiedad.anfitrion;
  const hostNombre = anfitrionInfo ? `${anfitrionInfo.first_name} ${anfitrionInfo.last_name || ''}`.trim() || anfitrionInfo.username : (propiedad.anfitrion_nombre || 'Usuario');
  const hostFoto = anfitrionInfo?.perfil?.foto_perfil || anfitrionInfo?.foto_perfil;
  const hostVerificado = anfitrionInfo?.perfil?.es_anfitrion_verificado || false;

  return (
    <div className="min-h-screen bg-white pb-28">
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

      {/* ======================================================== */}
      {/* HEADER FLOTANTE CON LOGO (IMAGEN), BUSCADOR Y ACCIONES     */}
      {/* ======================================================== */}
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between items-center z-20 pointer-events-none gap-2 sm:gap-4">
        
        {/* --- IZQUIERDA: Píldora (Volver + Logo Imagen) --- */}
        <div className="flex items-center pointer-events-auto flex-shrink-0">
            <div className="bg-white/90 rounded-full shadow-md backdrop-blur-md flex items-center p-1 border border-gray-100 transition hover:bg-white">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-full hover:bg-gray-100 transition active:scale-95"
                    title="Volver"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-700" />
                </button>
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

        {/* --- CENTRO: Barra de Búsqueda (Al estilo Home) --- */}
        <div className="flex-1 max-w-md hidden md:block pointer-events-auto">
             <div className="relative group shadow-md rounded-full bg-white/90 backdrop-blur-md border border-gray-100 overflow-hidden transition-all focus-within:shadow-lg focus-within:ring-2 focus-within:ring-brand-200">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-brand-600 transition-colors" />
                <input 
                    type="text" 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Buscar en Chantli..." 
                    className="w-full bg-transparent py-2.5 pl-11 pr-12 text-sm focus:outline-none font-medium text-gray-700 placeholder-gray-400"
                />
                <button 
                    onClick={handleSearchAction}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 hover:text-brand-600 transition-colors active:scale-95"
                    title="Buscar"
                >
                    <Filter className="h-4 w-4 text-gray-600" />
                </button>
            </div>
        </div>
         
        {/* --- DERECHA: Acciones (Fav, Compartir) --- */}
        <div className="flex gap-2 sm:gap-3 pointer-events-auto flex-shrink-0">
            <button 
                onClick={handleToggleFavorite} 
                disabled={favLoading} 
                className="bg-white/90 p-2.5 rounded-full shadow-md backdrop-blur-md hover:bg-white hover:scale-105 transition-all disabled:opacity-70"
                title={isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
                <Heart className={`h-5 w-5 transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-800'}`} />
            </button>
            <button 
                className="bg-white/90 p-2.5 rounded-full shadow-md backdrop-blur-md hover:bg-white hover:scale-105 transition-all hidden sm:block"
                title="Compartir propiedad"
            >
                <Share2 className="h-5 w-5 text-gray-800" />
            </button>
        </div>
      </div>

      {/* SECCIÓN DE FOTOS */}
      <div className="pt-20 px-4 md:px-8 max-w-6xl mx-auto h-[45vh] md:h-[60vh] relative group">
        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full rounded-2xl overflow-hidden shadow-sm bg-gray-100 relative">
                <div 
                    className={`relative cursor-pointer overflow-hidden ${todasLasFotos.length > 1 ? 'md:col-span-2' : 'md:col-span-3'}`} 
                    onClick={() => openCarouselAt(0)}
                >
                    <img src={todasLasFotos[0]?.imagen} className="w-full h-full object-cover hover:brightness-90 transition duration-300" alt="Principal" />
                </div>
                {todasLasFotos.length > 1 && (
                    <div className="hidden md:flex flex-col gap-2 h-full">
                        <div className="h-1/2 relative cursor-pointer overflow-hidden" onClick={() => openCarouselAt(1)}>
                            <img src={todasLasFotos[1]?.imagen} className="w-full h-full object-cover hover:brightness-90 transition duration-300" alt="Secundaria 1" />
                        </div>
                        {todasLasFotos.length > 2 && (
                            <div className="h-1/2 relative cursor-pointer overflow-hidden" onClick={() => openCarouselAt(2)}>
                                <img src={todasLasFotos[2]?.imagen} className="w-full h-full object-cover hover:brightness-90 transition duration-300" alt="Secundaria 2" />
                            </div>
                        )}
                    </div>
                )}
                <button 
                    onClick={() => openCarouselAt(0)}
                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-sm shadow-md border border-gray-200 hover:bg-white flex items-center gap-2 transition active:scale-95 text-gray-800"
                >
                    <ImageIcon className="h-4 w-4" /> {todasLasFotos.length} Fotos
                </button>
            </div>
        ) : (
            <div className="w-full h-full bg-gray-900 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                <img src={todasLasFotos[currentPhotoIndex]?.imagen} className="max-w-full max-h-full object-contain animate-fade-in" alt={`Detalle ${currentPhotoIndex + 1}`} />
                <button onClick={() => setViewMode('grid')} className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2.5 rounded-full backdrop-blur-md transition">
                    <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md">
                    {currentPhotoIndex + 1} / {todasLasFotos.length}
                </div>
            </div>
        )}
        {todasLasFotos.length > 1 && (
            <>
                <button onClick={(e) => { e.stopPropagation(); handlePrevPhoto(); }} className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 active:scale-95 text-gray-800 z-10">
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleNextPhoto(); }} className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 active:scale-95 text-gray-800 z-10">
                    <ChevronRight className="h-6 w-6" />
                </button>
            </>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto mt-6 px-4 sm:px-6">
        
        {/* Título y Ubicación */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 leading-tight">{propiedad.titulo}</h1>
                <div className="flex items-center text-gray-500 text-sm mt-2">
                    <MapPin className="h-4 w-4 mr-1 text-brand-600" /> {propiedad.direccion}
                </div>
            </div>
            <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 text-center min-w-[60px] shadow-sm">
                <div className="flex items-center justify-center font-bold text-gray-900">
                    <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" /> {promedioRating}
                </div>
                <div className="text-[10px] text-gray-400 underline">{resenas.length} reseñas</div>
            </div>
        </div>

        <hr className="border-gray-100 my-8" />

        {/* 1. Acerca del Lugar */}
        <div className="mb-10">
            <h3 className="font-bold text-xl mb-3 text-gray-900">Acerca del lugar</h3>
            <p className="text-gray-600 leading-relaxed">{propiedad.descripcion}</p>
        </div>

        {/* 2. Amenidades */}
        <div className="mb-10">
            <h3 className="font-bold text-xl mb-4 text-gray-900">Lo que ofrece este lugar</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                {(() => {
                    if (!propiedad.amenidades) {
                        return <span className="text-sm text-gray-400">Sin amenidades listadas.</span>;
                    }

                    let listaAmenidades = [];
                    
                    try {
                        // 1. Intentamos leerlo como JSON (Para tus publicaciones manuales)
                        const parsed = JSON.parse(propiedad.amenidades);
                        if (Array.isArray(parsed)) {
                            listaAmenidades = parsed;
                        } else {
                            // Si por alguna razón es JSON pero no es arreglo, lo pasamos a texto
                            listaAmenidades = [String(parsed)];
                        }
                    } catch (error) {
                        // 2. Si da error (como pasó con el script), usamos .split(',')
                        listaAmenidades = propiedad.amenidades.split(',');
                    }

                    return listaAmenidades.map((amenidad, index) => (
                        <div key={index} className="flex items-center text-gray-700">
                            <CheckCircle className="h-5 w-5 mr-3 text-brand-500 flex-shrink-0" /> 
                            {amenidad.trim()}
                        </div>
                    ));
                })()}
            </div>
        </div>

        {/* 3. Mapa de Ubicación */}
        <div className="mb-10">
            <h3 className="font-bold text-xl mb-4 text-gray-900">Ubicación</h3>
            <div className="h-80 bg-gray-200 rounded-2xl overflow-hidden relative shadow-sm border border-gray-100">
                {isLoaded && hasCoordinates ? (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={mapCenter}
                        zoom={15}
                        options={{ disableDefaultUI: true, zoomControl: true, streetViewControl: false, mapTypeControl: false }}
                    >
                        <Marker position={mapCenter} />
                    </GoogleMap>
                ) : (
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
                        <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                            <div className="h-2 w-2 bg-brand-600 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-gray-700">Ubicación aproximada (Dirección)</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* 4. Anfitrión */}
        <div className="mb-10 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-xl mb-6 text-gray-900">Conoce a tu anfitrión</h3>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div 
                    onClick={() => navigate(`/public-profile/${hostId}`)}
                    className="flex items-center cursor-pointer transition-colors group"
                >
                    <div className="h-14 w-14 bg-brand-100 rounded-full overflow-hidden flex items-center justify-center text-brand-700 font-bold text-xl mr-4 border-2 border-white shadow-sm group-hover:shadow-md transition-all relative">
                        {hostFoto ? (
                            <img src={getFileUrl(hostFoto)} className="w-full h-full object-cover" alt="Anfitrión" />
                        ) : (
                            hostNombre.charAt(0).toUpperCase()
                        )}
                        {hostVerificado && (
                            <div className="absolute bottom-0 right-0 bg-white rounded-full">
                                <ShieldCheck className="h-3 w-3 text-green-500 fill-green-50" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-lg group-hover:text-brand-600 transition-colors flex items-center gap-1">
                            {hostNombre} 
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </p>
                        <p className="text-sm text-gray-500">{hostVerificado ? 'Identidad verificada' : 'Miembro de Chantli'}</p>
                    </div>
                </div>
                
                {currentUser && currentUser.id !== hostId && (
                    <button 
                        onClick={() => navigate(`/chat/${hostId}`)}
                        className="p-3 bg-white border border-gray-200 rounded-full text-brand-600 hover:bg-brand-50 transition shadow-sm"
                        title="Enviar mensaje"
                    >
                        <MessageCircle className="h-6 w-6" />
                    </button>
                )}
            </div>
        </div>

        {/* 5. Opiniones y Reseñas */}
        <div className="mb-10 pt-8 border-t border-gray-100">
            <h3 className="font-bold text-xl mb-6 text-gray-900 flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" /> 
                Opiniones ({resenas.length})
            </h3>

            {canReview && (
                <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100">
                    <h4 className="font-bold text-gray-800 mb-3">¡Cuéntanos tu experiencia!</h4>
                    <div className="flex gap-1 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} type="button" onClick={() => setNewReview({ ...newReview, rating: star })}>
                                <Star className={`h-8 w-8 transition-colors ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'}`} />
                            </button>
                        ))}
                    </div>
                    <textarea 
                        className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-200 outline-none resize-none shadow-inner bg-white"
                        rows="3" placeholder="¿Qué tal estuvo tu estancia?" value={newReview.comentario} onChange={(e) => setNewReview({...newReview, comentario: e.target.value})}
                    ></textarea>
                    <button onClick={handleSubmitResena} disabled={reviewLoading || !newReview.comentario} className="mt-3 bg-brand-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 ml-auto hover:bg-brand-700 disabled:opacity-50 transition shadow-md">
                        {reviewLoading ? 'Enviando...' : <><Send className="h-4 w-4" /> Publicar Opinión</>}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resenas.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 italic">Aún no hay opiniones para este lugar.</p>
                    </div>
                ) : (
                    resenas.map((review) => (
                        <div key={review.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                                        {review.autor_foto ? <img src={getFileUrl(review.autor_foto)} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{review.autor_nombre ? review.autor_nombre.charAt(0) : 'U'}</div>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{review.autor_nombre || 'Usuario'}</p>
                                        <p className="text-xs text-gray-400">{new Date(review.fecha).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex text-yellow-400">{[...Array(review.calificacion)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{review.comentario}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* BARRA INFERIOR (RESERVAR) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-end">
                    <span className="font-bold text-2xl text-gray-900">${parseFloat(propiedad.precio).toLocaleString()}</span>
                    <span className="text-sm text-gray-500 mb-1 ml-1">/ mes</span>
                </div>
                <span className="text-xs text-green-600 font-bold flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Disponible ahora</span>
            </div>
            
            {currentUser && currentUser.id === hostId ? ( 
                <button className="bg-gray-900 text-white font-bold py-4 px-8 rounded-xl opacity-50 cursor-not-allowed">Es tu propiedad</button>
            ) : (
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-brand-200 transition-all active:scale-95 text-lg">
                    Solicitar Renta
                </button>
            )}
        </div>
      </div>

      {/* MODAL RESERVA Y MODAL DE ÉXITO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 relative z-10 animate-slide-up sm:animate-fade-in shadow-2xl min-h-[600px] flex flex-col">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-20 transition"><X className="h-6 w-6 text-gray-600" /></button>
                <div className="flex-1 overflow-y-auto pr-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Selecciona tus Fechas</h2>
                    <p className="text-sm text-gray-500 mb-6 flex items-center gap-1"><Clock className="h-4 w-4" /> Las fechas en amarillo ya están ocupadas.</p>
                    <form onSubmit={handleReserva} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Llegada</label>
                                <DatePicker selected={startDate} onChange={setStartDate} selectsStart startDate={startDate} endDate={endDate} minDate={new Date()} excludeDates={diasBloqueados} placeholderText="Seleccionar" className="w-full cursor-pointer border-gray-300" dateFormat="dd/MM/yyyy" popperPlacement="bottom-start" />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Salida</label>
                                <DatePicker selected={endDate} onChange={setEndDate} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || new Date()} excludeDates={diasBloqueados} placeholderText="Seleccionar" className="w-full cursor-pointer border-gray-300" dateFormat="dd/MM/yyyy" popperPlacement="bottom-end" />
                            </div>
                        </div>
                        {calculo.error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center border border-red-100 font-medium"><AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />{calculo.error}</div>}
                        {!calculo.error && calculo.total > 0 && (
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3 mt-4 animate-fade-in">
                                <div className="flex justify-between text-sm text-gray-600"><span>Renta ({calculo.dias} días)</span><span>${calculo.renta.toLocaleString()}</span></div>
                                <div className="flex justify-between text-sm text-gray-600"><span>IVA (16%)</span><span>${calculo.iva.toLocaleString()}</span></div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-gray-600">Depósito de Garantía</span>
                                    {calculo.deposito === 0 ? <div className="flex items-center text-green-700 font-bold bg-green-100 px-2 py-1 rounded-md text-xs border border-green-200"><ShieldCheck className="h-3 w-3 mr-1" /> Exento</div> : <span className="text-gray-600">${calculo.deposito.toLocaleString()}</span>}
                                </div>
                                <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-brand-700 text-xl">${calculo.total.toLocaleString()}</span></div>
                            </div>
                        )}
                        <div className="pt-4">
                            <button type="submit" disabled={bookingLoading || !!calculo.error || calculo.total === 0} className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl hover:bg-brand-700 transition disabled:opacity-50 shadow-lg text-lg">
                                {bookingLoading ? 'Enviando...' : (calculo.total > 0 ? `Enviar Solicitud` : 'Selecciona fechas')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative z-10 shadow-2xl animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mb-6 border-4 border-green-100">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
                <div className="bg-orange-50 text-orange-800 text-xs p-3 rounded-lg flex items-start text-left mb-6 border border-orange-100">
                    <Clock className="h-5 w-5 mr-2 flex-shrink-0 text-orange-500" />
                    <p>El anfitrión revisará tus fechas. <strong>No se ha realizado ningún cobro aún.</strong></p>
                </div>
                <p className="text-gray-600 text-sm mb-8 leading-relaxed">Te enviaremos una notificación en cuanto el anfitrión acepte tu solicitud para que puedas proceder al pago de forma segura.</p>
                <button onClick={() => { setShowSuccessModal(false); navigate('/historial-rentas'); }} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition active:scale-95 shadow-md">
                    Entendido, ir a mis rentas
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default PropertyDetail;
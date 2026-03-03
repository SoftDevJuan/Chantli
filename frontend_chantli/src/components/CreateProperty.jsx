import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, MapPin, Type, X, Check, Wifi, Tv, Coffee, Car, Wind, Search, Loader2, Home as HomeIcon, } from 'lucide-react';

// --- IMPORTACIONES GOOGLE MAPS ---
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // ¡Asegúrate de tener esto en tu .env!

// Configuración del Mapa
const containerStyle = { width: '100%', height: '100%', borderRadius: '0.75rem' };
const DEFAULT_CENTER = { lat: 20.659698, lng: -103.349609 }; // Guadalajara
const LIBRARIES = ['places']; // Necesario para búsquedas

const AMENIDADES_OPTIONS = [
    { id: 'wifi', label: 'Wifi Alta Vel.', icon: <Wifi className="h-4 w-4" /> },
    { id: 'ac', label: 'Aire Acondicionado', icon: <Wind className="h-4 w-4" /> },
    { id: 'cocina', label: 'Cocina Equipada', icon: <Coffee className="h-4 w-4" /> },
    { id: 'tv', label: 'TV / Streaming', icon: <Tv className="h-4 w-4" /> },
    { id: 'estacionamiento', label: 'Estacionamiento', icon: <Car className="h-4 w-4" /> },
    { id: 'lavadora', label: 'Lavadora', icon: null },
    { id: 'secadora', label: 'Secadora', icon: null },
    { id: 'patio', label: 'Patio / Jardín', icon: null },
    { id: 'pet_friendly', label: 'Pet Friendly', icon: null },
    { id: 'seguridad', label: 'Cámaras 24/7', icon: null },
];

const CreateProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);

  // Estados de Imagen y Datos
  const [portada, setPortada] = useState(null);
  const [previewPortada, setPreviewPortada] = useState(null);
  const [galeria, setGaleria] = useState([]);
  const [previewsGaleria, setPreviewsGaleria] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  const [formData, setFormData] = useState({
    titulo: '', descripcion: '', direccion: '', precio: ''
  });

  // --- ESTADOS GOOGLE MAPS ---
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries: LIBRARIES
  });

  const [map, setMap] = useState(null);
  const [markerPosition, setMarkerPosition] = useState(null); // Ubicación exacta {lat, lng}
  const [searchingMap, setSearchingMap] = useState(false);

  // Validación de Permisos (Igual que antes)
  useEffect(() => {
    const checkPermissions = async () => {
        const token = localStorage.getItem('chantli_token');
        if (!token) { navigate('/'); return; }
        try {
            const res = await fetch(`${API_URL}/api/me/`, { headers: { 'Authorization': `Token ${token}` } });
            const user = await res.json();
            if (!user.is_superuser && !user.perfil?.es_anfitrion_verificado) {
                alert("🔒 Acceso denegado, necesitas verificar tu perfil para crear propiedades"); navigate('/profile');
            } else { setVerifying(false); }
        } catch { navigate('/'); }
    };
    checkPermissions();
  }, [navigate]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- FUNCIONES GOOGLE MAPS ---
  
  const onLoad = useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  // 1. BUSCAR DIRECCIÓN (Geocoding)
  const buscarDireccionGoogle = async () => {
      if (!formData.direccion || !isLoaded || !window.google) return;
      
      setSearchingMap(true);
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: formData.direccion }, (results, status) => {
          setSearchingMap(false);
          if (status === 'OK' && results[0]) {
              const location = results[0].geometry.location;
              const lat = location.lat();
              const lng = location.lng();
              
              // Mover mapa y poner pin
              if (map) {
                  map.panTo({ lat, lng });
                  map.setZoom(17);
              }
              setMarkerPosition({ lat, lng });
          } else {
              alert("No pudimos encontrar esa dirección en Google Maps. Intenta ser más específico.");
          }
      });
  };

  // 2. ARRASTRAR MARCADOR
  const onMarkerDragEnd = (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
  };

  // 3. CLIC EN EL MAPA (Opcional, si quieres que al dar clic se mueva el pin)
  const onMapClick = (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
  };


  // --- MANEJO DE IMÁGENES Y AMENIDADES (Igual que antes) ---
  const toggleAmenity = (id) => selectedAmenities.includes(id) ? setSelectedAmenities(p => p.filter(i => i !== id)) : setSelectedAmenities(p => [...p, id]);
  const handlePortadaChange = (e) => { const f = e.target.files[0]; if(f) { setPortada(f); setPreviewPortada(URL.createObjectURL(f)); } };
  const handleGaleriaChange = (e) => { const files = Array.from(e.target.files); setGaleria(p => [...p, ...files]); setPreviewsGaleria(p => [...p, ...files.map(f => URL.createObjectURL(f))]); };
  const removeFoto = (i) => { setGaleria(p => p.filter((_, x) => x !== i)); setPreviewsGaleria(p => p.filter((_, x) => x !== i)); };

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('chantli_token');
    const dataToSend = new FormData();
    
    dataToSend.append('titulo', formData.titulo);
    dataToSend.append('descripcion', formData.descripcion);
    dataToSend.append('direccion', formData.direccion);
    dataToSend.append('precio', formData.precio);
    dataToSend.append('amenidades', JSON.stringify(selectedAmenities));

    if (markerPosition) {
        dataToSend.append('latitud', markerPosition.lat);
        dataToSend.append('longitud', markerPosition.lng);
    } else {
        alert("Por favor, confirma la ubicación en el mapa antes de guardar.");
        setLoading(false); return;
    }

    if (portada) dataToSend.append('imagen', portada);
    galeria.forEach((foto) => dataToSend.append('fotos_extra', foto));

    try {
      const response = await fetch(`${API_URL}/api/propiedades/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: dataToSend
      });
      if (response.ok) { alert("¡Propiedad publicada!"); navigate('/home'); }
      else { const err = await response.json(); alert('Error: ' + JSON.stringify(err)); }
    } catch { alert('Error de conexión'); } 
    finally { setLoading(false); }
  };

  if (verifying) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-20 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
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
        <h1 className="ml-2 text-lg font-bold text-gray-900">Publicar Espacio</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* FOTOS */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-brand-600" /> Fotografías
              </h3>
              {/* Portada */}
              <div className="mb-4">
                <div className="relative h-56 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-brand-400 transition-colors group">
                  {previewPortada ? <img src={previewPortada} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-gray-400"><UploadCloud className="h-8 w-8 mb-2" /><span className="text-xs">Subir Portada</span></div>}
                  <input type="file" onChange={handlePortadaChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" required />
                </div>
              </div>
              {/* Galería (Simplificada para no repetir código visual) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Galería</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previewsGaleria.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"><img src={src} className="w-full h-full object-cover" /><button type="button" onClick={() => removeFoto(index)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X className="h-3 w-3" /></button></div>
                  ))}
                  <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer"><UploadCloud className="h-6 w-6 text-gray-400" /><input type="file" multiple onChange={handleGaleriaChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" /></div>
                </div>
              </div>
          </section>

          {/* DATOS BÁSICOS */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Type className="h-4 w-4 text-brand-600" /> Información Básica
            </h3>
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Título</label>
                <input type="text" name="titulo" onChange={handleChange} required className="block w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Precio Mensual</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
                        <input type="number" name="precio" onChange={handleChange} required className="block w-full pl-7 p-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-gray-800" />
                    </div>
                </div>
                
                {/* --- DIRECCIÓN CON GOOGLE --- */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Dirección Completa</label>
                    <div className="relative mt-1 group">
                        <input 
                            type="text" 
                            name="direccion" 
                            value={formData.direccion}
                            onChange={handleChange} 
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarDireccionGoogle())}
                            required 
                            className="block w-full p-3 pr-12 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                            placeholder="Calle, Número, Colonia, Ciudad" 
                        />
                        <button 
                            type="button"
                            onClick={buscarDireccionGoogle}
                            disabled={searchingMap}
                            className="absolute right-2 top-2 p-1.5 bg-white border border-gray-200 rounded-lg text-brand-600 hover:bg-brand-50 shadow-sm transition-all active:scale-95"
                        >
                            {searchingMap ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Escribe la dirección y pulsa la lupa para ubicar en el mapa.</p>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <textarea name="descripcion" onChange={handleChange} rows="4" required className="block w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mt-1 outline-none resize-none"></textarea>
            </div>
          </section>

          {/* --- MAPA GOOGLE --- */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative">
             <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-600" /> Ubicación en Google Maps
            </h3>
            <p className="text-xs text-gray-500 mb-3">
                {markerPosition ? "Puedes arrastrar el marcador rojo si la ubicación no es exacta." : "Usa la lupa de arriba para buscar la dirección."}
            </p>
            
            <div className="h-64 w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={DEFAULT_CENTER}
                        zoom={12}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={onMapClick}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                        }}
                    >
                        {markerPosition && (
                            <Marker 
                                position={markerPosition} 
                                draggable={true}
                                onDragEnd={onMarkerDragEnd}
                                animation={window.google.maps.Animation.DROP}
                            />
                        )}
                    </GoogleMap>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">Cargando Google Maps...</div>
                )}
            </div>

            {markerPosition ? (
                <div className="mt-3 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between animate-fade-in">
                    <span className="flex items-center"><Check className="h-4 w-4 mr-1.5" /> Coordenadas listas</span>
                    <span className="font-mono opacity-75 text-[10px]">{markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}</span>
                </div>
            ) : (
                <div className="mt-3 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold flex items-center animate-pulse">
                    <MapPin className="h-4 w-4 mr-1.5" /> Busca una dirección para fijar el mapa
                </div>
            )}
          </section>

          {/* AMENIDADES */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Wifi className="h-4 w-4 text-brand-600" /> Amenidades</h3>
             <div className="grid grid-cols-2 gap-3">
                {AMENIDADES_OPTIONS.map((item) => {
                    const isSelected = selectedAmenities.includes(item.id);
                    return (
                        <div key={item.id} onClick={() => toggleAmenity(item.id)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${isSelected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200'}`}>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'}`}>{isSelected && <Check className="h-3 w-3 text-white" />}</div>
                            <span className="text-xs font-bold flex items-center gap-2">{item.icon}{item.label}</span>
                        </div>
                    );
                })}
            </div>
          </section>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20">
              <div className="max-w-2xl mx-auto">
                <button type="submit" disabled={loading} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition disabled:opacity-70 active:scale-95 flex items-center justify-center gap-2">
                    {loading ? 'Publicando...' : <>Publicar Propiedad <ArrowLeft className="h-4 w-4 rotate-180" /></>}
                </button>
              </div>
          </div>
          <div className="h-10"></div> 
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;
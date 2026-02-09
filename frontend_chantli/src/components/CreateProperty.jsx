import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, MapPin, DollarSign, Type, X, Check, ShieldAlert, Wifi, Tv, Coffee, Car, Wind } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Lista de amenidades disponibles
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
  const [verifying, setVerifying] = useState(true); // Estado de carga inicial (validación)
  
  // Estado para la foto de portada (Individual)
  const [portada, setPortada] = useState(null);
  const [previewPortada, setPreviewPortada] = useState(null);

  // Estado para la galería (Múltiple)
  const [galeria, setGaleria] = useState([]); 
  const [previewsGaleria, setPreviewsGaleria] = useState([]); 

  // Estado para Amenidades Seleccionadas
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    direccion: '',
    precio: ''
  });

  // --- 1. VALIDACIÓN DE PERMISOS AL CARGAR ---
  useEffect(() => {
    const checkPermissions = async () => {
        const token = localStorage.getItem('chantli_token');
        if (!token) { navigate('/'); return; }

        try {
            const res = await fetch(`${API_URL}/api/me/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const user = await res.json();

            // Verificamos: ¿Es Superusuario? O ¿Es Anfitrión Verificado?
            const isSuper = user.is_superuser;
            const isVerifiedHost = user.perfil?.es_anfitrion_verificado;

            if (!isSuper && !isVerifiedHost) {
                // Si no cumple, lo mandamos al perfil con una alerta
                alert("🔒 ACCESO DENEGADO\nNecesitas verificar tu identidad como anfitrión para publicar.");
                navigate('/profile');
            } else {
                // Si cumple, permitimos ver el formulario
                setVerifying(false);
            }
        } catch (error) {
            console.error(error);
            navigate('/');
        }
    };
    checkPermissions();
  }, [navigate]);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar toggle de amenidades
  const toggleAmenity = (id) => {
      if (selectedAmenities.includes(id)) {
          setSelectedAmenities(prev => prev.filter(item => item !== id));
      } else {
          setSelectedAmenities(prev => [...prev, id]);
      }
  };

  // Manejar Fotos
  const handlePortadaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPortada(file);
      setPreviewPortada(URL.createObjectURL(file));
    }
  };

  const handleGaleriaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setGaleria(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewsGaleria(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFoto = (index) => {
    setGaleria(prev => prev.filter((_, i) => i !== index));
    setPreviewsGaleria(prev => prev.filter((_, i) => i !== index));
  };

  // --- ENVÍO DEL FORMULARIO ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('chantli_token');
    const dataToSend = new FormData();
    
    // Datos básicos
    dataToSend.append('titulo', formData.titulo);
    dataToSend.append('descripcion', formData.descripcion);
    dataToSend.append('direccion', formData.direccion);
    dataToSend.append('precio', formData.precio);
    
    // Amenidades (Las enviamos como JSON string para que el backend TextField las guarde)
    dataToSend.append('amenidades', JSON.stringify(selectedAmenities));

    // Fotos
    if (portada) {
      dataToSend.append('imagen', portada);
    }
    galeria.forEach((foto) => {
      dataToSend.append('fotos_extra', foto); 
    });

    try {
      const response = await fetch(`${API_URL}/api/propiedades/`, {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: dataToSend
      });

      if (response.ok) {
        alert("¡Propiedad publicada con éxito!");
        navigate('/home');
      } else {
        const err = await response.json();
        console.error(err);
        alert('Error al publicar: ' + JSON.stringify(err));
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de carga mientras valida permisos
  if (verifying) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Verificando permisos...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-20 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Publicar Espacio</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECCIÓN 1: FOTOS */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-brand-600" /> Fotografías
              </h3>
              
              {/* Portada */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Portada (Principal)</label>
                <div className="relative h-56 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden hover:border-brand-400 transition-colors group">
                  {previewPortada ? (
                    <img src={previewPortada} className="w-full h-full object-cover" alt="Portada" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                          <UploadCloud className="h-6 w-6 text-brand-500" />
                      </div>
                      <span className="text-sm font-medium">Toca para subir portada</span>
                    </div>
                  )}
                  <input type="file" onChange={handlePortadaChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" required />
                </div>
              </div>

              {/* Galería */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Galería Adicional</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previewsGaleria.map((src, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={src} className="w-full h-full object-cover" alt={`Foto ${index}`} />
                      <button 
                        type="button"
                        onClick={() => removeFoto(index)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Botón + */}
                  <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
                    <UploadCloud className="h-6 w-6 text-gray-400" />
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleGaleriaChange} 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
          </section>

          {/* SECCIÓN 2: DETALLES */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Type className="h-4 w-4 text-brand-600" /> Información Básica
            </h3>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Título del Anuncio</label>
                <input type="text" name="titulo" onChange={handleChange} required className="block w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Ej. Depa moderno cerca de CUCEI" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Precio Mensual</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-3 text-gray-500 font-bold">$</span>
                        <input type="number" name="precio" onChange={handleChange} required className="block w-full pl-7 p-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-gray-800" placeholder="0.00" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Ubicación</label>
                    <input type="text" name="direccion" onChange={handleChange} required className="block w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="Colonia, Ciudad" />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                <textarea name="descripcion" onChange={handleChange} rows="4" required className="block w-full p-3 border border-gray-200 bg-gray-50 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none" placeholder="Describe lo mejor de tu espacio..."></textarea>
            </div>
          </section>

          {/* SECCIÓN 3: AMENIDADES (NUEVO) */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
             <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-brand-600" /> Amenidades y Servicios
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
                {AMENIDADES_OPTIONS.map((item) => {
                    const isSelected = selectedAmenities.includes(item.id);
                    return (
                        <div 
                            key={item.id}
                            onClick={() => toggleAmenity(item.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none
                                ${isSelected 
                                    ? 'border-brand-500 bg-brand-50 text-brand-700' 
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-brand-200'}`}
                        >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white'}`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-xs font-bold flex items-center gap-2">
                                {item.icon && <span className="opacity-70">{item.icon}</span>}
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
          </section>

          {/* BOTÓN PUBLICAR */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-20">
              <div className="max-w-2xl mx-auto">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition disabled:opacity-70 active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        'Publicando...'
                    ) : (
                        <>Publicar Propiedad <ArrowLeft className="h-4 w-4 rotate-180" /></>
                    )}
                </button>
              </div>
          </div>
          
          {/* Espaciador para el botón fixed */}
          <div className="h-10"></div> 

        </form>
      </div>
    </div>
  );
};

export default CreateProperty;
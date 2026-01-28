import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, MapPin, DollarSign, Type, X } from 'lucide-react';

const CreateProperty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Estado para la foto de portada (Individual)
  const [portada, setPortada] = useState(null);
  const [previewPortada, setPreviewPortada] = useState(null);

  // Estado para la galería (Múltiple)
  const [galeria, setGaleria] = useState([]); // Array de archivos
  const [previewsGaleria, setPreviewsGaleria] = useState([]); // Array de URLs

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    direccion: '',
    precio: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Manejar Foto de Portada
  const handlePortadaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPortada(file);
      setPreviewPortada(URL.createObjectURL(file));
    }
  };

  // 2. Manejar Galería (Múltiples fotos)
  const handleGaleriaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Agregamos a los que ya existen
      setGaleria(prev => [...prev, ...files]);
      
      // Generamos previews
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviewsGaleria(prev => [...prev, ...newPreviews]);
    }
  };

  // Eliminar una foto de la galería antes de subir
  const removeFoto = (index) => {
    setGaleria(prev => prev.filter((_, i) => i !== index));
    setPreviewsGaleria(prev => prev.filter((_, i) => i !== index));
  };

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
    
    // Foto Portada (Campo original del modelo)
    if (portada) {
      dataToSend.append('imagen', portada);
    }

    // Fotos Galería (Loop para agregar múltiples archivos con la misma clave)
    galeria.forEach((foto) => {
      dataToSend.append('fotos_extra', foto); // <--- Esta clave coincide con el Backend
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/propiedades/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` },
        body: dataToSend
      });

      if (response.ok) {
        navigate('/home');
      } else {
        const err = await response.json();
        console.error(err);
        alert('Error al publicar. Revisa la consola.');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="ml-2 text-lg font-bold text-gray-900">Publicar Espacio</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- FOTO DE PORTADA --- */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Foto de Portada (Principal)</label>
            <div className="relative h-48 rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden hover:border-brand-400 transition-colors">
              {previewPortada ? (
                <img src={previewPortada} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <UploadCloud className="h-10 w-10 mb-2" />
                  <span className="text-sm">Toca para subir portada</span>
                </div>
              )}
              <input type="file" onChange={handlePortadaChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" required />
            </div>
          </div>

          {/* --- GALERÍA ADICIONAL --- */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Galería (Fotos extra)</label>
            
            {/* Grid de Previews */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previewsGaleria.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img src={src} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removeFoto(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              {/* Botón para agregar más */}
              <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:bg-gray-100 cursor-pointer">
                <UploadCloud className="h-8 w-8 text-gray-400" />
                <input 
                  type="file" 
                  multiple // <--- ESTO PERMITE VARIAS FOTOS
                  onChange={handleGaleriaChange} 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">Puedes seleccionar varias fotos a la vez.</p>
          </div>

          {/* --- INPUTS DE TEXTO --- */}
          <div className="space-y-4">
            <div>
                <label className="text-sm font-medium text-gray-700">Título</label>
                <input type="text" name="titulo" onChange={handleChange} required className="block w-full p-3 border border-gray-300 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Ej. Depa en Providencia" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-700">Precio</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-3 text-gray-500">$</span>
                        <input type="number" name="precio" onChange={handleChange} required className="block w-full pl-7 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700">Dirección</label>
                    <input type="text" name="direccion" onChange={handleChange} required className="block w-full p-3 border border-gray-300 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="descripcion" onChange={handleChange} rows="3" required className="block w-full p-3 border border-gray-300 rounded-xl mt-1 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Detalles del lugar..."></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition disabled:opacity-50"
          >
            {loading ? 'Subiendo fotos...' : 'Publicar Propiedad'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateProperty;
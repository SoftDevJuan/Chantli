import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, CheckCircle, Share2 } from 'lucide-react';

const PropertyDetail = () => {
  const { id } = useParams(); // Obtenemos el ID de la URL
  const navigate = useNavigate();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar detalles de UNA sola propiedad
    fetch(`http://127.0.0.1:8000/api/propiedades/${id}/`)
      .then(res => res.json())
      .then(data => {
        setPropiedad(data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!propiedad) return <div>No encontrada</div>;

  // Unir foto portada + album para mostrar todo junto
  const todasLasFotos = [
      { id: 'cover', imagen: propiedad.imagen }, 
      ...(propiedad.album || [])
  ].filter(f => f.imagen);

  return (
    <div className="min-h-screen bg-white pb-24">
      
      {/* Navbar Transparente (o botón regresar) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10">
        <button onClick={() => navigate(-1)} className="bg-white/80 p-2 rounded-full shadow-sm backdrop-blur-md">
            <ArrowLeft className="h-6 w-6 text-gray-800" />
        </button>
        <button className="bg-white/80 p-2 rounded-full shadow-sm backdrop-blur-md">
            <Share2 className="h-6 w-6 text-gray-800" />
        </button>
      </div>

      {/* --- GALERÍA GRANDE --- */}
      <div className="h-[40vh] sm:h-[50vh] bg-gray-200 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide">
        {todasLasFotos.map((foto, idx) => (
            <img 
                key={idx} 
                src={foto.imagen} 
                className="w-full h-full object-cover snap-center flex-shrink-0" 
                alt="Detalle" 
            />
        ))}
      </div>

      <div className="max-w-4xl mx-auto -mt-6 relative bg-white rounded-t-3xl px-6 py-8 shadow-inner min-h-[50vh]">
        {/* Título y Precio */}
        <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-gray-900 w-3/4">{propiedad.titulo}</h1>
            <div className="text-right">
                <p className="text-2xl font-bold text-brand-600">${propiedad.precio}</p>
                <p className="text-xs text-gray-500">/mes</p>
            </div>
        </div>

        <div className="flex items-center text-gray-500 text-sm mb-6">
            <MapPin className="h-4 w-4 mr-1" />
            {propiedad.direccion}
        </div>

        <hr className="border-gray-100 mb-6" />

        {/* Anfitrión */}
        <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-xl mr-4">
                <User className="text-gray-500" />
            </div>
            <div>
                <p className="font-bold text-gray-900">Anfitrión: {propiedad.anfitrion}</p>
                <p className="text-xs text-gray-500">Identidad verificada</p>
            </div>
        </div>

        {/* Descripción */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-2">Acerca de este lugar</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {propiedad.descripcion}
            </p>
        </div>

        {/* Servicios (Hardcoded por ahora para diseño) */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-3">Lo que ofrece</h3>
            <div className="grid grid-cols-2 gap-3">
                {['Wifi', 'Cocina', 'Lavadora', 'Entrada privada'].map(s => (
                    <div key={s} className="flex items-center text-gray-600">
                        <CheckCircle className="h-4 w-4 mr-2 text-brand-500" />
                        {s}
                    </div>
                ))}
            </div>
        </div>

      </div>

      {/* --- BARRA FIJA DE RESERVA --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
                <span className="font-bold text-lg">${propiedad.precio}</span>
                <span className="text-xs text-gray-500 underline">Consultar disponibilidad</span>
            </div>
            <button className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl transition-colors">
                Solicitar Reserva
            </button>
        </div>
      </div>

    </div>
  );
};

export default PropertyDetail;
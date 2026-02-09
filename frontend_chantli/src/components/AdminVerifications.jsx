import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShieldAlert, FileText, Check, X as XIcon, User, ExternalLink, Loader2, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const AdminVerifications = () => {
  const navigate = useNavigate();
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de visualización de documentos
  const [visorDoc, setVisorDoc] = useState(null); // URL de la imagen a ver en grande

  // Cargar lista
  const fetchPendientes = async () => {
    const token = localStorage.getItem('chantli_token');
    try {
        const res = await fetch(`${API_URL}/api/perfil/admin_pendientes/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        
        if (res.status === 403) {
            alert("Acceso Denegado: Solo Administradores.");
            navigate('/home');
            return;
        }

        const data = await res.json();
        setPerfiles(data);
        setLoading(false);
    } catch (error) {
        console.error(error);
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendientes();
  }, []);

  // Función para Aprobar/Revocar
  const toggleVerificacion = async (idPerfil, tipo, nuevoValor) => {
      const token = localStorage.getItem('chantli_token');
      try {
          const res = await fetch(`${API_URL}/api/perfil/${idPerfil}/admin_verificar/`, {
              method: 'PATCH',
              headers: { 
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ tipo, valor: nuevoValor })
          });

          if (res.ok) {
              // Actualizar UI localmente para que sea rápido
              setPerfiles(prev => prev.map(p => {
                  if (p.id === idPerfil) {
                      return {
                          ...p,
                          es_anfitrion_verificado: tipo === 'anfitrion' ? nuevoValor : p.es_anfitrion_verificado,
                          es_huesped_verificado: tipo === 'huesped' ? nuevoValor : p.es_huesped_verificado
                      };
                  }
                  return p;
              }));
          }
      } catch (error) {
          alert("Error al actualizar");
      }
  };

  if (loading) return <div className="p-10 text-center">Cargando panel...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-white p-2 rounded-full shadow hover:bg-gray-50">
                <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-brand-600" /> 
                Panel de Validación
            </h1>
        </div>
        <span className="bg-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm text-gray-500">
            {perfiles.length} Usuarios Encontrados
        </span>
      </div>

      {/* Grid de Usuarios */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6">
        {perfiles.map(perfil => (
            <div key={perfil.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
                
                {/* Cabecera del Usuario */}
                <div className="bg-gray-50 p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl overflow-hidden">
                            {perfil.foto_perfil ? (
                                <img src={perfil.foto_perfil} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <User />
                            )}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-gray-900">@{perfil.username}</h2>
                            <p className="text-sm text-gray-500">{perfil.email}</p>
                            <p className="text-xs text-gray-400 font-mono mt-1">Tel: {perfil.telefono || 'Sin registro'}</p>
                        </div>
                    </div>
                    
                    {/* Botones de Acción Principal */}
                    <div className="flex gap-3">
                        {/* Control Anfitrión */}
                        <button 
                            onClick={() => toggleVerificacion(perfil.id, 'anfitrion', !perfil.es_anfitrion_verificado)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all border
                            ${perfil.es_anfitrion_verificado 
                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                : 'bg-white text-gray-400 border-gray-300 hover:border-green-500 hover:text-green-600'}`}
                        >
                            {perfil.es_anfitrion_verificado ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 border-2 border-current rounded-sm"></div>}
                            ANFITRIÓN
                        </button>

                        {/* Control Huésped */}
                        <button 
                            onClick={() => toggleVerificacion(perfil.id, 'huesped', !perfil.es_huesped_verificado)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all border
                            ${perfil.es_huesped_verificado 
                                ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' 
                                : 'bg-white text-gray-400 border-gray-300 hover:border-blue-500 hover:text-blue-600'}`}
                        >
                            {perfil.es_huesped_verificado ? <Check className="h-4 w-4" /> : <div className="h-4 w-4 border-2 border-current rounded-sm"></div>}
                            HUÉSPED
                        </button>
                    </div>
                </div>

                {/* Cuerpo: Documentos */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* 1. INE Frente */}
                    <DocumentCard 
                        title="INE Frente" 
                        file={perfil.identificacion_frente} 
                        onView={() => setVisorDoc(perfil.identificacion_frente)} 
                    />

                    {/* 2. INE Reverso */}
                    <DocumentCard 
                        title="INE Reverso" 
                        file={perfil.identificacion_reverso} 
                        onView={() => setVisorDoc(perfil.identificacion_reverso)} 
                    />

                    {/* 3. Datos Fiscales / Domicilio */}
                    <div className="space-y-4">
                        <DocumentCard 
                            title="Comp. Domicilio" 
                            file={perfil.comprobante_domicilio_propiedad} 
                            onView={() => setVisorDoc(perfil.comprobante_domicilio_propiedad)} 
                        />
                         <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">RFC / SAT</p>
                            <p className="font-mono text-sm font-bold text-gray-700 break-all">
                                {perfil.rfc || "No registrado"}
                            </p>
                        </div>
                    </div>

                    {/* 4. Datos Huésped */}
                    <div className="space-y-4">
                        <DocumentCard 
                            title="Constancia Estudios/Trabajo" 
                            file={perfil.constancia_estudios_trabajo} 
                            onView={() => setVisorDoc(perfil.constancia_estudios_trabajo)} 
                        />
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Referencia</p>
                            <p className="text-xs font-bold text-gray-700">{perfil.referencia_nombre}</p>
                            <p className="text-xs text-gray-500">{perfil.referencia_telefono}</p>
                        </div>
                    </div>

                </div>
            </div>
        ))}
      </div>

      {/* MODAL VISOR DE IMAGEN */}
      {visorDoc && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setVisorDoc(null)}>
              <button className="absolute top-4 right-4 text-white hover:text-red-400">
                  <XIcon className="h-8 w-8" />
              </button>
              <img 
                src={visorDoc.startsWith('http') ? visorDoc : `${API_URL}${visorDoc}`} 
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" 
                alt="Documento" 
                onClick={(e) => e.stopPropagation()} // Evitar cerrar al dar click a la imagen
              />
          </div>
      )}

    </div>
  );
};

// Componente auxiliar para tarjeta de documento
const DocumentCard = ({ title, file, onView }) => {
    if (!file) return (
        <div className="border border-dashed border-gray-200 bg-gray-50 rounded-lg h-32 flex flex-col items-center justify-center text-gray-300">
            <FileText className="h-6 w-6 mb-1" />
            <span className="text-xs">Sin documento</span>
        </div>
    );

    const isPdf = typeof file === 'string' && file.toLowerCase().endsWith('.pdf');

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden group relative h-32 bg-gray-100">
            {isPdf ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50 text-red-500">
                    <FileText className="h-10 w-10" />
                    <span className="text-xs font-bold ml-2">PDF</span>
                </div>
            ) : (
                <img 
                    src={file.startsWith('http') ? file : `${API_URL}${file}`} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                    alt={title} 
                />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <span className="text-white text-xs font-bold">{title}</span>
                <button 
                    onClick={(e) => { e.stopPropagation(); isPdf ? window.open(file, '_blank') : onView(); }}
                    className="bg-white text-black p-2 rounded-full hover:bg-brand-50"
                >
                    {isPdf ? <ExternalLink className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>

            {/* Etiqueta siempre visible si no hay hover */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] p-1 text-center truncate group-hover:opacity-0">
                {title}
            </div>
        </div>
    );
};

export default AdminVerifications;
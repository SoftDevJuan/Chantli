import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Check, X as XIcon, User, Eye, AlertCircle, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const AdminVerifications = () => {
  const navigate = useNavigate();
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal del Súper Visor
  const [selectedUser, setSelectedUser] = useState(null);

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
        
        // 1. EL FILTRO MÁGICO: Solo mostramos a quienes ya subieron al menos un documento o foto
        const usuariosConDocs = data.filter(p => 
            p.identificacion_frente || 
            p.foto_selfie || 
            p.constancia_estudios_trabajo || 
            p.comprobante_domicilio_propiedad
        );

        setPerfiles(usuariosConDocs);
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
              // Actualizar UI localmente (Lista)
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
              
              // Actualizar UI localmente (Modal si está abierto)
              if (selectedUser && selectedUser.id === idPerfil) {
                  setSelectedUser(prev => ({
                      ...prev,
                      es_anfitrion_verificado: tipo === 'anfitrion' ? nuevoValor : prev.es_anfitrion_verificado,
                      es_huesped_verificado: tipo === 'huesped' ? nuevoValor : prev.es_huesped_verificado
                  }));
              }
          }
      } catch (error) {
          alert("Error al actualizar");
      }
  };

  // Ayudante para formatear URLs de archivos
  const getFileUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `${API_URL}${path}`;
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Cargando panel de seguridad...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 pb-20">
      
      {/* --- HEADER --- */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="bg-white p-2 rounded-full shadow hover:bg-gray-50 transition-colors">
                <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ShieldCheck className="h-8 w-8 text-brand-600" /> 
                Centro de Validación
            </h1>
        </div>
        <span className="bg-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm text-gray-500 border border-gray-200">
            {perfiles.length} Solicitudes Pendientes
        </span>
      </div>

      {/* --- LISTA LIMPIA DE USUARIOS --- */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {perfiles.length === 0 ? (
            <div className="col-span-full bg-white p-10 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
                <ShieldCheck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 font-medium">No hay usuarios con documentos pendientes de validación.</p>
            </div>
        ) : (
            perfiles.map(perfil => (
                <div key={perfil.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
                    <div className="p-5 flex items-center gap-4">
                        <div className="h-14 w-14 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-xl overflow-hidden shadow-inner flex-shrink-0">
                            {perfil.foto_perfil ? (
                                <img src={getFileUrl(perfil.foto_perfil)} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-6 w-6" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-lg text-gray-900 truncate">@{perfil.username}</h2>
                            <p className="text-xs text-gray-500 truncate">{perfil.email}</p>
                            
                            {/* Insignias rápidas de estado */}
                            <div className="flex gap-2 mt-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${perfil.es_anfitrion_verificado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    Anfitrión {perfil.es_anfitrion_verificado ? '✓' : '⌛'}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${perfil.es_huesped_verificado ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                    Huésped {perfil.es_huesped_verificado ? '✓' : '⌛'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Botón para abrir el Súper Modal */}
                    <div className="bg-gray-50 p-3 border-t border-gray-100">
                        <button 
                            onClick={() => setSelectedUser(perfil)}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 font-bold py-2 rounded-lg shadow-sm hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-all"
                        >
                            <Eye className="h-4 w-4" /> Ver Documentación
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* --- SÚPER MODAL DE VALIDACIÓN VISUAL --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
            <div className="bg-gray-100 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
                
                {/* Cabecera del Modal */}
                <div className="bg-white p-4 border-b flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-brand-100 rounded-full flex items-center justify-center overflow-hidden">
                            {selectedUser.foto_perfil ? <img src={getFileUrl(selectedUser.foto_perfil)} className="w-full h-full object-cover"/> : <User className="text-brand-600" />}
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-gray-800">Validando a @{selectedUser.username}</h2>
                            <p className="text-xs text-gray-500 font-mono">RFC: {selectedUser.rfc || 'No subido'} | Tel: {selectedUser.telefono || 'No subido'}</p>
                        </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                {/* Cuerpo Scrolleable del Modal */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {/* SECCIÓN 1: BIOMETRÍA (INE vs Selfie) */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-brand-600" /> Comparación Biométrica
                        </h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Izquierda: Identificaciones (Toman 2 columnas) */}
                            <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ImagePreviewBox title="INE (Frente)" src={getFileUrl(selectedUser.identificacion_frente)} />
                                <ImagePreviewBox title="INE (Reverso)" src={getFileUrl(selectedUser.identificacion_reverso)} />
                            </div>
                            
                            {/* Derecha: Selfie (Toma 1 columna, se muestra más grande) */}
                            <div className="col-span-1 border-l-0 lg:border-l-2 border-dashed border-gray-200 lg:pl-6">
                                <ImagePreviewBox title="Prueba de Vida (Selfie)" src={getFileUrl(selectedUser.foto_selfie)} isSelfie={true} />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: DOCUMENTOS PDF (Comprobante y Constancia) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Comprobante de Domicilio (Para Anfitrión) */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">Comprobante Domicilio (Anfitrión)</h3>
                            <DocumentViewer src={getFileUrl(selectedUser.comprobante_domicilio_propiedad)} />
                        </div>

                        {/* Constancia de Estudios (Para Huésped) */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-800 uppercase">Constancia Estudios (Huésped)</h3>
                            </div>
                            <div className="mb-3 bg-gray-50 p-2 rounded text-xs border border-gray-200 flex justify-between">
                                <span><strong className="text-gray-500">Ref:</strong> {selectedUser.referencia_nombre || 'N/A'}</span>
                                <span className="font-mono"><strong className="text-gray-500">Tel:</strong> {selectedUser.referencia_telefono || 'N/A'}</span>
                            </div>
                            <DocumentViewer src={getFileUrl(selectedUser.constancia_estudios_trabajo)} />
                        </div>
                    </div>

                </div>

                {/* Footer de Decisiones (Sticky abajo) */}
                <div className="bg-white p-4 border-t flex flex-col sm:flex-row justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <button 
                        onClick={() => toggleVerificacion(selectedUser.id, 'huesped', !selectedUser.es_huesped_verificado)}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border-2
                        ${selectedUser.es_huesped_verificado 
                            ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-blue-500 hover:text-blue-600'}`}
                    >
                        {selectedUser.es_huesped_verificado ? <Check className="h-5 w-5" /> : <div className="h-5 w-5 border-2 border-current rounded-md"></div>}
                        APROBAR HUÉSPED
                    </button>

                    <button 
                        onClick={() => toggleVerificacion(selectedUser.id, 'anfitrion', !selectedUser.es_anfitrion_verificado)}
                        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all border-2
                        ${selectedUser.es_anfitrion_verificado 
                            ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                            : 'bg-white text-gray-500 border-gray-300 hover:border-green-500 hover:text-green-600'}`}
                    >
                        {selectedUser.es_anfitrion_verificado ? <Check className="h-5 w-5" /> : <div className="h-5 w-5 border-2 border-current rounded-md"></div>}
                        APROBAR ANFITRIÓN
                    </button>
                </div>

            </div>
        </div>
      )}

    </div>
  );
};

// --- COMPONENTES AUXILIARES PARA EL MODAL ---

// Visor de Imágenes (Para INE y Selfie)
const ImagePreviewBox = ({ title, src, isSelfie }) => {
    return (
        <div className="flex flex-col h-full">
            <span className="text-xs font-bold text-gray-500 mb-2">{title}</span>
            <div className={`bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex-1 flex items-center justify-center relative group
                ${isSelfie ? 'min-h-[250px]' : 'min-h-[160px]'}`}
            >
                {src ? (
                    <>
                        <img src={src} className="w-full h-full object-contain absolute inset-0 p-1" alt={title} />
                        {/* Botón para ver en pestaña nueva por si quieren zoom */}
                        <a href={src} target="_blank" rel="noreferrer" className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </>
                ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                        <AlertCircle className="h-8 w-8 mb-1 opacity-50" />
                        <span className="text-xs font-medium">No subido</span>
                    </div>
                )}
            </div>
        </div>
    );
};

// Visor de Documentos (Incrusta PDFs en iframes o muestra imagen si no es PDF)
const DocumentViewer = ({ src }) => {
    if (!src) return (
        <div className="h-80 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400">
            <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">Archivo no proporcionado</span>
        </div>
    );

    const isPdf = src.toLowerCase().endsWith('.pdf');

    return (
        <div className="h-80 bg-gray-100 border border-gray-200 rounded-xl overflow-hidden relative group">
            {isPdf ? (
                // El iframe renderiza el PDF directamente en la página
                <iframe src={src} className="w-full h-full border-none" title="Visor PDF" />
            ) : (
                <img src={src} className="w-full h-full object-contain p-2" alt="Documento" />
            )}
            
            {/* Botón flotante para abrir en pantalla completa si está muy pequeño */}
            <a 
                href={src} 
                target="_blank" 
                rel="noreferrer" 
                className="absolute bottom-4 right-4 bg-brand-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg hover:bg-brand-700 transition-transform hover:scale-105 flex items-center gap-2 opacity-0 group-hover:opacity-100"
            >
                <ExternalLink className="h-4 w-4" /> Abrir completo
            </a>
        </div>
    );
};

export default AdminVerifications;
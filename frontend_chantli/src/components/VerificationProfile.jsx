import React, { useState, useEffect } from 'react';
import { Upload, ShieldCheck, FileText, AlertTriangle, CheckCircle, User, Briefcase, Home as HomeIcon, Camera, Edit3, XCircle, ExternalLink, Eye, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const VerificationProfile = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showTerms, setShowTerms] = useState(false); // Modal de términos
  
  const [formData, setFormData] = useState({
      telefono: '',
      direccion: '',
      rfc: '',
      referencia_nombre: '',
      referencia_telefono: '',
      acepto_terminos: false
  });
  
  const [files, setFiles] = useState({});

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    const token = localStorage.getItem('chantli_token');
    try {
        const res = await fetch(`${API_URL}/api/perfil/subir_documentos/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await res.json();
        setPerfil(data);
        
        setFormData({
            telefono: data.telefono || '',
            direccion: data.direccion || '',
            rfc: data.rfc || '',
            referencia_nombre: data.referencia_nombre || '',
            referencia_telefono: data.referencia_telefono || '',
            acepto_terminos: data.acepto_terminos_y_reglamento || false
        });

        if (data.identificacion_frente || data.foto_selfie || data.constancia_estudios_trabajo) {
            setIsEditing(false);
        } else {
            setIsEditing(true); 
        }
        setLoading(false);
    } catch (err) {
        console.error(err);
        setLoading(false);
    }
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const maxSize = 5 * 1024 * 1024; 
          if (file.size > maxSize) {
              alert(`El archivo "${file.name}" es demasiado pesado. El límite es 5MB.`);
              e.target.value = ""; 
              return;
          }
          setFiles({ ...files, [e.target.name]: file });
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      if (!formData.acepto_terminos) return alert("Debes aceptar los términos y condiciones.");
      
      setUploading(true);
      const token = localStorage.getItem('chantli_token');
      
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      data.append('acepto_terminos_y_reglamento', 'true');

      Object.keys(files).forEach(key => {
          if (files[key]) data.append(key, files[key]);
      });

      // Si ya existía el perfil, marcamos como editado
      if(perfil?.identificacion_frente) {
          data.append('fue_editado', 'true');
      }

      try {
          const res = await fetch(`${API_URL}/api/perfil/subir_documentos/`, {
              method: 'PATCH',
              headers: { 'Authorization': `Token ${token}` },
              body: data
          });
          
          if (res.ok) {
              alert("Documentos enviados con éxito.");
              setFiles({}); 
              cargarPerfil(); 
          } else {
              alert("Error al procesar los documentos. Verifica los tamaños.");
          }
      } catch (error) {
          alert("Error de conexión");
      } finally {
          setUploading(false);
      }
  };

  const handleCancelVerification = async () => {
      if(!window.confirm("¿Seguro que deseas cancelar tu validación? Se borrarán tus documentos y perderás tus insignias.")) return;

      setUploading(true);
      const token = localStorage.getItem('chantli_token');
      
      const data = new FormData();
      data.append('cancelar_validacion', 'true'); 

      try {
          const res = await fetch(`${API_URL}/api/perfil/subir_documentos/`, {
              method: 'PATCH',
              headers: { 'Authorization': `Token ${token}` },
              body: data
          });
          
          if (res.ok) {
              alert("Validación cancelada correctamente.");
              cargarPerfil();
          }
      } catch (error) {
          console.error(error);
      } finally {
          setUploading(false);
      }
  };

  const getFileUrl = (path) => {
      if (!path) return null;
      return path.startsWith('http') ? path : `${API_URL}${path}`;
  };

  if (loading) return <div className="p-10 text-center font-bold text-brand-600 flex justify-center mt-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-28">
      
      {/* Botón flotante para regresar al Perfil */}
      <div className="max-w-3xl mx-auto mb-4">
        <button onClick={() => navigate('/profile')} className="flex items-center text-gray-600 hover:text-brand-600 font-bold transition">
            <ArrowLeft className="h-5 w-5 mr-1" /> Regresar al Perfil
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

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Encabezado */}
        <div className="bg-brand-600 p-8 text-white text-center relative">
            <ShieldCheck className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-bold">Verificación de Identidad</h1>
            <p className="text-brand-100 mt-2">Mantén tu cuenta segura y gana la confianza de la comunidad Chantli.</p>
        </div>

        {/* ========================================================= */}
        {/* VISTA 1: MODO LECTURA (RESUMEN DE LO ENVIADO)             */}
        {/* ========================================================= */}
        {!isEditing ? (
            <div className="p-8 space-y-6 animate-fade-in">
                
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Estado de tu Solicitud</h2>
                        <p className="text-sm text-gray-500">Tus documentos están siendo revisados por nuestro equipo.</p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${perfil?.es_anfitrion_verificado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {perfil?.es_anfitrion_verificado ? <CheckCircle className="h-4 w-4"/> : <ClockIcon className="h-4 w-4"/>} Anfitrión
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${perfil?.es_huesped_verificado ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {perfil?.es_huesped_verificado ? <CheckCircle className="h-4 w-4"/> : <ClockIcon className="h-4 w-4"/>} Huésped
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Teléfono</p>
                        <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{perfil?.telefono || 'No proporcionado'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Dirección</p>
                        <p className="font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{perfil?.direccion || 'No proporcionada'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">Documentos Enviados</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MiniDocViewer title="INE Frente" file={perfil?.identificacion_frente} getFileUrl={getFileUrl} />
                        <MiniDocViewer title="INE Reverso" file={perfil?.identificacion_reverso} getFileUrl={getFileUrl} />
                        <MiniDocViewer title="Selfie" file={perfil?.foto_selfie} getFileUrl={getFileUrl} />
                        <MiniDocViewer title="PDF Adicional" file={perfil?.comprobante_domicilio_propiedad || perfil?.constancia_estudios_trabajo} getFileUrl={getFileUrl} isPdf={true} />
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 flex justify-center items-center gap-2 bg-brand-50 text-brand-700 font-bold py-3 px-4 rounded-xl hover:bg-brand-100 transition"
                    >
                        <Edit3 className="h-5 w-5" /> Editar Documentación
                    </button>
                    <button 
                        onClick={handleCancelVerification}
                        disabled={uploading}
                        className="flex-1 flex justify-center items-center gap-2 bg-white border border-red-200 text-red-600 font-bold py-3 px-4 rounded-xl hover:bg-red-50 transition"
                    >
                        <XCircle className="h-5 w-5" /> Cancelar Validación
                    </button>
                </div>
            </div>
        ) : (

        /* ========================================================= */
        /* VISTA 2: MODO EDICIÓN (FORMULARIO CON VISTAS PREVIAS)     */
        /* ========================================================= */
        <form onSubmit={handleSubmit} className="p-8 space-y-8 animate-fade-in relative">
            
            {(perfil?.identificacion_frente || perfil?.foto_selfie || perfil?.constancia_estudios_trabajo) && (
                <button type="button" onClick={() => setIsEditing(false)} className="absolute top-4 right-8 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition">
                    <X className="h-5 w-5 text-gray-600" />
                </button>
            )}

            <section>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 border-b pb-2">
                    <User className="h-5 w-5 text-brand-600" /> Datos y Biometría
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="Teléfono Celular" className="input-field border p-3 rounded-lg w-full"
                        value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} required
                    />
                    <input 
                        type="text" placeholder="Dirección Completa con CP" className="input-field border p-3 rounded-lg w-full"
                        value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} required
                    />
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileUploader 
                        title="Identificación (Frente)" 
                        name="identificacion_frente" 
                        fileUrl={getFileUrl(perfil?.identificacion_frente)} 
                        onChange={handleFileChange} 
                        newFile={files.identificacion_frente} 
                        accept="image/*" capture="environment" 
                    />
                    <FileUploader 
                        title="Identificación (Reverso)" 
                        name="identificacion_reverso" 
                        fileUrl={getFileUrl(perfil?.identificacion_reverso)} 
                        onChange={handleFileChange} 
                        newFile={files.identificacion_reverso} 
                        accept="image/*" capture="environment" 
                    />
                </div>

                <div className="mt-4">
                    <FileUploader 
                        title="Prueba de Vida (Selfie)" 
                        name="foto_selfie" 
                        fileUrl={getFileUrl(perfil?.foto_selfie)} 
                        onChange={handleFileChange} 
                        newFile={files.foto_selfie} 
                        accept="image/*" capture="user"
                        isSelfie={true}
                    />
                </div>
            </section>

            <section className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                    <HomeIcon className="h-5 w-5" /> Quiero Publicar Propiedades (Anfitrión)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="RFC (Registro SAT)" className="input-field border p-3 rounded-lg w-full"
                        value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})}
                    />
                     <FileUploader 
                        title="Comprobante Domicilio / Propiedad" 
                        name="comprobante_domicilio_propiedad" 
                        fileUrl={getFileUrl(perfil?.comprobante_domicilio_propiedad)} 
                        onChange={handleFileChange} 
                        newFile={files.comprobante_domicilio_propiedad} 
                        accept=".pdf,image/*" 
                    />
                </div>
            </section>

            <section className="bg-green-50 p-5 rounded-xl border border-green-100">
                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5" /> Validación de Huésped
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        type="text" placeholder="Nombre Referencia Personal" className="input-field border p-3 rounded-lg w-full"
                        value={formData.referencia_nombre} onChange={e => setFormData({...formData, referencia_nombre: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Teléfono Referencia" className="input-field border p-3 rounded-lg w-full"
                        value={formData.referencia_telefono} onChange={e => setFormData({...formData, referencia_telefono: e.target.value})}
                    />
                </div>
                <FileUploader 
                    title="Constancia de Estudios o Trabajo" 
                    name="constancia_estudios_trabajo" 
                    fileUrl={getFileUrl(perfil?.constancia_estudios_trabajo)} 
                    onChange={handleFileChange} 
                    newFile={files.constancia_estudios_trabajo} 
                    accept=".pdf,image/*" 
                />
            </section>

            <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <input 
                    type="checkbox" 
                    checked={formData.acepto_terminos}
                    onChange={e => setFormData({...formData, acepto_terminos: e.target.checked})}
                    className="h-5 w-5 mt-1 text-brand-600 rounded focus:ring-brand-500 cursor-pointer"
                />
                <div>
                    <span className="text-sm font-bold text-gray-800 cursor-pointer" onClick={() => setFormData({...formData, acepto_terminos: !formData.acepto_terminos})}>
                        He leído y acepto los términos legales.
                    </span>
                    <p className="text-xs text-brand-600 font-bold hover:underline cursor-pointer mt-1" onClick={() => setShowTerms(true)}>
                        Ver Términos, Condiciones y Aviso de Privacidad
                    </p>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Upload className="h-5 w-5" />}
                {uploading ? 'Guardando...' : 'Guardar y Enviar a Revisión'}
            </button>

        </form>
        )}
      </div>

      {/* MODAL LEGAL */}
      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-900">Términos y Aviso de Privacidad</h2>
                    <button onClick={() => setShowTerms(false)} className="text-gray-400 hover:text-red-500"><XCircle className="h-6 w-6" /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-600 space-y-4">
                    <p><strong>1. Uso de Datos:</strong> Tus documentos son encriptados y utilizados exclusivamente para validar tu identidad dentro de la plataforma Chantli, garantizando la seguridad de la comunidad.</p>
                    <p><strong>2. Almacenamiento:</strong> No compartimos tus datos biométricos ni identificaciones con terceros ajenos al proceso de validación. Al cancelar tu validación, tus archivos físicos son destruidos de nuestros servidores permanentemente.</p>
                    <p><strong>3. Responsabilidad:</strong> Proporcionar documentos falsos o alterados resultará en la suspensión permanente de tu cuenta y posibles reportes a las autoridades correspondientes.</p>
                    <p><strong>4. Consentimiento:</strong> Al marcar la casilla de aceptación, otorgas tu consentimiento expreso para el tratamiento de tus datos personales bajo los lineamientos de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>
                </div>
                <div className="p-4 border-t bg-gray-50 text-right">
                    <button onClick={() => setShowTerms(false)} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700">Entendido</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Componente para la Vista Previa del Documento
const MiniDocViewer = ({ title, file, getFileUrl, isPdf }) => {
    if (!file) return (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg h-24 flex flex-col items-center justify-center text-gray-400">
            <span className="text-[10px] font-bold text-center px-2">{title}</span>
            <span className="text-[9px] mt-1">Pendiente</span>
        </div>
    );

    const fullUrl = getFileUrl(file);
    const renderPdf = isPdf || file.toLowerCase().endsWith('.pdf');

    return (
        <a href={fullUrl} target="_blank" rel="noreferrer" className="group relative bg-gray-100 border border-gray-200 rounded-lg h-24 overflow-hidden block hover:shadow-md transition">
            {renderPdf ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-red-500 bg-red-50">
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold">PDF</span>
                </div>
            ) : (
                <img src={fullUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition" alt={title} />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <ExternalLink className="text-white h-5 w-5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] text-center py-1 truncate px-1">
                {title}
            </div>
        </a>
    );
};

// Componente Inteligente para Subir Archivos (Muestra el actual, permite cambiarlo)
const FileUploader = ({ title, name, fileUrl, onChange, newFile, accept, capture, isSelfie }) => {
    const isPdf = fileUrl && fileUrl.toLowerCase().endsWith('.pdf');

    return (
        <div className={`relative border-2 border-dashed ${fileUrl || newFile ? 'border-brand-300 bg-brand-50' : 'border-gray-300 hover:bg-gray-50'} rounded-xl p-4 text-center transition flex flex-col justify-center`}>
            
            {/* Si ya hay un archivo subido, mostramos una mini vista previa arriba */}
            {fileUrl && !newFile && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm border border-gray-200">
                    <span className="text-[10px] font-bold text-green-600">Actual ✓</span>
                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-800"><Eye className="h-3 w-3" /></a>
                </div>
            )}

            {!fileUrl && !newFile && <Camera className={`h-8 w-8 mx-auto text-gray-400 mb-2 ${isSelfie && 'text-brand-400'}`} />}
            
            <p className={`text-sm font-bold mb-1 ${isSelfie ? 'text-brand-900' : 'text-gray-700'}`}>{title}</p>
            
            {newFile ? (
                <p className="text-xs text-brand-600 font-bold mt-2">Nuevo archivo seleccionado listo para guardar.</p>
            ) : (
                <p className="text-[10px] text-gray-500 mb-3">{fileUrl ? 'Sube un archivo para reemplazarlo' : 'Toma una foto clara'}</p>
            )}
            
            <input 
                type="file" 
                name={name} 
                onChange={onChange} 
                className="text-xs w-full max-w-[200px] mx-auto cursor-pointer file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200" 
                accept={accept} 
                capture={capture} 
            />
        </div>
    );
};

const ClockIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default VerificationProfile;
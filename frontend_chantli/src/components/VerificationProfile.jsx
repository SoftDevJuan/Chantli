import React, { useState, useEffect } from 'react';
import { Upload, ShieldCheck, FileText, AlertTriangle, CheckCircle, User, Briefcase, Home, Camera, Edit3, XCircle, ExternalLink, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const VerificationProfile = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // NUEVO: Estado para saber si mostramos el resumen o el formulario
  const [isEditing, setIsEditing] = useState(false);
  
  // Formulario
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

        // LÓGICA MÁGICA: Si ya subió su INE o Selfie, lo mandamos a la vista de "Resumen"
        if (data.identificacion_frente || data.foto_selfie) {
            setIsEditing(false);
        } else {
            setIsEditing(true); // Si está vacío, mostramos el formulario
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

      // Bandera para que Django sepa que fue una edición manual y mande notificación
      data.append('fue_editado', 'true');

      try {
          const res = await fetch(`${API_URL}/api/perfil/subir_documentos/`, {
              method: 'PATCH',
              headers: { 'Authorization': `Token ${token}` },
              body: data
          });
          
          if (res.ok) {
              alert("Documentos actualizados con éxito. Hemos notificado al equipo de validación.");
              setFiles({}); // Limpiamos archivos temporales
              cargarPerfil(); // Recarga y lo regresa a la vista de lectura automáticamente
          } else {
              alert("Error al subir documentos. Verifica el tamaño de los archivos.");
          }
      } catch (error) {
          alert("Error de conexión");
      } finally {
          setUploading(false);
      }
  };

  // Función para Cancelar/Borrar la validación
  const handleCancelVerification = async () => {
      if(!window.confirm("¿Estás seguro de que deseas cancelar tu proceso de validación? Esto borrará tus documentos enviados y perderás tus insignias de verificación.")) return;

      setUploading(true);
      const token = localStorage.getItem('chantli_token');
      
      // Enviamos campos vacíos para resetear
      const data = new FormData();
      data.append('telefono', '');
      data.append('direccion', '');
      data.append('rfc', '');
      data.append('acepto_terminos_y_reglamento', 'false');
      data.append('cancelar_validacion', 'true'); // Bandera para backend

      try {
          const res = await fetch(`${API_URL}/api/perfil/subir_documentos/`, {
              method: 'PATCH',
              headers: { 'Authorization': `Token ${token}` },
              body: data
          });
          
          if (res.ok) {
              alert("Tu proceso de validación ha sido cancelado y tus datos retirados de la revisión.");
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

  if (loading) return <div className="p-10 text-center text-gray-500 font-bold">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-28">
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
                
                {/* Estatus Global */}
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

                {/* Resumen de Datos */}
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

                {/* Resumen de Documentos */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">Documentos Enviados</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MiniDocViewer title="INE Frente" file={perfil?.identificacion_frente} getFileUrl={getFileUrl} />
                        <MiniDocViewer title="INE Reverso" file={perfil?.identificacion_reverso} getFileUrl={getFileUrl} />
                        <MiniDocViewer title="Selfie" file={perfil?.foto_selfie} getFileUrl={getFileUrl} />
                        <MiniDocViewer title="Comprobante / PDF" file={perfil?.comprobante_domicilio_propiedad || perfil?.constancia_estudios_trabajo} getFileUrl={getFileUrl} isPdf={true} />
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 flex justify-center items-center gap-2 bg-brand-50 text-brand-700 font-bold py-3 px-4 rounded-xl hover:bg-brand-100 transition"
                    >
                        <Edit3 className="h-5 w-5" /> Editar Información
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
        /* VISTA 2: MODO EDICIÓN (EL FORMULARIO QUE YA TENÍAMOS)     */
        /* ========================================================= */
        <form onSubmit={handleSubmit} className="p-8 space-y-8 animate-fade-in">
            
            {/* Si ya tenía datos y está editando, mostramos un botón para regresar */}
            {(perfil?.identificacion_frente || perfil?.foto_selfie) && (
                <button type="button" onClick={() => setIsEditing(false)} className="text-brand-600 text-sm font-bold flex items-center hover:underline mb-4">
                    &larr; Volver al resumen
                </button>
            )}

            {/* --- SECCIÓN DATOS PERSONALES --- */}
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
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 transition">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-700 mb-1">Identificación (Frente)</p>
                        <p className="text-[10px] text-gray-500 mb-3">Toma una foto clara y sin reflejos</p>
                        <input type="file" name="identificacion_frente" onChange={handleFileChange} className="text-xs w-full" accept="image/*" capture="environment" />
                        {perfil?.identificacion_frente && <p className="text-xs text-green-600 mt-2 font-bold">✓ Archivo actual guardado</p>}
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 transition">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-700 mb-1">Identificación (Reverso)</p>
                        <p className="text-[10px] text-gray-500 mb-3">Asegúrate de que el texto sea legible</p>
                        <input type="file" name="identificacion_reverso" onChange={handleFileChange} className="text-xs w-full" accept="image/*" capture="environment" />
                        {perfil?.identificacion_reverso && <p className="text-xs text-green-600 mt-2 font-bold">✓ Archivo actual guardado</p>}
                    </div>
                </div>

                <div className="mt-4 border-2 border-dashed border-brand-200 bg-brand-50 rounded-xl p-5 text-center">
                    <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <User className="h-6 w-6 text-brand-600" />
                    </div>
                    <p className="text-sm font-bold text-brand-900 mb-1">Prueba de Vida (Selfie)</p>
                    <p className="text-xs text-brand-700 mb-4 max-w-md mx-auto">Tómate una foto ahora mismo.</p>
                    <input type="file" name="foto_selfie" onChange={handleFileChange} className="text-xs w-full max-w-xs mx-auto block" accept="image/*" capture="user" />
                    {perfil?.foto_selfie && <p className="text-xs text-green-600 mt-2 font-bold">✓ Selfie actual guardada</p>}
                </div>
            </section>

            {/* --- SECCIÓN ANFITRIÓN --- */}
            <section className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5" /> Quiero Publicar Propiedades (Anfitrión)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="RFC (Registro SAT)" className="input-field border p-3 rounded-lg w-full"
                        value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})}
                    />
                     <div className="border border-dashed border-blue-300 bg-white rounded-lg p-4 text-center">
                        <p className="text-sm font-bold text-gray-500 mb-2">Comprobante Domicilio / Propiedad</p>
                        <input type="file" name="comprobante_domicilio_propiedad" onChange={handleFileChange} className="text-xs" accept=".pdf,image/*" />
                        {perfil?.comprobante_domicilio_propiedad && <p className="text-xs text-green-600 mt-2 font-bold">✓ Archivo guardado</p>}
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN HUÉSPED --- */}
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
                <div className="border border-dashed border-green-300 bg-white rounded-lg p-4 text-center">
                    <p className="text-sm font-bold text-gray-500 mb-2">Constancia de Estudios o Trabajo (PDF)</p>
                    <input type="file" name="constancia_estudios_trabajo" onChange={handleFileChange} className="text-xs" accept=".pdf,image/*" />
                    {perfil?.constancia_estudios_trabajo && <p className="text-xs text-green-600 mt-2 font-bold">✓ Archivo guardado</p>}
                </div>
            </section>

            <label className="flex items-center gap-3 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={formData.acepto_terminos}
                    onChange={e => setFormData({...formData, acepto_terminos: e.target.checked})}
                    className="h-5 w-5 text-brand-600 rounded focus:ring-brand-500"
                />
                <span className="text-sm font-bold text-gray-800">He leído y acepto el Reglamento y Aviso de Privacidad.</span>
            </label>

            <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-lg disabled:opacity-50"
            >
                {uploading ? 'Guardando cambios...' : 'Guardar y Enviar a Revisión'}
            </button>

        </form>
        )}
      </div>
    </div>
  );
};

// Componente pequeño para renderizar los documentos en la vista de resumen
const MiniDocViewer = ({ title, file, getFileUrl }) => {
    if (!file) return (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg h-24 flex flex-col items-center justify-center text-gray-400">
            <span className="text-[10px] font-bold text-center px-2">{title}</span>
            <span className="text-[9px] mt-1">Pendiente</span>
        </div>
    );

    const isPdf = file.toLowerCase().endsWith('.pdf');
    const fullUrl = getFileUrl(file);

    return (
        <a href={fullUrl} target="_blank" rel="noreferrer" className="group relative bg-gray-100 border border-gray-200 rounded-lg h-24 overflow-hidden block hover:shadow-md transition">
            {isPdf ? (
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

// Icono auxiliar
const ClockIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default VerificationProfile;
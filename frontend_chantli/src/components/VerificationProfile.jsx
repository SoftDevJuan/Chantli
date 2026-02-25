import React, { useState, useEffect } from 'react';
import { Upload, ShieldCheck, FileText, AlertTriangle, CheckCircle, User, Briefcase, Home, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const VerificationProfile = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Formulario
  const [formData, setFormData] = useState({
      telefono: '',
      direccion: '',
      rfc: '',
      referencia_nombre: '',
      referencia_telefono: '',
      acepto_terminos: false
  });
  
  // Archivos
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
            acepto_terminos: data.acepto_terminos_y_reglamento
        });
        setLoading(false);
    } catch (err) {
        console.error(err);
    }
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      
      if (file) {
          // VALIDACIÓN DE TAMAÑO (Máximo 5MB)
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

      try {
          const res = await fetch(`${API_URL}/api/perfil/subir_documentos/`, {
              method: 'PATCH',
              headers: { 'Authorization': `Token ${token}` },
              body: data
          });
          
          if (res.ok) {
              alert("Documentos enviados. Nuestro equipo validará tu identidad en 24-48hrs.");
              cargarPerfil(); 
          } else {
              alert("Error al subir documentos. Verifica el tamaño de los archivos.");
          }
      } catch (error) {
          alert("Error de conexión");
      } finally {
          setUploading(false);
      }
  };

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 pb-28">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Encabezado */}
        <div className="bg-brand-600 p-8 text-white text-center">
            <ShieldCheck className="h-16 w-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl font-bold">Verificación de Identidad</h1>
            <p className="text-brand-100 mt-2">Para mantener la seguridad de Chantli, necesitamos validar quién eres.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* 1. Datos Personales y Biometría */}
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
                
                {/* ZONA DE FOTOS DE IDENTIFICACIÓN (Cámara Trasera) */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 transition">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-700 mb-1">Identificación (Frente)</p>
                        <p className="text-[10px] text-gray-500 mb-3">Toma una foto clara y sin reflejos</p>
                        {/* capture="environment" abre la cámara trasera */}
                        <input type="file" name="identificacion_frente" onChange={handleFileChange} className="text-xs w-full" accept="image/*" capture="environment" />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:bg-gray-50 transition">
                        <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm font-bold text-gray-700 mb-1">Identificación (Reverso)</p>
                        <p className="text-[10px] text-gray-500 mb-3">Asegúrate de que el texto sea legible</p>
                        <input type="file" name="identificacion_reverso" onChange={handleFileChange} className="text-xs w-full" accept="image/*" capture="environment" />
                    </div>
                </div>

                {/* ZONA DE SELFIE (Cámara Frontal) */}
                <div className="mt-4 border-2 border-dashed border-brand-200 bg-brand-50 rounded-xl p-5 text-center">
                    <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <User className="h-6 w-6 text-brand-600" />
                    </div>
                    <p className="text-sm font-bold text-brand-900 mb-1">Prueba de Vida (Selfie)</p>
                    <p className="text-xs text-brand-700 mb-4 max-w-md mx-auto">Tómate una foto ahora mismo. Necesitamos confirmar que tu rostro coincide con la identificación proporcionada.</p>
                    {/* capture="user" abre la cámara frontal (selfie) */}
                    <input type="file" name="foto_selfie" onChange={handleFileChange} className="text-xs w-full max-w-xs mx-auto block" accept="image/*" capture="user" />
                </div>
            </section>

            {/* 2. Sección Anfitrión */}
            <section className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5" /> Quiero Publicar Propiedades (Anfitrión)
                </h3>
                <p className="text-xs text-blue-700 mb-4">Requerido para cobrar y publicar anuncios.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="RFC (Registro SAT)" className="input-field border p-3 rounded-lg w-full"
                        value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})}
                    />
                     <div className="border border-dashed border-blue-300 bg-white rounded-lg p-4 text-center">
                        <p className="text-sm font-bold text-gray-500 mb-2">Comprobante Domicilio / Propiedad</p>
                        <input type="file" name="comprobante_domicilio_propiedad" onChange={handleFileChange} className="text-xs" accept=".pdf,image/*" />
                    </div>
                </div>
                {perfil?.es_anfitrion_verificado ? (
                    <div className="mt-4 text-green-600 font-bold flex items-center gap-2 bg-green-50 p-2 rounded-lg"><CheckCircle className="h-5 w-5"/> Anfitrión Verificado</div>
                ) : (
                    <div className="mt-4 text-orange-600 text-sm font-bold flex items-center gap-2 bg-orange-50 p-2 rounded-lg"><AlertTriangle className="h-5 w-5"/> Pendiente de validación</div>
                )}
            </section>

            {/* 3. Sección Huésped */}
            <section className="bg-green-50 p-5 rounded-xl border border-green-100">
                <h3 className="text-lg font-bold text-green-900 flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5" /> Validación de Huésped
                </h3>
                <p className="text-xs text-green-700 mb-4">Sube comprobante de estudios o trabajo para evitar el depósito de garantía extra.</p>
                
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
                </div>
            </section>

            {/* 4. Términos Legales */}
            <section className="border-t pt-6">
                <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600 h-32 overflow-y-auto mb-4 border border-gray-200">
                    <h4 className="font-bold mb-2">1. Confidencialidad</h4>
                    <p className="mb-2">La información aquí proporcionada será tratada con estricta confidencialidad según la Ley de Protección de Datos...</p>
                    <h4 className="font-bold mb-2">2. Obligaciones del Huésped</h4>
                    <p className="mb-2">El huésped se compromete a cuidar el inmueble, respetar a los vecinos y no realizar actividades ilícitas...</p>
                    <h4 className="font-bold mb-2">3. Veracidad y Biometría</h4>
                    <p>Declaro que los documentos y fotografías capturadas son auténticos, vigentes y corresponden a mi persona.</p>
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={formData.acepto_terminos}
                        onChange={e => setFormData({...formData, acepto_terminos: e.target.checked})}
                        className="h-5 w-5 text-brand-600 rounded focus:ring-brand-500"
                    />
                    <span className="text-sm font-bold text-gray-800">He leído y acepto el Reglamento y Aviso de Privacidad.</span>
                </label>
            </section>

            <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition shadow-lg disabled:opacity-50"
            >
                {uploading ? 'Subiendo archivos...' : 'Enviar Documentación para Validación'}
            </button>

        </form>
      </div>
    </div>
  );
};

export default VerificationProfile;
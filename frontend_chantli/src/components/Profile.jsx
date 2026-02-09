import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Camera, User, Mail, Phone, FileText, Save, X, Edit2, 
    ShieldCheck, ShieldAlert, ChevronRight, Briefcase, Home // <--- 1. IMPORTAMOS EL ICONO HOME
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado para los datos del usuario
  const [user, setUser] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    rol: '',
    telefono: '', 
    biografia: '', 
    foto_perfil: null,
    es_anfitrion_verificado: false,
    es_huesped_verificado: false
  });

  const [newImageFile, setNewImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // 1. Cargar datos
  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    if (!token) { navigate('/'); return; }

    fetch(`${API_URL}/api/me/`, {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        setUser({
            ...data,
            telefono: data.perfil?.telefono || data.telefono || '',
            biografia: data.perfil?.biografia || data.biografia || '',
            rol: data.perfil?.rol || 'huesped',
            foto_perfil: data.perfil?.foto_perfil || data.foto_perfil || null,
            es_anfitrion_verificado: data.perfil?.es_anfitrion_verificado || false,
            es_huesped_verificado: data.perfil?.es_huesped_verificado || false
        });
        
        const foto = data.perfil?.foto_perfil || data.foto_perfil;
        setPreviewImage(foto ? (foto.startsWith('http') ? foto : `${API_URL}${foto}`) : null);
        
        setLoading(false);
    })
    .catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, [navigate]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setPreviewImage(URL.createObjectURL(file)); 
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('chantli_token');

    const formData = new FormData();
    formData.append('first_name', user.first_name);
    formData.append('last_name', user.last_name);
    formData.append('email', user.email);
    formData.append('telefono', user.telefono);
    formData.append('biografia', user.biografia);
    
    if (newImageFile) {
        formData.append('foto_perfil', newImageFile);
    }

    try {
        const res = await fetch(`${API_URL}/api/me/`, { 
            method: 'PATCH',
            headers: { 
                'Authorization': `Token ${token}`
            },
            body: formData
        });

        if (res.ok) {
            const updatedData = await res.json();
            setUser(prev => ({
                ...prev,
                ...updatedData,
                telefono: updatedData.perfil?.telefono || updatedData.telefono,
                biografia: updatedData.perfil?.biografia || updatedData.biografia,
                foto_perfil: updatedData.perfil?.foto_perfil || updatedData.foto_perfil
            }));
            
            setIsEditing(false);
            setNewImageFile(null);
            alert("Perfil actualizado correctamente");
        } else {
            alert("Error al guardar cambios.");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-10 shadow-sm border-b border-gray-100">
        
        {/* 2. LADO IZQUIERDO: Agrupamos Flecha + Home */}
        <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition">
                <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            {/* Botón de escape rápido a Home */}
            <button 
                onClick={() => navigate('/home')} 
                className="p-2 rounded-full hover:bg-brand-50 transition text-brand-600"
                title="Ir al Inicio"
            >
                <Home className="h-6 w-6" />
            </button>
        </div>

        <h1 className="font-bold text-lg text-gray-900">Mi Perfil</h1>
        
        {/* Botón Acción (Editar o Cancelar) */}
        {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="text-brand-600 font-bold text-sm flex items-center hover:bg-brand-50 px-3 py-1.5 rounded-lg transition">
                <Edit2 className="h-4 w-4 mr-1" /> Editar
            </button>
        ) : (
            <button 
                onClick={() => { 
                    setIsEditing(false); 
                    const foto = user.foto_perfil;
                    setPreviewImage(foto ? (foto.startsWith('http') ? foto : `${API_URL}${foto}`) : null);
                    setNewImageFile(null);
                }} 
                className="text-gray-500 font-medium text-sm flex items-center hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
            >
                <X className="h-4 w-4 mr-1" /> Cancelar
            </button>
        )}
      </div>

      <div className="px-6 py-6 max-w-lg mx-auto">
        <form onSubmit={handleSave}>
            
            {/* --- SECCIÓN FOTO --- */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                        {previewImage ? (
                            <img src={previewImage} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-600 text-4xl font-bold">
                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : <User />}
                            </div>
                        )}
                    </div>
                    
                    {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-brand-600 text-white p-2.5 rounded-full cursor-pointer shadow-md hover:bg-brand-700 transition-transform active:scale-95 border-2 border-white">
                            <Camera className="h-5 w-5" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} name="foto_perfil" />
                        </label>
                    )}
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                </h2>
                <div className="flex items-center gap-1 text-sm text-gray-500 capitalize mt-1">
                    <Briefcase className="h-3 w-3" />
                    {user.rol || 'Usuario'}
                </div>
            </div>

            {/* --- SECCIÓN ESTADO DE VERIFICACIÓN --- */}
            <div className="mb-8">
                {user.es_anfitrion_verificado ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-full">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-green-800 text-sm">Identidad Verificada</h3>
                                <p className="text-xs text-green-600">Tu cuenta está validada para publicar.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-orange-100 p-2 rounded-full mt-1">
                                <ShieldAlert className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-orange-800 text-sm">Verificación Pendiente</h3>
                                <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                    Para publicar propiedades o rentar sin depósito de garantía extra, necesitamos validar tus documentos.
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={() => navigate('/verification')} 
                            className="w-full py-3 bg-white border border-orange-200 text-orange-700 font-bold text-xs rounded-xl hover:bg-orange-100 transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            Subir Documentos Ahora <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* --- CAMPOS DEL FORMULARIO --- */}
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Nombre</label>
                        <input 
                            type="text" name="first_name" disabled={!isEditing}
                            value={user.first_name || ''} onChange={handleChange}
                            className={`w-full py-2.5 px-3 rounded-xl outline-none transition-all ${isEditing ? 'bg-gray-50 border border-brand-200 focus:ring-2 focus:ring-brand-500/20' : 'bg-transparent border border-transparent text-gray-800 font-medium pl-0'}`}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 block">Apellido</label>
                        <input 
                            type="text" name="last_name" disabled={!isEditing}
                            value={user.last_name || ''} onChange={handleChange}
                            className={`w-full py-2.5 px-3 rounded-xl outline-none transition-all ${isEditing ? 'bg-gray-50 border border-brand-200 focus:ring-2 focus:ring-brand-500/20' : 'bg-transparent border border-transparent text-gray-800 font-medium pl-0'}`}
                        />
                    </div>
                </div>

                <div>
                    <div className="flex items-center mb-1">
                        <Mail className="h-4 w-4 text-brand-600 mr-2" />
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Correo Electrónico</label>
                    </div>
                    <input 
                        type="email" name="email" disabled={!isEditing}
                        value={user.email || ''} onChange={handleChange}
                        className={`w-full py-2.5 px-3 rounded-xl outline-none transition-all ${isEditing ? 'bg-gray-50 border border-brand-200 focus:ring-2 focus:ring-brand-500/20' : 'bg-transparent border border-transparent text-gray-600 pl-0'}`}
                    />
                </div>

                <div>
                    <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 text-brand-600 mr-2" />
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Teléfono / WhatsApp</label>
                    </div>
                    <input 
                        type="text" name="telefono" disabled={!isEditing}
                        value={user.telefono || ''} onChange={handleChange}
                        placeholder={isEditing ? "+52 33 0000 0000" : "Sin registrar"}
                        className={`w-full py-2.5 px-3 rounded-xl outline-none transition-all ${isEditing ? 'bg-gray-50 border border-brand-200 focus:ring-2 focus:ring-brand-500/20' : 'bg-transparent border border-transparent text-gray-800 font-medium pl-0'}`}
                    />
                </div>

                <div>
                    <div className="flex items-center mb-1">
                        <FileText className="h-4 w-4 text-brand-600 mr-2" />
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Biografía</label>
                    </div>
                    <textarea 
                        name="biografia" disabled={!isEditing}
                        rows={isEditing ? 4 : 2}
                        value={user.biografia || ''} onChange={handleChange}
                        placeholder={isEditing ? "Cuéntanos algo sobre ti..." : "Sin biografía"}
                        className={`w-full py-2.5 px-3 rounded-xl outline-none transition-all resize-none ${isEditing ? 'bg-gray-50 border border-brand-200 focus:ring-2 focus:ring-brand-500/20' : 'bg-transparent border border-transparent text-gray-800 font-medium pl-0'}`}
                    />
                </div>
            </div>

            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 animate-slide-up z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
                    <div className="max-w-lg mx-auto">
                        <button 
                            type="submit" disabled={saving}
                            className="w-full bg-brand-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50 active:scale-95"
                        >
                            {saving ? 'Guardando...' : <><Save className="h-5 w-5 mr-2" /> Guardar Cambios</>}
                        </button>
                    </div>
                </div>
            )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
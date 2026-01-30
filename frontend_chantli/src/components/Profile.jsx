import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, Mail, Phone, FileText, Save, X, Edit2 } from 'lucide-react';

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
    foto_perfil: null 
  });

  // Estado separado para la foto NUEVA que se va a subir
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // 1. Cargar datos al entrar
  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    if (!token) { navigate('/'); return; }

    fetch('http://127.0.0.1:8000/api/me/', {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        // Asignación robusta: busca en la raíz y usa el perfil como respaldo
        setUser({
            ...data,
            telefono: data.telefono || data.perfil?.telefono || '',
            biografia: data.biografia || data.perfil?.biografia || '',
            foto_perfil: data.foto_perfil || null
        });
        
        // Configurar la previsualización inicial
        if (data.foto_perfil) {
            setPreviewImage(data.foto_perfil); 
        } else {
            setPreviewImage(null);
        }
        
        setLoading(false);
    })
    .catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, [navigate]);

  // Manejar cambios en inputs de texto
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Manejar selección de nueva foto
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setPreviewImage(URL.createObjectURL(file)); // Vista previa local inmediata
    }
  };

  // Guardar Cambios
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('chantli_token');

    // Usamos FormData para enviar texto + archivos
    const formData = new FormData();
    formData.append('first_name', user.first_name);
    formData.append('last_name', user.last_name);
    formData.append('email', user.email);
    formData.append('telefono', user.telefono);
    formData.append('biografia', user.biografia);
    
    // Solo agregamos la imagen si el usuario seleccionó una nueva
    if (newImageFile) {
        formData.append('foto_perfil', newImageFile);
    }

    try {
        const res = await fetch('http://127.0.0.1:8000/api/me/', {
            method: 'PATCH',
            headers: { 
                'Authorization': `Token ${token}`
                // NOTA: No agregamos 'Content-Type' aquí. 
                // El navegador lo detecta automáticamente como multipart/form-data
            },
            body: formData
        });

        if (res.ok) {
            const updatedData = await res.json();
            
            // Actualizamos el estado con la respuesta real del servidor
            setUser({
                ...updatedData,
                telefono: updatedData.telefono || updatedData.perfil?.telefono || '',
                biografia: updatedData.biografia || updatedData.perfil?.biografia || '',
                foto_perfil: updatedData.foto_perfil
            });
            
            setIsEditing(false); // Salir de modo edición
            setNewImageFile(null); // Limpiar archivo temporal
        } else {
            alert("Error al guardar cambios");
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
    <div className="min-h-screen bg-white pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-white z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">Mi Perfil</h1>
        
        {/* Botón Acción (Editar o Cancelar) */}
        {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="text-brand-600 font-medium text-sm flex items-center">
                <Edit2 className="h-4 w-4 mr-1" /> Editar
            </button>
        ) : (
            <button 
                onClick={() => { 
                    setIsEditing(false); 
                    setPreviewImage(user.foto_perfil); // Restaurar foto original al cancelar
                    setNewImageFile(null);
                }} 
                className="text-gray-500 font-medium text-sm flex items-center"
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
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-lg bg-gray-50">
                        {previewImage ? (
                            <img src={previewImage} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-brand-100 flex items-center justify-center text-brand-600 text-4xl font-bold">
                                {user.username ? user.username.charAt(0).toUpperCase() : <User />}
                            </div>
                        )}
                    </div>
                    
                    {/* Botón de cámara (Solo visible en edición) */}
                    {isEditing && (
                        <label className="absolute bottom-0 right-0 bg-brand-600 text-gray-400 p-2.5 rounded-full cursor-pointer shadow-md hover:bg-brand-700 transition-transform active:scale-90">
                            <Camera className="h-5 w-5 text-gray-800" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} name="foto_perfil" />
                        </label>
                    )}
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">@{user.username}</h2>
                <p className="text-sm text-gray-500 capitalize">{user.rol}</p>
            </div>

            {/* --- CAMPOS DEL FORMULARIO --- */}
            <div className="space-y-5">
                
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                        <input 
                            type="text" name="first_name" 
                            disabled={!isEditing}
                            value={user.first_name || ''} onChange={handleChange}
                            className={`w-full py-2 border-b-2 outline-none transition-colors ${isEditing ? 'border-brand-300 focus:border-brand-600 bg-gray-50 px-2 rounded-t' : 'border-transparent bg-transparent text-gray-800'}`}
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Apellido</label>
                        <input 
                            type="text" name="last_name" 
                            disabled={!isEditing}
                            value={user.last_name || ''} onChange={handleChange}
                            className={`w-full py-2 border-b-2 outline-none transition-colors ${isEditing ? 'border-brand-300 focus:border-brand-600 bg-gray-50 px-2 rounded-t' : 'border-transparent bg-transparent text-gray-800'}`}
                            placeholder="Tu apellido"
                        />
                    </div>
                </div>

                {/* Email (Read Only visualmente mejorado) */}
                <div>
                    <div className="flex items-center mb-1">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <label className="text-xs font-bold text-gray-500 uppercase">Correo</label>
                    </div>
                    <input 
                        type="email" name="email" 
                        disabled={!isEditing}
                        value={user.email || ''} onChange={handleChange}
                        className={`w-full py-2 border-b-2 outline-none transition-colors ${isEditing ? 'border-brand-300 focus:border-brand-600 bg-gray-50 px-2 rounded-t' : 'border-gray-100 bg-transparent text-gray-600'}`}
                    />
                </div>

                {/* Teléfono */}
                <div>
                    <div className="flex items-center mb-1">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <label className="text-xs font-bold text-gray-500 uppercase">Teléfono / WhatsApp</label>
                    </div>
                    <input 
                        type="text" name="telefono" 
                        disabled={!isEditing}
                        value={user.telefono || ''} onChange={handleChange}
                        placeholder={isEditing ? "+52 33 0000 0000" : "Sin registrar"}
                        className={`w-full py-2 border-b-2 outline-none transition-colors ${isEditing ? 'border-brand-300 focus:border-brand-600 bg-gray-50 px-2 rounded-t' : 'border-transparent bg-transparent text-gray-800'}`}
                    />
                </div>

                {/* Biografía */}
                <div>
                    <div className="flex items-center mb-1">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <label className="text-xs font-bold text-gray-500 uppercase">Biografía</label>
                    </div>
                    <textarea 
                        name="biografia" 
                        disabled={!isEditing}
                        rows={isEditing ? 4 : 2}
                        value={user.biografia || ''} onChange={handleChange}
                        placeholder={isEditing ? "Cuéntanos algo sobre ti..." : "Sin biografía"}
                        className={`w-full py-2 border-b-2 outline-none transition-colors resize-none ${isEditing ? 'border-brand-300 focus:border-brand-600 bg-gray-50 px-2 rounded-t' : 'border-transparent bg-transparent text-gray-800'}`}
                    />
                </div>
            </div>

            {/* --- BOTÓN GUARDAR (Con tu estilo personalizado) --- */}
            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 animate-slide-up z-20">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full bg-brand-600 text-gray-400 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center hover:bg-brand-700 transition disabled:opacity-50"
                    >
                        {saving ? (
                            'Guardando...'
                        ) : (
                            <><Save className="h-5 w-5 mr-2" /> Guardar Cambios</>
                        )}
                    </button>
                </div>
            )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Star, MapPin, Calendar, Home, MessageSquare, Send, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const PublicProfile = () => {
  const { id } = useParams(); // ID del usuario que estamos visitando
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario reseña
  const [newReview, setNewReview] = useState({ rating: 5, comentario: '' });
  const [sendingReview, setSendingReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem('chantli_token');
        const headers = token ? { 'Authorization': `Token ${token}` } : {};

        try {
            // 1. Datos del Perfil Público
            const resUser = await fetch(`${API_URL}/api/public-profile/${id}/`);
            if (!resUser.ok) throw new Error("Usuario no encontrado");
            const userData = await resUser.json();
            setProfileUser(userData);

            // 2. Datos del Usuario Actual (para saber si puede comentar)
            if (token) {
                const resMe = await fetch(`${API_URL}/api/me/`, { headers });
                const meData = await resMe.json();
                setCurrentUser(meData);
            }

            // 3. Propiedades del Usuario (Si es anfitrión)
            const resProps = await fetch(`${API_URL}/api/propiedades/mis_propiedades/?user_id=${id}`); 
            // Nota: En tu backend 'mis_propiedades' filtra por request.user. 
            // Para ver propiedades de OTRO, usa el endpoint general filtrado: /api/propiedades/?anfitrion=${id}
            // Usaremos el general filtrado por ID:
            const resPropsPublic = await fetch(`${API_URL}/api/propiedades/?anfitrion=${id}`);
            if (resPropsPublic.ok) setUserProperties(await resPropsPublic.json());

            // 4. Reseñas del Usuario
            const resReviews = await fetch(`${API_URL}/api/resenas-usuario/usuario/?id=${id}`);
            if (resReviews.ok) setReviews(await resReviews.json());

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id]);

  const handlePostReview = async (e) => {
      e.preventDefault();
      if (!newReview.comentario) return;
      setSendingReview(true);
      const token = localStorage.getItem('chantli_token');

      try {
          const res = await fetch(`${API_URL}/api/resenas-usuario/`, {
              method: 'POST',
              headers: { 
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  destinatario: id,
                  calificacion: newReview.rating,
                  comentario: newReview.comentario
              })
          });

          if (res.ok) {
              const savedReview = await res.json();
              // Agregar visualmente con datos del usuario actual
              setReviews(prev => [{
                  ...savedReview,
                  autor_nombre: currentUser.first_name,
                  autor_foto: currentUser.foto_perfil
              }, ...prev]);
              setNewReview({ rating: 5, comentario: '' });
          } else {
              alert("Error al enviar reseña.");
          }
      } catch (error) {
          alert("Error de conexión");
      } finally {
          setSendingReview(false);
      }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Cargando perfil...</div>;
  if (!profileUser) return <div className="p-10 text-center">Usuario no encontrado.</div>;

  // Cálculos
  const promedio = reviews.length > 0 
      ? (reviews.reduce((acc, r) => acc + r.calificacion, 0) / reviews.length).toFixed(1) 
      : "Nuevo";
  
  const esAnfitrion = profileUser.perfil?.rol === 'anfitrion' || profileUser.rol === 'anfitrion';
  const verificado = profileUser.perfil?.es_anfitrion_verificado || profileUser.perfil?.es_huesped_verificado;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header Simple */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 mr-2">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="font-bold text-lg text-gray-900">Perfil Público</h1>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- COLUMNA IZQUIERDA: TARJETA DE PERFIL --- */}
        <div className="md:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center sticky top-24">
                
                {/* Foto Gigante */}
                <div className="relative">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200 mb-4">
                        {profileUser.perfil?.foto_perfil || profileUser.foto_perfil ? (
                            <img src={profileUser.perfil?.foto_perfil || profileUser.foto_perfil} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-100 text-brand-600 text-4xl font-bold">
                                {profileUser.first_name ? profileUser.first_name.charAt(0) : <User />}
                            </div>
                        )}
                    </div>
                    {verificado && (
                        <div className="absolute bottom-4 right-0 bg-white p-1.5 rounded-full shadow-sm" title="Identidad Verificada">
                            <ShieldCheck className="h-6 w-6 text-green-500 fill-green-50" />
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900">
                    {profileUser.first_name} {profileUser.last_name}
                </h2>
                <p className="text-sm text-gray-500 capitalize mb-4">
                    {esAnfitrion ? 'Anfitrión' : 'Huésped'} en Chantli
                </p>

                {/* Stats */}
                <div className="w-full grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4 mb-4">
                    <div className="text-center border-r border-gray-100">
                        <div className="font-bold text-lg text-gray-900 flex items-center justify-center gap-1">
                            {promedio} <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Calificación</span>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-gray-900">{reviews.length}</div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Reseñas</span>
                    </div>
                </div>

                {/* Info Extra */}
                <div className="w-full space-y-3 text-left">
                    {verificado && (
                        <div className="flex items-center text-sm text-gray-600">
                            <ShieldCheck className="h-5 w-5 mr-3 text-green-600" />
                            <span>Identidad Verificada</span>
                        </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                        <User className="h-5 w-5 mr-3 text-gray-400" />
                        <span>Se unió en 2026</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- COLUMNA DERECHA: CONTENIDO --- */}
        <div className="md:col-span-2 space-y-8">
            
            {/* Sección: Sobre Mí */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-gray-900 mb-3">Sobre mí</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                    {profileUser.perfil?.biografia || profileUser.biografia || "Este usuario aún no ha escrito una biografía, pero seguro es buena persona."}
                </p>
            </div>

            {/* Sección: Propiedades (Solo si es anfitrión y tiene) */}
            {userProperties.length > 0 && (
                <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Propiedades de {profileUser.first_name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userProperties.map(prop => (
                            <div 
                                key={prop.id} 
                                onClick={() => navigate(`/propiedad/${prop.id}`)}
                                className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            >
                                <div className="h-32 bg-gray-200">
                                    <img src={prop.imagen} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{prop.titulo}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{prop.direccion}</p>
                                    <div className="mt-2 font-bold text-brand-600 text-sm">${parseFloat(prop.precio).toLocaleString()} <span className="text-gray-400 font-normal">/mes</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Sección: Reseñas */}
            <div>
                <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    Lo que dicen otros usuarios
                </h3>

                {/* Formulario (Solo si no es mi propio perfil) */}
                {currentUser && currentUser.id !== profileUser.id && (
                    <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
                        <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setNewReview({ ...newReview, rating: star })}>
                                    <Star className={`h-6 w-6 ${star <= newReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                        <textarea 
                            className="w-full p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                            placeholder={`Deja una reseña para ${profileUser.first_name}...`}
                            rows="2"
                            value={newReview.comentario}
                            onChange={e => setNewReview({...newReview, comentario: e.target.value})}
                        ></textarea>
                        <button 
                            onClick={handlePostReview}
                            disabled={!newReview.comentario || sendingReview}
                            className="mt-2 bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-lg ml-auto flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50"
                        >
                            <Send className="h-3 w-3" /> Publicar
                        </button>
                    </div>
                )}

                {/* Lista */}
                <div className="space-y-4">
                    {reviews.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">Aún no tiene reseñas.</p>
                    ) : (
                        reviews.map(rev => (
                            <div key={rev.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-gray-200 rounded-full overflow-hidden">
                                            <img src={rev.autor_foto || "https://via.placeholder.com/150"} className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{rev.autor_nombre}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(rev.fecha).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex text-yellow-400">
                                        {[...Array(rev.calificacion)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm">{rev.comentario}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
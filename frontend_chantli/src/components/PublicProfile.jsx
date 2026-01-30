import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ShieldCheck } from 'lucide-react';

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Reutilizamos el endpoint user_info que hicimos para el chat
    // O idealmente crear uno /api/users/<id>/public_profile/ con bio y stats
    const token = localStorage.getItem('chantli_token');
    fetch(`http://127.0.0.1:8000/api/mensajes/user_info/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(setProfile);
  }, [userId]);

  if (!profile) return <div>Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
       <div className="bg-white p-4 shadow-sm mb-4 sticky top-0 flex items-center">
            <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft /></button>
            <h1 className="font-bold">Perfil Público</h1>
       </div>
       
       <div className="p-4 flex flex-col items-center">
            <img src={profile.foto || "https://via.placeholder.com/150"} className="h-32 w-32 rounded-full object-cover mb-4" />
            <h2 className="text-2xl font-bold">{profile.nombre}</h2>
            <div className="flex items-center text-green-600 mt-2 bg-green-50 px-3 py-1 rounded-full">
                <ShieldCheck className="h-4 w-4 mr-1" /> Identidad Verificada
            </div>
            {/* Aquí agregaríamos estadísticas reales de calificaciones más adelante */}
       </div>
    </div>
  );
};
export default PublicProfile;
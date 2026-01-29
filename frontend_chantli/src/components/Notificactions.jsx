import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, CheckCircle } from 'lucide-react';

const Notifications = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    fetch('http://127.0.0.1:8000/api/notificaciones/', {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(setNotificaciones);
  }, []);

  const handleRead = (id, reservaId) => {
    const token = localStorage.getItem('chantli_token');
    // Marcar como leída en backend
    fetch(`http://127.0.0.1:8000/api/notificaciones/${id}/marcar_leida/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Token ${token}` }
    });
    
    // Navegar al contexto (ej. al Dashboard o Detalles)
    // Si eres host vas al dashboard, si eres guest a tus reservas (aún no hecha esa pantalla, mandamos a home por ahora)
    navigate('/host'); 
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 shadow-sm flex items-center mb-4 sticky top-0">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft /></button>
        <h1 className="font-bold text-lg">Notificaciones</h1>
      </div>

      <div className="px-4 space-y-3">
        {notificaciones.length === 0 && <p className="text-gray-500 text-center mt-10">No tienes notificaciones.</p>}
        
        {notificaciones.map(noti => (
            <div 
                key={noti.id} 
                onClick={() => handleRead(noti.id, noti.reserva_id)}
                className={`p-4 rounded-xl border flex gap-3 cursor-pointer transition-colors ${noti.leida ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'}`}
            >
                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${noti.leida ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                <div>
                    <p className={`text-sm ${noti.leida ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>{noti.mensaje}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(noti.fecha).toLocaleDateString()}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
export default Notifications;
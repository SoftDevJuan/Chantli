import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle, Info } from 'lucide-react';

const Notifications = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null); // Para saber quién soy
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    const headers = { 'Authorization': `Token ${token}` };

    // 1. Cargar Notificaciones
    fetch('http://127.0.0.1:8000/api/notificaciones/', { headers })
      .then(r => r.json())
      .then(setNotificaciones);

    // 2. Saber quién soy (para decidir si soy Huésped o Anfitrión en el click)
    fetch('http://127.0.0.1:8000/api/me/', { headers })
      .then(r => r.json())
      .then(data => setCurrentUserId(data.id));

  }, []);

  const handleNotificationClick = async (noti) => {
    const token = localStorage.getItem('chantli_token');
    
    // A. Marcar como leída visualmente
    setNotificaciones(prev => prev.map(n => n.id === noti.id ? { ...n, leida: true } : n));
    
    // B. Marcar como leída en Backend (sin esperar respuesta para ser rápido)
    fetch(`http://127.0.0.1:8000/api/notificaciones/${noti.id}/marcar_leida/`, {
        method: 'PATCH',
        headers: { 'Authorization': `Token ${token}` }
    });

    // C. LÓGICA INTELIGENTE DE REDIRECCIÓN
    if (noti.reserva_id) {
        try {
            // Consultamos la reserva para ver su estado actual
            const res = await fetch(`http://127.0.0.1:8000/api/reservas/${noti.reserva_id}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const reserva = await res.json();

            const soyHuesped = reserva.huesped === currentUserId;

            // CASO 1: Soy Huésped y debo pagar
            if (soyHuesped && reserva.estado === 'esperando_pago') {
                navigate('/checkout', { 
                    state: { 
                        reservaId: reserva.id,
                        precio: reserva.propiedad_precio, // Viene del serializer actualizado
                        titulo: reserva.propiedad_titulo,
                        imagen: reserva.propiedad_imagen
                    } 
                });
                return;
            }

            // CASO 2: Soy Anfitrión (Ir al Dashboard)
            if (!soyHuesped) {
                navigate('/host');
                return;
            }
            
            // CASO 3: Soy Huésped y solo es info (Aceptada, Rechazada, etc)
            // Por ahora mandamos a Home o a un futuro "Mis Viajes"
            navigate('/home'); 

        } catch (error) {
            console.error("Error al obtener detalles de la reserva", error);
            navigate('/home');
        }
    } else {
        // Si es una notificación genérica sin reserva
        navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full hover:bg-gray-50"><ArrowLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="font-bold text-xl text-gray-900">Notificaciones</h1>
      </div>

      <div className="px-4 mt-2">
        {notificaciones.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p>No tienes notificaciones nuevas.</p>
            </div>
        )}
        
        {notificaciones.map(noti => (
            <div 
                key={noti.id} 
                onClick={() => handleNotificationClick(noti)}
                className={`py-4 border-b border-gray-50 flex gap-4 cursor-pointer transition-colors active:bg-gray-50
                    ${!noti.leida ? 'bg-blue-50/50 -mx-4 px-4' : ''}
                `}
            >
                <div className={`mt-1 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 
                    ${!noti.leida ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}
                `}>
                    {!noti.leida ? <Info className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                </div>
                
                <div className="flex-1">
                    <p className={`text-sm leading-snug ${!noti.leida ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                        {noti.mensaje}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(noti.fecha).toLocaleDateString()} • {new Date(noti.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    
                    {/* Badge visual si requiere pago */}
                    {noti.mensaje.includes("pago") && !noti.leida && (
                         <span className="mt-2 inline-block bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            Requiere Acción
                         </span>
                    )}
                </div>
                
                {!noti.leida && (
                    <div className="self-center">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};
export default Notifications;
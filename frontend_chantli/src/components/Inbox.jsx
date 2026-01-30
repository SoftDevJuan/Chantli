import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, User } from 'lucide-react';

const Inbox = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    if (!token) { navigate('/'); return; }

    fetch('http://127.0.0.1:8000/api/mensajes/inbox/', {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        // Convertimos el objeto de valores a array si es necesario, aunque Django ya lo manda como lista
        const lista = Array.isArray(data) ? data : Object.values(data);
        setChats(lista);
        setLoading(false);
    })
    .catch(err => {
        console.error(err);
        setLoading(false);
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* HEADER */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center">
            <button onClick={() => navigate('/home')} className="mr-3 p-2 rounded-full hover:bg-gray-50">
                <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Mensajes</h1>
        </div>
      </div>

      {/* LISTA DE CHATS */}
      <div className="px-4 mt-2">
        {loading ? (
             <div className="text-center py-10 text-gray-400">Cargando conversaciones...</div>
        ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                    <MessageSquare className="h-10 w-10 text-gray-300" />
                </div>
                <p>No tienes mensajes aún.</p>
                <p className="text-xs mt-2">Explora propiedades y contacta al anfitrión.</p>
            </div>
        ) : (
            chats.map((chat) => (
                <div 
                    key={chat.usuario_id} 
                    onClick={() => navigate(`/chat/${chat.usuario_id}`)}
                    className="flex items-center gap-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors -mx-4 px-4"
                >
                    {/* FOTO */}
                    <div className="relative">
                        <div className="h-14 w-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                            {chat.foto ? (
                                <img src={chat.foto} alt={chat.nombre} className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-brand-100 text-brand-600 font-bold text-lg">
                                    {chat.nombre.charAt(0)}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* TEXTO */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                            <h3 className="font-bold text-gray-900 truncate text-base">{chat.nombre}</h3>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {new Date(chat.fecha).toLocaleDateString() === new Date().toLocaleDateString() 
                                    ? new Date(chat.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                    : new Date(chat.fecha).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate flex items-center">
                            {chat.es_mio && <span className="mr-1 text-gray-400">Tú:</span>}
                            <span className={!chat.es_mio ? "text-gray-700 font-medium" : ""}>
                                {chat.ultimo_mensaje}
                            </span>
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Inbox;
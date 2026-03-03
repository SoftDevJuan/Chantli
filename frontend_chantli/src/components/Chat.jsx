import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Home } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [otroUsuario, setOtroUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem('chantli_token');

  // --- 1. Cargar Info del Otro Usuario ---
  useEffect(() => {
    fetch(`${API_URL}/api/mensajes/user_info/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (!data.error) {
            // Simulamos el estado 'en línea' por ahora
            // En una app real, esto vendría del backend
            const isOnline = Math.random() > 0.5; // Probabilidad del 50%
            setOtroUsuario({ ...data, isOnline });
        }
    })
    .catch(err => console.error(err));
  }, [userId]);

  // --- 2. Cargar Mensajes ---
  const cargarMensajes = () => {
    fetch(`${API_URL}/api/mensajes/conversacion/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (Array.isArray(data)) {
            setMensajes(data);
            setLoading(false);
        }
    })
    .catch(err => console.error(err));
  };

  useEffect(() => {
    cargarMensajes();
    const intervalo = setInterval(cargarMensajes, 3000);
    return () => clearInterval(intervalo);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  // --- 3. Enviar Mensaje ---
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    try {
        const res = await fetch(`${API_URL}/api/mensajes/`, {
            method: 'POST',
            headers: { 
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ destinatario: userId, contenido: nuevoMensaje })
        });
        
        if (res.ok) {
            setNuevoMensaje("");
            cargarMensajes();
        }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* --- HEADER --- */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center sticky top-0 z-40 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <button 
            onClick={() => navigate('/home')} 
            className="p-2 rounded-full hover:bg-brand-50 transition text-brand-600 mr-3"
            title="Ir al Inicio">
            <Home className="h-6 w-6" />
        </button>
        
        {otroUsuario ? (
            <div 
                className="flex items-center cursor-pointer group"
                onClick={() => navigate(`/public-profile/${userId}`)}
                title="Ver perfil"
            >
                <div className="relative h-10 w-10 mr-3">
                    <div className="h-full w-full bg-gray-200 rounded-full flex items-center justify-center border border-gray-300 overflow-hidden group-hover:opacity-80 transition-opacity">
                        {otroUsuario.foto ? (
                            <img src={otroUsuario.foto} className="h-full w-full object-cover" alt="User" />
                        ) : (
                            <span className="text-gray-600 font-bold">{otroUsuario.nombre?.charAt(0)}</span>
                        )}
                    </div>
                    {otroUsuario.isOnline && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                </div>
                <div>
                    <h1 className="font-bold text-gray-900 leading-tight text-sm sm:text-base group-hover:text-brand-600 transition-colors">
                        {otroUsuario.nombre}
                    </h1>
                    <p className={`text-xs font-medium flex items-center ${otroUsuario.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        {otroUsuario.isOnline ? 'En línea' : 'Desconectado'}
                    </p>
                </div>
            </div>
        ) : (
            <div className="flex items-center animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
            </div>
        )}
      </div>

      {/* --- LISTA DE MENSAJES --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24 bg-gray-100 scroll-smooth">
        {loading && mensajes.length === 0 && (
            <div className="text-center py-10 opacity-50 text-gray-500">Cargando...</div>
        )}

        {mensajes.map((msg, i) => (
            <div key={i} className={`flex w-full ${msg.es_mio ? 'justify-end' : 'justify-start'}`}>
                
                {/* Burbuja del Mensaje */}
                <div className={`
                    max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm relative break-words
                    ${msg.es_mio 
                        ? 'bg-blue-100 text-gray-900 rounded-br-none border border-blue-200' 
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none' 
                    }
                `}>
                    {msg.contenido}
                    
                    {/* Hora */}
                    <div className="text-[10px] mt-1 text-right opacity-60 text-gray-600">
                        {new Date(msg.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {msg.es_mio && <span className="ml-1 text-blue-500 font-bold">✓✓</span>}
                    </div>
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* --- INPUT --- */}
      <form 
        onSubmit={enviarMensaje} 
        className="fixed bottom-0 left-0 right-0 bg-white p-3 border-t border-gray-200 flex items-center gap-2 z-50 shadow-lg"
      >
        <input 
            type="text" 
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-100 text-gray-900 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white transition-all text-sm"
        />
        <button 
            type="submit" 
            disabled={!nuevoMensaje.trim()}
            className="bg-gray-900 text-gray-100 p-3 rounded-full hover:bg-gray-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
        >
            <Send className="h-5 w-5" />
        </button>
      </form>

    </div>
  );
};

export default Chat;
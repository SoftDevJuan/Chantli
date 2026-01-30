import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft } from 'lucide-react';

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
    fetch(`http://127.0.0.1:8000/api/mensajes/user_info/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        if (!data.error) setOtroUsuario(data);
    })
    .catch(err => console.error(err));
  }, [userId]);

  // --- 2. Cargar Mensajes ---
  const cargarMensajes = () => {
    fetch(`http://127.0.0.1:8000/api/mensajes/conversacion/${userId}/`, {
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
        const res = await fetch('http://127.0.0.1:8000/api/mensajes/', {
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
        
        {otroUsuario ? (
            <div className="flex items-center">
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 border border-gray-300 overflow-hidden">
                    {otroUsuario.foto ? (
                        <img src={otroUsuario.foto} className="h-full w-full object-cover" alt="User" />
                    ) : (
                        <span className="text-gray-600 font-bold">{otroUsuario.nombre?.charAt(0)}</span>
                    )}
                </div>
                <div>
                    <h1 className="font-bold text-gray-900 leading-tight text-sm sm:text-base">
                        {otroUsuario.nombre}
                    </h1>
                    <p className="text-xs text-green-600 font-medium flex items-center">
                        En línea
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
                        ? 'bg-blue-100 text-gray-900 rounded-br-none border border-blue-200' // TUS MENSAJES: Azul claro, texto oscuro
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none' // RECIBIDOS: Blanco, texto oscuro
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
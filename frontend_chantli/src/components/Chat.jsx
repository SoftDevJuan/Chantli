import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, User } from 'lucide-react';

const Chat = () => {
  const { userId } = useParams(); // ID del otro usuario
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('chantli_token');

  const cargarMensajes = () => {
    fetch(`http://127.0.0.1:8000/api/mensajes/conversacion/${userId}/`, {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(setMensajes);
  };

  useEffect(() => {
    cargarMensajes();
    const intervalo = setInterval(cargarMensajes, 3000); // Polling cada 3 seg
    return () => clearInterval(intervalo);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    await fetch('http://127.0.0.1:8000/api/mensajes/', {
        method: 'POST',
        headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ destinatario: userId, contenido: nuevoMensaje })
    });
    setNuevoMensaje("");
    cargarMensajes();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-3"><ArrowLeft /></button>
        <div className="flex items-center">
             <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center mr-2">
                <User className="h-5 w-5 text-brand-600" />
             </div>
             <h1 className="font-bold text-gray-900">Chat</h1>
        </div>
      </div>

      {/* Área de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {mensajes.map((msg, i) => (
            <div key={i} className={`flex ${msg.es_mio ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.es_mio ? 'bg-brand-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                    {msg.contenido}
                </div>
            </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviarMensaje} className="fixed bottom-0 left-0 right-0 bg-white p-3 border-t flex gap-2">
        <input 
            type="text" 
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button type="submit" className="bg-brand-600 text-white p-2 rounded-full hover:bg-brand-700">
            <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};
export default Chat;
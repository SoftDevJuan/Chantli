import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, ArrowLeft, Save } from 'lucide-react';

const AddCard = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber desde dónde venimos (ej. desde el Checkout)
  
  const [formData, setFormData] = useState({
    nombre_titular: '',
    numero: '',
    fecha_vencimiento: '',
    cvv: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('chantli_token');

    try {
        const res = await fetch('http://127.0.0.1:8000/api/tarjetas/', {
            method: 'POST',
            headers: { 
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            alert("Tarjeta agregada exitosamente.");
            // Si venimos del checkout, volvemos ahí. Si no, al perfil.
            if (location.state?.from === 'checkout') {
                navigate(-1); // Volver atrás
            } else {
                navigate('/profile'); // O a donde quieras
            }
        } else {
            alert("Error al guardar la tarjeta.");
        }
    } catch (error) {
        console.error(error);
        alert("Error de conexión");
    }
  };

  // Formateador simple para el número de tarjeta (espacios cada 4 dígitos)
  const handleNumChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    setFormData({ ...formData, numero: val });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6">
        
        <div className="flex items-center mb-6">
            <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-100 rounded-full">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Nueva Tarjeta</h1>
        </div>

        {/* Tarjeta Visual (Simulación) */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-gray-800 shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <CreditCard className="h-8 w-8 mb-4" />
            <p className="text-lg font-mono tracking-widest mb-4">
                {formData.numero ? formData.numero.match(/.{1,4}/g).join(' ') : '0000 0000 0000 0000'}
            </p>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase">Titular</p>
                    <p className="text-sm font-medium uppercase">{formData.nombre_titular || 'NOMBRE APELLIDO'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400 uppercase">Expira</p>
                    <p className="text-sm font-medium">{formData.fecha_vencimiento || 'MM/YY'}</p>
                </div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Titular</label>
                <input 
                    type="text" name="nombre_titular" required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-brand-500 uppercase"
                    placeholder="Como aparece en la tarjeta"
                    onChange={handleChange}
                />
            </div>
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Número de Tarjeta</label>
                <input 
                    type="text" name="numero" required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-brand-500 font-mono"
                    placeholder="0000 0000 0000 0000"
                    value={formData.numero}
                    onChange={handleNumChange}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Vencimiento</label>
                    <input 
                        type="text" name="fecha_vencimiento" required
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:border-brand-500"
                        placeholder="MM/YY"
                        maxLength="5"
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">CVV</label>
                    <input 
                        type="text" name="cvv" required
                        className="w-full px-4 py-2 border rounded-lg outline-none focus:border-brand-500"
                        placeholder="123"
                        maxLength="4"
                        onChange={handleChange}
                    />
                </div>
            </div>

            <button type="submit" className="w-full bg-brand-600 text-gray-800 font-bold py-3.5 rounded-xl shadow-lg hover:bg-brand-700 transition mt-4 flex justify-center items-center">
                <Save className="h-5 w-5 mr-2" /> Guardar Tarjeta
            </button>
        </form>

      </div>
    </div>
  );
};

export default AddCard;
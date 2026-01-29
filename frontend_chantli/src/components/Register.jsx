import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Home, Briefcase } from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rol: 'huesped' // Valor por defecto
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- REGISTRO NORMAL ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/registro/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('chantli_token', data.token);
        navigate('/home');
      } else {
        // Mostrar errores del backend (ej. "Usuario ya existe")
        const firstError = Object.values(data)[0]; 
        setError(Array.isArray(firstError) ? firstError[0] : 'Error en el registro');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // --- REGISTRO CON GOOGLE ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
        const res = await fetch('http://127.0.0.1:8000/api/google-login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: credentialResponse.credential, // El token que nos da Google
                rol: formData.rol // Enviamos el rol seleccionado también
            })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('chantli_token', data.token);
            navigate('/home');
        } else {
            setError('Error al iniciar con Google');
        }
    } catch (error) {
        setError('Error de conexión con Google');
    }
  };

  return (
    <GoogleOAuthProvider clientId="AQUI_PEGA_TU_GOOGLE_CLIENT_ID">
        <div className="min-h-screen bg-brand-50 flex flex-col justify-center px-6 py-12 lg:px-8">
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <h2 className="text-3xl font-extrabold text-brand-900">Únete a Chantli</h2>
                <p className="mt-2 text-gray-600">Crea una cuenta para empezar</p>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-brand-100">
                    
                    {/* --- SELECCIÓN DE ROL --- */}
                    <div className="flex gap-4 mb-6">
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, rol: 'huesped'})}
                            className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center transition-all ${formData.rol === 'huesped' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            <Home className="h-6 w-6 mb-1" />
                            <span className="text-sm font-bold">Huésped</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, rol: 'anfitrion'})}
                            className={`flex-1 p-3 rounded-xl border-2 flex flex-col items-center transition-all ${formData.rol === 'anfitrion' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                        >
                            <Briefcase className="h-6 w-6 mb-1" />
                            <span className="text-sm font-bold">Anfitrión</span>
                        </button>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Inputs Normales */}
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="text" placeholder="Nombre de usuario" required 
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                onChange={e => setFormData({...formData, username: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="email" placeholder="Correo electrónico" required 
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input 
                                type="password" placeholder="Contraseña" required 
                                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                        <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white font-bold py-3 rounded-xl hover:bg-brand-700 transition">
                            {loading ? 'Creando cuenta...' : 'Registrarse'}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O continúa con</span></div>
                    </div>

                    {/* --- BOTÓN DE GOOGLE --- */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Falló el registro con Google')}
                            useOneTap
                            shape="circle" // O 'rectangular'
                        />
                    </div>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-gray-500">¿Ya tienes cuenta? </span>
                        <Link to="/" className="font-bold text-brand-600 hover:text-brand-500">Inicia Sesión</Link>
                    </div>
                </div>
            </div>
        </div>
    </GoogleOAuthProvider>
  );
};

export default Register;
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Home } from 'lucide-react';
// 1. Importar librería de Google
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- LOGIN NORMAL ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api-token-auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('chantli_token', data.token);
        navigate('/home');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIN CON GOOGLE ---
  const handleGoogleLogin = async (credentialResponse) => {
    try {
        // Usamos el mismo endpoint que en el registro
        const res = await fetch('http://127.0.0.1:8000/api/google-login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: credentialResponse.credential,
                // No enviamos 'rol' aquí, porque asumimos que el usuario ya existe.
                // Si es nuevo y entra por aquí, el backend le pondrá 'huesped' por defecto.
            })
        });
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('chantli_token', data.token);
            navigate('/home');
        } else {
            setError('No pudimos iniciar sesión con Google');
        }
    } catch (error) {
        setError('Error de conexión con Google');
    }
  };

  return (
    // 2. Envolver todo en el Provider con TU ID
    <GoogleOAuthProvider clientId="485296325778-9i5j0efprjtgil4v66cr1p46rg18sjne.apps.googleusercontent.com">
        <div className="min-h-screen bg-brand-50 flex flex-col justify-center px-6 py-12 lg:px-8">
        
        {/* --- LOGO Y TÍTULO --- */}
        <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center mb-10">
            <div className="mx-auto h-20 w-20 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0">
                <Home className="text-gray-800 h-10 w-10" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-brand-900 tracking-tight">
            Chantli
            </h2>
            <p className="mt-2 text-sm text-gray-600">
            Tu espacio ideal en la ZMG
            </p>
        </div>

        {/* --- TARJETA DEL FORMULARIO --- */}
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-brand-100">
                <form className="space-y-6" onSubmit={handleLogin}>
                    
                    {/* Input Usuario */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition duration-150 sm:text-sm"
                                placeholder="Ej. juanperez"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Input Contraseña */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition duration-150 sm:text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-gray-800 bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-95 disabled:opacity-70"
                    >
                        {loading ? 'Entrando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                {/* --- SEPARADOR --- */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">O accede con</span>
                    </div>
                </div>

                {/* --- BOTÓN DE GOOGLE --- */}
                <div className="flex justify-center w-full">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => setError('Falló el inicio de sesión con Google')}
                        useOneTap={false} // Puedes poner true si quieres que salga el popup automático arriba a la derecha
                        shape="pill"
                        width="250" // Ajusta el ancho si lo ves muy chico
                    />
                </div>

                {/* --- FOOTER REGISTRO --- */}
                <div className="mt-6 text-center text-sm">
                    <p className="text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 font-bold">
                            Regístrate gratis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
        </div>
    </GoogleOAuthProvider>
  );
};

export default Login;
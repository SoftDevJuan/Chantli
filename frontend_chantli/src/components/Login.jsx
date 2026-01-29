import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Agregamos Link
import { User, Lock, Home } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${apiUrl}/api-token-auth/`, {
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

  const handleGoogleLogin = () => {
    // Aquí redirigimos al usuario al endpoint de Django que inicia el flujo de Google
    // Por ejemplo, si usas django-allauth o tu propia vista:
    window.location.href = `${apiUrl}/google-login/`; 
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col justify-center px-6 py-12 lg:px-8">
      
      {/* --- LOGO Y TÍTULO --- */}
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center mb-10">
        <div className="mx-auto h-20 w-20 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 transition-transform hover:rotate-0">
            <Home className="text-gray-400 h-10 w-10" />
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
                        <div className="text-sm">
                          <a href="#" className="font-semibold text-brand-600 hover:text-brand-500">
                            ¿Olvidaste tu contraseña?
                          </a>
                        </div>
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

                {/* Mensaje de Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 text-center animate-pulse">
                        {error}
                    </div>
                )}

                {/* Botón de Iniciar Sesión */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-gray-400 bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Entrando...
                        </span>
                    ) : 'Iniciar Sesión'}
                </button>
            </form>

            {/* --- DIVIDER --- */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    O continúa con
                  </span>
                </div>
              </div>

              {/* --- BOTÓN DE GOOGLE --- */}
              <div className="mt-6">
                <button
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-95"
                >
                  <svg className="h-5 w-5 mr-2" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M12.0003 20.45c4.656 0 8.526-3.156 9.945-7.65h-9.945v-3.6h14.73c.18.9.27 1.845.27 2.805 0 8.085-6.03 12.45-12.45 12.45-6.63 0-12-5.37-12-12s5.37-12 12-12c3.24 0 6.18 1.185 8.46 3.12l-3.39 3.39c-1.35-1.14-3.135-1.71-5.07-1.71-4.005 0-7.26 3.255-7.26 7.26s3.255 7.26 7.26 7.26z" fill="currentColor" />
                  </svg>
                  Google
                </button>
              </div>
            </div>

            {/* --- LINK A REGISTRO --- */}
            <p className="mt-10 text-center text-sm text-gray-500">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-semibold leading-6 text-brand-600 hover:text-brand-500">
                Regístrate aquí
              </Link>
            </p>

        </div>
      </div>
    </div>
  );
};

export default Login;
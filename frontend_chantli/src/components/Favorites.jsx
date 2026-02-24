import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Star, ArrowLeft, Home } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const Favorites = () => {
    const [favoritos, setFavoritos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavoritos = async () => {
            const token = localStorage.getItem('chantli_token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Asumimos que tienes un endpoint que devuelve la lista de propiedades favoritas
                const res = await fetch(`${API_URL}/api/favoritos/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setFavoritos(data);
                }
            } catch (error) {
                console.error("Error cargando favoritos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavoritos();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft className="h-6 w-6 text-gray-800" />
                </button>
                <button 
                    onClick={() => navigate('/home')} 
                    className="p-2 rounded-full hover:bg-brand-50 transition text-brand-600"
                    title="Ir al Inicio">
                    <Home className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Tus Favoritos</h1>
            </div>

            <div className="p-4 max-w-4xl mx-auto mt-4">
                {favoritos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center mt-20 text-center">
                        <Heart className="h-20 w-20 text-gray-300 mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Aún no tienes favoritos</h2>
                        <p className="text-gray-500 mb-6">Toca el corazón en las propiedades que te gusten para guardarlas aquí.</p>
                        <button onClick={() => navigate('/home')} className="bg-brand-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:bg-brand-700">
                            Explorar propiedades
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {favoritos.map((fav) => (
                            <div 
                                key={fav.id} 
                                onClick={() => navigate(`/propiedad/${fav.propiedad.id}`)}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 relative group"
                            >
                                {/* Botón de corazón directamente en la tarjeta */}
                                <div className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm">
                                    <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                                </div>

                                <div className="h-48 w-full bg-gray-200">
                                    <img src={fav.propiedad.imagen} alt={fav.propiedad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 truncate">{fav.propiedad.titulo}</h3>
                                    <div className="flex justify-between mt-1 items-center">
                                        <p className="text-gray-500 text-sm flex items-center truncate max-w-[70%]">
                                            <MapPin className="h-3 w-3 mr-1 text-brand-600 flex-shrink-0" />
                                            <span className="truncate">{fav.propiedad.direccion}</span>
                                        </p>
                                        <div className="flex items-center text-sm font-bold text-gray-800">
                                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                            {fav.propiedad.rating_promedio || "Nuevo"}
                                        </div>
                                    </div>
                                    <p className="mt-3 font-bold text-gray-900">
                                        ${parseFloat(fav.propiedad.precio).toLocaleString()} <span className="text-xs text-gray-500 font-normal">/ mes</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Favorites;
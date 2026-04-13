import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home as HomeIcon, Gamepad2, Trophy, Sparkles } from 'lucide-react';

const GameView = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            
            <div className="bg-white/90 backdrop-blur-md p-4 shadow-sm sticky top-0 z-30 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center pointer-events-auto">
                    <div className="bg-white rounded-full shadow-sm flex items-center p-1 border border-gray-200 transition hover:bg-gray-50">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-2 rounded-full hover:bg-gray-100 transition active:scale-95"
                            title="Volver"
                        >
                            <ArrowLeft className="h-5 w-5 text-gray-700" />
                        </button>
                        
                        <div className="h-5 w-px bg-gray-200 mx-1"></div>
                        
                        <div 
                            onClick={() => navigate('/home')} 
                            className="flex items-center gap-1.5 justify-center px-3 pr-4 cursor-pointer group transition"
                            title="Ir a Inicio"
                        >
                            <HomeIcon strokeWidth={1.5} className="h-5 w-5 text-brand-600 group-hover:scale-105 transition-transform" />
                            <span className="font-logo text-lg tracking-[0.15em] text-gray-900 group-hover:text-brand-700 transition uppercase pt-0.5">
                                Chantli
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ======================================================== */}
            {/* CONTENIDO PRINCIPAL: ZONA ARCADE                         */}
            {/* ======================================================== */}
            {/* CAMBIO 1: Ensanchamos el contenedor principal de max-w-5xl a max-w-[1100px] */}
            <div className="max-w-[1100px] mx-auto p-4 sm:p-6 mt-4">
                
                {/* Título y Contexto */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
                        <Gamepad2 className="h-8 w-8 text-brand-600" /> 
                        Zona Arcade
                    </h1>
                    <p className="text-gray-500 mt-2 flex items-center justify-center gap-1">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        Relájate un momento, juega y gana descuentos para tu próxima reserva.
                    </p>
                </div>

                {/* Contenedor del Juego (Estilo Consola/Marco) */}
                {/* CAMBIO 2: Ensanchamos el marco negro de max-w-4xl a max-w-[1020px] */}
                <div className="bg-gray-900 rounded-[2rem] p-2 sm:p-4 shadow-2xl relative mx-auto max-w-[1020px] border border-gray-800">
                    
                    {/* Barra decorativa superior */}
                    <div className="absolute top-0 left-0 w-full h-8 bg-gray-800/80 rounded-t-[2rem] flex items-center justify-start px-5 gap-2 z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    
                    {/* Pantalla del juego (Relación de aspecto) */}
                    {/* Quitamos aspect-video y le damos altura responsiva o altura fija */}
                    <div className="mt-8 h-[600px] sm:h-[700px] md:h-[800px] w-full bg-black rounded-xl overflow-hidden border-2 border-gray-800 relative shadow-inner">
                        
                        {/* --- EL IFRAME QUE CARGA UNITY --- */}
                        <iframe 
                            src="/webgame/index.html" 
                            className="w-full h-full border-0 relative z-10"
                            title="Chantli Minigame"
                            allowFullScreen
                            scrolling="no" /* <-- Evita barras de desplazamiento en el iframe */
                            style={{ overflow: 'hidden', display: 'block' }}
                        ></iframe>
                        
                        {/* Fondo de carga (Se ve mientras el iframe carga) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-900 z-0">
                            <Trophy className="h-12 w-12 text-gray-700 mb-4 animate-pulse" />
                            <p className="font-bold tracking-widest text-gray-500 text-sm">CARGANDO MOTOR GRÁFICO...</p>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default GameView;
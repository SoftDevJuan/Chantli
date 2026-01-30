import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Share2, Star, MessageCircle, Heart, X, AlertCircle, Clock } from 'lucide-react';

// --- IMPORTACIONES CALENDARIO ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados de datos
  const [propiedad, setPropiedad] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Array de fechas ocupadas (Objetos Date)
  const [diasBloqueados, setDiasBloqueados] = useState([]);

  // Estados de UI
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados del Calendario (Date Objects)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Cálculo Financiero
  const [calculo, setCalculo] = useState({
      dias: 0,
      renta: 0,
      iva: 0,
      deposito: 0,
      total: 0,
      error: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    const headers = token ? { 'Authorization': `Token ${token}` } : {};

    // 1. Cargar Propiedad
    const fetchPropiedad = fetch(`http://127.0.0.1:8000/api/propiedades/${id}/`, { headers }).then(r => r.json());
    
    // 2. Cargar Usuario
    const fetchUser = token 
        ? fetch(`http://127.0.0.1:8000/api/me/`, { headers }).then(r => r.json())
        : Promise.resolve(null);

    // 3. Cargar Fechas Ocupadas
    const fetchFechas = fetch(`http://127.0.0.1:8000/api/propiedades/${id}/fechas_ocupadas/`, { headers })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);

    Promise.all([fetchPropiedad, fetchUser, fetchFechas])
      .then(([propData, userData, fechasData]) => {
          setPropiedad(propData);
          setCurrentUser(userData);
          
          // Procesar fechas ocupadas para el calendario
          const blockedDates = [];
          fechasData.forEach(rango => {
              let current = new Date(rango.inicio);
              current.setHours(12,0,0,0); // Evitar desfases horarios
              const end = new Date(rango.fin);
              end.setHours(12,0,0,0);

              while(current <= end) {
                  blockedDates.push(new Date(current));
                  current.setDate(current.getDate() + 1);
              }
          });
          setDiasBloqueados(blockedDates);
          
          setLoading(false);
      })
      .catch(err => console.error(err));
  }, [id]);

  // Lógica de Cálculo
  useEffect(() => {
    if (!startDate || !endDate || !propiedad) return;

    if (startDate >= endDate) {
        setCalculo(prev => ({ ...prev, error: 'La fecha de salida debe ser después de la llegada.', total: 0 }));
        return;
    }

    const diffTime = Math.abs(endDate - startDate);
    const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const precioMensual = parseFloat(propiedad.precio);
    const precioDiario = precioMensual / 30;
    
    const rentaCalculada = precioDiario * dias;
    const impuesto = rentaCalculada * 0.16;
    const deposito = precioMensual;
    
    const totalFinal = rentaCalculada + impuesto + deposito;

    setCalculo({
        dias: dias,
        renta: rentaCalculada,
        iva: impuesto,
        deposito: deposito,
        total: totalFinal,
        error: ''
    });

  }, [startDate, endDate, propiedad]);

  const handleReserva = async (e) => {
    e.preventDefault();
    if (calculo.error || calculo.total === 0) return;

    setBookingLoading(true);
    const token = localStorage.getItem('chantli_token');
    const format = (date) => date.toISOString().split('T')[0];

    try {
        const response = await fetch('http://127.0.0.1:8000/api/reservas/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                propiedad: propiedad.id,
                fecha_inicio: format(startDate),
                fecha_fin: format(endDate),
                huesped: currentUser.id,
                total: calculo.total 
            })
        });

        if (response.ok) {
            const data = await response.json();
            navigate('/checkout', { 
                state: { 
                    reservaId: data.id, 
                    titulo: propiedad.titulo, 
                    precio: calculo.renta 
                } 
            });
            setIsModalOpen(false);
        } else {
            const err = await response.json();
            alert("Error: " + JSON.stringify(err));
        }
    } catch (error) {
        alert("Error de conexión");
    } finally {
        setBookingLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div></div>;
  if (!propiedad) return <div>No encontrada</div>;

  const todasLasFotos = [{ id: 'cover', imagen: propiedad.imagen }, ...(propiedad.album || [])].filter(f => f.imagen);

  return (
    <div className="min-h-screen bg-white pb-28">
      
      {/* Estilos para el Calendario */}
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker__input-container input { 
            width: 100%; padding: 0.75rem 1rem; border-radius: 0.75rem; 
            border: 1px solid #e5e7eb; background-color: #f9fafb; outline: none;
        }
        .react-datepicker__input-container input:focus {
            border-color: #4F46E5; box-shadow: 0 0 0 2px #c7d2fe;
        }

        /* 1. FECHAS PASADAS (Gris) */
        /* Se aplica automático porque pusimos minDate={new Date()} */
        .react-datepicker__day--disabled {
            background-color: #f3f4f6 !important; /* Gris claro fondo */
            color: #d1d5db !important; /* Gris texto */
            cursor: not-allowed;
            opacity: 0.6;
        }

        /* 2. FECHAS OCUPADAS (Amarillo) */
        /* Se aplica automático a lo que está en 'excludeDates' */
        .react-datepicker__day--excluded {
            background-color: #fef08a !important; /* Amarillo pastel */
            color: #854d0e !important; /* Texto ocre oscuro */
            font-weight: bold;
            text-decoration: line-through; /* Tachado opcional */
            border-radius: 0.3rem;
            opacity: 1 !important; /* Que se vea bien el amarillo */
        }

        /* Días Seleccionados (Azul Chantli) */
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
            background-color: #4F46E5 !important; color: white !important; border-radius: 50%;
        }
        
        /* Rango Seleccionado (Azul clarito) */
        .react-datepicker__day--in-range {
            background-color: #e0e7ff !important; color: #4338ca !important;
        }
        
        /* Ajustes generales */
        .react-datepicker__header { background-color: white; border-bottom: 1px solid #f3f4f6; }
        .react-datepicker { border: 1px solid #e5e7eb; border-radius: 1rem; font-family: inherit; overflow: hidden; }
      `}</style>

      {/* HEADER FLOTANTE */}
      <div className="fixed top-0 left-0 right-0 p-4 flex justify-between z-20 pointer-events-none">
        <button onClick={() => navigate(-1)} className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md pointer-events-auto hover:bg-white transition">
            <ArrowLeft className="h-6 w-6 text-gray-800" />
        </button>
        <div className="flex gap-3 pointer-events-auto">
            <button className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md hover:text-red-500 transition">
                <Heart className="h-6 w-6 text-gray-800 hover:text-red-500" />
            </button>
            <button className="bg-white/90 p-2 rounded-full shadow-md backdrop-blur-md">
                <Share2 className="h-6 w-6 text-gray-800" />
            </button>
        </div>
      </div>

      {/* GALERÍA */}
      <div className="h-[45vh] bg-gray-200 overflow-x-auto flex snap-x snap-mandatory scrollbar-hide">
        {todasLasFotos.map((foto, idx) => (
            <img key={idx} src={foto.imagen} className="w-full h-full object-cover snap-center flex-shrink-0" alt="Propiedad" />
        ))}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-4xl mx-auto -mt-6 relative bg-white rounded-t-3xl px-6 py-8 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] min-h-[50vh]">
        
        {/* Título y Header */}
        <div className="flex justify-between items-start mb-2">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{propiedad.titulo}</h1>
                <div className="flex items-center text-gray-8000 text-sm mt-1">
                    <MapPin className="h-4 w-4 mr-1 text-brand-600" />
                    {propiedad.direccion}
                </div>
            </div>
            <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100 text-center min-w-[60px]">
                <div className="flex items-center justify-center font-bold text-gray-900">
                    <Star className="h-3 w-3 text-yellow-500 mr-1 fill-yellow-500" /> 4.8
                </div>
                <div className="text-[10px] text-gray-400 underline">24 reseñas</div>
            </div>
        </div>

        <hr className="border-gray-100 my-6" />

        {/* Info del Anfitrión */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
                <div className="h-12 w-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-lg mr-4 border-2 border-white shadow-sm">
                    {propiedad.anfitrion ? propiedad.anfitrion.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                    <p className="font-bold text-gray-900">Anfitrión: {propiedad.anfitrion}</p>
                    <p className="text-xs text-gray-8000">Miembro verificado</p>
                </div>
            </div>
            <button className="p-2 bg-gray-100 rounded-full text-brand-600 hover:bg-brand-50 transition">
                <MessageCircle className="h-6 w-6" />
            </button>
        </div>

        {/* Descripción */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-2 text-gray-900">Acerca del lugar</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
                {propiedad.descripcion}
            </p>
        </div>

        {/* Lo que ofrece (RESTAURADO) */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Lo que ofrece</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                {['Wifi de alta velocidad', 'Cocina equipada', 'Lavadora', 'Entrada privada', 'Cámaras de seguridad', 'Agua caliente'].map(s => (
                    <div key={s} className="flex items-center text-gray-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-2 text-brand-500 flex-shrink-0" />
                        {s}
                    </div>
                ))}
            </div>
        </div>

        {/* Mapa (RESTAURADO) */}
        <div className="mb-8">
            <h3 className="font-bold text-lg mb-3 text-gray-900">Ubicación</h3>
            <div className="h-48 bg-gray-200 rounded-xl overflow-hidden relative">
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    src="https://maps.google.com/maps?q=Guadalajara&t=&z=13&ie=UTF8&iwloc=&output=embed"
                    className="w-full h-full" 
                ></iframe>
                
                {/* Etiqueta flotante (Opcional, si la quieres conservar) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-4 py-2 rounded-full shadow-lg font-bold text-xs flex items-center">
                        <div className="h-2 w-2 bg-brand-500 rounded-full mr-2 animate-pulse"></div>
                        Ubicación aproximada
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* BARRA INFERIOR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-6 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
                <div className="flex items-end">
                    <span className="font-bold text-xl text-gray-900">${parseFloat(propiedad.precio).toLocaleString()}</span>
                    <span className="text-xs text-gray-8000 mb-1 ml-1">/ mes</span>
                </div>
                <span className="text-[10px] text-green-600 font-bold">Disponible ahora</span>
            </div>
            
            {currentUser && currentUser.username === propiedad.anfitrion ? (
                <button className="bg-gray-900 text-gray-800 font-bold py-3 px-8 rounded-xl opacity-50 cursor-not-allowed">
                    Es tu propiedad
                </button>
            ) : (
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-brand-600 hover:bg-brand-700 text-black font-bold py-3 px-8 rounded-xl shadow-lg shadow-brand-200 transition-all active:scale-95"
                >
                    Solicitar Renta
                </button>
            )}
        </div>
      </div>

      {/* --- MODAL DE RESERVA (ARREGLADO PARA ALTURA) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            
            {/* AGREGADO: min-h-[600px] para que quepa el calendario abierto */}
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative z-10 animate-slide-up sm:animate-fade-in shadow-2xl min-h-[600px] flex flex-col">
                
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-20">
                    <X className="h-5 w-5 text-gray-600" />
                </button>
                
                <div className="flex-1 overflow-y-auto pr-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Selecciona tus Fechas</h2>
                    <p className="text-xs text-gray-8000 mb-6 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Las fechas en amarillo ya están ocupadas.
                    </p>

                    <form onSubmit={handleReserva} className="space-y-6">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Llegada</label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    selectsStart
                                    startDate={startDate}
                                    endDate={endDate}
                                    minDate={new Date()}
                                    excludeDates={diasBloqueados}
                                    placeholderText="Seleccionar"
                                    className="w-full cursor-pointer"
                                    dateFormat="dd/MM/yyyy"
                                    popperPlacement="bottom-start" // Fuerza a abrir hacia abajo
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-700 mb-1 uppercase">Salida</label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    selectsEnd
                                    startDate={startDate}
                                    endDate={endDate}
                                    minDate={startDate || new Date()}
                                    excludeDates={diasBloqueados}
                                    placeholderText="Seleccionar"
                                    className="w-full cursor-pointer"
                                    dateFormat="dd/MM/yyyy"
                                    popperPlacement="bottom-end"
                                />
                            </div>
                        </div>

                        {calculo.error && (
                            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl flex items-center border border-red-100 font-medium">
                                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                                {calculo.error}
                            </div>
                        )}

                        {!calculo.error && calculo.total > 0 && (
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4 animate-fade-in">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Renta ({calculo.dias} días)</span>
                                    <span>${calculo.renta.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>IVA (16%)</span>
                                    <span>${calculo.iva.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Depósito (Garantía)</span>
                                    <span>${calculo.deposito.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                                    <span className="font-bold text-brand-900 text-sm">Total a Pagar</span>
                                    <span className="font-bold text-brand-700 text-lg">${calculo.total.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={bookingLoading || !!calculo.error || calculo.total === 0}
                                className="w-full bg-brand-600 text-black font-bold py-4 rounded-xl hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-200"
                            >
                                {bookingLoading ? 'Procesando...' : 
                                    (calculo.total > 0 ? `Reservar por $${calculo.total.toLocaleString(undefined, {maximumFractionDigits: 0})}` : 'Selecciona fechas')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default PropertyDetail;
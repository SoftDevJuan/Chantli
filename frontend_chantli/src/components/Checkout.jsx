import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, ChevronDown, Plus, ShieldCheck, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const Checkout = () => {
  const { state } = useLocation(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(true); // Nuevo estado de carga inicial
  const [yaPagada, setYaPagada] = useState(false);      // Nuevo estado de bloqueo
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState('');
  
  const [modalState, setModalState] = useState({ type: null, title: '', message: '' });

  // --- LOGOS ---
  const VisaLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 w-auto object-contain bg-white px-1 rounded-sm border border-gray-100" />;
  const MastercardLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8 w-auto object-contain bg-gray-900 px-1 rounded-sm" />;
  const AmexLogo = () => <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg" alt="Amex" className="h-6 w-auto object-contain" />;
  const GenericCardIcon = () => <div className="h-6 w-9 bg-gray-200 rounded flex items-center justify-center border border-gray-300"><CreditCard className="h-4 w-4 text-gray-500" /></div>;

  // Carga Inicial: Tarjetas y Verificación de Estado
  useEffect(() => {
    if (!state?.reservaId) return;

    const token = localStorage.getItem('chantli_token');
    const headers = { 'Authorization': `Token ${token}` };

    const initData = async () => {
        try {
            // 1. Cargar Tarjetas
            const reqTarjetas = fetch('http://127.0.0.1:8000/api/tarjetas/', { headers });
            
            // 2. Verificar estado REAL de la reserva (por si el usuario recarga la página)
            // Asumimos que tienes un endpoint para ver el detalle de la reserva
            const reqReserva = fetch(`http://127.0.0.1:8000/api/reservas/${state.reservaId}/`, { headers });

            const [resTarjetas, resReserva] = await Promise.all([reqTarjetas, reqReserva]);
            
            const dataTarjetas = await resTarjetas.json();
            const dataReserva = await resReserva.json();

            // Setear Tarjetas
            setTarjetas(dataTarjetas);
            if(dataTarjetas.length > 0) setTarjetaSeleccionada(dataTarjetas[0].id);

            // Validar si ya está pagada
            if (dataReserva.estado === 'pagada' || dataReserva.estado === 'aceptada') {
                setYaPagada(true);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setVerificando(false);
        }
    };

    initData();
  }, [state]);

  const handlePagar = async (e) => {
    e.preventDefault();
    setModalState({ type: 'loading', title: '', message: '' });

    const token = localStorage.getItem('chantli_token');

    try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        const res = await fetch('http://127.0.0.1:8000/api/pagos/procesar/', {
            method: 'POST',
            headers: { 
                'Authorization': `Token ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                reserva_id: state.reservaId,
                tarjeta_id: tarjetaSeleccionada 
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            setModalState({ 
                type: 'success', 
                title: '¡Pago Aprobado!',
                message: 'Tu reservación ha sido confirmada.' 
            });
        } else {
            // Si el backend dice que ya está pagada, mostramos éxito en lugar de error
            if (data.error && data.error.includes("ya ha sido pagada")) {
                setYaPagada(true); // Bloqueamos la UI
                setModalState({ 
                    type: 'success', 
                    title: '¡Ya está pagado!',
                    message: 'Esta reserva ya fue cobrada anteriormente. No se realizó ningún cargo nuevo.' 
                });
            } else {
                // Otros errores (Fondos, etc)
                let msg = "No pudimos completar la transacción.";
                if (data.error && data.error.includes("Fondos insuficientes")) msg = "Saldo insuficiente en la tarjeta seleccionada.";
                
                setModalState({ 
                    type: 'failure', 
                    title: 'Transacción no procesada',
                    message: msg
                });
            }
        }
    } catch (error) {
        setModalState({ type: 'failure', title: 'Error de conexión', message: 'Inténtalo más tarde.' });
    }
  };

  if (!state) return <div className="p-10 text-center text-red-500">Información no disponible.</div>;

  const precioMensual = parseFloat(state.precio);
  const impuesto = precioMensual * 0.16;
  const deposito = precioMensual;
  const total = precioMensual + impuesto + deposito;
  const tarjetaActual = tarjetas.find(t => t.id == tarjetaSeleccionada);

  const getBrandIcon = () => {
      if (!tarjetaActual) return <GenericCardIcon />;
      const num = tarjetaActual.numero;
      if (num.startsWith('4')) return <VisaLogo />;
      if (num.startsWith('5')) return <MastercardLogo />;
      if (num.startsWith('3')) return <AmexLogo />;
      return <GenericCardIcon />;
  };

  return (
    <div className="min-h-screen bg-gray-500 p-6 flex flex-col items-center justify-center relative">
       
       {/* --- MODALES --- */}
       {modalState.type !== null && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-scale-in">
                
                {modalState.type === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 text-brand-600 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Procesando...</h3>
                        <p className="text-sm text-gray-500 mt-2">Validando con el banco.</p>
                    </>
                )}

                {modalState.type === 'success' && (
                    <>
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{modalState.title}</h3>
                        <p className="text-sm text-gray-600 mb-6">{modalState.message}</p>
                        <button 
                            onClick={() => navigate('/invoices')} 
                            className="w-full bg-green-600 text-gray-500 font-bold py-3 rounded-xl hover:bg-green-700 transition"
                        >
                            Ver Recibo
                        </button>
                    </>
                )}

                {modalState.type === 'failure' && (
                    <>
                        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <XCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{modalState.title}</h3>
                        <p className="text-sm text-gray-600 mb-6 bg-red-50 p-3 rounded-lg border border-red-100">{modalState.message}</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => navigate('/add-card', { state: { from: 'checkout' } })} className="flex-1 border border-gray-300 text-gray-600 font-bold py-3 rounded-xl text-sm">Otra tarjeta</button>
                            <button onClick={() => setModalState({ type: null, title: '', message: '' })} className="flex-1 bg-gray-800 text-gray-500 font-bold py-3 rounded-xl text-sm">Reintentar</button>
                        </div>
                    </>
                )}
            </div>
         </div>
       )}

       <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 relative overflow-hidden">
          
          {/* CUBIERTA DE CARGA O BLOQUEO SI YA ESTÁ PAGADA */}
          {(verificando || yaPagada) && (
              <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center text-center p-6 backdrop-blur-sm">
                  {verificando ? (
                      <Loader2 className="h-10 w-10 text-brand-600 animate-spin" />
                  ) : (
                      <>
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">¡Reserva Pagada!</h2>
                        <p className="text-gray-500 mt-2 mb-6">Esta reserva ya fue liquidada correctamente.</p>
                        <button onClick={() => navigate('/invoices')} className="px-6 py-3 bg-brand-600 text-gray-500 rounded-xl font-bold shadow-lg hover:bg-brand-700 transition">
                            Ver mis Comprobantes
                        </button>
                      </>
                  )}
              </div>
          )}

          <h1 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
             <Lock className="h-6 w-6 mr-2 text-brand-600" /> Confirmar Pago
          </h1>
          
          <div className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100">
             <h3 className="font-bold text-lg text-gray-900 mb-2">{state.titulo}</h3>
             
             <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                    <span>1 Mes de Renta</span>
                    <span>${precioMensual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                    <span>IVA (16%)</span>
                    <span>${impuesto.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-brand-600 font-medium border-b border-gray-200 pb-2">
                    <span>Depósito en Garantía</span>
                    <span>${deposito.toLocaleString()}</span>
                </div>
             </div>

             <div className="mt-3 flex justify-between font-extrabold text-xl text-gray-900">
                <span>Total a Pagar</span>
                <span>${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
             </div>
          </div>

          <form onSubmit={handlePagar}>
             <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Selecciona tu Tarjeta</label>
             
             {tarjetas.length > 0 ? (
                 <div className="relative mb-6">
                    <div className="absolute left-3 top-2.5 pointer-events-none z-10">{getBrandIcon()}</div>
                    <select 
                        className="w-full pl-24 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer text-gray-800 font-medium transition-all"
                        value={tarjetaSeleccionada}
                        onChange={e => setTarjetaSeleccionada(e.target.value)}
                    >
                        {tarjetas.map(t => (
                            <option key={t.id} value={t.id} className="py-2">
                                {t.numero.startsWith('4') ? 'Visa' : t.numero.startsWith('5') ? 'Mastercard' : 'Tarjeta'} •••• {t.numero.slice(-4)}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                 </div>
             ) : (
                 <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg mb-4 text-center border border-yellow-200">
                     No tienes tarjetas guardadas.
                 </div>
             )}

             <button type="button" onClick={() => navigate('/add-card', { state: { from: 'checkout' } })} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-brand-400 hover:text-brand-600 transition mb-6 flex items-center justify-center text-sm group">
                <Plus className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" /> Agregar Nueva Tarjeta
             </button>

             <button 
                type="submit"
                disabled={tarjetas.length === 0} 
                className="w-full bg-brand-600 text-gray-400 font-bold py-4 rounded-xl shadow-lg hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg flex justify-center items-center gap-2"
             >
                 <Lock className="h-5 w-5 opacity-80" /> 
                 Pagar ${total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
             </button>
             
             <p className="text-center text-xs text-gray-400 mt-4 flex justify-center items-center gap-1">
                 <ShieldCheck className="h-3 w-3" /> Transacción encriptada de extremo a extremo.
             </p>
          </form>
       </div>
    </div>
  );
};
export default Checkout;
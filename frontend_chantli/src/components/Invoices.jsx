import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Calendar, CheckCircle, Eye, X } from 'lucide-react';

const Invoices = () => {
  const navigate = useNavigate();
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el recibo que se está viendo actualmente (Modal)
  const [reciboActivo, setReciboActivo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('chantli_token');
    
    fetch('http://127.0.0.1:8000/api/pagos/', {
        headers: { 'Authorization': `Token ${token}` }
    })
    .then(r => r.json())
    .then(data => {
        setPagos(data);
        setLoading(false);
    })
    .catch(err => {
        console.error("Error cargando recibos:", err);
        setLoading(false);
    });
  }, []);

  // Función para abrir el modal
  const abrirRecibo = (pago) => {
    // Calculamos el IVA aquí mismo para mostrarlo desglosado
    const renta = parseFloat(pago.monto_renta);
    const iva = renta * 0.16;
    setReciboActivo({ ...pago, ivaCalculado: iva });
  };

  const getPdfUrl = (url) => {
      if (!url) return '#';
      if (url.startsWith('http')) return url; // Si ya trae http, la dejamos igual
      return `http://127.0.0.1:8000${url}`;  // Si no, le ponemos el servidor
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      
      {/* HEADER */}
      <div className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => navigate('/home')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition">
            <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" /> Mis Recibos
        </h1>
      </div>

      {/* --- MODAL DE RECIBO DIGITAL --- */}
      {reciboActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {/* Hoja de Papel */}
            <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-scale-in relative">
                
                {/* Botón Cerrar */}
                <button 
                    onClick={() => setReciboActivo(null)}
                    className="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Encabezado Recibo */}
                <div className="bg-brand-600 p-6 text-gray-800 text-center">
                    <h2 className="text-2xl font-bold tracking-widest">CHANTLI</h2>
                    <p className="text-brand-100 text-xs uppercase tracking-wide mt-1">Comprobante de Pago Digital</p>
                </div>

                {/* Cuerpo del Recibo */}
                <div className="p-8">
                    <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-4">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Cliente</p>
                            <p className="text-gray-800 font-bold text-lg">{reciboActivo.nombre_cliente} {reciboActivo.apellido_cliente}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold">Folio</p>
                            <p className="text-brand-600 font-mono font-bold">#{reciboActivo.id.toString().padStart(6, '0')}</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Propiedad</p>
                        <p className="text-gray-700 text-sm leading-tight">{reciboActivo.propiedad_titulo}</p>
                        <p className="text-xs text-gray-400 mt-1">{reciboActivo.fecha_formateada}</p>
                    </div>

                    {/* Tabla de Desglose */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-2 mb-6 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Renta Mensual</span>
                            <span>${parseFloat(reciboActivo.monto_renta).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Depósito en Garantía</span>
                            <span>${parseFloat(reciboActivo.monto_deposito).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>IVA (16%)</span>
                            <span>${reciboActivo.ivaCalculado.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-lg">
                            <span>Total Pagado</span>
                            <span>${parseFloat(reciboActivo.total_pagado).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Footer del Modal */}
                    <div className="flex gap-3">
                        {reciboActivo.pdf_factura && (
                            <a 
                                href={getPdfUrl(reciboActivo.pdf_factura)} // <--- USO DE LA FUNCIÓN
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex-1 bg-gray-900 text-gray-50 font-bold py-3 rounded-lg text-center text-sm hover:bg-black transition flex items-center justify-center gap-2"
                            >
                                <Download className="h-4 w-4" /> Descargar PDF
                            </a>
                        )}
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-4">
                        Este recibo es un comprobante válido emitido por Chantli.
                    </p>
                </div>
            </div>
        </div>
      )}


      {/* --- LISTA DE RECIBOS --- */}
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600 mb-2"></div>
                Cargando historial...
            </div>
        ) : pagos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No tienes comprobantes generados.</p>
                <button onClick={() => navigate('/home')} className="mt-4 text-brand-600 font-bold text-sm hover:underline">
                    Explorar Propiedades
                </button>
            </div>
        ) : (
            pagos.map((pago) => (
                <div key={pago.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:shadow-md hover:border-brand-100">
                    
                    {/* INFO PRINCIPAL */}
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                                {pago.propiedad_titulo || "Renta de Propiedad"}
                            </h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> {pago.fecha_formateada}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="font-medium text-gray-700">Folio #{pago.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* PRECIO Y ACCIONES */}
                    <div className="flex flex-col items-end gap-1 pl-16 md:pl-0 w-full md:w-auto">
                        <div className="text-right mb-2">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Pagado</p>
                            <p className="text-xl font-bold text-gray-900">
                                ${parseFloat(pago.total_pagado).toLocaleString()}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {/* Botón Ver Recibo (Abre Modal) */}
                            <button 
                                onClick={() => abrirRecibo(pago)}
                                className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-lg border border-brand-200 transition flex items-center gap-1"
                            >
                                <Eye className="h-3.5 w-3.5" /> Ver Recibo
                            </button>

                            {/* Botón Descargar PDF */}
                            {pago.pdf_factura && (
                                <a 
                                    href={getPdfUrl(pago.pdf_factura)} // <--- USO DE LA FUNCIÓN
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-lg border border-gray-200 transition flex items-center gap-1"
                                >
                                    <Download className="h-3.5 w-3.5" /> PDF
                                </a>
                            )}
                        </div>
                    </div>

                </div>
            ))
        )}

      </div>
    </div>
  );
};

export default Invoices;
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { FaShoppingCart, FaTimes, FaPlus, FaMinus, FaWhatsapp, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { guardarPedido } from "../firebase/pedidos";
import { probarFirebase, probarLecturaPedidos } from "../utils/testFirebase";

export default function FloatingCart() {
  const [metodoEntrega, setMetodoEntrega] = useState("retiro");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [direccion, setDireccion] = useState("");
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [notas, setNotas] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const autocompleteRef = useRef(null);
  const inputRef = useRef(null);
  
  const { items, isOpen, totalItems, totalPrice, dispatch } = useCart();

  // Función para mostrar notificaciones
  const mostrarNotificacion = (mensaje, tipo = 'info', duracion = 3000) => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), duracion);
  };

  // Hacer funciones disponibles globalmente para debugging (solo en desarrollo)
  useEffect(() => {
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      window.probarFirebase = probarFirebase;
      window.probarLecturaPedidos = probarLecturaPedidos;
      window.guardarPedidoTest = guardarPedido;
      console.log("🔧 Funciones de debug disponibles:");
      console.log("   - window.probarFirebase()");
      console.log("   - window.probarLecturaPedidos()");
      console.log("   - window.guardarPedidoTest(datos)");
    }
  }, []);

  // Cargar Google Maps API
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCkVq9kSWcQdaLcdGc_JF7s8fQoqk9ngWA&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // Inicializar Autocomplete cuando el componente se monta
  useEffect(() => {
    if (typeof window !== 'undefined' && 
        window.google && 
        window.google.maps && 
        inputRef.current && 
        metodoEntrega === "envio") {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'AR' },
        fields: ['formatted_address', 'geometry'],
        types: ['address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setDireccion(place.formatted_address);
          setDireccionSeleccionada(place);
          calcularCostoEnvio(place.geometry.location);
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [metodoEntrega, typeof window !== 'undefined' ? window.google : null]);

  // Calcular costo de envío
  const calcularCostoEnvio = async (destino) => {
    if (typeof window === 'undefined') return;
    
    setCargandoEnvio(true);
    try {
      const service = new window.google.maps.DistanceMatrixService();
      const origen = "Pasaje Necochea 2035, Resistencia, Chaco, Argentina";
      
      service.getDistanceMatrix({
        origins: [origen],
        destinations: [destino],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK') {
          const distance = response.rows[0].elements[0].distance;
          if (distance) {
            const km = distance.value / 1000; // Convertir metros a km
            const costoBase = km * 1000; // $1000 por km
            const costo = Math.ceil(costoBase / 100) * 100; // Redondear al próximo múltiplo de 100
            setCostoEnvio(costo);
          }
        } else {
          console.error('Error calculando distancia:', status);
          setCostoEnvio(1000); // Costo mínimo por defecto (ya es múltiplo de 100)
        }
        setCargandoEnvio(false);
      });
    } catch (error) {
      console.error('Error:', error);
      setCostoEnvio(1000); // Costo mínimo por defecto (ya es múltiplo de 100)
      setCargandoEnvio(false);
    }
  };

  // Reset envío cuando cambia método de entrega
  useEffect(() => {
    if (metodoEntrega === "retiro") {
      setCostoEnvio(0);
      setDireccion("");
      setDireccionSeleccionada(null);
    }
  }, [metodoEntrega]);


  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else if (typeof window !== 'undefined') {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.overflow = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    

    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
    };
  }, [isOpen]);

  const toggleCart = () => {
    dispatch({ type: 'TOGGLE_CART' });
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const sendWhatsAppOrder = async () => {
    console.log("🍕 Iniciando proceso de pedido...");
    
    // Validar que el nombre esté completo
    if (!nombreCliente.trim()) {
      mostrarNotificacion("Por favor ingresa tu nombre para el pedido", "error");
      return;
    }

    // Validar dirección si es envío
    if (metodoEntrega === "envio" && !direccion.trim()) {
      mostrarNotificacion("Por favor selecciona una dirección de entrega", "error");
      return;
    }

    setGuardandoPedido(true);
    mostrarNotificacion("Guardando pedido...", "info");
    
    console.log("📦 Datos del pedido:", {
      items,
      totalPrice,
      costoEnvio,
      metodoEntrega,
      direccion,
      metodoPago,
      nombreCliente,
      notas
    });

    try {
      console.log("💾 Intentando guardar en Firebase...");
      
      // Guardar pedido en Firebase
      const resultado = await guardarPedido({
        items,
        totalPrice,
        costoEnvio,
        metodoEntrega,
        direccion,
        metodoPago,
        nombreCliente,
        notas
      });

      console.log("📤 Resultado de Firebase:", resultado);

      if (resultado.success) {
        console.log("✅ Pedido guardado exitosamente, preparando WhatsApp...");
        
        // Mostrar notificación de éxito
        mostrarNotificacion(`🎉 Pedido #${resultado.numeroOrden} guardado! Abriendo WhatsApp...`, "success", 5000);
        
        // Número de WhatsApp (agregando el código de país)
        const phoneNumber = "5493624751290";
        
        // Construir el mensaje
        let message = "🍕 *NUEVO PEDIDO - LA QUE VA* 🍕\n\n";
        
        // Agregar número de orden prominente
        message += `🔢 *PEDIDO #${resultado.numeroOrden}*\n`;
        message += `📅 *Fecha:* ${new Date().toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit', 
          hour: '2-digit',
          minute: '2-digit'
        })}\n\n`;
        
        // Agregar nombre del cliente
        message += `👤 *Cliente:* ${nombreCliente}\n\n`;
        
        // Agregar método de entrega y dirección si corresponde
        message += `*Método de entrega:* ${metodoEntrega === "retiro" ? "Retiro en Pasaje Necochea 2035" : "Envío a domicilio"}\n`;
        if (metodoEntrega === "envio") {
          message += `*Dirección:* ${direccion}\n`;
          message += `*Costo de envío:* $${costoEnvio.toLocaleString()}\n`;
        }
        
        // Agregar método de pago
        message += `*Método de pago:* ${metodoPago === "efectivo" ? "Efectivo" : "Transferencia"}\n\n`;
        
        // Agregar los productos
        message += "*Productos:*\n";
        items.forEach(item => {
          message += `• ${item.quantity}x ${item.nombre} - $${(item.precio * item.quantity).toLocaleString()}\n`;
        });
        
        // Agregar subtotal y total
        message += `\n*Subtotal:* $${totalPrice.toLocaleString()}`;
        if (metodoEntrega === "envio" && costoEnvio > 0) {
          message += `\n*Envío:* $${costoEnvio.toLocaleString()}`;
        }
        message += `\n*TOTAL:* $${(totalPrice + costoEnvio).toLocaleString()}`;
        
        // Agregar notas si existen
        if (notas.trim()) {
          message += `\n\n*Notas adicionales:* ${notas}`;
        }
        
        // Agregar mensaje de cierre
        message += "\n\n✅ *Pedido registrado en el sistema*";
        message += "\nPor favor confirmar mi pedido. ¡Gracias!";
        
        console.log("📱 Mensaje de WhatsApp preparado:", message);
        
        // Codificar el mensaje para la URL
        const encodedMessage = encodeURIComponent(message);
        
        // Crear la URL de WhatsApp
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        console.log("🔗 URL de WhatsApp:", whatsappUrl);
        
        // Abrir WhatsApp
        if (typeof window !== 'undefined') {
          window.open(whatsappUrl, "_blank");
        }
        
        // Limpiar carrito después de enviar el pedido exitosamente
        clearCart();
        
      } else {
        console.error("❌ Error al guardar pedido:", resultado.error);
        mostrarNotificacion(`Error al guardar el pedido: ${resultado.error || 'Error desconocido'}`, "error");
      }
    } catch (error) {
      console.error("💥 Error en el proceso:", error);
      mostrarNotificacion(`Error al procesar el pedido: ${error.message}`, "error");
    } finally {
      setGuardandoPedido(false);
    }
  };

  return (
    <>
      {/* Botón flotante del carrito */}
      <motion.button
        onClick={toggleCart}
        className="fixed top-6 right-6 bg-white hover:bg-red-600 text-red-600 hover:text-white px-4 py-3 rounded-full shadow-lg z-50 transition-colors flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={totalItems > 0 ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FaShoppingCart className="text-xl" />
        <span className="font-medium text-sm whitespace-nowrap">Ver carrito</span>
        {totalItems > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
          >
            {totalItems}
          </motion.span>
        )}
      </motion.button>

      {/* Panel del carrito */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={toggleCart}
            />

            {/* Panel del carrito */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-red-600">Tu Pedido</h2>
                <button
                  onClick={toggleCart}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-600" />
                </button>
              </div>

              {/* Items del carrito - Esta sección debe tener su propio scroll */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <FaShoppingCart className="text-6xl mx-auto mb-4 opacity-50" />
                    <p>Tu carrito está vacío</p>
                    <p className="text-sm mt-2">¡Agrega algunas pizzas!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50"
                      >
                        <img
                          src={`${item.imagen}`}
                          alt={item.nombre}
                          className="w-12 h-12 object-cover rounded  bg-slate-900/90 p-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{item.nombre}</h3>
                          <p className="text-red-600 font-semibold">${item.precio.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <FaMinus className="text-red-600 text-xs" />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <FaPlus className="text-red-600 text-xs" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer con total y acciones */}
              {items.length > 0 && (
                <div className="border-t p-4 space-y-4 bg-white">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span className="text-red-600">${totalPrice.toLocaleString()}</span>
                  </div>

                  {/* Mostrar costo de envío si aplica */}
                  {metodoEntrega === "envio" && costoEnvio > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Envío:</span>
                      <span className="text-gray-600">${costoEnvio.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Total final */}
                  <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-red-600">${(totalPrice + costoEnvio).toLocaleString()}</span>
                  </div>

                  {/* Nombre del cliente */}
                  <div className="text-sm font-semibold">
                    <label className="block mb-1">Nombre del pedido:</label>
                    <input
                      type="text"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Método de pago */}
                  <div className="text-sm font-semibold">
                    <label className="block mb-1">Método de pago:</label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-gray-700"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>

                  {/* Método de entrega */}
                  <div className="text-sm font-semibold">
                    <label className="block mb-1">Método de entrega:</label>
                    <select
                      value={metodoEntrega}
                      onChange={(e) => setMetodoEntrega(e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-gray-700"
                    >
                      <option value="retiro">Retiro en Pje. Necochea 2035</option>
                      <option value="envio">Envío a domicilio</option>
                    </select>
                  </div>

                  {/* Dirección si elige envío */}
                  {metodoEntrega === "envio" && (
                    <div className="text-sm font-semibold space-y-2">
                      <label className="flex items-center mb-1">
                        <FaMapMarkerAlt className="mr-1 text-red-600" />
                        Dirección de entrega:
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Buscar dirección..."
                        className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      {cargandoEnvio && (
                        <p className="text-xs text-blue-600">Calculando costo de envío...</p>
                      )}
                      {costoEnvio > 0 && !cargandoEnvio && (
                        <p className="text-xs text-green-600">
                          Costo de envío: ${costoEnvio.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notas adicionales */}
                  <div className="text-sm font-semibold">
                    <label className="block mb-1">Notas adicionales (opcional):</label>
                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Ej: Sin cebolla, extra queso, timbre roto..."
                      rows="2"
                      className="w-full border rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  {/* Botones */}
                  <div className="space-y-2">
                    <button 
                      onClick={sendWhatsAppOrder}
                      disabled={guardandoPedido}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {guardandoPedido ? (
                        <>
                          <FaSpinner className="mr-2 text-xl animate-spin" />
                          <span>Guardando pedido...</span>
                        </>
                      ) : (
                        <>
                          <FaWhatsapp className="mr-2 text-xl" />
                          <span>Enviar pedido por WhatsApp</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={clearCart}
                      disabled={guardandoPedido}
                      className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Vaciar Carrito
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notificaciones Toast */}
      <AnimatePresence>
        {notificacion && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className={`fixed top-6 left-1/2 transform z-[60] px-6 py-3 rounded-lg shadow-lg text-white font-medium max-w-sm text-center ${
              notificacion.tipo === 'success' ? 'bg-green-600' :
              notificacion.tipo === 'error' ? 'bg-red-600' :
              'bg-blue-600'
            }`}
          >
            {notificacion.mensaje}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

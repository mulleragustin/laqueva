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
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [errorDistancia, setErrorDistancia] = useState("");
  const [notas, setNotas] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [notificacion, setNotificacion] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [pestanaActiva, setPestanaActiva] = useState("pedido");
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
    setErrorDistancia(""); // Limpiar errores previos
    
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
            const metros = distance.value;
            
            // Validar distancia mínima (100m) y máxima (15km)
            if (metros < 100) {
              setErrorDistancia("La dirección está muy cerca. Mínimo 100 metros para envío.");
              setCostoEnvio(0);
              setDistanciaKm(km);
            } else if (km > 15) {
              setErrorDistancia("La dirección está muy lejos. Máximo 15 km para envío.");
              setCostoEnvio(0);
              setDistanciaKm(km);
            } else {
              // Distancia válida
              const costoBase = km * 1000; // $1000 por km
              const costo = Math.ceil(costoBase / 100) * 100; // Redondear al próximo múltiplo de 100
              setCostoEnvio(costo);
              setDistanciaKm(km);
              setErrorDistancia("");
            }
          }
        } else {
          console.error('Error calculando distancia:', status);
          setErrorDistancia("Error al calcular la distancia. Por favor intenta con otra dirección.");
          setCostoEnvio(0);
        }
        setCargandoEnvio(false);
      });
    } catch (error) {
      console.error('Error:', error);
      setErrorDistancia("Error al calcular la distancia. Por favor intenta con otra dirección.");
      setCostoEnvio(0);
      setCargandoEnvio(false);
    }
  };

  // Reset envío cuando cambia método de entrega
  useEffect(() => {
    if (metodoEntrega === "retiro") {
      setCostoEnvio(0);
      setDireccion("");
      setDireccionSeleccionada(null);
      setDistanciaKm(0);
      setErrorDistancia("");
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

  const cerrarConfirmacion = () => {
    setPedidoConfirmado(null);
    dispatch({ type: 'CLOSE_CART' });
  };
  
  const sendWhatsAppOrder = async () => {
    console.log("🍕 Iniciando proceso de pedido...");
    
    // Validar que el nombre esté completo
    if (!nombreCliente.trim()) {
      mostrarNotificacion("Por favor ingresa tu nombre para el pedido", "error");
      return;
    }

    // Validar que el teléfono esté completo
    if (!telefonoCliente.trim()) {
      mostrarNotificacion("Por favor ingresa tu número de teléfono", "error");
      return;
    }

    // Validar dirección si es envío
    if (metodoEntrega === "envio" && !direccion.trim()) {
      mostrarNotificacion("Por favor selecciona una dirección de entrega", "error");
      return;
    }

    // Validar distancia y costo de envío si es envío
    if (metodoEntrega === "envio") {
      if (errorDistancia) {
        mostrarNotificacion(errorDistancia, "error");
        return;
      }
      
      if (costoEnvio === 0) {
        mostrarNotificacion("Por favor espera a que se calcule el costo de envío", "error");
        return;
      }
      
      if (cargandoEnvio) {
        mostrarNotificacion("Calculando costo de envío, por favor espera...", "error");
        return;
      }
    }

    setGuardandoPedido(true);
    mostrarNotificacion("Procesando pedido...", "info");
    
    console.log("📦 Datos del pedido:", {
      items,
      totalPrice,
      costoEnvio,
      metodoEntrega,
      direccion,
      metodoPago,
      nombreCliente,
      telefonoCliente,
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
        telefonoCliente,
        notas
      });

      console.log("📤 Resultado de Firebase:", resultado);

      if (resultado.success) {
        console.log("✅ Pedido guardado exitosamente");
        
        // Guardar información del pedido confirmado
        setPedidoConfirmado({
          numeroOrden: resultado.numeroOrden,
          telefono: telefonoCliente,
          nombre: nombreCliente,
          total: totalPrice + costoEnvio
        });
        
        // Limpiar carrito después de guardar el pedido exitosamente
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
              className="fixed right-0 top-0 h-full w-full sm:w-96 max-w-md bg-white shadow-xl z-50 flex flex-col overflow-hidden"
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
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
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
                          {item.esDobleGusto && (
                            <p className="text-xs text-gray-500">
                              {item.gustos[0].nombre} & {item.gustos[1].nombre}
                            </p>
                          )}
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
                <div className="border-t p-3 sm:p-4 space-y-3 sm:space-y-4 bg-white max-h-[60vh] overflow-y-auto">
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

                  {/* Teléfono del cliente */}
                  <div className="text-sm font-semibold">
                    <label className="block mb-1">Número de teléfono:</label>
                    <input
                      type="tel"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      placeholder="Ej: 3624123456"
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
                      {errorDistancia && (
                        <p className="text-xs text-red-600">{errorDistancia}</p>
                      )}
                      {costoEnvio > 0 && !cargandoEnvio && !errorDistancia && (
                        <p className="text-xs text-green-600">
                          Costo de envío: ${costoEnvio.toLocaleString()} ({distanciaKm.toFixed(1)} km)
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
                  <div className="space-y-2 pt-2 border-t bg-white sticky bottom-0">
                    <button 
                      onClick={sendWhatsAppOrder}
                      disabled={guardandoPedido || cargandoEnvio || (metodoEntrega === "envio" && (errorDistancia || costoEnvio === 0))}
                      className="w-full bg-green-600 text-white py-4 sm:py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-base"
                    >
                      {guardandoPedido ? (
                        <>
                          <FaSpinner className="mr-2 text-xl animate-spin" />
                          <span>Procesando pedido...</span>
                        </>
                      ) : cargandoEnvio ? (
                        <>
                          <FaSpinner className="mr-2 text-xl animate-spin" />
                          <span>Calculando envío...</span>
                        </>
                      ) : (
                        <>
                          <FaShoppingCart className="mr-2 text-xl" />
                          <span>Confirmar pedido</span>
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

      {/* Página de Confirmación */}
      <AnimatePresence>
        {pedidoConfirmado && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-60 z-[70]"
            />

            {/* Modal de Confirmación */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
                {/* Ícono de éxito */}
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                  >
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>

                {/* Título */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ¡Pedido Confirmado!
                </h2>

                {/* Información del pedido */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-lg font-semibold text-red-600 mb-2">
                    Pedido #{pedidoConfirmado.numeroOrden}
                  </div>
                  <div className="text-gray-700 text-sm space-y-1">
                    <div>Cliente: {pedidoConfirmado.nombre}</div>
                    <div>Total: ${pedidoConfirmado.total.toLocaleString()}</div>
                  </div>
                </div>

                {/* Mensaje */}
                <div className="text-gray-600 mb-6 leading-relaxed">
                  <p className="mb-3">
                    Tu pedido ha sido registrado exitosamente.
                  </p>
                  <p className="text-sm">
                    Nos estaremos comunicando al número <strong>{pedidoConfirmado.telefono}</strong> para confirmar y coordinar la entrega de tu pedido.
                  </p>
                </div>

                {/* Botón */}
                <button
                  onClick={cerrarConfirmacion}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Entendido
                </button>

                {/* Nota adicional */}
                <p className="text-xs text-gray-500 mt-4">
                  ¡Gracias por elegir La Que Va! 🍕
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

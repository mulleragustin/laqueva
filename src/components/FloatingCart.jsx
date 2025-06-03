import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { FaShoppingCart, FaTimes, FaPlus, FaMinus, FaWhatsapp } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function FloatingCart() {
  const [metodoEntrega, setMetodoEntrega] = useState("retiro");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [direccion, setDireccion] = useState("");
  
  const { items, isOpen, totalItems, totalPrice, dispatch } = useCart();

  // Este efecto controla el scroll cuando el carrito está abierto
  useEffect(() => {
    if (isOpen) {
      // Bloquear el scroll
      document.body.style.overflow = 'hidden';
      // Almacenar la posición actual del scroll
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Recuperar la posición del scroll
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.overflow = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    
    // Limpiar en desmontaje
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
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
  
  const sendWhatsAppOrder = () => {
    // Número de WhatsApp (agregando el código de país)
    const phoneNumber = "5493624384200"; // Reemplaza este número con el número de WhatsApp real
    
    // Construir el mensaje
    let message = "🍕 *NUEVO PEDIDO - LA QUE VA* 🍕\n\n";
    
    // Agregar método de entrega y dirección si corresponde
    message += `*Método de entrega:* ${metodoEntrega === "retiro" ? "Retiro en Paseo Sur" : "Envío a domicilio"}\n`;
    if (metodoEntrega === "envio") {
      if (!direccion.trim()) {
        alert("Por favor ingresa una dirección de entrega");
        return;
      }
      message += `*Dirección:* ${direccion}\n`;
    }
    
    // Agregar método de pago
    message += `*Método de pago:* ${metodoPago === "efectivo" ? "Efectivo" : "Transferencia"}\n\n`;
    
    // Agregar los productos
    message += "*Productos:*\n";
    items.forEach(item => {
      message += `• ${item.quantity}x ${item.nombre} - $${(item.precio * item.quantity).toLocaleString()}\n`;
    });
    
    // Agregar total
    message += `\n*TOTAL:* $${totalPrice.toLocaleString()}`;
    
    // Agregar mensaje de cierre
    message += "\n\nPor favor confirmar mi pedido. ¡Gracias!";
    
    // Codificar el mensaje para la URL
    const encodedMessage = encodeURIComponent(message);
    
    // Crear la URL de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Abrir WhatsApp
    window.open(whatsappUrl, "_blank");
    
    // Opcionalmente: cerrar el carrito después de enviar el pedido
    // toggleCart();
  };

  return (
    <>
      {/* Botón flotante del carrito */}
      <motion.button
        onClick={toggleCart}
        className="fixed top-6 right-6 bg-red-600 text-white p-4 rounded-full shadow-lg z-50 hover:bg-red-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={totalItems > 0 ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <FaShoppingCart className="text-xl" />
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
                          <p className="text-red-600 font-semibold">${item.precio}</p>
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
                    <span>Total:</span>
                    <span className="text-red-600">${totalPrice.toFixed(0)}</span>
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
                      <option value="retiro">Retiro en Paseo Sur</option>
                      <option value="envio">Envío a domicilio</option>
                    </select>
                  </div>

                  {/* Dirección si elige envío */}
                  {metodoEntrega === "envio" && (
                    <div className="text-sm font-semibold">
                      <label className="block mb-1">Dirección de entrega:</label>
                      <input
                        type="text"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Ej: Av. Italia 1234"
                        className="w-full border rounded-lg px-2 py-1 text-gray-700"
                      />
                    </div>
                  )}

                  {/* Botones */}
                  <div className="space-y-2">
                    <button 
                      onClick={sendWhatsAppOrder}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center"
                    >
                      <FaWhatsapp className="mr-2 text-xl" />
                      <span>Enviar pedido por WhatsApp</span>
                    </button>
                    <button
                      onClick={clearCart}
                      className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
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
    </>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { pizza } from "../data/pizza.js";
import { FaPlus, FaCheck } from "react-icons/fa";

export default function DobleGusto({ index }) {
  const [gusto1, setGusto1] = useState(null);
  const [gusto2, setGusto2] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [selectorActivo, setSelectorActivo] = useState(null); // 1 o 2
  const { dispatch } = useCart();

  // Filtrar solo pizzas normales (no promos)
  const pizzasDisponibles = pizza.filter(p => !p.esPromo);

  const calcularPrecio = () => {
    if (!gusto1 || !gusto2) return 0;
    return Math.round((gusto1.precio + gusto2.precio) / 2);
  };

  const seleccionarGusto = (pizzaSeleccionada) => {
    if (selectorActivo === 1) {
      setGusto1(pizzaSeleccionada);
    } else if (selectorActivo === 2) {
      setGusto2(pizzaSeleccionada);
    }
    setShowSelector(false);
    setSelectorActivo(null);
  };

  const abrirSelector = (numeroGusto) => {
    setSelectorActivo(numeroGusto);
    setShowSelector(true);
  };

  const agregarAlCarrito = () => {
    if (!gusto1 || !gusto2) return;

    const pizzaDobleGusto = {
      id: `doble-${gusto1.id}-${gusto2.id}-${Date.now()}`,
      nombre: `Pizza Doble Gusto: ${gusto1.nombre} & ${gusto2.nombre}`,
      precio: calcularPrecio(),
      imagen: gusto1.imagen, // Usar la imagen del primer gusto
      esDobleGusto: true,
      gustos: [gusto1, gusto2]
    };

    dispatch({ type: 'ADD_ITEM', payload: pizzaDobleGusto });
    
    // Reset selección
    setGusto1(null);
    setGusto2(null);
  };

  return (
    <>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5, 
          delay: 0.2 + (index * 0.1),
          ease: "easeOut"
        }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-dashed border-red-300"
      >
        {/* Header especial */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 text-center">
          <h3 className="text-xl font-bold">Pizza 2 sabores</h3>
          <p className="text-sm opacity-90">Selecciona 2 sabores diferentes</p>
        </div>

        {/* Selectores de gustos */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Gusto 1 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                MITAD 1
              </label>
              <button
                onClick={() => abrirSelector(1)}
                className={`w-full p-3 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  gusto1 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                {gusto1 ? (
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700">
                      {gusto1.nombre}
                    </div>
                    
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Seleccionar...
                  </div>
                )}
              </button>
            </div>

            {/* Gusto 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                MITAD 2
              </label>
              <button
                onClick={() => abrirSelector(2)}
                className={`w-full p-3 border-2 border-dashed rounded-lg transition-all duration-200 ${
                  gusto2 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                {gusto2 ? (
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700">
                      {gusto2.nombre}
                    </div>
                    
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    Seleccionar...
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Precio calculado */}
          {gusto1 && gusto2 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Precio total:</div>
                <div className="text-2xl font-bold text-red-600">
                  ${calcularPrecio().toLocaleString()}
                </div>
                
              </div>
            </div>
          )}

          {/* Botón agregar */}
          <motion.button
            onClick={agregarAlCarrito}
            disabled={!gusto1 || !gusto2}
            whileHover={gusto1 && gusto2 ? { scale: 1.02 } : {}}
            whileTap={gusto1 && gusto2 ? { scale: 0.98 } : {}}
            className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
              gusto1 && gusto2
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaPlus className="mr-2" />
            {gusto1 && gusto2 ? 'Agregar al Carrito' : 'Selecciona ambos gustos'}
          </motion.button>
        </div>
      </motion.div>

      {/* Modal selector de pizzas */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b bg-red-600 text-white">
              <h3 className="text-lg font-semibold text-center">
                Selecciona el {selectorActivo === 1 ? 'primer' : 'segundo'} gusto
              </h3>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pizzasDisponibles.map((pizzaOption) => (
                  <button
                    key={pizzaOption.id}
                    onClick={() => seleccionarGusto(pizzaOption)}
                    className="flex items-center p-3 border rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-left"
                  >
                    <img
                      src={pizzaOption.imagen}
                      alt={pizzaOption.nombre}
                      className="w-12 h-12 object-cover rounded bg-slate-900/90 p-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{pizzaOption.nombre}</div>
                      <div className="text-red-600 font-semibold text-sm">
                        ${pizzaOption.precio.toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t">
              <button
                onClick={() => setShowSelector(false)}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

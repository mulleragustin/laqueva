import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CartProvider } from '../context/CartContext';
import Card from "./Card.jsx";
import FloatingCart from "./FloatingCart.jsx";
import { pizza } from "../data/pizza.js";

export default function PizzaSlider() {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true,
    margin: "-100px" 
  });

  return (
    <CartProvider>
      {/* Título de la sección - Ahora está al principio, fuera del área de desplazamiento */}
      <div className="text-center w-full mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl sm:text-6xl text-red-600 font-sora mb-4"
        >
          Nuestras Pizzas
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-600 text-lg"
        >
          Selecciona tu pizza favorita
        </motion.p>
      </div>

      {/* Contenedor de pizzas con scroll */}
      <div ref={ref} className="w-full py-4">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={isInView ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-20">
            {pizza.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                animate={isInView ? { y: 0, opacity: 1, scale: 1 } : { y: 50, opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2 + (index * 0.1),
                  ease: "easeOut"
                }}
              >
                <Card pizza={item} index={index} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Carrito flotante */}
      <FloatingCart />
    </CartProvider>
  );
}
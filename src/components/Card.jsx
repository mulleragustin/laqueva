import { motion } from "framer-motion";
import PizzaImage from "./PizzaImage.jsx";
import { useCart } from "../context/CartContext";

export default function Card({ pizza, index }) {
  const { dispatch, items } = useCart();

  const cartItem = items.find((item) => item.id === pizza.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const increaseQuantity = () => {
    if (cartQuantity > 0) {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: { id: pizza.id, quantity: cartQuantity + 1 },
      });
    } else {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: pizza.id,
          nombre: pizza.nombre,
          precio: pizza.precio,
          imagen: pizza.imagen,
          ingredientes: pizza.ingredientes,
          quantity: 1,
        },
      });
    }
  };

  const decreaseQuantity = () => {
    if (cartQuantity > 0) {
      if (cartQuantity === 1) {
        dispatch({ type: "REMOVE_ITEM", payload: pizza.id });
      } else {
        dispatch({
          type: "UPDATE_QUANTITY",
          payload: { id: pizza.id, quantity: cartQuantity - 1 },
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`w-full rounded-xl overflow-hidden shadow-lg flex flex-col ${
        pizza.nombre ? "bg-red-500" : "bg-slate-800"
      }`}
    >
      <div className="flex w-full flex-1 p-2">
        <div className="w-1/4  items-center justify-center flex rounded-lg">
          <PizzaImage
            client:load
            src={pizza.imagen}
            alt={`Pizza ${pizza.nombre}`}
            className="w-16 h-16 sm:w-28 sm:h-28 rounded-lg object-cover"
          />
        </div>
        <div className="w-3/4 pl-3 flex flex-col justify-between">
          <div>
            <div
              className={`font-rubik-wet text-xl ${
                pizza.nombre ? "text-yellow-300 break-all" : "text-white"
              }`}
            >
              {pizza.nombre.toUpperCase()}
            </div>
            <p
              className={`text-xs sm:text-sm ${
                pizza.nombre ? "text-white" : "text-gray-400"
              } mb-1`}
            >
              <span className="font-bold">Ingredientes: </span>
              {pizza.ingredientes?.join(", ").toLowerCase() || ""}.
            </p>
          </div>

          <div className="flex justify-between items-center mt-2 sm:mt-3">
            <div
              className={`text-lg sm:text-xl font-bold ${
                pizza.nombre ? "text-white" : "text-green-500"
              }`}
            >
              ${pizza.precio.toLocaleString()}
            </div>

            <div className="flex items-center bg-white rounded-lg overflow-hidden">
              <button
                onClick={decreaseQuantity}
                className="px-1 sm:px-2 w-6 sm:w-8 py-1 text-gray-800 hover:text-white text-sm sm:text-xl font-bold cursor-pointer hover:bg-red-700 rounded-l-lg transition-colors"
              >
                -
              </button>
              <span className="px-1 sm:px-2 py-1 font-bold text-black text-sm sm:text-base min-w-[20px] text-center">
                {cartQuantity}
              </span>
              <button
                onClick={increaseQuantity}
                className="px-1 sm:px-2 w-6 sm:w-8 py-1 text-gray-800 text-sm sm:text-xl font-bold cursor-pointer hover:text-white hover:bg-red-700 rounded-r-lg transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

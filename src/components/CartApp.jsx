import { CartProvider } from '../context/CartContext';
import FloatingCart from './FloatingCart';
import PizzaSlider from './PizzaSlider';

export default function CartApp() {
  return (
    <CartProvider>
      <PizzaSlider />
      <FloatingCart />
    </CartProvider>
  );
}
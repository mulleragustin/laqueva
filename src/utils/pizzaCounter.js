// Función para contar cuántas pizzas incluye cada item
export const contarPizzasEnItem = (item) => {
  // Si es promo, verificar cuántas pizzas incluye
  if (item.esPromo) {
    switch (item.id) {
      case 8: // 2 MUZZA
        return 2;
      case 9: // 1 MUZZA + 1 ESPECIAL  
        return 2;
      case 10: // 1 NAPO + 1 FUGA
        return 2;
      case 11: // 1 NAPO + 1 FUGA (CON JAMÓN)
        return 2;
      default:
        return 1;
    }
  }
  // Si no es promo, cada item es 1 pizza
  return 1;
};

// Función para contar el total de pizzas en un carrito
export const contarTotalPizzas = (items) => {
  return items.reduce((total, item) => {
    const pizzasPorItem = contarPizzasEnItem(item);
    return total + (pizzasPorItem * item.quantity);
  }, 0);
};

// Función para preparar items para guardar en Firebase
export const prepararItemsParaFirebase = (items) => {
  return items.map(item => ({
    id: item.id,
    nombre: item.nombre,
    precio: item.precio,
    cantidad: item.quantity,
    esPromo: item.esPromo || false,
    cantidadPizzas: contarPizzasEnItem(item) * item.quantity
  }));
};

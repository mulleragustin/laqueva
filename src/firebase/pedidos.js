import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  getDoc,
  setDoc,
  increment
} from "firebase/firestore";
import { db } from "./config";
import { contarTotalPizzas, prepararItemsParaFirebase } from "../utils/pizzaCounter";

// Obtener el próximo número de orden
export const obtenerProximoNumeroOrden = async () => {
  try {
    const configRef = doc(db, "configuracion", "general");
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const numeroActual = configSnap.data().numeroOrdenActual || 1;
      const nuevoNumero = numeroActual + 1;
      
      // Actualizar el número en la configuración
      await updateDoc(configRef, {
        numeroOrdenActual: nuevoNumero
      });
      
      return nuevoNumero;
    } else {
      // Crear la configuración inicial
      await setDoc(configRef, {
        numeroOrdenActual: 2,
        costoEnvioBase: 1000,
        costoPorKm: 200,
        zonaGratis: 2,
        abierto: true
      });
      return 1;
    }
  } catch (error) {
    console.error("Error obteniendo número de orden:", error);
    return Date.now(); // Fallback con timestamp
  }
};

// Guardar un nuevo pedido (versión simplificada para debugging)
export const guardarPedido = async (datosCarrito) => {
  console.log("🔥 Función guardarPedido iniciada");
  console.log("📊 Datos recibidos:", datosCarrito);
  
  try {
    // Verificar conexión a Firebase
    console.log("🔗 Verificando conexión a Firebase...");
    console.log("🏪 DB instance:", db);
    
    const {
      items,
      totalPrice,
      costoEnvio,
      metodoEntrega,
      direccion,
      metodoPago,
      nombreCliente,
      telefonoCliente,
      notas
    } = datosCarrito;

    console.log("📋 Items del carrito:", items);

    // Obtener número de orden secuencial
    console.log("🔢 Obteniendo número de orden secuencial...");
    const numeroOrden = await obtenerProximoNumeroOrden();
    console.log("📊 Número de orden:", numeroOrden);
    
    // Preparar items para Firebase incluyendo gustos para doble gusto
    console.log("🛠️ Preparando items para Firebase...");
    const itemsParaFirebase = items.map(item => {
      const itemBase = {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.quantity,
        esPromo: item.esPromo || false
      };

      // Si es doble gusto, agregar información de los gustos
      if (item.esDobleGusto && item.gustos && item.gustos.length === 2) {
        itemBase.esDobleGusto = true;
        itemBase.gustos = item.gustos.map(gusto => ({
          id: gusto.id,
          nombre: gusto.nombre,
          precio: gusto.precio,
          ingredientes: gusto.ingredientes || []
        }));
      }

      return itemBase;
    });
    console.log("📦 Items preparados:", itemsParaFirebase);
    
    // Calcular total de pizzas simple
    const totalPizzas = items.reduce((total, item) => total + item.quantity, 0);
    console.log("🍕 Total pizzas:", totalPizzas);
    
    // Estructura del pedido simplificada
    const pedido = {
      numeroOrden,
      cliente: {
        nombre: nombreCliente,
        telefono: telefonoCliente
      },
      items: itemsParaFirebase,
      resumen: {
        subtotal: totalPrice,
        costoEnvio: costoEnvio || 0,
        total: totalPrice + (costoEnvio || 0),
        totalPizzas
      },
      entrega: {
        tipo: metodoEntrega,
        direccion: metodoEntrega === "envio" ? direccion : "Retiro en Paseo Sur"
      },
      pago: {
        metodo: metodoPago,
        estado: "pendiente"
      },
      estado: "pendiente",
      notas: notas || "",
      fechaCreacion: new Date().toISOString() // Usar string por simplicidad
    };

    console.log("📝 Pedido preparado:", pedido);

    // Intentar guardar en Firestore
    console.log("💾 Guardando en Firestore...");
    const docRef = await addDoc(collection(db, "pedidos"), pedido);
    console.log("✅ Pedido guardado con ID:", docRef.id);
    
    return { success: true, id: docRef.id, numeroOrden };
    
  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("📄 Error message:", error.message);
    console.error("🔍 Error code:", error.code);
    console.error("📚 Error stack:", error.stack);
    return { success: false, error: error.message };
  }
};

// Actualizar estadísticas diarias
const actualizarVentasDiarias = async (pedido) => {
  try {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const ventasRef = doc(db, "ventas_diarias", hoy);
    const ventasSnap = await getDoc(ventasRef);
    
    if (ventasSnap.exists()) {
      // Actualizar estadísticas existentes
      const datos = ventasSnap.data();
      await updateDoc(ventasRef, {
        "resumen.totalVentas": increment(pedido.resumen.total),
        "resumen.totalPedidos": increment(1),
        "resumen.totalPizzas": increment(pedido.resumen.totalPizzas),
        [`porMetodoPago.${pedido.pago.metodo}.cantidad`]: increment(1),
        [`porMetodoPago.${pedido.pago.metodo}.total`]: increment(pedido.resumen.total),
        [`porTipoEntrega.${pedido.entrega.tipo}.cantidad`]: increment(1),
        [`porTipoEntrega.${pedido.entrega.tipo}.total`]: increment(pedido.resumen.total)
      });
    } else {
      // Crear estadísticas del día
      const nuevasVentas = {
        fecha: hoy,
        resumen: {
          totalVentas: pedido.resumen.total,
          totalPedidos: 1,
          totalPizzas: pedido.resumen.totalPizzas,
          promedioVenta: pedido.resumen.total
        },
        porMetodoPago: {
          efectivo: { 
            cantidad: pedido.pago.metodo === "efectivo" ? 1 : 0, 
            total: pedido.pago.metodo === "efectivo" ? pedido.resumen.total : 0 
          },
          transferencia: { 
            cantidad: pedido.pago.metodo === "transferencia" ? 1 : 0, 
            total: pedido.pago.metodo === "transferencia" ? pedido.resumen.total : 0 
          }
        },
        porTipoEntrega: {
          retiro: { 
            cantidad: pedido.entrega.tipo === "retiro" ? 1 : 0, 
            total: pedido.entrega.tipo === "retiro" ? pedido.resumen.total : 0 
          },
          envio: { 
            cantidad: pedido.entrega.tipo === "envio" ? 1 : 0, 
            total: pedido.entrega.tipo === "envio" ? pedido.resumen.total : 0 
          }
        }
      };
      
      await setDoc(ventasRef, nuevasVentas);
    }
  } catch (error) {
    console.error("Error actualizando ventas diarias:", error);
  }
};

// Obtener pedidos por estado para el admin (pendientes, confirmados, cancelados)
export const obtenerPedidosPorEstado = async (estado = null) => {
  try {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    const pedidos = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filtrar por estado si se especifica
      if (estado) {
        if (data.estado === estado || (!data.estado && estado === "pendiente")) {
          pedidos.push({
            id: doc.id,
            ...data
          });
        }
      } else {
        // Si no se especifica estado, devolver solo activos (no cancelados ni entregados)
        const estadosActivos = ["pendiente", "confirmado"];
        if (estadosActivos.includes(data.estado) || !data.estado) {
          pedidos.push({
            id: doc.id,
            ...data
          });
        }
      }
    });
    
    // Ordenar por fecha de creación (más recientes primero)
    pedidos.sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion || 0);
      const fechaB = new Date(b.fechaCreacion || 0);
      return fechaB - fechaA;
    });
    
    return pedidos;
  } catch (error) {
    console.error("Error obteniendo pedidos:", error);
    return [];
  }
};

// Mantener funciones para compatibilidad
export const obtenerPedidosActivos = () => obtenerPedidosPorEstado();
export const obtenerPedidosPendientes = () => obtenerPedidosPorEstado("pendiente");
export const obtenerPedidosConfirmados = () => obtenerPedidosPorEstado("confirmado");
export const obtenerPedidosCancelados = () => obtenerPedidosPorEstado("cancelado");

// Confirmar pedido (cambiar estado a confirmado) - versión simplificada
export const confirmarPedido = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    await updateDoc(pedidoRef, {
      estado: "confirmado",
      "pago.estado": "confirmado",
      fechaConfirmacion: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error confirmando pedido:", error);
    return { success: false, error: error.message };
  }
};

// Cancelar pedido (cambiar estado a cancelado)
export const cancelarPedido = async (pedidoId) => {
  try {
    const pedidoRef = doc(db, "pedidos", pedidoId);
    await updateDoc(pedidoRef, {
      estado: "cancelado",
      fechaCancelacion: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error cancelando pedido:", error);
    return { success: false, error: error.message };
  }
};

// Generar e imprimir comanda
export const imprimirComanda = (pedido) => {
  const fechaCreacion = new Date(pedido.fechaCreacion).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const contenidoComanda = `
    <div style="font-family: 'Courier New', monospace; max-width: 300px; margin: 0 auto; padding: 5px;">
      <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 24px;">LA QUE VA</h1>
        <p style="margin: 5px 0;"> PIZZERÍA </p>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>PEDIDO #${pedido.numeroOrden}</strong><br>
        <strong>Fecha:</strong> ${fechaCreacion}<br>
        <strong>Estado:</strong> ${pedido.estado.toUpperCase()}<br>
        <hr style="border: 1px dashed #000;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>CLIENTE:</strong><br>
        ${pedido.cliente.nombre}<br>
        ${pedido.cliente.telefono ? `${pedido.cliente.telefono}<br>` : ''}
        <hr style="border: 1px dashed #000;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>ENTREGA:</strong><br>
        ${pedido.entrega.tipo === "retiro" ? "RETIRO EN PASEO SUR" : "ENVÍO A DOMICILIO"}<br>
        ${pedido.entrega.tipo === "envio" ? `<small>${pedido.entrega.direccion}</small><br>` : ""}
        <strong>Pago:</strong> ${pedido.pago.metodo.toUpperCase()}<br>
        <hr style="border: 1px dashed #000;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>PRODUCTOS:</strong><br>
        ${pedido.items.map(item => {
          let linea = `${item.cantidad}x ${item.nombre}<br>`;
          
          // Si es doble gusto, mostrar los gustos
          if (item.esDobleGusto && item.gustos && item.gustos.length === 2) {
            linea += `<small>   (${item.gustos[0].nombre} & ${item.gustos[1].nombre})</small><br>`;
          }
          
          if (item.esPromo) {
            linea += '<em>(PROMO)</em><br>';
          }
          
          return linea;
        }).join('')}
        <hr style="border: 1px dashed #000;">
      </div>
      ${pedido.notas ? `
        <div style="margin-bottom: 15px;">
          <strong>NOTAS:</strong><br>
          <em>${pedido.notas}</em><br>
          <hr style="border: 1px dashed #000;">
        </div>
      ` : ''}
      
      <div style="margin-bottom: 15px;">
        <strong>TOTAL PIZZAS:</strong> ${pedido.resumen.totalPizzas}<br>
        <strong>SUBTOTAL:</strong> $${pedido.resumen.subtotal.toLocaleString()}<br>
        ${pedido.resumen.costoEnvio > 0 ? 
          `<strong>ENVÍO:</strong> $${pedido.resumen.costoEnvio.toLocaleString()}<br>` : ''
        }
        <strong style="font-size: 18px;">TOTAL: $${pedido.resumen.total.toLocaleString()}</strong><br>
        <hr style="border: 2px solid #000;">
      </div>
      
      
      
      <div style="text-align: center; margin-top: 20px;">
        <p style="margin: 0;">¡Gracias por elegirnos!</p>
        <p style="margin: 0; font-size: 12px;">Paseo Sur - La Que Va</p>
      </div>
    </div>
  `;

  // Crear ventana de impresión
  const ventanaImpresion = window.open('', '_blank', 'width=400,height=600');
  ventanaImpresion.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comanda - Pedido #${pedido.numeroOrden}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 0.5cm; }
        }
      </style>
    </head>
    <body>
      ${contenidoComanda}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `);
  ventanaImpresion.document.close();
};

// Obtener estadísticas de ventas de hoy
export const obtenerVentasHoy = async () => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const ventasRef = doc(db, "ventas_diarias", hoy);
    const ventasSnap = await getDoc(ventasRef);
    
    if (ventasSnap.exists()) {
      return ventasSnap.data();
    } else {
      return {
        fecha: hoy,
        resumen: {
          totalVentas: 0,
          totalPedidos: 0,
          totalPizzas: 0,
          promedioVenta: 0
        }
      };
    }
  } catch (error) {
    console.error("Error obteniendo ventas:", error);
    return null;
  }
};

// Función para enviar confirmación de pedido por WhatsApp
export const enviarConfirmacionWhatsApp = (pedido) => {
  // Construir el mensaje de confirmación
  let mensaje = `Hola ${pedido.cliente.nombre}, confirmamos tu pedido N° ${pedido.numeroOrden} ✅\n\n`;
  
  // Agregar información de entrega
  if (pedido.entrega.tipo === "envio") {
    mensaje += `Lo enviaremos a ${pedido.entrega.direccion} 🛵\n`;
    mensaje += `Tiempo de entrega estimado: 40 minutos ⏰\n`;
  } else {
    mensaje += `Puedes retirar tu pedido en Pasaje Necochea 2035 🏪\n`;
    mensaje += `Tiempo de preparación estimado: 25 minutos ⏰\n`;
  }
  
  mensaje += `El costo de tu orden es de $${pedido.resumen.total.toLocaleString()}\n\n`;
  mensaje += `¡Gracias por tu compra! La Que Va Pizzería 🍕`;
  
  // Codificar el mensaje para la URL
  const encodedMessage = encodeURIComponent(mensaje);
  
  // Crear la URL de WhatsApp con el teléfono del cliente
  const phoneNumber = pedido.cliente.telefono.replace(/\D/g, ''); // Remover caracteres no numéricos
  const whatsappUrl = `https://wa.me/54${phoneNumber}?text=${encodedMessage}`;
  
  // Abrir WhatsApp
  if (typeof window !== 'undefined') {
    window.open(whatsappUrl, "_blank");
  }
  
  return whatsappUrl;
};

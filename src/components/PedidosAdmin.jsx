import { useState, useEffect } from "react";
import { 
  obtenerPedidosPorEstado,
  obtenerPedidosPendientes,
  obtenerPedidosConfirmados,
  obtenerPedidosCancelados,
  confirmarPedido,
  cancelarPedido,
  obtenerVentasHoy,
  imprimirComanda
} from "../firebase/pedidos";
import { FaCheck, FaTimes, FaClock, FaSpinner, FaPrint, FaExclamationTriangle } from "react-icons/fa";

export default function PedidosAdmin() {
  const [pestanaActiva, setPestanaActiva] = useState("pendientes");
  const [pedidos, setPedidos] = useState([]);
  const [ventasHoy, setVentasHoy] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState({});

  // Cargar datos al montar el componente y cuando cambie la pestaña
  useEffect(() => {
    cargarDatos();
  }, [pestanaActiva]);

  // Auto-recargar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [pestanaActiva]);

  const cargarDatos = async () => {
    setCargando(true);
    
    try {
      let pedidosData = [];
      
      // Cargar pedidos según la pestaña activa
      switch (pestanaActiva) {
        case "pendientes":
          pedidosData = await obtenerPedidosPendientes();
          break;
        case "confirmados":
          pedidosData = await obtenerPedidosConfirmados();
          break;
        case "cancelados":
          pedidosData = await obtenerPedidosCancelados();
          break;
        default:
          pedidosData = await obtenerPedidosPendientes();
      }
      
      // Solo cargar ventas en la primera pestaña para no hacer llamadas innecesarias
      if (pestanaActiva === "pendientes" && !ventasHoy) {
        const ventasData = await obtenerVentasHoy();
        setVentasHoy(ventasData);
      }
      
      setPedidos(pedidosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  const manejarConfirmarPedido = async (pedidoId) => {
    setProcesando(prev => ({ ...prev, [pedidoId]: "confirmando" }));
    
    try {
      const resultado = await confirmarPedido(pedidoId);
      if (resultado.success) {
        // Quitar el pedido de la lista de pendientes
        setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId));
      }
    } catch (error) {
      console.error("Error confirmando pedido:", error);
    } finally {
      setProcesando(prev => ({ ...prev, [pedidoId]: null }));
    }
  };

  const manejarCancelarPedido = async (pedidoId) => {
    if (!confirm("¿Estás seguro de que quieres cancelar este pedido?")) {
      return;
    }
    
    setProcesando(prev => ({ ...prev, [pedidoId]: "cancelando" }));
    
    try {
      const resultado = await cancelarPedido(pedidoId);
      if (resultado.success) {
        // Quitar el pedido de la lista actual
        setPedidos(prev => prev.filter(pedido => pedido.id !== pedidoId));
      }
    } catch (error) {
      console.error("Error cancelando pedido:", error);
    } finally {
      setProcesando(prev => ({ ...prev, [pedidoId]: null }));
    }
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return "";
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente": return "bg-yellow-100 text-yellow-800";
      case "confirmado": return "bg-blue-100 text-blue-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const pestanas = [
    { id: "pendientes", label: "Pedidos Pendientes", icon: FaClock },
    { id: "confirmados", label: "Pedidos Confirmados", icon: FaCheck },
    { id: "cancelados", label: "Pedidos Cancelados", icon: FaTimes }
  ];

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="text-4xl animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Estadísticas del día - solo en pendientes */}
      {pestanaActiva === "pendientes" && ventasHoy && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Ventas de Hoy</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${ventasHoy.resumen?.totalVentas?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600">Total Ventas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {ventasHoy.resumen?.totalPedidos || 0}
              </div>
              <div className="text-sm text-gray-600">Pedidos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {ventasHoy.resumen?.totalPizzas || 0}
              </div>
              <div className="text-sm text-gray-600">Pizzas Vendidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${Math.round(ventasHoy.resumen?.promedioVenta || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Promedio Venta</div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de pestañas */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Pestañas */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {pestanas.map((pestana) => {
              const Icon = pestana.icon;
              const esActiva = pestanaActiva === pestana.id;
              
              return (
                <button
                  key={pestana.id}
                  onClick={() => setPestanaActiva(pestana.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    esActiva
                      ? "border-red-500 text-red-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="text-sm" />
                    <span>{pestana.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido de la pestaña */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-red-600">
              {pestanas.find(p => p.id === pestanaActiva)?.label} ({pedidos.length})
            </h1>
            <button
              onClick={cargarDatos}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Actualizar
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaClock className="text-6xl mx-auto mb-4 opacity-50" />
              <p className="text-xl">
                No hay {pestanaActiva === "pendientes" ? "pedidos pendientes" : 
                        pestanaActiva === "confirmados" ? "pedidos confirmados" : 
                        "pedidos cancelados"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pedidos.map((pedido) => (
                <div key={pedido.id} className="py-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold">
                        Pedido #{pedido.numeroOrden}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(pedido.estado || "pendiente")}`}>
                        {(pedido.estado || "pendiente").toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatearFecha(pedido.fechaCreacion)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Información del cliente */}
                    <div>
                      <h4 className="font-semibold mb-2">Cliente</h4>
                      <p className="text-gray-700">{pedido.cliente.nombre}</p>
                      
                      <h4 className="font-semibold mt-4 mb-2">Entrega</h4>
                      <p className="text-gray-700">
                        {pedido.entrega.tipo === "retiro" ? "Retiro en Paseo Sur" : "Envío a domicilio"}
                      </p>
                      {pedido.entrega.tipo === "envio" && (
                        <p className="text-gray-600 text-sm">{pedido.entrega.direccion}</p>
                      )}

                      <h4 className="font-semibold mt-4 mb-2">Pago</h4>
                      <p className="text-gray-700 capitalize">{pedido.pago.metodo}</p>
                      
                      {pedido.notas && (
                        <>
                          <h4 className="font-semibold mt-4 mb-2">Notas</h4>
                          <p className="text-gray-700 text-sm">{pedido.notas}</p>
                        </>
                      )}
                    </div>

                    {/* Items del pedido */}
                    <div>
                      <h4 className="font-semibold mb-2">Items</h4>
                      <div className="space-y-2">
                        {pedido.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.cantidad}x {item.nombre}</span>
                            <span>${(item.precio * item.cantidad).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t mt-4 pt-4">
                        <div className="flex justify-between font-semibold">
                          <span>Subtotal:</span>
                          <span>${pedido.resumen.subtotal.toLocaleString()}</span>
                        </div>
                        {pedido.resumen.costoEnvio > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Envío:</span>
                            <span>${pedido.resumen.costoEnvio.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-red-600">
                          <span>Total:</span>
                          <span>${pedido.resumen.total.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {pedido.resumen.totalPizzas} pizzas
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {/* Botón de imprimir comanda - siempre disponible excepto en cancelados */}
                    {pestanaActiva !== "cancelados" && (
                      <button
                        onClick={() => imprimirComanda(pedido)}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                      >
                        <FaPrint className="mr-2" />
                        Imprimir Comanda
                      </button>
                    )}

                    {/* Botones específicos por estado */}
                    {pestanaActiva === "pendientes" && (
                      <>
                        <button
                          onClick={() => manejarConfirmarPedido(pedido.id)}
                          disabled={procesando[pedido.id]}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
                        >
                          {procesando[pedido.id] === "confirmando" ? (
                            <FaSpinner className="animate-spin mr-2" />
                          ) : (
                            <FaCheck className="mr-2" />
                          )}
                          Confirmar Pedido
                        </button>
                        
                        <button
                          onClick={() => manejarCancelarPedido(pedido.id)}
                          disabled={procesando[pedido.id]}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                        >
                          {procesando[pedido.id] === "cancelando" ? (
                            <FaSpinner className="animate-spin mr-2" />
                          ) : (
                            <FaTimes className="mr-2" />
                          )}
                          Cancelar Pedido
                        </button>
                      </>
                    )}

                    {pestanaActiva === "confirmados" && (
                      <button
                        onClick={() => manejarCancelarPedido(pedido.id)}
                        disabled={procesando[pedido.id]}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                      >
                        {procesando[pedido.id] === "cancelando" ? (
                          <FaSpinner className="animate-spin mr-2" />
                        ) : (
                          <FaExclamationTriangle className="mr-2" />
                        )}
                        Cancelar Pedido
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

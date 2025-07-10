import { useState, useEffect, useRef } from "react";
import { 
  obtenerPedidosPorEstado,
  obtenerPedidosPendientes,
  obtenerPedidosConfirmados,
  obtenerPedidosCancelados,
  confirmarPedido,
  cancelarPedido,
  obtenerVentasHoy,
  imprimirComanda,
  enviarConfirmacionWhatsApp
} from "../firebase/pedidos";
import { FaCheck, FaTimes, FaClock, FaSpinner, FaPrint, FaExclamationTriangle, FaWhatsapp } from "react-icons/fa";

export default function PedidosAdmin() {
  const [pestanaActiva, setPestanaActiva] = useState("pendientes");
  const [pedidos, setPedidos] = useState([]);
  const [ventasHoy, setVentasHoy] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState({});
  const [cantidadPedidosAnterior, setCantidadPedidosAnterior] = useState(-1); // Inicializar con -1 para detectar la primera carga
  const [audioIniciado, setAudioIniciado] = useState(false);

  // Cargar datos al montar el componente y cuando cambie la pestaña
  useEffect(() => {
    cargarDatos();
  }, [pestanaActiva]);

  // Auto-verificar nuevos pedidos cada 10 segundos (sin recargar la página completa)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (audioIniciado && pestanaActiva === "pendientes") {
        try {
          const pedidosData = await obtenerPedidosPendientes();
          const nuevaCantidad = pedidosData.length;
          
          // Solo detectar nuevos pedidos si hay aumento
          if (cantidadPedidosAnterior >= 0 && nuevaCantidad > cantidadPedidosAnterior) {
            reproducirSonidoNotificacion();
            // Actualizar la lista de pedidos sin recargar toda la página
            setPedidos(pedidosData);
          }
          
          // Actualizar la cantidad anterior
          setCantidadPedidosAnterior(nuevaCantidad);
        } catch (error) {
          console.error('Error verificando nuevos pedidos:', error);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [audioIniciado, pestanaActiva, cantidadPedidosAnterior]);

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
      
      // Detectar nuevos pedidos pendientes solo en carga manual/inicial
      if (pestanaActiva === "pendientes") {
        const nuevaCantidad = pedidosData.length;
        
        // Si es la primera carga (cantidadPedidosAnterior es -1), solo establecer la cantidad base
        if (cantidadPedidosAnterior === -1) {
          setCantidadPedidosAnterior(nuevaCantidad);
        } else {
          // En cargas manuales, actualizar sin reproducir sonido (el sonido se maneja en el intervalo)
          setCantidadPedidosAnterior(nuevaCantidad);
        }
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
        setPedidos(prev => {
          const nuevosPedidos = prev.filter(pedido => pedido.id !== pedidoId);
          // Actualizar el contador para reflejar la nueva cantidad
          setCantidadPedidosAnterior(nuevosPedidos.length);
          return nuevosPedidos;
        });
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
        setPedidos(prev => {
          const nuevosPedidos = prev.filter(pedido => pedido.id !== pedidoId);
          // Si estamos en pendientes, actualizar el contador
          if (pestanaActiva === "pendientes") {
            setCantidadPedidosAnterior(nuevosPedidos.length);
          }
          return nuevosPedidos;
        });
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

  // Función para reproducir sonido de notificación
  const reproducirSonidoNotificacion = () => {
    try {
      const audio = new Audio('/wow.mp3');
      audio.volume = 0.8; // Volumen al 80%
      
      // Promesa para manejar la reproducción
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Sonido reproducido exitosamente
          })
          .catch(error => {
            console.error('Error reproduciendo sonido:', error);
            // Intentar de nuevo con un audio nuevo
            setTimeout(() => {
              try {
                const audioBackup = new Audio('/wow.mp3');
                audioBackup.volume = 0.8;
                audioBackup.play();
              } catch (e) {
                console.error('Error en segundo intento:', e);
              }
            }, 100);
          });
      }
    } catch (error) {
      console.error('Error creando audio:', error);
    }
  };

  // Función para inicializar el audio con interacción del usuario
  const inicializarAudio = () => {
    if (!audioIniciado) {
      setAudioIniciado(true);
      
      // Reproducir sonido silencioso para inicializar
      try {
        const audio = new Audio('/wow.mp3');
        audio.volume = 0.01; // Muy bajo pero no 0
        audio.play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {
            // Audio no se pudo inicializar automáticamente
          });
      } catch (error) {
        console.error('Error inicializando audio:', error);
      }
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="text-4xl animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4" onClick={inicializarAudio}>
      {/* Estadísticas del día - solo en pendientes */}
      {pestanaActiva === "pendientes" && ventasHoy && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
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

      {/* Indicador de sonido habilitado */}
      {!audioIniciado ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">
            🔊 <strong>Haz clic en cualquier lugar</strong> para habilitar las notificaciones de sonido cuando lleguen nuevos pedidos.
          </p>
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="text-sm">
            ✅ <strong>Notificaciones de sonido activadas</strong> - Recibirás una alerta sonora cuando lleguen nuevos pedidos.
          </p>
        </div>
      )}

      {/* Panel de pestañas */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Pestañas */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4">
            {pestanas.map((pestana) => {
              const Icon = pestana.icon;
              const esActiva = pestanaActiva === pestana.id;
              
              return (
                <button
                  key={pestana.id}
                  onClick={() => {
                    setPestanaActiva(pestana.id);
                    inicializarAudio();
                  }}
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
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-red-600">
              {pestanas.find(p => p.id === pestanaActiva)?.label} ({pedidos.length})
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🔄 Recarga manual iniciada...');
                  cargarDatos();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                🔄 Actualizar
                {audioIniciado && (
                  <span className="ml-2 text-xs bg-green-500 px-2 py-1 rounded">
                    🔊
                  </span>
                )}
              </button>
            </div>
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
                <div key={pedido.id} className="py-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Información del cliente */}
                    <div>
                      <h4 className="font-semibold mb-2">Cliente</h4>
                      <p className="text-gray-700">{pedido.cliente.nombre}</p>
                      {pedido.cliente.telefono && (
                        <p className="text-gray-600 text-sm">{pedido.cliente.telefono}</p>
                      )}
                      
                      <h4 className="font-semibold mt-3 mb-2">Entrega</h4>
                      <p className="text-gray-700">
                        {pedido.entrega.tipo === "retiro" ? "Retiro en LOCAL" : "Envío a domicilio"}
                      </p>
                      {pedido.entrega.tipo === "envio" && (
                        <p className="text-gray-600 text-sm">{pedido.entrega.direccion}</p>
                      )}

                      <h4 className="font-semibold mt-3 mb-2">Pago</h4>
                      <p className="text-gray-700 capitalize">{pedido.pago.metodo}</p>
                      
                      {pedido.notas && (
                        <>
                          <h4 className="font-semibold mt-3 mb-2">Notas</h4>
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
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span>{item.cantidad}x {item.nombre}</span>
                                {item.esPromo && (
                                  <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                    PROMO
                                  </span>
                                )}
                              </div>
                              {item.esDobleGusto && item.gustos && item.gustos.length === 2 && (
                                <div className="text-xs text-gray-600 ml-2">
                                  ({item.gustos[0].nombre} & {item.gustos[1].nombre})
                                </div>
                              )}
                            </div>
                            <span>${(item.precio * item.cantidad).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t mt-3 pt-3">
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
                  <div className="mt-4 flex flex-wrap gap-2">
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

                    {/* Botón de confirmación por WhatsApp - disponible en pendientes y confirmados */}
                    {pestanaActiva !== "cancelados" && (
                      <button
                        onClick={() => enviarConfirmacionWhatsApp(pedido)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                      >
                        <FaWhatsapp className="mr-2" />
                        Confirmar por WhatsApp
                      </button>
                    )}

                    {/* Botones específicos por estado */}
                    {pestanaActiva === "pendientes" && (
                      <>
                        <button
                          onClick={() => manejarConfirmarPedido(pedido.id)}
                          disabled={procesando[pedido.id]}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                        >
                          {procesando[pedido.id] === "confirmando" ? (
                            <FaSpinner className="animate-spin mr-2" />
                          ) : (
                            <FaCheck className="mr-2" />
                          )}
                          Marcar como Confirmado
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

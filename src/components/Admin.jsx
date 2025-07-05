import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/config.js";
import PedidosAdmin from "./PedidosAdmin.jsx";

export default function AdminPanel() {
  const [estado, setEstado] = useState("cargando");
  const [isUpdating, setIsUpdating] = useState(false);
  const [tabActiva, setTabActiva] = useState("pedidos");
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "config", "estado"),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setEstado(data.estado || "cerrado");
        } else {
          setEstado("cerrado");
        }
      },
      (error) => {
        console.error("Error:", error);
        setEstado("cerrado");
      }
    );

    return () => unsubscribe();
  }, []);

  const updateEstado = async (nuevoEstado) => {
    setIsUpdating(true);
    try {
      await setDoc(doc(db, "config", "estado"), {
        estado: nuevoEstado,
        timestamp: new Date(),
        updatedBy: auth.currentUser?.email || "admin"
      });
      console.log("Estado actualizado a:", nuevoEstado);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      alert("Error al actualizar el estado");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con navegación */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-red-600">Panel de Administración</h1>
            <button
              onClick={handleLogout}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
          
          {/* Pestañas */}
          <div className="flex space-x-6 mt-4">
            <button
              onClick={() => setTabActiva("pedidos")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                tabActiva === "pedidos"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setTabActiva("configuracion")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                tabActiva === "configuracion"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Configuración
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="py-6">
        {tabActiva === "pedidos" && <PedidosAdmin />}
        
        {tabActiva === "configuracion" && (
          <div className="max-w-md mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg border">
              <h2 className="text-xl font-bold mb-4">Control de Pizzería</h2>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Estado actual:</p>
                <div className={`p-3 rounded-lg text-center font-semibold ${
                  estado === "abierto" 
                    ? "bg-green-100 text-green-800" 
                    : estado === "cargando"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {estado === "abierto" ? "🟢 ABIERTO" : 
                   estado === "cargando" ? "⏳ CARGANDO..." : 
                   "🔴 CERRADO"}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updateEstado("abierto")}
                  disabled={isUpdating || estado === "abierto" || estado === "cargando"}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {isUpdating ? "Actualizando..." : "Abrir Pizzería"}
                </button>
                
                <button
                  onClick={() => updateEstado("cerrado")}
                  disabled={isUpdating || estado === "cerrado" || estado === "cargando"}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {isUpdating ? "Actualizando..." : "Cerrar Pizzería"}
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500 text-center">
                Los cambios se actualizan en tiempo real
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

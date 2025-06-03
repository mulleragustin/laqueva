import { useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase/config.js";

export default function AdminPanel() {
  const [estado, setEstado] = useState("cargando");
  const [isUpdating, setIsUpdating] = useState(false);
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
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Control de Pizzería</h2>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Cerrar Sesión
        </button>
      </div>
      
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
  );
}

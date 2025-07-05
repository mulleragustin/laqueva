// Utilidades de diagnóstico para Firebase (solo para desarrollo)
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config.js";

// Probar conexión básica a Firebase
export const probarFirebase = async () => {
  try {
    const testData = {
      test: true,
      mensaje: "Prueba de conexión",
      timestamp: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, "test"), testData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error en prueba de Firebase:", error);
    return { success: false, error: error.message };
  }
};

// Probar lectura de pedidos
export const probarLecturaPedidos = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    const pedidos = [];
    
    querySnapshot.forEach((doc) => {
      pedidos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, pedidos, total: pedidos.length };
  } catch (error) {
    console.error("Error leyendo pedidos:", error);
    return { success: false, error: error.message };
  }
};

// Si quieres probar desde la consola del navegador:
// window.probarFirebase = probarFirebase;
// window.probarLecturaPedidos = probarLecturaPedidos;

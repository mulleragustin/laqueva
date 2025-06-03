import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

import { FaInstagram, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";

export default function EstadoDePedidos() {
  const [estado, setEstado] = useState("cargando");
  const [isClient, setIsClient] = useState(false);

  // Verificar que estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // No ejecutar en servidor

    console.log("Estado component mounted");
    console.log("DB instance:", db);

    const docRef = doc(db, "config", "estado");
    console.log("DocRef created:", docRef);

    // 1) Traer valor inicial
    getDoc(docRef)
      .then((docSnap) => {
        console.log("getDoc resolved:", docSnap.exists());
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          setEstado(docSnap.data().estado.toLowerCase());
        } else {
          console.log("Document does not exist");
          setEstado("desconocido");
        }
      })
      .catch((err) => {
        console.error("getDoc error:", err);
        setEstado("error");
      });

    // 2) Suscribirse a cambios
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        console.log("onSnapshot triggered:", docSnap.exists());
        if (docSnap.exists()) {
          console.log("Snapshot data:", docSnap.data());
          setEstado(docSnap.data().estado.toLowerCase());
        }
      },
      (err) => {
        console.error("onSnapshot error:", err);
        setEstado("error");
      }
    );

    return () => unsub();
  }, [isClient]);

  if (estado === "cargando") {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
        <span>Cargando estado...</span>
      </div>
    );
  }

  if (estado === "error") {
    return <div className="text-red-600">Error al cargar el estado.</div>;
  }

  if (estado === "desconocido") {
    return <div className="text-orange-500">Estado no encontrado.</div>;
  }

  if (estado === "cerrado") {
    return (
      <div className="text-center space-y-4 mx-4">
        <div className="p-4 text-center bg-red-600 rounded-lg font-bold text-xl text-white">
          🚫 Cerrado🚫
        </div>
        <div className="text-gray-700 px-1">
          Seguinos en nuestras redes para enterarte de nuestro horario de
          atención
        </div>
        <motion.div
          className="flex justify-center space-x-6 px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.a
            href="https://instagram.com/laquevapizzeria"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="text-red-500 transition-transform"
          >
            <FaInstagram size={40} />
          </motion.a>

          <motion.a
            href="https://facebook.com/laquevapizzeria"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            className="text-red-500 transition-transform"
          >
            <FaFacebook size={40} />
          </motion.a>

          <motion.a
            href="https://wa.me/5493624384200?text=Hola,%20quiero%20estar%20en%20el%20grupo%20de%20whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.2, rotate: -180 }}
            whileTap={{ scale: 0.95 }}
            className="text-red-500 transition-transform"
          >
            <FaWhatsapp size={40} />
          </motion.a>
        </motion.div>
      </div>
    );
  }

  if (estado === "abierto") {
    return (
      <div className="p-4 bg-green-600 rounded-lg font-bold text-xl text-white">
        Estamos tomando pedidos
      </div>
    );
  }

  return (
    <>
      <div className="text-orange-500">Estado desconocido: {estado}</div>
      <a
        href="https://wa.me/5493624384200"
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-600 hover:text-green-800 transition-colors"
      >
        Reportar
        <FaWhatsapp size={40} />
      </a>
    </>
  );
}

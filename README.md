# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

# 🍕 La Que Va - Pizzería Online

Una aplicación web sencilla para la pizzería "La Que Va" construida con Astro, React y Tailwind CSS.

## ✨ Características

- 🛒 **Carrito de compras interactivo** con persistencia local
- 📱 **Diseño responsivo** optimizado para móviles y desktop
- 💬 **Integración con WhatsApp** para pedidos directos
- 🎨 **Interfaz moderna** con animaciones fluidas usando Framer Motion
- 🔥 **Rendimiento optimizado** con Astro para carga rápida
- 📍 **Opciones de entrega** - Retiro en local o envío a domicilio
- 💰 **Múltiples métodos de pago** - Efectivo y transferencia

## 🚀 Estructura del Proyecto

```text
/
├── public/
│   ├── favicon.svg
│   ├── tiny2.svg
│   └── pizzas/
│       └── [imágenes de pizzas]
├── src/
│   ├── components/
│   │   ├── Card.jsx
│   │   ├── FloatingCart.jsx
│   │   ├── PizzaSlider.jsx
│   │   ├── LaQueVaLogo.jsx
│   │   ├── PizzaImage.jsx
│   │   └── Estado.jsx
│   ├── context/
│   │   └── CartContext.jsx
│   ├── data/
│   │   └── pizza.js
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── .env.production
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

## 🛠️ Tecnologías Utilizadas

- **[Astro](https://astro.build/)** - Framework web moderno
- **[React](https://reactjs.org/)** - Biblioteca de componentes
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework de CSS utilitario
- **[Framer Motion](https://www.framer.com/motion/)** - Biblioteca de animaciones
- **[React Icons](https://react-icons.github.io/react-icons/)** - Iconos vectoriales
- **Context API** - Gestión de estado del carrito

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto, desde una terminal:

| Comando                   | Acción                                                |
| :------------------------ | :---------------------------------------------------- |
| `npm install`             | Instala las dependencias                              |
| `npm run dev`             | Inicia el servidor de desarrollo en `localhost:4321`  |
| `npm run build`           | Construye el sitio de producción en `./dist/`        |
| `npm run preview`         | Previsualiza la construcción localmente              |
| `npm run astro ...`       | Ejecuta comandos CLI como `astro add`, `astro check` |
| `npm run astro -- --help` | Obtiene ayuda usando el Astro CLI                    |

## 🔧 Configuración de Desarrollo

1. **Clona el repositorio:**
   ```bash
   git clone [tu-repositorio]
   cd laqueva
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno:**
   - Crea un archivo `.env.local` basado en `.env.production`
   - Actualiza las credenciales de Firebase si es necesario

4. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

5. **Abre tu navegador en** `http://localhost:4321`

## 🍕 Funcionalidades del Carrito

- **Agregar productos:** Usa los botones + en cada pizza
- **Modificar cantidades:** Controles integrados en cada card
- **Eliminar productos:** Reducir cantidad a 0 o usar controles del carrito
- **Configurar entrega:** Retiro en local o envío a domicilio
- **Seleccionar pago:** Efectivo o transferencia
- **Enviar pedido:** Integración directa con WhatsApp

## 📱 WhatsApp Integration

El sistema genera automáticamente un mensaje formateado que incluye:
- Detalles de todos los productos
- Cantidades y precios
- Método de entrega seleccionado
- Dirección (si es envío a domicilio)
- Método de pago
- Total del pedido

## 🚀 Despliegue a Producción

1. **Construir para producción:**
   ```bash
   npm run build
   ```

2. **Desplegar en Netlify, Vercel o tu hosting preferido**

3. **Configurar variables de entorno** en tu plataforma de hosting

## 🔒 Configuración de Seguridad

- Las credenciales de Firebase están en variables de entorno
- El archivo `.env.production` está excluido del control de versiones
- Se recomienda configurar restricciones de dominio en Google Cloud Console

## 🎨 Personalización

### Colores principales:
- **Rojo:** `#dc2626` (red-600)
- **Amarillo:** `#fbbf24` (yellow-400)
- **Fondo:** `#fefce8` (yellow-50)

### Fuentes:
- **Principal:** Sora
- **Títulos:** Rubik Wet Paint

## 📞 Contacto

- **Pizzería:** La Que Va
- **Ubicación:** Paseo Sur, Resistencia, Chaco
- **WhatsApp:** [Número configurado en la aplicación]

## 📄 Licencia

© 2024 La Que Va. Todos los derechos reservados.

---

**Desarrollado con ❤️ para La Que Va Pizzería**

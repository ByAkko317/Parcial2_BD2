# 🛍 Proyecto API REST - E-commerce (Node.js + MongoDB + Docker)

## 📖 Descripción General
Este proyecto consiste en una **API REST completa** para la gestión de un sistema de e-commerce.  
Fue desarrollada utilizando **Node.js**, **Express**, **Mongoose**, y **JWT** para autenticación segura, cumpliendo con los requisitos de la consigna de Bases de Datos II.  

La aplicación permite administrar **usuarios**, **categorías**, **productos**, **carritos**, **órdenes** y **reseñas**.  
El proyecto también incluye soporte para **Docker**, permitiendo ejecutar una instancia de MongoDB dentro de un contenedor, o usar una instalación local.

---

## 🚀 Despliegue del Proyecto

### 🔹 Opción 1: Ejecución sin Docker (modo local)
1. Asegurarse de tener instalados:
   - **Node.js v18+**
   - **MongoDB local**
2. Clonar o copiar el proyecto en una carpeta local.
3. Instalar las dependencias:
npm install
4. Iniciar el servidor de desarrollo:
npm run dev
5. Acceder a la API desde:
http://localhost:4000

### 🔹 Opción 2: Ejecución con Docker
Asegurarse de tener Docker Desktop instalado y en ejecución.

En la raíz del proyecto existe un archivo docker-compose.yml configurado para levantar MongoDB y mongo-express.
Ejecutar el siguiente comando:

docker-compose up -d

Verificar que los servicios estén activos:

MongoDB disponible en el puerto 27017.
mongo-express accesible desde http://localhost:8081.

Luego iniciar el backend normalmente:

npm run dev
La aplicación se conectará automáticamente al contenedor de MongoDB.

## 🧪 Pruebas con Postman
La API fue diseñada siguiendo una arquitectura RESTful, con rutas protegidas por JWT y permisos según rol.
A continuación, se listan los principales endpoints a probar:

### 🔐 Autenticación
Método	Endpoint	Descripción
POST	/api/auth/register	Registra un nuevo usuario
POST	/api/auth/login	Inicia sesión y devuelve token JWT

### 👤 Usuarios
Método	Endpoint	Descripción
GET	/api/users	Lista todos los usuarios (solo ADMIN)
GET	/api/users/:id	Muestra un usuario específico (propio o ADMIN)
POST	/api/users	Crea usuario (solo ADMIN)
DELETE	/api/users/:id	Elimina usuario y su carrito asociado

### 🏷 Categorías
Método	Endpoint	Descripción
GET	/api/categorias	Lista todas las categorías
POST	/api/categorias	Crea una nueva categoría (ADMIN)
PUT	/api/categorias/:id	Modifica una categoría existente
DELETE	/api/categorias/:id	Elimina categoría (ADMIN)
GET	/api/categorias/stats/cantidad-productos	Estadísticas: cantidad de productos por categoría

### 🛒 Productos
Método	Endpoint	Descripción
GET	/api/productos	Lista todos los productos
GET	/api/productos/filtro?min=1000&max=3000&marca=Sony	Filtra productos por precio y marca
GET	/api/productos/top	Muestra productos más reseñados
POST	/api/productos	Crea producto (solo ADMIN)
PATCH	/api/productos/:id/stock	Actualiza stock de producto (ADMIN)

### 🛍 Carrito
Método	Endpoint	Descripción
GET	/api/carrito/:usuarioId	Obtiene el carrito del usuario
POST	/api/carrito/:usuarioId/add	Agrega producto al carrito
POST	/api/carrito/:usuarioId/remove	Elimina producto del carrito
GET	/api/carrito/:usuarioId/total	Calcula total y subtotales del carrito

### 📦 Órdenes
Método	Endpoint	Descripción
POST	/api/ordenes	Crea pedido desde el carrito del usuario
GET	/api/ordenes	Lista todos los pedidos (solo ADMIN)
GET	/api/ordenes/user/:userId	Muestra pedidos de un usuario
PATCH	/api/ordenes/:id/status	Actualiza estado del pedido (ADMIN)
GET	/api/ordenes/stats	Muestra estadísticas de pedidos por estado

### ⭐ Reseñas
Método	Endpoint	Descripción
POST	/api/resenas	Crea una reseña (solo si el usuario compró el producto)
GET	/api/resenas	Lista todas las reseñas con datos de usuario y producto
GET	/api/resenas/product/:productId	Muestra reseñas de un producto
GET	/api/resenas/top	Promedios de calificación por producto

## 📂 Estructura del Proyecto

src/
 ├── app.js
 ├── config/
 ├── models/
 ├── routes/
 ├── middleware/
 └── utils/

## 📑 Notas de Cumplimiento de la Consigna
El proyecto cumple con todos los requerimientos evaluativos:

Modelado correcto:
Los modelos de User, Product, Category, Cart, Order y Review utilizan referencias y subdocumentos embebidos.
Esto garantiza la integridad y relación entre colecciones de forma eficiente.

JWT y roles:
Implementación de autenticación mediante JSON Web Tokens, con middlewares auth y requireAdmin que validan el acceso según rol.

Organización REST:
Estructura modular de rutas y controladores, con endpoints coherentes para cada entidad, siguiendo principios RESTful.

Operadores y agregaciones MongoDB:
Uso de operadores de comparación ($eq, $ne, $gte, $lte, $and, $or),
de modificación ($set, $inc, $pull),
y de agregación ($lookup, $group, $match, $sort, $unwind, $avg, $sum, $count) en las consultas estadísticas.

Manejo de errores y respuestas JSON:
Respuestas unificadas en formato { success, data | error }, con manejo centralizado mediante middleware errorHandler.

Rutas públicas y protegidas:
Las rutas sensibles están protegidas por autenticación JWT y validadas por rol.
Las rutas públicas permiten el acceso a catálogos y reseñas.

## 🧾 Evaluación y Pruebas
Todos los endpoints fueron probados con Postman.

Se realizaron pruebas con tokens válidos e inválidos, validando la autenticación.

Se comprobaron las restricciones por rol (ADMIN vs CLIENTE).

Se verificaron las agregaciones de Mongo en /stats y /top.

✨ Autoría
Autor: Pablo Barrios
Materia: Bases de Datos II
Trabajo: Parcial Integrador
Año: 2025
Profesor/a: Franco González
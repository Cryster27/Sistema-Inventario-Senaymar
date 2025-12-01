# 🏪 Sistema de Inventario y Ventas - Mercería

Sistema de gestión de inventario y ventas para tienda de hilos y mercería, desarrollado en Node.js + MySQL.

## 🎯 Características Principales

- ✅ Gestión completa de inventario (productos con múltiples unidades de medida)
- ✅ Sistema de ventas con validación de stock
- ✅ Soporte para ventas especiales (precio personalizado por venta)
- ✅ Generación automática de boletas en PDF
- ✅ Registro de auditoría de movimientos
- ✅ API RESTful

## 🛠️ Tecnologías

- **Backend:** Node.js + Express
- **Base de Datos:** MySQL 5.7+
- **Generación PDF:** PDFKit
- **Validaciones:** Express Validator

## 📋 Requisitos Previos

- Node.js >= 14.x
- MySQL >= 5.7
- npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone [url-del-repo]
cd merceria-system
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar base de datos
```bash
# Ejecutar el script SQL en MySQL
mysql -u root -p < database_schema.sql
```

### 4. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus datos
nano .env
```

### 5. Crear carpetas necesarias
```bash
mkdir pdfs
mkdir logs
```

### 6. Iniciar el servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

## 📡 API Endpoints

### Productos

- `GET /api/products` - Listar todos los productos
- `GET /api/products/:id` - Obtener un producto específico
- `POST /api/products` - Crear nuevo producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Ventas

- `GET /api/sales` - Listar todas las ventas
- `GET /api/sales/:id` - Obtener detalle de una venta
- `POST /api/sales` - Crear nueva venta
- `GET /api/sales/:id/pdf` - Descargar boleta en PDF

## 📊 Estructura del Proyecto

```
merceria-system/
├── src/
│   ├── config/          # Configuraciones
│   ├── models/          # Modelos de datos
│   ├── controllers/     # Controladores
│   ├── routes/          # Rutas de la API
│   ├── services/        # Lógica de negocio
│   ├── middlewares/     # Middlewares
│   └── utils/           # Utilidades
├── pdfs/                # Boletas generadas
├── tests/               # Tests unitarios
└── server.js            # Punto de entrada
```

## 🧪 Testing

```bash
npm test
```

## 📝 Licencia

MIT

## 👤 Autor

Cristopher Jesus Cabrera Eguia
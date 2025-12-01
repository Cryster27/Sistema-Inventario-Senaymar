# 📝 Ejemplos de Uso - Módulo de Productos

Esta guía muestra ejemplos prácticos de cómo usar todas las funcionalidades del módulo de inventario.

---

## 📋 **1. LISTAR TODOS LOS PRODUCTOS**

### Obtener productos activos
```bash
GET http://localhost:3000/api/products
```

**Respuesta:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": 1,
      "codigo": "HIL-001",
      "nombre": "Hilo de algodón blanco",
      "unidad": "metro",
      "stock": 150.500,
      "precio": 2.50,
      "descripcion": "Hilo 100% algodón color blanco",
      "activo": true,
      "fecha_creacion": "2025-01-15T10:30:00.000Z",
      "fecha_actualizacion": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

### Incluir productos inactivos
```bash
GET http://localhost:3000/api/products?includeInactive=true
```

---

## 🔍 **2. BUSCAR PRODUCTOS**

### Por ID
```bash
GET http://localhost:3000/api/products/1
```

### Por código
```bash
GET http://localhost:3000/api/products/codigo/HIL-001
```

### Por nombre (búsqueda parcial)
```bash
GET http://localhost:3000/api/products/search?q=hilo
```

**Respuesta:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "codigo": "HIL-001",
      "nombre": "Hilo de algodón blanco",
      "unidad": "metro",
      "stock": 150.500,
      "precio": 2.50
    },
    {
      "id": 2,
      "codigo": "HIL-002",
      "nombre": "Hilo de polyester negro",
      "unidad": "metro",
      "stock": 200.000,
      "precio": 3.00
    }
  ]
}
```

---

## ➕ **3. CREAR PRODUCTO**

### Ejemplo 1: Producto en metros
```bash
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "codigo": "HIL-010",
  "nombre": "Hilo de seda rojo",
  "unidad": "metro",
  "stock": 75.250,
  "precio": 5.50,
  "descripcion": "Hilo de seda premium color rojo"
}
```

### Ejemplo 2: Producto en unidades
```bash
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "codigo": "AGU-005",
  "nombre": "Agujas para bordar",
  "unidad": "unidad",
  "stock": 200,
  "precio": 1.50,
  "descripcion": "Pack de agujas para bordado"
}
```

### Ejemplo 3: Producto en docenas
```bash
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "codigo": "BOT-100",
  "nombre": "Botones metálicos dorados",
  "unidad": "docena",
  "stock": 25,
  "precio": 8.00,
  "descripcion": "Docena de botones metálicos color dorado 1.5cm"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    "id": 9,
    "codigo": "HIL-010",
    "nombre": "Hilo de seda rojo",
    "unidad": "metro",
    "stock": 75.250,
    "precio": 5.50,
    "descripcion": "Hilo de seda premium color rojo"
  }
}
```

**Error - Código duplicado:**
```json
{
  "success": false,
  "error": "El código de producto ya existe"
}
```

---

## ✏️ **4. ACTUALIZAR PRODUCTO**

### Actualización completa
```bash
PUT http://localhost:3000/api/products/1
Content-Type: application/json

{
  "nombre": "Hilo de algodón blanco premium",
  "unidad": "metro",
  "stock": 200.500,
  "precio": 3.00,
  "descripcion": "Hilo 100% algodón color blanco - calidad premium",
  "activo": true
}
```

### Actualización parcial (solo algunos campos)
```bash
PUT http://localhost:3000/api/products/1
Content-Type: application/json

{
  "precio": 3.50
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Producto actualizado exitosamente",
  "data": {
    "id": 1,
    "codigo": "HIL-001",
    "nombre": "Hilo de algodón blanco premium",
    "unidad": "metro",
    "stock": 200.500,
    "precio": 3.50,
    "descripcion": "Hilo 100% algodón color blanco - calidad premium",
    "activo": true
  }
}
```

---

## 📊 **5. ACTUALIZAR SOLO STOCK**

### Restar stock (por venta manual)
```bash
PATCH http://localhost:3000/api/products/1/stock
Content-Type: application/json

{
  "cantidad": -15.5,
  "motivo": "Venta manual"
}
```

### Sumar stock (por reabastecimiento)
```bash
PATCH http://localhost:3000/api/products/1/stock
Content-Type: application/json

{
  "cantidad": 100,
  "motivo": "Reabastecimiento de proveedor"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Stock actualizado exitosamente",
  "motivo": "Reabastecimiento de proveedor",
  "stockAnterior": 150.500,
  "stockNuevo": 250.500,
  "data": {
    "id": 1,
    "codigo": "HIL-001",
    "nombre": "Hilo de algodón blanco",
    "stock": 250.500
  }
}
```

**Error - Stock insuficiente:**
```json
{
  "success": false,
  "error": "Stock insuficiente. Stock actual: 10.5, cantidad a restar: 15"
}
```

---

## 📉 **6. PRODUCTOS CON STOCK BAJO**

### Con valor por defecto (10)
```bash
GET http://localhost:3000/api/products/low-stock
```

### Con valor personalizado
```bash
GET http://localhost:3000/api/products/low-stock?min=20
```

**Respuesta:**
```json
{
  "success": true,
  "count": 3,
  "threshold": 20,
  "data": [
    {
      "id": 8,
      "codigo": "TIJ-001",
      "nombre": "Tijera profesional 8\"",
      "stock": 5,
      "precio": 25.00
    },
    {
      "id": 3,
      "codigo": "ELA-001",
      "nombre": "Elástico blanco 1cm",
      "stock": 12.500,
      "precio": 1.80
    }
  ]
}
```

---

## 🗑️ **7. ELIMINAR PRODUCTO**

### Eliminación suave (desactivar)
```bash
DELETE http://localhost:3000/api/products/5
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Producto desactivado"
}
```

### Eliminación permanente
```bash
DELETE http://localhost:3000/api/products/5?permanent=true
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Producto eliminado permanentemente"
}
```

**Error - Producto con ventas:**
```json
{
  "success": false,
  "error": "No se puede eliminar el producto porque tiene ventas registradas"
}
```

---

## ❌ **8. EJEMPLOS DE ERRORES DE VALIDACIÓN**

### Precio inválido
```bash
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "codigo": "TEST-001",
  "nombre": "Producto de prueba",
  "unidad": "unidad",
  "precio": 0
}
```

**Respuesta:**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "El precio debe ser mayor a 0",
      "param": "precio",
      "location": "body"
    }
  ]
}
```

### Unidad inválida
```bash
POST http://localhost:3000/api/products
Content-Type: application/json

{
  "codigo": "TEST-001",
  "nombre": "Producto de prueba",
  "unidad": "kilos",
  "precio": 10
}
```

**Respuesta:**
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Unidad inválida. Valores permitidos: metro, centimetro, unidad, docena, otro",
      "param": "unidad",
      "location": "body"
    }
  ]
}
```

---

## 🧪 **9. PROBAR CON cURL**

### Crear producto
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "HIL-020",
    "nombre": "Hilo de algodón azul",
    "unidad": "metro",
    "stock": 100,
    "precio": 2.80,
    "descripcion": "Hilo azul marino"
  }'
```

### Buscar producto
```bash
curl http://localhost:3000/api/products/search?q=hilo
```

### Actualizar stock
```bash
curl -X PATCH http://localhost:3000/api/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{
    "cantidad": -5.5,
    "motivo": "Venta de prueba"
  }'
```

---

## 📱 **10. PROBAR CON POSTMAN**

### Importar Collection
1. Abre Postman
2. Crea una nueva colección llamada "Mercería - Productos"
3. Agrega las siguientes requests:

#### Request 1: Listar Productos
- **Método:** GET
- **URL:** `http://localhost:3000/api/products`

#### Request 2: Crear Producto
- **Método:** POST
- **URL:** `http://localhost:3000/api/products`
- **Body (raw JSON):**
```json
{
  "codigo": "HIL-030",
  "nombre": "Hilo de polyester verde",
  "unidad": "metro",
  "stock": 85.5,
  "precio": 3.20,
  "descripcion": "Hilo polyester color verde"
}
```

#### Request 3: Buscar por nombre
- **Método:** GET
- **URL:** `http://localhost:3000/api/products/search?q=hilo`

#### Request 4: Actualizar stock
- **Método:** PATCH
- **URL:** `http://localhost:3000/api/products/1/stock`
- **Body (raw JSON):**
```json
{
  "cantidad": -10,
  "motivo": "Venta manual"
}
```

---

## ✅ **CHECKLIST DE PRUEBAS**

- [ ] Listar todos los productos
- [ ] Buscar producto por ID
- [ ] Buscar producto por código
- [ ] Buscar productos por nombre
- [ ] Crear producto con datos válidos
- [ ] Intentar crear producto con código duplicado (debe fallar)
- [ ] Intentar crear producto con precio negativo (debe fallar)
- [ ] Actualizar producto completo
- [ ] Actualizar solo el precio de un producto
- [ ] Actualizar stock sumando cantidad
- [ ] Actualizar stock restando cantidad
- [ ] Intentar restar más stock del disponible (debe fallar)
- [ ] Ver productos con stock bajo
- [ ] Desactivar producto (soft delete)
- [ ] Eliminar producto permanentemente
- [ ] Intentar eliminar producto con ventas (debe fallar)

---

## 🎯 **PRÓXIMO PASO**

Una vez que hayas probado todas estas funcionalidades, estarás listo para continuar con el **Módulo de Ventas** que usará estos productos para registrar transacciones.
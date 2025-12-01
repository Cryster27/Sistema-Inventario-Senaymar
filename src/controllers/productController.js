/**
 * productController.js
 * Controlador para operaciones CRUD de productos
 */

const Product = require('../models/Product');
const { validationResult } = require('express-validator');

/**
 * Obtener todos los productos
 * GET /api/products
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const products = await Product.findAll(!includeInactive);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un producto por ID
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar productos por código
 * GET /api/products/codigo/:codigo
 */
const getProductByCodigo = async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const product = await Product.findByCodigo(codigo);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Buscar productos por nombre
 * GET /api/products/search?q=texto
 */
const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un término de búsqueda'
      });
    }

    const products = await Product.searchByName(q);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear nuevo producto
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { codigo, nombre, unidad, stock, precio, descripcion } = req.body;

    // Verificar que el código sea único
    const isUnique = await Product.isCodigoUnique(codigo);
    if (!isUnique) {
      return res.status(409).json({
        success: false,
        error: 'El código de producto ya existe'
      });
    }

    // Validar stock según tipo de unidad
    if (stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'El stock no puede ser negativo'
      });
    }

    // Validar precio
    if (precio <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El precio debe ser mayor a 0'
      });
    }

    // Crear producto
    const newProduct = await Product.create({
      codigo,
      nombre,
      unidad,
      stock: stock || 0,
      precio,
      descripcion
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar producto
 * PUT /api/products/:id
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, unidad, stock, precio, descripcion, activo } = req.body;

    // Verificar que el producto existe
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Validaciones
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        error: 'El stock no puede ser negativo'
      });
    }

    if (precio !== undefined && precio <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El precio debe ser mayor a 0'
      });
    }

    // Actualizar producto
    const updatedProduct = await Product.update(id, {
      nombre: nombre || existingProduct.nombre,
      unidad: unidad || existingProduct.unidad,
      stock: stock !== undefined ? stock : existingProduct.stock,
      precio: precio !== undefined ? precio : existingProduct.precio,
      descripcion: descripcion !== undefined ? descripcion : existingProduct.descripcion,
      activo: activo !== undefined ? activo : existingProduct.activo
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar producto (soft delete)
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Verificar que el producto existe
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Eliminar (permanente o soft)
    if (permanent === 'true') {
      await Product.hardDelete(id);
    } else {
      await Product.delete(id);
    }

    res.json({
      success: true,
      message: permanent === 'true' 
        ? 'Producto eliminado permanentemente' 
        : 'Producto desactivado'
    });
  } catch (error) {
    // Error si el producto tiene ventas asociadas
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        success: false,
        error: 'No se puede eliminar el producto porque tiene ventas registradas'
      });
    }
    next(error);
  }
};

/**
 * Obtener productos con stock bajo
 * GET /api/products/low-stock?min=10
 */
const getLowStock = async (req, res, next) => {
  try {
    const { min } = req.query;
    const minStock = min ? parseFloat(min) : 10;

    const products = await Product.getLowStock(minStock);

    res.json({
      success: true,
      count: products.length,
      threshold: minStock,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar stock de un producto
 * PATCH /api/products/:id/stock
 */
const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cantidad, motivo } = req.body;

    if (cantidad === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar la cantidad a ajustar'
      });
    }

    // Verificar que el producto existe
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado'
      });
    }

    // Verificar que no quede stock negativo
    const nuevoStock = product.stock + cantidad;
    if (nuevoStock < 0) {
      return res.status(400).json({
        success: false,
        error: `Stock insuficiente. Stock actual: ${product.stock}, cantidad a restar: ${Math.abs(cantidad)}`
      });
    }

    // Actualizar stock
    const updatedProduct = await Product.updateStock(id, cantidad);

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      motivo: motivo || 'Ajuste manual',
      stockAnterior: product.stock,
      stockNuevo: updatedProduct.stock,
      data: updatedProduct
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductByCodigo,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStock,
  updateStock
};
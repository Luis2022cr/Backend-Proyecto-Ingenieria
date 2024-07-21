// index.ts
import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from '../controllers/categoryController';
import authRouter from './authRoutes'; // Importa las rutas de autenticación
import { authenticateJWT } from '../Middlewares/authMiddleware';
import { getCarreras, getCarreraById, createCarrera, updateCarrera, deleteCarrera } from '../controllers/carrerasController';

const router: Router = Router();

// Rutas de autenticación
router.use('/auth', authRouter);

// EndPoints de CATEGORIAS (protegidos por autenticación JWT)
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory); 

// EndPoints de CARRERAS (protegidos por autenticación JWT)
router.get('/carreras', getCarreras);
router.get('/carreras/:id', getCarreraById);
router.post('/carreras', createCarrera);
router.put('/carreras/:id', updateCarrera);
router.delete('/carreras/:id', deleteCarrera);

export default router;

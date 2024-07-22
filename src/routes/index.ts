// index.ts
import { Router } from 'express';
import authRouter from './authRoutes'; // Importa las rutas de autenticación
import { authenticateJWT } from '../Middlewares/authMiddleware';
import { getCarreras, getCarreraById, createCarrera, updateCarrera, deleteCarrera } from '../controllers/carrerasController';
import { getAmbito } from '../controllers/ambitosController';
import { getEstados } from '../controllers/estadosController';
import { createActividad, getActividades } from '../controllers/actividadesController';
import { getUsuariosRolCoordinador } from '../controllers/usuariosController';

const router: Router = Router();

// Rutas de autenticación
router.use('/auth', authRouter);

// EndPoints de CARRERAS 
router.get('/carreras', getCarreras);
router.get('/carreras/:id', getCarreraById);
router.post('/carreras', createCarrera);
router.put('/carreras/:id', updateCarrera);
router.delete('/carreras/:id', deleteCarrera);

//Endponit de Ambito
router.get('/ambitos', getAmbito);

//Endponit de Estados
router.get('/estados', getEstados);

//Endponit de Usuarios
router.get('/usuarioCoordinador', getUsuariosRolCoordinador)

//Endponit de Actividades
router.get('/actividades', getActividades);
router.post('/actividades', createActividad);

export default router;
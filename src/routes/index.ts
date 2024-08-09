// index.ts
import { Router } from 'express';
import authRouter from './authRoutes'; // Importa las rutas de autenticación
import { authenticateJWT } from '../Middlewares/authMiddleware';
import { getCarreras, getCarreraById, createCarrera, updateCarrera, deleteCarrera } from '../controllers/carrerasController';
import { getAmbito } from '../controllers/ambitosController';
import { getEstados } from '../controllers/estadosController';
import { createActividad, getActividades, updateActividad, updateEstadoActividad } from '../controllers/actividadesController';
import { getUsuariosRolCoordinador } from '../controllers/usuariosController';
import { getParticipantesByActividad, getActividadesByUsuario, addParticipante, removeParticipante, getActividadesByUsuarioUnido, getActividadesByNumeroUsuario } from '../controllers/actividadesParticipantesController';

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
router.put('/actividades/:id', updateActividad);
router.patch('/actividades/:id/estado', updateEstadoActividad);

//Enpoint de actividades participantes
router.get('/actividades/:id/participantes', getParticipantesByActividad);
router.get('/usuarios/:id/finalizado', getActividadesByUsuario);
router.get('/usuarios/:numero_usuario/estudiante', getActividadesByNumeroUsuario);
router.get('/usuarios/:id/unido', getActividadesByUsuarioUnido);
router.post('/participantes', addParticipante);
router.put('/actividades-participantes', removeParticipante);

export default router;

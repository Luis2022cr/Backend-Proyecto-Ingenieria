// authRoutes.ts
import { Router } from 'express';
import { register, login, generarCorreoRecuperacion, resetPassword, cambiarPassword } from '../controllers/authController';
import { authenticateJWT } from '../Middlewares/authMiddleware';

const authRouter: Router = Router();

authRouter.post('/registro', register);
authRouter.post('/login', login);
authRouter.post('/generar-correo-recuperacion', generarCorreoRecuperacion);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/cambiar-password',authenticateJWT, cambiarPassword);

export default authRouter;

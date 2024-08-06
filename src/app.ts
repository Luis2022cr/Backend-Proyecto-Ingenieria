import express, { Application, Request, Response } from 'express';
import routes from './routes';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import slowDown from 'express-slow-down';
import { updateEstadoFinalizado } from './controllers/actividadesController';
const cron = require('node-cron');
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3000;

// Configuración del rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 150, // Limita cada IP a 100 solicitudes por ventana
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuración de slow down (para ralentizar el tráfico malicioso)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 50, // Comienza a retrasar respuestas después de 50 solicitudes
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500;
  },
});


// Seguridad básica con Helmet
app.use(helmet());

// Aplicar el rate limiter y speed limiter a todas las solicitudes
app.use(limiter);
app.use(speedLimiter);

// Lista de orígenes permitidos
const allowedOrigins = [process.env.URL_FRONTEND, process.env.URL_LOCAL];

app.use(cors({
  origin: function (origin, callback) {
    // Comprobar si el origen está en la lista de orígenes permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

const upload = multer(); // Configuración básica de multer para manejar archivos

//Ejecutar el updateEstado automaticamente con el 'cron'
cron.schedule('0 0 * * *', () => {
  updateEstadoFinalizado()
      .then(() => console.log('Estado de las actividades actualizado a Finalizado'))
      .catch(error => console.error('Error al actualizar el estado de las actividades:', error));
});

app.use('/api', upload.single('imagen'), routes); // Agrega el middleware de multer antes de las rutas

// Configurar el motor de plantillas EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Ruta para la página principal
app.get('/', (req: Request, res: Response) => {
  res.render('index', { title: 'Página Principal', message: 'Bienvenido a la Página Principal' });
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

import { createClient } from '@libsql/client/web';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

export default client;

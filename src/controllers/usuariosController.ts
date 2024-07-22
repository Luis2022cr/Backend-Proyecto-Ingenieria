import { Request, Response } from 'express';
import client from '../servicios/db';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo_institucional: string;
  numero_usuario: number;
  carrera_nombre: string;
}

// Obtener usuarios con rol 2 (Coordinador) y el nombre de la carrera
export const getUsuariosRolCoordinador = async (req: Request, res: Response): Promise<void> => {
  try {
    // Consulta para obtener usuarios con role_id = 2 y nombre de la carrera
    const resultado = await client.execute(`
      SELECT 
        U.id, 
        U.nombre, 
        U.apellido, 
        U.correo_institucional, 
        U.numero_usuario, 
        C.nombre_carrera AS carrera_nombre
      FROM Usuarios U
      LEFT JOIN Carreras C ON U.carrera_id = C.id
      WHERE U.role_id = 2;
    `);

    if (Array.isArray(resultado.rows)) {
      const formattedData: Usuario[] = resultado.rows.map((row: any) => ({
        id: row[0],
        nombre: row[1],
        apellido: row[2],
        correo_institucional: row[3],
        numero_usuario: row[4],
        carrera_nombre: row[5],
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(500).json({ error: 'Error en la base de datos' });
    }
  } catch (error) {
    console.error('Error al obtener los usuarios con rol 2:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios con rol 2' });
  }
};

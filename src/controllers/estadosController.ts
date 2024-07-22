import { Request, Response } from 'express';
import client from '../servicios/db';

interface Estado {
  id: number;
  nombre_estado: string;
  descripcion: string;
}

// Obtener todas las carreras
export const getEstados = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultado = await client.execute("SELECT * FROM Estados;");

    if (Array.isArray(resultado.rows)) {
      const formattedData: Estado[] = resultado.rows.map((row: any) => ({
        id: row[0],
        nombre_estado: row[1],
        descripcion: row[2],
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(500).json({ error: 'Error en la base de datos' });
    }
  } catch (error) {
    console.error('Error al obtener los estados:', error);
    res.status(500).json({ error: 'Error al obtener los estados' });
  }
};
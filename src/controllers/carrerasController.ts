import { Request, Response } from 'express';
import client from '../servicios/db';

interface Carrera {
  id: number;
  nombre_carrera: string;
  descripcion: string;
  facultad: string;
}

// Obtener todas las carreras
export const getCarreras = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultado = await client.execute("SELECT * FROM Carreras ORDER BY id ASC;");

    if (Array.isArray(resultado.rows)) {
      const formattedData: Carrera[] = resultado.rows.map((row: any) => ({
        id: row[0],
        nombre_carrera: row[1],
        descripcion: row[2],
        facultad: row[3],
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(500).json({ error: 'Unexpected data format from database' });
    }
  } catch (error) {
    console.error('Error fetching carreras:', error);
    res.status(500).json({ error: 'Error fetching carreras' });
  }
};

// Obtener una carrera por ID
export const getCarreraById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const resultado = await client.execute({
      sql: "SELECT * FROM Carreras WHERE id = ?",
      args: [id]
    });

    if (Array.isArray(resultado.rows)) {
      const formattedData: Carrera[] = resultado.rows.map((row: any) => ({
        id: row[0],
        nombre_carrera: row[1],
        descripcion: row[2],
        facultad: row[3],
      }));
      res.status(200).json(formattedData[0]);
    } else {
      res.status(500).json({ error: 'Unexpected data format from database' });
    }
  } catch (error) {
    console.error('Error fetching carrera by id:', error);
    res.status(500).json({ error: 'Error fetching carrera by id' });
  }
};

// Crear una nueva carrera
export const createCarrera = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre_carrera, descripcion, facultad } = req.body;

    await client.execute({
      sql: "INSERT INTO Carreras (nombre_carrera, descripcion, facultad) VALUES (?, ?, ?)",
      args: [nombre_carrera, descripcion, facultad]
    });

    res.status(200).json({ message: 'Carrera creada exitosamente' });
  } catch (error) {
    console.error('Error creating carrera:', error);
    res.status(500).json({ error: 'Error al crear la carrera' });
  }
};

// Actualizar una carrera existente
export const updateCarrera = async (req: Request, res: Response): Promise<void> => {
  const carreraId = req.params.id;
  const { nombre_carrera, descripcion, facultad } = req.body;

  try {
    await client.execute({
      sql: "UPDATE Carreras SET nombre_carrera = ?, descripcion = ?, facultad = ? WHERE id = ?",
      args: [nombre_carrera, descripcion, facultad, carreraId]
    });

    res.status(200).json({ message: 'Carrera actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating carrera:', error);
    res.status(500).json({ error: 'Error al actualizar la carrera' });
  }
};

// Eliminar una carrera
export const deleteCarrera = async (req: Request, res: Response): Promise<void> => {
  const carreraId = req.params.id;

  try {
    await client.execute({
      sql: "DELETE FROM Carreras WHERE id = ?",
      args: [carreraId]
    });

    res.status(200).json({ message: 'Carrera eliminada exitosamente' });
  } catch (error) { 
    console.error('Error deleting carrera:', error);
    res.status(400).json({ error: 'Error al eliminar la carrera' });
  }
};

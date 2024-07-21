import { Request, Response } from 'express';
import client from '../db';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid'; // Importar uuidv4 desde uuid

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: 'dxc3qadsk',
  api_key: '783854393448399',
  api_secret: 'DP-nz6IpqPZatXMgnsivon0Rj2k'
});

// Configuración de Multer para la subida de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  imagen: string;
}

// Obtener todas las categorías
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultSet = await client.execute("SELECT * FROM Categorias ORDER BY id ASC;");

    if (Array.isArray(resultSet.rows)) {
      const formattedData: Categoria[] = resultSet.rows.map((row: any) => ({
        id: row[0],
        nombre: row[1],
        imagen: row[2],
        slug: row[3],
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(500).json({ error: 'Unexpected data format from database' });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error fetching categories' });
  }
};

export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params; // Obtener el ID de la categoría desde los parámetros de la URL

  try {
    // Consultar la categoría por su ID en la base de datos
    const resultSet = await client.execute({
      sql: "SELECT * FROM Categorias WHERE id = ?",
      args: [id]
    });

    if (Array.isArray(resultSet.rows)) {
      const formattedData: Categoria[] = resultSet.rows.map((row: any) => ({
        id: row[0],
        nombre: row[1],
        imagen: row[2],
        slug: row[3],
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(500).json({ error: 'Unexpected data format from database' });
    }
  } catch (error) {
    console.error('Error fetching category by id:', error);
    res.status(500).json({ error: 'Error fetching category by id' });
  }
};

// Función para generar un slug a partir del nombre
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
};

// Crear una nueva categoría
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  
  try {
    const formData = req.body;
    // Generar ID único para la categoría usando uuidv4
    const id = uuidv4();
    const slug = generateSlug(formData.nombre);
    const file = req.file as Express.Multer.File | undefined;
    let imageUrl = formData.imagen; 
    if(file){

      // Convertir el buffer de la imagen
      const arrayBuffer = Buffer.from(file.buffer);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Subir imagen a Cloudinary
      const response: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
        tags: ['catalogos'],
        upload_preset: 'ml_default',
      }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });

      stream.end(arrayBuffer);
    });
    
    const imageUrl = response.secure_url;
  }


    // Guardar en la base de datos

    if(file){
    await client.execute({
      sql: "INSERT INTO Categorias (id, nombre, slug, imagen) VALUES (?, ?, ?, ?)",
      args: [id, formData.nombre, slug, imageUrl]
    });
    }else{

      await client.execute({
        sql: "INSERT INTO Categorias (id, nombre, slug) VALUES (?, ?, ?)",
        args: [id, formData.nombre, slug]
      });
    }
      
    res.status(200).json({ message: 'Categoría creada exitosamente' });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Error al crear la categoría' });
  }
};

// Actualizar una categoría existente
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.params.id;
  const formData = req.body;
  const file = req.file as Express.Multer.File | undefined;

  try {
    let imageUrl = formData.imagen; // Mantener la imagen actual como predeterminada

    // Si se proporciona un nuevo archivo de imagen, subirlo a Cloudinary
    if (file) {
      // Convertir el buffer de la imagen
      const arrayBuffer = Buffer.from(file.buffer);
      const uint8Array = new Uint8Array(arrayBuffer);

      // Subir imagen a Cloudinary
      const response: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          tags: ['catalogos'],
          upload_preset: 'ml_default'
        }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });

        stream.end(arrayBuffer);
      });

      imageUrl = response.secure_url;
    }

    const slug = generateSlug(formData.nombre);

    // Actualizar en la base de datos
    if (file) {
      // Si se subió una nueva imagen, actualizar tanto el nombre como la imagen
      await client.execute({
        sql: "UPDATE Categorias SET nombre = ?, slug = ?, imagen = ? WHERE id = ?",
        args: [formData.nombre, slug, imageUrl, categoryId]
      });
    } else {
      // Si no se subió una nueva imagen, actualizar solo el nombre y el slug
      await client.execute({
        sql: "UPDATE Categorias SET nombre = ?, slug = ? WHERE id = ?",
        args: [formData.nombre, slug, categoryId]
      });
    }

    res.status(200).json({ message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
};

// Eliminar una categoría
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.params.id;

  try {
    // Eliminar de la base de datos
    await client.execute({
      sql: "DELETE FROM Categorias WHERE id = ?",
      args: [categoryId]
    });

    res.status(200).json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Error al eliminar la categoría' });
  }
};

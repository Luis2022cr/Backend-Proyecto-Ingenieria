import { Request, Response } from 'express';
import client from '../servicios/db';
import moment from 'moment-timezone';

interface Actividades {
    id: number;
    nombre_actividad: string;
    objetivos: string;
    actividades_principales: string;
    descripcion: string;
    ubicacion: string;
    carrera: string;
    ambito: string;
    coordinador: string;
    estudiante: string;
    horas_art140: number;
    cupos: number;
    cupos_disponibles: number;
    fecha: Date;
    hora_inicio: string;
    hora_final: string;
    fecha_entrega: Date;
    estado: string;
    observaciones: string;
    informe: string;
}

// Obtener todas las actividades
export const getActividades = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = `
      SELECT 
        A.id, 
        A.nombre_actividad, 
        A.objetivos, 
        A.actividades_principales, 
        A.descripcion, 
        A.ubicacion, 
        C.nombre_carrera AS carrera, 
        AA.nombre AS ambito, 
        UC.nombre || ' ' || UC.apellido AS coordinador, 
        UE.nombre || ' ' || UE.apellido AS estudiante, 
        A.horas_art140, 
        A.cupos, 
        A.cupos_disponibles, 
        A.fecha, 
        A.hora_inicio, 
        A.hora_final, 
        A.fecha_entrega, 
        E.nombre AS estado, 
        A.observaciones, 
        A.informe
      FROM Actividades A
      LEFT JOIN Carreras C ON A.carrera_id = C.id
      LEFT JOIN AmbitosActividad AA ON A.ambito_id = AA.id
      LEFT JOIN Usuarios UC ON A.coordinador_id = UC.id
      LEFT JOIN Usuarios UE ON A.estudiante_id = UE.id
      LEFT JOIN Estados E ON A.estado_id = E.id
      ORDER BY A.id DESC;
    `;

        const resultado = await client.execute(query);

        if (Array.isArray(resultado.rows)) {
            const formattedData: Actividades[] = resultado.rows.map((row: any) => ({
                id: row[0],
                nombre_actividad: row[1],
                objetivos: row[2],
                actividades_principales: row[3],
                descripcion: row[4],
                ubicacion: row[5],
                carrera: row[6],
                ambito: row[7],
                coordinador: row[8],
                estudiante: row[9],
                horas_art140: row[10],
                cupos: row[11],
                cupos_disponibles: row[12],
                fecha: row[13],
                hora_inicio: row[14],
                hora_final: row[15],
                fecha_entrega: row[16],
                estado: row[17],
                observaciones: row[18],
                informe: row[19]
            }));
            res.status(200).json(formattedData);
        } else {
            res.status(500).json({ error: 'Error en la base de datos' });
        }
    } catch (error) {
        console.error('Error al obtener las actividades:', error);
        res.status(500).json({ error: 'Error al obtener las actividades' });
    }
};


// Crear una nueva actividad
export const createActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            nombre_actividad,
            objetivos,
            actividades_principales,
            descripcion,
            ubicacion,
            carrera_id,
            ambito_id,
            coordinador_id,
            estudiante_id,
            horas_art140,
            cupos,
            fecha,
            hora_inicio,
            hora_final,
            observaciones
        } = req.body;

        const timezone = 'America/Tegucigalpa'; // Ajusta la zona horaria según tu ubicación
        const fecha_entrega = moment().tz(timezone).format();
        
        const estado_id = 1;
        const informe = null;
 
        await client.execute({
            sql: `
          INSERT INTO Actividades (
            nombre_actividad, objetivos, actividades_principales, descripcion, 
            ubicacion, carrera_id, ambito_id, coordinador_id, estudiante_id, 
            horas_art140, cupos, cupos_disponibles, fecha, hora_inicio, hora_final, 
            fecha_entrega, estado_id, observaciones, informe
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                nombre_actividad,
                objetivos,
                actividades_principales,
                descripcion,
                ubicacion,
                carrera_id,
                ambito_id,
                coordinador_id,
                estudiante_id,
                horas_art140,
                cupos,
                cupos, 
                fecha,
                hora_inicio,
                hora_final,
                fecha_entrega,
                estado_id,
                observaciones,
                informe
            ]
        });

        res.status(200).json({ message: 'Actividad creada exitosamente' });
    } catch (error) {
        console.error('Error creating actividad:', error);
        res.status(500).json({ error: 'Error al crear la actividad' });
    }
};
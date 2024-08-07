import { Request, Response } from 'express';
import client from '../servicios/db';
import moment from 'moment-timezone';

interface Actividad {
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
        const { estado } = req.query;

        let query = `
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
        `;

        const queryParams: any[] = [];

        // Verificar si hay un filtro de estado
        if (estado) {
            query += ` WHERE A.estado_id = ?`;
            queryParams.push(estado);
        }

        query += ` ORDER BY A.id DESC;`;

        const resultado = await client.execute({ sql: query, args: queryParams });

        if (Array.isArray(resultado.rows)) {
            const formattedData: Actividad[] = resultado.rows.map((row: any) => ({
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
            ambito_id,
            estudiante_id,
            horas_art140,
            cupos,
            fecha,
            hora_inicio,
            hora_final,
            observaciones = ''
        } = req.body;

        const timezone = 'America/Tegucigalpa'; // Ajusta la zona horaria según tu ubicación
        const fecha_entrega = moment().tz(timezone).format();
        
        const estado_id = 1;
        const informe = null; // O define una cadena vacía si es necesario

        // Obtener información del usuario
        const usuarioResult = await client.execute({
            sql: 'SELECT carrera_id FROM Usuarios WHERE id = ?',
            args: [estudiante_id]
        });
        const usuario = usuarioResult.rows[0];

        if (!usuario) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        const { carrera_id } = usuario;

        // Obtener el coordinador de la carrera
        const coordinadorResult = await client.execute({
            sql: 'SELECT id AS coordinador_id FROM Usuarios WHERE carrera_id = ? AND role_id = 2',
            args: [carrera_id]
        });
        const coordinador = coordinadorResult.rows[0];

        if (!coordinador) {
            res.status(404).json({ error: 'Coordinador no encontrado para la carrera especificada' });
            return;
        }

        const { coordinador_id } = coordinador;

        // Insertar la nueva actividad
        await client.execute({
            sql: `
                INSERT INTO Actividades (
                    nombre_actividad, objetivos, actividades_principales, descripcion, ubicacion, 
                    carrera_id, ambito_id, coordinador_id, estudiante_id, 
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
                cupos, // Se utiliza `cupos` como `cupos_disponibles`
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
        console.error('Error al crear la actividad:', error);
        res.status(500).json({ error: 'Error al crear la actividad' });
    }
};

// Actualizar una actividad existente
export const updateActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            nombre_actividad,
            objetivos,
            actividades_principales,
            descripcion,
            ubicacion,
            ambito_id,
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
        const informe = null; // O define una cadena vacía si es necesario

        // Obtener información del usuario
        const usuarioResult = await client.execute({
            sql: 'SELECT carrera_id FROM Usuarios WHERE id = ?',
            args: [estudiante_id]
        });
        const usuario = usuarioResult.rows[0];

        if (!usuario) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }

        const { carrera_id } = usuario;

        // Obtener el coordinador de la carrera
        const coordinadorResult = await client.execute({
            sql: 'SELECT id AS coordinador_id FROM Usuarios WHERE carrera_id = ? AND role_id = 2',
            args: [carrera_id]
        });
        const coordinador = coordinadorResult.rows[0];

        if (!coordinador) {
            res.status(404).json({ error: 'Coordinador no encontrado para la carrera especificada' });
            return;
        }

        const { coordinador_id } = coordinador;

        // Actualizar la actividad existente
        await client.execute({
            sql: `
                UPDATE Actividades
                SET 
                    nombre_actividad = ?, 
                    objetivos = ?, 
                    actividades_principales = ?, 
                    descripcion = ?, 
                    ubicacion = ?, 
                    carrera_id = ?, 
                    ambito_id = ?, 
                    coordinador_id = ?, 
                    estudiante_id = ?, 
                    horas_art140 = ?, 
                    cupos = ?, 
                    cupos_disponibles = ?, 
                    fecha = ?, 
                    hora_inicio = ?, 
                    hora_final = ?, 
                    fecha_entrega = ?, 
                    estado_id = ?, 
                    observaciones = ?, 
                    informe = ?
                WHERE id = ?`,
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
                cupos, // Se utiliza `cupos` como `cupos_disponibles`
                fecha,
                hora_inicio,
                hora_final,
                fecha_entrega,
                estado_id,
                observaciones,
                informe,
                id
            ]
        });

        res.status(200).json({ message: 'Actividad actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar la actividad:', error);
        res.status(500).json({ error: 'Error al actualizar la actividad' });
    }
};

// Actualizar el estado de una actividad
export const updateEstadoActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { estado, observacion } = req.body;

        // Verificar que el estado sea uno de los permitidos
        const validEstados = [1, 2, 3]; // 1: En revisión, 2: Aprobado, 3: Rechazado
        if (!validEstados.includes(estado)) {
            res.status(400).json({ error: 'Estado no válido' });
            return;
        }

        // Si el estado es "Rechazado" (3), la observación es obligatoria
        if (estado === 3 && !observacion) {
            res.status(400).json({ error: 'La observación es obligatoria cuando el estado es Rechazado' });
            return;
        }

        let query = `
            UPDATE Actividades
            SET estado_id = ?`;

        let args = [estado, id];

        if (estado === 3) {
            query += `, observaciones = ?`;
            args = [estado, observacion, id];
        }

        query += ` WHERE id = ?`;

        await client.execute({
            sql: query,
            args: args
        });

        res.status(200).json({ message: 'Estado de la actividad actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar el estado de la actividad:', error);
        res.status(500).json({ error: 'Error al actualizar el estado de la actividad' });
    }
};


export const updateEstadoFinalizado = async (): Promise<void> => {
    try {
        // Consulta para actualizar las actividades cuyo estado debe cambiar a 'Finalizado'
        const query = `
            UPDATE Actividades
            SET estado_id = 4
            WHERE fecha < CURRENT_DATE AND estado_id <> 4
        `;

        await client.execute({
            sql: query,
            args: []
        });

        console.log('Estado de las actividades actualizado a Finalizado');
    } catch (error) {
        console.error('Error al actualizar el estado de las actividades:', error);
    }
};


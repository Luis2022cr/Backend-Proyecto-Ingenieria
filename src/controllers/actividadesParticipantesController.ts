import { Request, Response } from 'express';
import client from '../servicios/db';

export const getParticipantesByActividad = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Consulta para obtener los datos de la actividad y sus participantes
        const query = `
            SELECT 
                A.id AS actividad_id,
                A.nombre_actividad,
                A.fecha,
                U.id AS usuario_id,
                U.nombre AS usuario_nombre,
                U.apellido AS usuario_apellido,
                U.numero_usuario,
                U.correo_institucional,
                C.nombre_carrera AS carrera_nombre
            FROM ActividadesParticipantes AP
            JOIN Usuarios U ON AP.id_usuario = U.id
            JOIN Actividades A ON AP.id_actividad = A.id
            JOIN Carreras C ON U.carrera_id = C.id
            WHERE AP.id_actividad = ?
        `;

        const resultado = await client.execute({
            sql: query,
            args: [id]
        });

        if (resultado.rows.length === 0) {
            res.status(404).json({ error: 'No se encontraron participantes para esta actividad' });
            return;
        }

        // Construir el objeto de la actividad con sus participantes
        const actividad = {
            id: resultado.rows[0].actividad_id,
            nombre_actividad: resultado.rows[0].nombre_actividad,
            fecha: resultado.rows[0].fecha,
            participantes: resultado.rows.map((row: any) => ({
                id: row.usuario_id,
                nombre: row.usuario_nombre,
                apellido: row.usuario_apellido,
                numero_usuario: row.numero_usuario,
                correo_institucional: row.correo_institucional,
                carrera_nombre: row.carrera_nombre
            }))
        };

        res.status(200).json(actividad);
    } catch (error) {
        console.error('Error al obtener los participantes de la actividad:', error);
        res.status(500).json({ error: 'Error al obtener los participantes de la actividad' });
    }
};



// Obtener todas las actividades en las que un usuario específico está participando con todos los datos de la actividad
export const getActividadesByUsuario = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                U.id AS usuario_id,
                U.nombre AS usuario_nombre,
                U.apellido AS usuario_apellido,
                U.correo_institucional AS usuario_correo,
                A.*
            FROM ActividadesParticipantes AP
            JOIN Actividades A ON AP.id_actividad = A.id
            JOIN Usuarios U ON AP.id_usuario = U.id
            WHERE AP.id_usuario = ?
        `;

        const resultado = await client.execute({
            sql: query,
            args: [id]
        });

        if (resultado.rows.length === 0) {
            res.status(404).json({ error: 'No se encontraron actividades para este usuario' });
            return;
        }

        // Construir el objeto de usuario con sus actividades
        const usuario = {
            id: resultado.rows[0].usuario_id,
            nombre: resultado.rows[0].usuario_nombre,
            apellido: resultado.rows[0].usuario_apellido,
            correo_institucional: resultado.rows[0].usuario_correo,
            actividades: resultado.rows.map((row: any) => ({
                id: row.id,
                nombre_actividad: row.nombre_actividad,
                objetivos: row.objetivos,
                actividades_principales: row.actividades_principales,
                descripcion: row.descripcion,
                ubicacion: row.ubicacion,
                carrera_id: row.carrera_id,
                ambito_id: row.ambito_id,
                coordinador_id: row.coordinador_id,
                estudiante_id: row.estudiante_id,
                horas_art140: row.horas_art140,
                cupos: row.cupos,
                cupos_disponibles: row.cupos_disponibles,
                fecha: row.fecha,
                hora_inicio: row.hora_inicio,
                hora_final: row.hora_final,
                fecha_entrega: row.fecha_entrega,
                estado_id: row.estado_id,
                observaciones: row.observaciones,
                informe: row.informe
            }))
        };

        res.status(200).json(usuario);
    } catch (error) {
        console.error('Error al obtener las actividades del usuario:', error);
        res.status(500).json({ error: 'Error al obtener las actividades del usuario' });
    }
};



// Añadir un participante a una actividad
export const addParticipante = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_usuario, id_actividad } = req.body;

        if (!id_usuario || !id_actividad) {
            res.status(400).json({ error: 'id_usuario e id_actividad son requeridos' });
            return;
        }

        // Insertar el participante en la actividad
        const insertQuery = `
            INSERT INTO ActividadesParticipantes (id_usuario, id_actividad) 
            VALUES (?, ?)
        `;

        await client.execute({
            sql: insertQuery,
            args: [id_usuario, id_actividad]
        });

        // Actualizar los cupos disponibles
        const updateCuposQuery = `
            UPDATE Actividades
            SET cupos_disponibles = cupos_disponibles - 1
            WHERE id = ?
        `;

        await client.execute({
            sql: updateCuposQuery,
            args: [id_actividad]
        });

        res.status(200).json({ message: 'Participante agregado exitosamente y cupos actualizados' });
    } catch (error) {
        console.error('Error al agregar el participante:', error);
        res.status(500).json({ error: 'Error al agregar el participante' });
    }
};



// Eliminar la participación de un usuario en una actividad
export const removeParticipante = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id_usuario, id_actividad } = req.body;

        if (!id_usuario || !id_actividad) {
            res.status(400).json({ error: 'id_usuario e id_actividad son requeridos' });
            return;
        }

        // Ejecutar la consulta para eliminar al usuario de la actividad
        const deleteQuery = `
            DELETE FROM ActividadesParticipantes
            WHERE id_usuario = ? AND id_actividad = ?
        `;

        const resultado = await client.execute({
            sql: deleteQuery,
            args: [id_usuario, id_actividad]
        });

        if (resultado.rowsAffected === 0) {
            res.status(404).json({ error: 'Participación no encontrada' });
            return;
        }

        // Actualizar los cupos disponibles
        const updateCuposQuery = `
            UPDATE Actividades
            SET cupos_disponibles = cupos_disponibles + 1
            WHERE id = ?
        `;

        await client.execute({
            sql: updateCuposQuery,
            args: [id_actividad]
        });

        res.status(200).json({ message: 'Participación eliminada exitosamente y cupos actualizados' });
    } catch (error) {
        console.error('Error al eliminar la participación del usuario:', error);
        res.status(500).json({ error: 'Error al eliminar la participación del usuario' });
    }
};

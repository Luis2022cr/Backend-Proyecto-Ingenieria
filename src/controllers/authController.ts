import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import client from '../db';

interface User {
    id: number;
    nombre: string;
    apellido: string;
    correo_institucional: string;
    numero_usuario: number;
    contrasena: string;
    role_id: number;
    carrera_id: number;
}

export const register = async (req: Request, res: Response): Promise<void> => {
    const { nombre, apellido, correo_institucional, numero_usuario, contrasena, carrera_id } = req.body;

    try {
        // Verificar si el correo institucional ya existe
        const checkEmail = await client.execute({
            sql: 'SELECT * FROM Usuarios WHERE correo_institucional = ?',
            args: [correo_institucional]
        });

        if (checkEmail.rows.length > 0) {
            res.status(400).json({ error: 'El correo institucional ya está registrado' });
            return;
        }

        // Verificar si el número de usuario ya existe
        const checkNumeroUsuario = await client.execute({
            sql: 'SELECT * FROM Usuarios WHERE numero_usuario = ?',
            args: [numero_usuario]
        });

        if (checkNumeroUsuario.rows.length > 0) {
            res.status(400).json({ error: 'El número de usuario ya está en uso' });
            return;
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // Establecer el role_id automáticamente
        const role_id = 3;

        // Guardar el usuario en la base de datos
        await client.execute({
            sql: 'INSERT INTO Usuarios (nombre, apellido, correo_institucional, numero_usuario, contrasena, role_id, carrera_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [nombre, apellido, correo_institucional, numero_usuario, hashedPassword, role_id, carrera_id]
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const { numero_usuario, contrasena } = req.body;

    try {
        // Buscar el usuario en la base de datos
        const resultSet = await client.execute({
            sql: 'SELECT * FROM Usuarios WHERE numero_usuario = ?',
            args: [numero_usuario]
        });

        if (Array.isArray(resultSet.rows) && resultSet.rows.length > 0) {
            const row = resultSet.rows[0];
            const user: User = {
                id: row[0] as number,
                nombre: row[1] as string,
                apellido: row[2] as string,
                correo_institucional: row[3] as string,
                numero_usuario: row[4] as number,
                contrasena: row[5] as string,
                role_id: row[6] as number,
                carrera_id: row[7] as number
            };

            // Comparar la contraseña proporcionada con la contraseña almacenada
            const isMatch = await bcrypt.compare(contrasena, user.contrasena);

            if (isMatch) {
                // Crear un token JWT
                const token = jwt.sign(
                    { id: user.id, numero_usuario: user.numero_usuario, role_id: user.role_id },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '5h' }
                );

                // Devolver la respuesta con el token y los datos del usuario
                res.status(200).json({
                    token,
                    id: user.id,
                    numero_usuario: user.numero_usuario,
                    role_id: user.role_id
                });
            } else {
                res.status(401).json({ error: 'Número de usuario o contraseña incorrectos' });
            }
        } else {
            res.status(401).json({ error: 'Número de usuario o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};

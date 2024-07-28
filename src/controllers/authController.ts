import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import client from '../servicios/db';
import nodemailer from 'nodemailer';  // Asegúrate de tener nodemailer instalado

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

const transporter = nodemailer.createTransport({
    service: 'hotmail',  // Cambia 'hotmail' por 'Outlook' si tienes problemas
    auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASSWORD
    }
});

export const register = async (req: Request, res: Response): Promise<void> => {
    const { nombre, apellido, correo_institucional, numero_usuario, contrasena, confirmacionContrasena, carrera_id, role_id } = req.body;

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

        // Verificar si la contraseña y la confirmación coinciden
        if (contrasena !== confirmacionContrasena) {
            res.status(400).json({ error: 'Las contraseñas no coinciden' });
            return;
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

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


export const generarCorreoRecuperacion = async (req: Request, res: Response): Promise<void> => {
    const { correo_institucional } = req.body;

    try {
        const resultSet = await client.execute({
            sql: 'SELECT * FROM Usuarios WHERE correo_institucional = ?',
            args: [correo_institucional] 
        });

        if (Array.isArray(resultSet.rows) && resultSet.rows.length > 0) {
            const user = resultSet.rows[0];
            const token = jwt.sign(
                { id: user[0], correo_institucional: user[3] },
                process.env.JWT_SECRET as string,
                { expiresIn: '1h' }
            );

            const resetLink = `https://proyecto-ingenieria.vercel.app/reset-password?token=${token}`;

            // Enviar el correo electrónico
            await transporter.sendMail({
                from: process.env.OUTLOOK_USER,
                to: correo_institucional,
                subject: 'Recuperación de contraseña',
                html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #0078d4; color: #ffffff; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">Restablecimiento de Contraseña</h1>
                    </div>
                    <div style="padding: 20px; color: #333333;">
                        <p>Hola,</p>
                        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para establecer una nueva contraseña:</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${resetLink}" style="background-color: #0078d4; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a>
                        </div>
                        <p>El Link es valido por 1 hora, si no solicitaste restablecer tu contraseña, por favor ignora este correo electrónico.</p>
                        <p>Gracias,</p>
                        <p>Equipo de soporte</p>
                    </div>
                </div>
            </div>
            `
            });

            res.status(200).json({ message: 'Correo de recuperación enviado' });
        } else {
            res.status(404).json({ error: 'Correo institucional no encontrado' });
        }
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ error: 'Error solicitando la recuperación de contraseña' });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const { token, nuevaContrasena, confirmacionContrasena } = req.body;

    if (nuevaContrasena !== confirmacionContrasena) {
        res.status(400).json({ error: 'Las contraseñas no coinciden' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
        const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

        await client.execute({
            sql: 'UPDATE Usuarios SET contrasena = ? WHERE id = ?',
            args: [hashedPassword, decoded.id]
        });

        res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Error al restablecer la contraseña' });
    }
};

export const cambiarPassword = async (req: Request, res: Response): Promise<void> => {
    const { contrasenaActual, nuevaContrasena, confirmacionContrasena } = req.body;
    const userId = (req as any).user.id; 

    try {
        // Obtener el usuario de la base de datos
        const resultSet = await client.execute({
            sql: 'SELECT * FROM Usuarios WHERE id = ?',
            args: [userId]
        });

        if (Array.isArray(resultSet.rows) && resultSet.rows.length > 0) {
            const row = resultSet.rows[0];
            const user = {
                id: row[0] as number,
                contrasena: row[5] as string
            };

            // Comparar la contraseña actual proporcionada con la contraseña almacenada
            const isMatch = await bcrypt.compare(contrasenaActual, user.contrasena);

            if (!isMatch) {
                res.status(401).json({ error: 'Contraseña actual incorrecta' });
                return;
            }

            // Verificar si la nueva contraseña y la confirmación coinciden
            if (nuevaContrasena !== confirmacionContrasena) {
                res.status(400).json({ error: 'Las contraseñas no coinciden' });
                return;
            }

            // Encriptar la nueva contraseña
            const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

            // Actualizar la contraseña en la base de datos
            await client.execute({
                sql: 'UPDATE Usuarios SET contrasena = ? WHERE id = ?',
                args: [hashedPassword, user.id]
            });

            res.status(200).json({ message: 'Contraseña cambiada exitosamente' });
        } else {
            res.status(401).json({ error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
};
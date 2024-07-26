// Interface para Roles
export interface Role {
    id: number;
    nombre: string;
    descripcion?: string;
}

// Interface para Ámbitos de Actividad
export interface AmbitoActividad {
    id: number;
    nombre: string;
    descripcion?: string;
}

// Interface para Estados
export interface Estado {
    id: number;
    nombre: string;
    descripcion?: string;
}

// Interface para Usuarios
export interface Usuario {
    id: number;
    nombre: string;
    apellido: string;
    correo_institucional: string;
    numero_usuario?: number;
    contrasena: string;
    role_id?: number;
    carrera_id?: number;
}

// Interface para Carreras
export interface Carrera {
    id: number;
    nombre_carrera: string;
    descripcion?: string;
    facultad?: string;
}

// Interface para Actividades
export interface Actividad {
    id: number;
    nombre_actividad: string;
    objetivos?: string;
    actividades_principales?: string;
    ubicacion?: string;
    carrera_id?: number;
    ambito_id?: number;
    coordinador_id?: number;
    estudiante_id?: number;
    horas_art140?: number;
    cupos?: number;
    cupos_disponibles?: number;
    fecha_inicio?: Date;
    fecha_final?: Date;
    fecha_entrega?: Date;
    estado_id?: number;
    observaciones?: string;
    informe?: string;
}

// Interface para Actividades Participantes
export interface ActividadParticipante {
    id: number;
    id_usuario: number;
    id_actividad: number;
}

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoEditorial" AS ENUM ('BORRADOR', 'PENDIENTE_APROBACION', 'RECHAZADO', 'APROBADO', 'PUBLICADO', 'ARCHIVADO', 'PROGRAMADO');

-- CreateEnum
CREATE TYPE "TipoPublicacionAcademica" AS ENUM ('CURSO', 'JORNADA', 'CONGRESO', 'PROYECTO_INVESTIGACION', 'CONVOCATORIA');

-- CreateEnum
CREATE TYPE "TipoContacto" AS ENUM ('TELEFONO', 'EMAIL', 'RED_SOCIAL', 'OTRO');

-- CreateTable
CREATE TABLE "archivo" (
    "id" BIGSERIAL NOT NULL,
    "nombreOriginal" VARCHAR(255) NOT NULL,
    "nombreArchivo" VARCHAR(255) NOT NULL,
    "ruta" VARCHAR(500) NOT NULL,
    "extension" VARCHAR(10) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "tamanioBytes" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "ubicacion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" BIGSERIAL NOT NULL,
    "usuarioId" UUID NOT NULL,
    "accion" VARCHAR(50) NOT NULL,
    "entidad" VARCHAR(100) NOT NULL,
    "entidadId" VARCHAR(100),
    "descripcion" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_documento" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria_noticia" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" BIGSERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacto_institucional" (
    "id" BIGSERIAL NOT NULL,
    "institucionId" BIGINT NOT NULL,
    "redSocial" VARCHAR(50) NOT NULL,
    "enlace" VARCHAR(255) NOT NULL,

    CONSTRAINT "contacto_institucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "categoriaId" BIGINT NOT NULL,
    "archivoId" BIGINT NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "estado" "EstadoEditorial" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidad" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "horarios" TEXT,
    "requisitos" TEXT,
    "ubicacion" TEXT,
    "documentacionNecesaria" TEXT,
    "informacionDerivacion" TEXT,
    "estado" "EstadoEditorial" NOT NULL DEFAULT 'PUBLICADO',

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informacion_institucional" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "direccion" VARCHAR(255) NOT NULL,
    "localidad" VARCHAR(100) NOT NULL,
    "provincia" VARCHAR(100) NOT NULL,
    "codigoPostal" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "informacion_institucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticia" (
    "id" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "contenido" TEXT NOT NULL,
    "categoriaId" BIGINT NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "estado" "EstadoEditorial" NOT NULL,
    "fechaPublicacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noticia_archivo" (
    "noticiaId" BIGINT NOT NULL,
    "archivoId" BIGINT NOT NULL,

    CONSTRAINT "noticia_archivo_pkey" PRIMARY KEY ("noticiaId","archivoId")
);

-- CreateTable
CREATE TABLE "profesional" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "matricula" VARCHAR(50),
    "cargo" VARCHAR(100),
    "especialidadId" BIGINT NOT NULL,
    "archivoId" BIGINT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoEditorial" NOT NULL DEFAULT 'PENDIENTE_APROBACION',

    CONSTRAINT "profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profesional_area" (
    "profesionalId" BIGINT NOT NULL,
    "areaId" BIGINT NOT NULL,

    CONSTRAINT "profesional_area_pkey" PRIMARY KEY ("profesionalId","areaId")
);

-- CreateTable
CREATE TABLE "publicacion_academica" (
    "id" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoPublicacionAcademica" NOT NULL,
    "fechaEvento" TIMESTAMP(3),
    "estado" "EstadoEditorial" NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publicacion_academica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicacion_archivo" (
    "publicacionId" BIGINT NOT NULL,
    "archivoId" BIGINT NOT NULL,

    CONSTRAINT "publicacion_archivo_pkey" PRIMARY KEY ("publicacionId","archivoId")
);

-- CreateTable
CREATE TABLE "rol" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "requisitos" TEXT,
    "documentacionNecesaria" TEXT,
    "horarios" TEXT,
    "informacionDerivacion" TEXT,
    "ubicacion" TEXT,
    "estado" "EstadoEditorial" NOT NULL DEFAULT 'PUBLICADO',

    CONSTRAINT "servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "keycloakId" UUID NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "rolId" BIGINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicio_area" (
    "servicioId" BIGINT NOT NULL,
    "areaId" BIGINT NOT NULL,

    CONSTRAINT "servicio_area_pkey" PRIMARY KEY ("servicioId","areaId")
);

-- CreateTable
CREATE TABLE "capacitacion" (
    "id" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "contenido" TEXT,
    "imagenId" BIGINT,
    "videoUrl" TEXT,
    "enlaceUrl" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoEditorial" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contenido_grafico" (
    "id" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "altText" TEXT,
    "archivoId" BIGINT,
    "enlaceUrl" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipoId" BIGINT NOT NULL,
    "ubicacionId" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoEditorial" NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "pagina" VARCHAR(100) NOT NULL,

    CONSTRAINT "contenido_grafico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residencia" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "contenido" TEXT,
    "imagenId" BIGINT,
    "convocatoria" TEXT,
    "fechaConvocatoria" TIMESTAMP(3),
    "estado" "EstadoEditorial" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "residencia_historial" (
    "id" BIGSERIAL NOT NULL,
    "residenciaId" BIGINT NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "imagenId" BIGINT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "residencia_historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_contenido_grafico" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipo_contenido_grafico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicacion_contenido_grafico" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ubicacion_contenido_grafico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autoridad" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "cargo" VARCHAR(150) NOT NULL,
    "imagenId" BIGINT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "autoridad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "area_nombre_key" ON "area"("nombre");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidadId_idx" ON "auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "auditoria_usuarioId_idx" ON "auditoria"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_documento_nombre_key" ON "categoria_documento"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_noticia_nombre_key" ON "categoria_noticia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- CreateIndex
CREATE INDEX "contacto_institucional_institucionId_idx" ON "contacto_institucional"("institucionId");

-- CreateIndex
CREATE UNIQUE INDEX "contacto_institucional_institucionId_redSocial_key" ON "contacto_institucional"("institucionId", "redSocial");

-- CreateIndex
CREATE INDEX "documento_archivoId_idx" ON "documento"("archivoId");

-- CreateIndex
CREATE INDEX "documento_categoriaId_idx" ON "documento"("categoriaId");

-- CreateIndex
CREATE INDEX "documento_createdBy_idx" ON "documento"("createdBy");

-- CreateIndex
CREATE INDEX "documento_estado_idx" ON "documento"("estado");

-- CreateIndex
CREATE INDEX "documento_updatedBy_idx" ON "documento"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- CreateIndex
CREATE INDEX "noticia_categoriaId_idx" ON "noticia"("categoriaId");

-- CreateIndex
CREATE INDEX "noticia_createdBy_idx" ON "noticia"("createdBy");

-- CreateIndex
CREATE INDEX "noticia_estado_idx" ON "noticia"("estado");

-- CreateIndex
CREATE INDEX "noticia_updatedBy_idx" ON "noticia"("updatedBy");

-- CreateIndex
CREATE INDEX "profesional_archivoId_idx" ON "profesional"("archivoId");

-- CreateIndex
CREATE INDEX "profesional_especialidadId_idx" ON "profesional"("especialidadId");

-- CreateIndex
CREATE INDEX "profesional_estado_idx" ON "profesional"("estado");

-- CreateIndex
CREATE INDEX "publicacion_academica_createdBy_idx" ON "publicacion_academica"("createdBy");

-- CreateIndex
CREATE INDEX "publicacion_academica_estado_idx" ON "publicacion_academica"("estado");

-- CreateIndex
CREATE INDEX "publicacion_academica_updatedBy_idx" ON "publicacion_academica"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_keycloakId_key" ON "usuario"("keycloakId");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_username_key" ON "usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "usuario_rolId_idx" ON "usuario"("rolId");

-- CreateIndex
CREATE INDEX "servicio_area_areaId_idx" ON "servicio_area"("areaId");

-- CreateIndex
CREATE INDEX "capacitacion_activo_idx" ON "capacitacion"("activo");

-- CreateIndex
CREATE INDEX "capacitacion_estado_idx" ON "capacitacion"("estado");

-- CreateIndex
CREATE INDEX "capacitacion_imagenId_idx" ON "capacitacion"("imagenId");

-- CreateIndex
CREATE INDEX "contenido_grafico_activo_idx" ON "contenido_grafico"("activo");

-- CreateIndex
CREATE INDEX "contenido_grafico_archivoId_idx" ON "contenido_grafico"("archivoId");

-- CreateIndex
CREATE INDEX "contenido_grafico_estado_idx" ON "contenido_grafico"("estado");

-- CreateIndex
CREATE INDEX "contenido_grafico_pagina_idx" ON "contenido_grafico"("pagina");

-- CreateIndex
CREATE INDEX "contenido_grafico_pagina_ubicacionId_orden_idx" ON "contenido_grafico"("pagina", "ubicacionId", "orden");

-- CreateIndex
CREATE INDEX "contenido_grafico_tipoId_idx" ON "contenido_grafico"("tipoId");

-- CreateIndex
CREATE INDEX "contenido_grafico_ubicacionId_idx" ON "contenido_grafico"("ubicacionId");

-- CreateIndex
CREATE INDEX "residencia_activo_idx" ON "residencia"("activo");

-- CreateIndex
CREATE INDEX "residencia_estado_idx" ON "residencia"("estado");

-- CreateIndex
CREATE INDEX "residencia_imagenId_idx" ON "residencia"("imagenId");

-- CreateIndex
CREATE INDEX "residencia_historial_activo_idx" ON "residencia_historial"("activo");

-- CreateIndex
CREATE INDEX "residencia_historial_imagenId_idx" ON "residencia_historial"("imagenId");

-- CreateIndex
CREATE INDEX "residencia_historial_residenciaId_idx" ON "residencia_historial"("residenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_contenido_grafico_nombre_key" ON "tipo_contenido_grafico"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ubicacion_contenido_grafico_nombre_key" ON "ubicacion_contenido_grafico"("nombre");

-- CreateIndex
CREATE INDEX "autoridad_activo_orden_idx" ON "autoridad"("activo", "orden");

-- CreateIndex
CREATE INDEX "autoridad_imagenId_idx" ON "autoridad"("imagenId");

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacto_institucional" ADD CONSTRAINT "contacto_institucional_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "informacion_institucional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_noticia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia_archivo" ADD CONSTRAINT "noticia_archivo_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia_archivo" ADD CONSTRAINT "noticia_archivo_noticiaId_fkey" FOREIGN KEY ("noticiaId") REFERENCES "noticia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "especialidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_area" ADD CONSTRAINT "profesional_area_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_area" ADD CONSTRAINT "profesional_area_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_academica" ADD CONSTRAINT "publicacion_academica_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_academica" ADD CONSTRAINT "publicacion_academica_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_archivo" ADD CONSTRAINT "publicacion_archivo_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_archivo" ADD CONSTRAINT "publicacion_archivo_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "publicacion_academica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_area" ADD CONSTRAINT "servicio_area_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio_area" ADD CONSTRAINT "servicio_area_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacitacion" ADD CONSTRAINT "capacitacion_imagenId_fkey" FOREIGN KEY ("imagenId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contenido_grafico" ADD CONSTRAINT "contenido_grafico_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contenido_grafico" ADD CONSTRAINT "contenido_grafico_tipoId_fkey" FOREIGN KEY ("tipoId") REFERENCES "tipo_contenido_grafico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contenido_grafico" ADD CONSTRAINT "contenido_grafico_ubicacionId_fkey" FOREIGN KEY ("ubicacionId") REFERENCES "ubicacion_contenido_grafico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencia" ADD CONSTRAINT "residencia_imagenId_fkey" FOREIGN KEY ("imagenId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencia_historial" ADD CONSTRAINT "residencia_historial_imagenId_fkey" FOREIGN KEY ("imagenId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencia_historial" ADD CONSTRAINT "residencia_historial_residenciaId_fkey" FOREIGN KEY ("residenciaId") REFERENCES "residencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autoridad" ADD CONSTRAINT "autoridad_imagenId_fkey" FOREIGN KEY ("imagenId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;


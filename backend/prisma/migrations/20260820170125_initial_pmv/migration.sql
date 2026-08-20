-- CreateEnum
CREATE TYPE "EstadoEditorial" AS ENUM ('BORRADOR', 'PUBLICADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoContacto" AS ENUM ('TELEFONO', 'EMAIL', 'RED_SOCIAL', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoPublicacionAcademica" AS ENUM ('CURSO', 'JORNADA', 'CONGRESO', 'PROYECTO_INVESTIGACION', 'CONVOCATORIA');

-- CreateTable
CREATE TABLE "rol" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "banner" (
    "id" BIGSERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "enlace" VARCHAR(500),
    "archivoId" BIGINT NOT NULL,
    "createdBy" UUID NOT NULL,
    "updatedBy" UUID,
    "orden" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banner_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "categoria_documento" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_documento_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "contacto_institucional" (
    "id" BIGSERIAL NOT NULL,
    "institucionId" BIGINT NOT NULL,
    "tipo" "TipoContacto" NOT NULL,
    "valor" VARCHAR(255) NOT NULL,
    "descripcion" VARCHAR(255),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacto_institucional_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "servicio" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "requisitos" TEXT,
    "documentacionNecesaria" TEXT,
    "horarios" TEXT,
    "informacionDerivacion" TEXT,
    "ubicacion" TEXT,
    "areaId" BIGINT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidad" (
    "id" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "especialidad_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "configuracion" (
    "id" BIGSERIAL NOT NULL,
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "auditoria_usuarioId_idx" ON "auditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidadId_idx" ON "auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "banner_archivoId_idx" ON "banner"("archivoId");

-- CreateIndex
CREATE INDEX "banner_createdBy_idx" ON "banner"("createdBy");

-- CreateIndex
CREATE INDEX "banner_updatedBy_idx" ON "banner"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_noticia_nombre_key" ON "categoria_noticia"("nombre");

-- CreateIndex
CREATE INDEX "noticia_categoriaId_idx" ON "noticia"("categoriaId");

-- CreateIndex
CREATE INDEX "noticia_createdBy_idx" ON "noticia"("createdBy");

-- CreateIndex
CREATE INDEX "noticia_updatedBy_idx" ON "noticia"("updatedBy");

-- CreateIndex
CREATE INDEX "noticia_estado_idx" ON "noticia"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_documento_nombre_key" ON "categoria_documento"("nombre");

-- CreateIndex
CREATE INDEX "documento_categoriaId_idx" ON "documento"("categoriaId");

-- CreateIndex
CREATE INDEX "documento_archivoId_idx" ON "documento"("archivoId");

-- CreateIndex
CREATE INDEX "documento_createdBy_idx" ON "documento"("createdBy");

-- CreateIndex
CREATE INDEX "documento_updatedBy_idx" ON "documento"("updatedBy");

-- CreateIndex
CREATE INDEX "documento_estado_idx" ON "documento"("estado");

-- CreateIndex
CREATE INDEX "contacto_institucional_institucionId_idx" ON "contacto_institucional"("institucionId");

-- CreateIndex
CREATE UNIQUE INDEX "area_nombre_key" ON "area"("nombre");

-- CreateIndex
CREATE INDEX "servicio_areaId_idx" ON "servicio"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "especialidad_nombre_key" ON "especialidad"("nombre");

-- CreateIndex
CREATE INDEX "profesional_especialidadId_idx" ON "profesional"("especialidadId");

-- CreateIndex
CREATE INDEX "profesional_archivoId_idx" ON "profesional"("archivoId");

-- CreateIndex
CREATE INDEX "publicacion_academica_createdBy_idx" ON "publicacion_academica"("createdBy");

-- CreateIndex
CREATE INDEX "publicacion_academica_updatedBy_idx" ON "publicacion_academica"("updatedBy");

-- CreateIndex
CREATE INDEX "publicacion_academica_estado_idx" ON "publicacion_academica"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_noticia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia" ADD CONSTRAINT "noticia_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia_archivo" ADD CONSTRAINT "noticia_archivo_noticiaId_fkey" FOREIGN KEY ("noticiaId") REFERENCES "noticia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "noticia_archivo" ADD CONSTRAINT "noticia_archivo_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categoria_documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacto_institucional" ADD CONSTRAINT "contacto_institucional_institucionId_fkey" FOREIGN KEY ("institucionId") REFERENCES "informacion_institucional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_especialidadId_fkey" FOREIGN KEY ("especialidadId") REFERENCES "especialidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_area" ADD CONSTRAINT "profesional_area_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional_area" ADD CONSTRAINT "profesional_area_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_academica" ADD CONSTRAINT "publicacion_academica_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_academica" ADD CONSTRAINT "publicacion_academica_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_archivo" ADD CONSTRAINT "publicacion_archivo_publicacionId_fkey" FOREIGN KEY ("publicacionId") REFERENCES "publicacion_academica"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicacion_archivo" ADD CONSTRAINT "publicacion_archivo_archivoId_fkey" FOREIGN KEY ("archivoId") REFERENCES "archivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

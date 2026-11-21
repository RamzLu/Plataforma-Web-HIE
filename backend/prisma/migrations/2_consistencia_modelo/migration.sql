-- DropForeignKey
ALTER TABLE "publicacion_academica" DROP CONSTRAINT "publicacion_academica_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "publicacion_academica" DROP CONSTRAINT "publicacion_academica_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "publicacion_archivo" DROP CONSTRAINT "publicacion_archivo_archivoId_fkey";

-- DropForeignKey
ALTER TABLE "publicacion_archivo" DROP CONSTRAINT "publicacion_archivo_publicacionId_fkey";

-- DropForeignKey
ALTER TABLE "servicio_area" DROP CONSTRAINT "servicio_area_areaId_fkey";

-- DropForeignKey
ALTER TABLE "servicio_area" DROP CONSTRAINT "servicio_area_servicioId_fkey";

-- AlterTable
ALTER TABLE "documento" ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "especialidad" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "updatedBy" UUID,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "noticia" ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "profesional" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "updatedBy" UUID,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "servicio" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "updatedBy" UUID,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "capacitacion" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "updatedBy" UUID,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- AlterTable
ALTER TABLE "residencia" ADD COLUMN     "createdBy" UUID,
ADD COLUMN     "updatedBy" UUID,
ALTER COLUMN "estado" SET DEFAULT 'BORRADOR';

-- DropTable
DROP TABLE "publicacion_academica";

-- DropTable
DROP TABLE "publicacion_archivo";

-- DropTable
DROP TABLE "servicio_area";

-- DropEnum
DROP TYPE "TipoPublicacionAcademica";

-- DropEnum
DROP TYPE "TipoContacto";

-- CreateIndex
CREATE INDEX "especialidad_createdBy_idx" ON "especialidad"("createdBy");

-- CreateIndex
CREATE INDEX "especialidad_updatedBy_idx" ON "especialidad"("updatedBy");

-- CreateIndex
CREATE INDEX "profesional_createdBy_idx" ON "profesional"("createdBy");

-- CreateIndex
CREATE INDEX "profesional_updatedBy_idx" ON "profesional"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "servicio_nombre_key" ON "servicio"("nombre");

-- CreateIndex
CREATE INDEX "servicio_createdBy_idx" ON "servicio"("createdBy");

-- CreateIndex
CREATE INDEX "servicio_updatedBy_idx" ON "servicio"("updatedBy");

-- CreateIndex
CREATE INDEX "capacitacion_createdBy_idx" ON "capacitacion"("createdBy");

-- CreateIndex
CREATE INDEX "capacitacion_updatedBy_idx" ON "capacitacion"("updatedBy");

-- CreateIndex
CREATE INDEX "residencia_createdBy_idx" ON "residencia"("createdBy");

-- CreateIndex
CREATE INDEX "residencia_updatedBy_idx" ON "residencia"("updatedBy");

-- AddForeignKey
ALTER TABLE "especialidad" ADD CONSTRAINT "especialidad_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "especialidad" ADD CONSTRAINT "especialidad_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profesional" ADD CONSTRAINT "profesional_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicio" ADD CONSTRAINT "servicio_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacitacion" ADD CONSTRAINT "capacitacion_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacitacion" ADD CONSTRAINT "capacitacion_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencia" ADD CONSTRAINT "residencia_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "residencia" ADD CONSTRAINT "residencia_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;


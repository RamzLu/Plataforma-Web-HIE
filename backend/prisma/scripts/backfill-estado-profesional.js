// Completa la nueva columna profesional.estado a partir de cómo se guardaba antes el estado:
//   - pendiente  -> existe la clave "profesional_pending_meta_<id>" en la tabla configuracion
//   - rechazado  -> existe la clave "profesional_rejection_<id>"
//   - publicado  -> activo = true
//   - archivado  -> todo lo demás
//
// Uso (desde la carpeta backend, DESPUÉS de agregar la columna con "npm run db-push"):
//   node --env-file=.env prisma/scripts/backfill-estado-profesional.js            -> solo muestra qué haría
//   node --env-file=.env prisma/scripts/backfill-estado-profesional.js --aplicar  -> guarda los cambios
import { prisma } from "../../src/config/prisma.js";

const aplicar = process.argv.includes("--aplicar");

const claves = await prisma.configuracion.findMany({
  where: {
    OR: [
      { clave: { startsWith: "profesional_pending_meta_" } },
      { clave: { startsWith: "profesional_rejection_" } },
    ],
  },
  select: { clave: true },
});
const pendientes = new Set();
const rechazados = new Set();
for (const { clave } of claves) {
  if (clave.startsWith("profesional_pending_meta_")) pendientes.add(clave.replace("profesional_pending_meta_", ""));
  else rechazados.add(clave.replace("profesional_rejection_", ""));
}

const profesionales = await prisma.profesional.findMany({
  select: { id: true, nombre: true, apellido: true, activo: true, estado: true },
  orderBy: { id: "asc" },
});

const resumen = {};
const cambios = [];
for (const p of profesionales) {
  const id = p.id.toString();
  const nuevo = pendientes.has(id)
    ? "PENDIENTE_APROBACION"
    : rechazados.has(id)
    ? "RECHAZADO"
    : p.activo
    ? "PUBLICADO"
    : "ARCHIVADO";
  resumen[nuevo] = (resumen[nuevo] || 0) + 1;
  if (p.estado !== nuevo) cambios.push({ id: p.id, nombre: `${p.nombre} ${p.apellido}`, antes: p.estado, despues: nuevo });
}

console.log(`Profesionales: ${profesionales.length}. Estados resultantes:`, resumen);
for (const c of cambios) console.log(`  #${c.id} ${c.nombre}: ${c.antes} -> ${c.despues}`);

if (!aplicar) {
  console.log(`\n${cambios.length} cambio(s) por aplicar. No se guardó nada: volvé a correrlo con --aplicar.`);
} else {
  await prisma.$transaction(
    cambios.map((c) => prisma.profesional.update({ where: { id: c.id }, data: { estado: c.despues } }))
  );
  console.log(`\nListo: ${cambios.length} profesional(es) actualizado(s).`);
}

await prisma.$disconnect();
process.exit(0);

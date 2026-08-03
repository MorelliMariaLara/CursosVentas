import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@academia.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  const name = process.env.ADMIN_NAME || "Administrador";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role: "ADMIN" },
    create: {
      email,
      passwordHash,
      name,
      role: "ADMIN",
    },
  });

  const demoCourse = await prisma.course.upsert({
    where: { slug: "introduccion-a-la-seguridad-laboral" },
    update: {},
    create: {
      slug: "introduccion-a-la-seguridad-laboral",
      title: "Introducción a la Seguridad Laboral",
      shortDescription:
        "Fundamentos esenciales para prevenir riesgos y obtener tu certificación.",
      description:
        "Este curso te introduce a los conceptos clave de seguridad e higiene en el trabajo. Al finalizar los módulos en video y aprobar la evaluación, recibirás un certificado digital verificable.",
      price: 14990,
      currency: "ARS",
      published: true,
      passingScore: 70,
      modules: {
        create: [
          {
            title: "Módulo 1 — Conceptos básicos",
            sortOrder: 1,
            lessons: {
              create: [
                {
                  title: "¿Qué es la seguridad laboral?",
                  description: "Definiciones y marco normativo introductorio.",
                  sortOrder: 1,
                  durationSec: 600,
                },
                {
                  title: "Identificación de riesgos",
                  description: "Cómo detectar peligros en el entorno de trabajo.",
                  sortOrder: 2,
                  durationSec: 720,
                },
              ],
            },
          },
          {
            title: "Módulo 2 — Prevención práctica",
            sortOrder: 2,
            lessons: {
              create: [
                {
                  title: "Equipos de protección personal",
                  description: "Uso correcto del EPP.",
                  sortOrder: 1,
                  durationSec: 540,
                },
                {
                  title: "Protocolos de emergencia",
                  description: "Qué hacer ante un incidente.",
                  sortOrder: 2,
                  durationSec: 660,
                },
              ],
            },
          },
        ],
      },
      exam: {
        create: {
          title: "Evaluación final — Seguridad Laboral",
          description:
            "Respondé correctamente al menos el 70% de las preguntas para obtener tu certificado.",
          questions: {
            create: [
              {
                prompt: "¿Cuál es el objetivo principal de la seguridad laboral?",
                sortOrder: 1,
                optionsJson: JSON.stringify([
                  "Aumentar la productividad a cualquier costo",
                  "Prevenir accidentes y enfermedades laborales",
                  "Reducir el personal de planta",
                  "Eliminar todas las normas internas",
                ]),
                correctOption: 1,
              },
              {
                prompt: "El EPP se utiliza para:",
                sortOrder: 2,
                optionsJson: JSON.stringify([
                  "Decorar el uniforme",
                  "Reemplazar la capacitación",
                  "Proteger al trabajador frente a riesgos residuales",
                  "Evitar controles de calidad",
                ]),
                correctOption: 2,
              },
              {
                prompt: "Ante un incidente, lo primero es:",
                sortOrder: 3,
                optionsJson: JSON.stringify([
                  "Publicarlo en redes",
                  "Asegurar la zona y asistir según el protocolo",
                  "Culpar a un compañero",
                  "Continuar trabajando normalmente",
                ]),
                correctOption: 1,
              },
              {
                prompt: "Un riesgo laboral es:",
                sortOrder: 4,
                optionsJson: JSON.stringify([
                  "Cualquier oportunidad de ascenso",
                  "La posibilidad de que ocurra un daño en el trabajo",
                  "Una tarea administrativa",
                  "Un beneficio social",
                ]),
                correctOption: 1,
              },
              {
                prompt: "La capacitación en seguridad debe ser:",
                sortOrder: 5,
                optionsJson: JSON.stringify([
                  "Opcional y solo para nuevos ingresos",
                  "Continua, clara y documentada",
                  "Solo teórica sin práctica",
                  "Exclusiva para jefes",
                ]),
                correctOption: 1,
              },
            ],
          },
        },
      },
    },
  });

  console.log("Seed OK");
  console.log(`Admin: ${admin.email} / ${password}`);
  console.log(`Curso demo: ${demoCourse.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

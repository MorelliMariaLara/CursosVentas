import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { createHash, randomBytes } from "crypto";
import fsPromises from "fs/promises";

export function getUploadRoot() {
  const configured = process.env.UPLOAD_DIR;
  if (configured) return path.resolve(configured);
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
}

export async function ensureUploadDirs() {
  const root = getUploadRoot();
  await fsPromises.mkdir(path.join(root, "videos"), { recursive: true });
  await fsPromises.mkdir(path.join(root, "thumbnails"), { recursive: true });
  await fsPromises.mkdir(path.join(root, "certificates"), { recursive: true });
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function generateCertificateCode() {
  const raw = randomBytes(8).toString("hex").toUpperCase();
  return `CERT-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

export function hashCode(input: string) {
  return createHash("sha256").update(input).digest("hex").slice(0, 12);
}

export async function generateCertificatePdf(params: {
  code: string;
  studentName: string;
  courseTitle: string;
  score: number;
  issuedAt: Date;
  appName: string;
}): Promise<string> {
  await ensureUploadDirs();
  const filename = `${params.code}.pdf`;
  const filePath = path.join(getUploadRoot(), "certificates", filename);

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0f2d2a");
    doc
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(2)
      .strokeColor("#c4a35a")
      .stroke();

    doc.fillColor("#c4a35a").fontSize(14).text(params.appName.toUpperCase(), {
      align: "center",
    });

    doc.moveDown(1.2);
    doc
      .fillColor("#f4f0e6")
      .fontSize(36)
      .text("Certificado de Finalización", { align: "center" });

    doc.moveDown(0.8);
    doc
      .fillColor("#b8c5c2")
      .fontSize(14)
      .text("Se certifica que", { align: "center" });

    doc.moveDown(0.4);
    doc
      .fillColor("#ffffff")
      .fontSize(28)
      .text(params.studentName, { align: "center" });

    doc.moveDown(0.6);
    doc
      .fillColor("#b8c5c2")
      .fontSize(14)
      .text("completó satisfactoriamente el curso", { align: "center" });

    doc.moveDown(0.4);
    doc
      .fillColor("#c4a35a")
      .fontSize(22)
      .text(params.courseTitle, { align: "center" });

    doc.moveDown(0.8);
    doc
      .fillColor("#b8c5c2")
      .fontSize(13)
      .text(
        `Calificación: ${params.score}%  ·  Emitido: ${params.issuedAt.toLocaleDateString("es-AR")}  ·  Código: ${params.code}`,
        { align: "center" },
      );

    doc.moveDown(1.5);
    doc
      .fillColor("#7a8f8a")
      .fontSize(10)
      .text(
        "Documento válido para verificación en la plataforma. Verificá el código en /verificar",
        { align: "center" },
      );

    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return path.join("certificates", filename);
}

export function formatPrice(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

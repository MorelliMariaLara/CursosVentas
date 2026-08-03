import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoPayment } from "@/lib/mercadopago";

async function activateFromExternalRef(
  externalReference: string,
  mpPaymentId: string,
  raw: unknown,
) {
  const payment = await prisma.payment.findUnique({
    where: { mpExternalReference: externalReference },
  });
  if (!payment) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "APPROVED",
      mpPaymentId: String(mpPaymentId),
      rawPayload: JSON.stringify(raw),
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: payment.userId,
        courseId: payment.courseId,
      },
    },
    update: {
      status: "ACTIVE",
      purchasedAt: new Date(),
    },
    create: {
      userId: payment.userId,
      courseId: payment.courseId,
      status: "ACTIVE",
      purchasedAt: new Date(),
    },
  });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic =
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      undefined;
    const id =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      undefined;

    let paymentId = id;
    try {
      const body = await request.json();
      if (body?.data?.id) paymentId = String(body.data.id);
      if (body?.type) {
        // payment notification
      }
      if (!topic && body?.type) {
        // keep going
      }
    } catch {
      // body vacío o form-urlencoded — usamos query params
    }

    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const mpPayment = await getMercadoPagoPayment(paymentId);
    const status = mpPayment.status;
    const externalReference = mpPayment.external_reference;

    if (status === "approved" && externalReference) {
      await activateFromExternalRef(
        externalReference,
        String(mpPayment.id),
        mpPayment,
      );
    } else if (externalReference && status) {
      const mapped =
        status === "rejected"
          ? "REJECTED"
          : status === "cancelled"
            ? "CANCELLED"
            : status === "refunded"
              ? "REFUNDED"
              : "PENDING";
      await prisma.payment.updateMany({
        where: { mpExternalReference: externalReference },
        data: {
          status: mapped,
          mpPaymentId: String(mpPayment.id),
          rawPayload: JSON.stringify(mpPayment),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook MP error", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Mercado Pago a veces valida el endpoint con GET
  return POST(request);
}

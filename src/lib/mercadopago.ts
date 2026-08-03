import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

function getClient() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "MP_ACCESS_TOKEN no configurado. Agregá tu Access Token de Mercado Pago en .env",
    );
  }
  return new MercadoPagoConfig({ accessToken: token });
}

export function isMercadoPagoConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

export async function createCheckoutPreference(params: {
  courseId: string;
  courseTitle: string;
  price: number;
  currency: string;
  userId: string;
  userEmail: string;
  externalReference: string;
}) {
  const client = getClient();
  const preference = new Preference(client);
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.courseId,
          title: params.courseTitle,
          quantity: 1,
          unit_price: params.price,
          currency_id: params.currency || "ARS",
        },
      ],
      payer: {
        email: params.userEmail,
      },
      external_reference: params.externalReference,
      back_urls: {
        success: `${appUrl}/checkout/resultado?status=success`,
        failure: `${appUrl}/checkout/resultado?status=failure`,
        pending: `${appUrl}/checkout/resultado?status=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      metadata: {
        courseId: params.courseId,
        userId: params.userId,
      },
    },
  });

  return result;
}

export async function getMercadoPagoPayment(paymentId: string) {
  const client = getClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

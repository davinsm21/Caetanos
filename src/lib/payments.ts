export type CheckoutInput = {
  bookingId: string;
  amount: number;
  description: string;
  payer: { name: string; email: string };
};

export type CheckoutResult = { checkoutUrl: string; paymentId: string };

export interface PaymentProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}

export class MercadoPagoProvider implements PaymentProvider {
  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) throw new Error("Mercado Pago não está configurado.");
    const { Preference, MercadoPagoConfig } = await import("mercadopago");
    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const result = await preference.create({
      body: {
        items: [{ id: input.bookingId, title: input.description, quantity: 1, unit_price: input.amount, currency_id: "BRL" }],
        payer: input.payer,
        external_reference: input.bookingId,
        notification_url: `${siteUrl}/api/payments/webhook`,
        back_urls: {
          success: `${siteUrl}/reserva/confirmada`,
          failure: `${siteUrl}/reserva/pendente`,
          pending: `${siteUrl}/reserva/pendente`
        },
        auto_return: "approved",
        payment_methods: { installments: 12 }
      }
    });
    if (!result.init_point || !result.id) throw new Error("O Mercado Pago não retornou um checkout válido.");
    return { checkoutUrl: result.init_point, paymentId: String(result.id) };
  }
}

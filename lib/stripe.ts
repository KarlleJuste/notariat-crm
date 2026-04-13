import Stripe from "stripe";

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
  return new Stripe(key, { typescript: true });
}

export type SubscriptionMrrRow = {
  subscriptionId: string;
  customerId: string;
  customerEmail: string | null;
  amountMonthly: number;
  status: string;
  interval: Stripe.Price.Recurring.Interval | null;
};

/** MRR mensuel à partir d'un prix Stripe (annuel / 12) */
export function priceToMonthlyMrr(
  unitAmount: number | null | undefined,
  interval: Stripe.Price.Recurring.Interval | null | undefined
): number {
  if (unitAmount == null) return 0;
  const euros = unitAmount / 100;
  if (interval === "year") return euros / 12;
  return euros;
}

export async function listActiveSubscriptionsMrr(): Promise<
  SubscriptionMrrRow[]
> {
  const stripe = getStripe();
  const rows: SubscriptionMrrRow[] = [];
  let startingAfter: string | undefined;

  for (;;) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.customer", "data.items.data.price"],
    });

    for (const sub of page.data) {
      const customer =
        typeof sub.customer === "string"
          ? await stripe.customers.retrieve(sub.customer)
          : sub.customer;
      if (customer.deleted) continue;
      const email =
        typeof customer.email === "string" ? customer.email : null;
      const item = sub.items.data[0];
      const price = item?.price;
      const interval = price?.recurring?.interval ?? null;
      const amount = priceToMonthlyMrr(price?.unit_amount ?? null, interval);
      rows.push({
        subscriptionId: sub.id,
        customerId: customer.id,
        customerEmail: email,
        amountMonthly: amount,
        status: sub.status,
        interval,
      });
    }

    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  return rows;
}

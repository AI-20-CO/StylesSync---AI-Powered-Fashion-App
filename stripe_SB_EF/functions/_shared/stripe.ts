// @deno-types="npm:@types/stripe"
import Stripe from 'https://esm.sh/stripe@12.18.0'

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
}) 
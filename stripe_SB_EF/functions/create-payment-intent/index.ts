import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { stripe } from '../_shared/stripe'
import { corsHeaders } from '../_shared/cors'

interface RequestBody {
  amount: number
  currency: string
  productId: number
  userId: string
  paymentMethod: string
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, productId, userId, paymentMethod } = await req.json() as RequestBody

    // Validate inputs
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    if (!currency) {
      throw new Error('Currency is required')
    }

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Convert amount to cents and ensure it's an integer
    const amountInCents = Math.round(amount * 100)
    
    console.log(`Creating payment intent for user ${userId}, amount: ${amountInCents} ${currency}`)

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata: {
        productId: productId?.toString() || '',
        userId,
        paymentMethod
      },
      payment_method_types: ['card', 'grabpay'],
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'always'
      },
    })

    console.log(`Payment intent created successfully: ${paymentIntent.id}`)

    // Send publishable key and PaymentIntent details to client
    return new Response(
      JSON.stringify({
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error: unknown) {
    console.error('Error creating payment intent:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorResponse = {
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
}) 
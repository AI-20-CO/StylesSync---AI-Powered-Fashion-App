import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { stripe } from '../_shared/stripe'
import { corsHeaders } from '../_shared/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('No signature found in request')
    }

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object
        const { metadata } = paymentIntent

        // Get payment method details
        const paymentMethod = paymentIntent.payment_method_types?.[0] || 'card'

        // Update payment status in database
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            payment_status: 'completed',
            paid_at: new Date().toISOString(),
            stripe_payment_id: paymentIntent.id,
            payment_method: paymentMethod // Store the actual payment method used
          })
          .eq('user_id', metadata.userId)
          .eq('payment_status', 'pending')

        if (paymentError) {
          console.error('Error updating payment:', paymentError)
        }

        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            order_status: 'processing',
            payment_status: 'paid',
            payment_method: paymentMethod // Update order with payment method
          })
          .eq('user_id', metadata.userId)
          .eq('payment_status', 'pending')

        if (orderError) {
          console.error('Error updating order:', orderError)
        }
        break
      }

      case 'payment_intent.requires_action': {
        // Handle GrabPay redirect
        const paymentIntent = event.data.object
        const { metadata } = paymentIntent

        // Update payment status to indicate redirect needed
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            payment_status: 'pending_action',
            stripe_payment_id: paymentIntent.id,
            payment_method: 'grabpay'
          })
          .eq('user_id', metadata.userId)
          .eq('payment_status', 'pending')

        if (paymentError) {
          console.error('Error updating payment status for redirect:', paymentError)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object
        const { metadata } = paymentIntent

        // Get payment method details
        const paymentMethod = paymentIntent.payment_method_types?.[0] || 'card'

        // Update payment status
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            payment_status: 'failed',
            stripe_payment_id: paymentIntent.id,
            payment_method: paymentMethod
          })
          .eq('user_id', metadata.userId)
          .eq('payment_status', 'pending')

        if (paymentError) {
          console.error('Error updating payment:', paymentError)
        }

        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            order_status: 'cancelled',
            payment_status: 'failed',
            payment_method: paymentMethod
          })
          .eq('user_id', metadata.userId)
          .eq('payment_status', 'pending')

        if (orderError) {
          console.error('Error updating order:', orderError)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        const paymentIntentId = charge.payment_intent

        // Get the payment intent to access metadata
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        const { metadata } = paymentIntent

        // Update payment status
        const { error: paymentError } = await supabase
          .from('payments')
          .update({ 
            payment_status: 'refunded',
            refunded_at: new Date().toISOString()
          })
          .eq('stripe_payment_id', paymentIntentId)

        if (paymentError) {
          console.error('Error updating payment:', paymentError)
        }

        // Update order status
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            order_status: 'refunded',
            payment_status: 'refunded'
          })
          .eq('user_id', metadata.userId)
          .eq('payment_status', 'paid')

        if (orderError) {
          console.error('Error updating order:', orderError)
        }
        break
      }

      // Add more event types as needed
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    })
  } catch (error: unknown) {
    console.error('Error processing webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
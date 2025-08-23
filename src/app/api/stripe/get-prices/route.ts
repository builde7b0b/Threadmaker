import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Fetching available Stripe prices...')
    
    // Get all active prices
    const { data: prices, error } = await stripe.prices.list({
      active: true,
      limit: 20,
      expand: ['data.product']
    })

    if (error) {
      console.error('❌ Error fetching prices:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prices' },
        { status: 500 }
      )
    }

    // Format the prices for the frontend
    const formattedPrices = prices.map(price => ({
      id: price.id,
      nickname: price.nickname,
      unit_amount: price.unit_amount,
      currency: price.currency,
      recurring: price.recurring,
      product: {
        id: (price.product as Stripe.Product).id,
        name: (price.product as Stripe.Product).name,
        description: (price.product as Stripe.Product).description
      }
    }))

    console.log('✅ Found prices:', formattedPrices.length)
    
    return NextResponse.json({
      success: true,
      prices: formattedPrices
    })

  } catch (error) {
    console.error('❌ Error in get-prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}

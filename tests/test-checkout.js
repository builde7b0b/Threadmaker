// Test script to debug checkout session creation
// Run this with: node test-checkout.js

const userId = '85003093-81a2-4294-80a3-db969b976102';

async function testCheckoutSession() {
  try {
    console.log('🔄 Testing checkout session creation...');
    
    const response = await fetch('http://localhost:3000/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: process.env.STRIPE_PRICE_ID || 'price_monthly_subscription',
        userId,
        successUrl: 'http://localhost:3000/subscription/success',
        cancelUrl: 'http://localhost:3000/subscription/canceled'
      }),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📊 Response body:', result);
    
    if (response.ok) {
      console.log('✅ Checkout session created successfully:', result);
    } else {
      console.error('❌ Error creating checkout session:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Check environment variables
console.log('🔍 Environment check:');
console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Set' : '❌ Missing');
console.log('- STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID || '❌ Missing (using default)');

// Run the test
testCheckoutSession();

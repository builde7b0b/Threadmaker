// Test script to verify the upgrade flow
// Run this with: node test-upgrade-flow.js

const userId = '85003093-81a2-4294-80a3-db969b976102';

async function testUpgradeFlow() {
  try {
    console.log('🔄 Testing upgrade flow...');
    
    // Step 1: Get available prices
    console.log('📋 Step 1: Getting available prices...');
    const pricesResponse = await fetch('http://localhost:3000/api/stripe/get-prices');
    const pricesData = await pricesResponse.json();
    
    if (pricesResponse.ok) {
      console.log('✅ Available prices:', pricesData.prices.length);
      pricesData.prices.forEach(price => {
        console.log(`  - ${price.product.name}: $${(price.unit_amount / 100).toFixed(2)}/${price.recurring.interval}`);
      });
    } else {
      console.error('❌ Failed to get prices:', pricesData);
      return;
    }
    
    // Step 2: Create checkout session
    console.log('💳 Step 2: Creating checkout session...');
    const checkoutResponse = await fetch('http://localhost:3000/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: 'price_1RzFgsLmmUf9wA40mXTe0b1D', // Threadmaker Premium
        userId,
        successUrl: 'http://localhost:3000/subscription/success',
        cancelUrl: 'http://localhost:3000/subscription/canceled'
      }),
    });

    const checkoutData = await checkoutResponse.json();
    
    if (checkoutResponse.ok) {
      console.log('✅ Checkout session created successfully!');
      console.log('📋 Session ID:', checkoutData.sessionId);
      console.log('🔗 Checkout URL:', checkoutData.url);
      console.log('\n🎉 Upgrade flow is working! Users can now upgrade to premium.');
    } else {
      console.error('❌ Failed to create checkout session:', checkoutData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUpgradeFlow();

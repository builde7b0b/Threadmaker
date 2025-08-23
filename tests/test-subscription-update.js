// Test script to test subscription update
// Run this with: node test-subscription-update.js

const userId = '85003093-81a2-4294-80a3-db969b976102';

async function testSubscriptionUpdate() {
  try {
    console.log('🔄 Testing subscription update...');
    
    // Test the simple subscription update API
    const response = await fetch('http://localhost:3000/api/stripe/update-subscription-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        status: 'active',
        subscriptionId: 'sub_test_123'
      }),
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('📊 Response body:', result);
    
    if (response.ok) {
      console.log('✅ Subscription updated successfully:', result);
    } else {
      console.error('❌ Error updating subscription:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function testProfileCreation() {
  try {
    console.log('🔄 Testing profile creation...');
    
    const response = await fetch('http://localhost:3000/api/create-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile creation result:', result);
    } else {
      console.error('❌ Error creating profile:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the tests
console.log('🔍 Testing subscription update for user:', userId);
testSubscriptionUpdate().then(() => {
  setTimeout(() => {
    console.log('🔄 Testing profile creation...');
    testProfileCreation();
  }, 1000);
});

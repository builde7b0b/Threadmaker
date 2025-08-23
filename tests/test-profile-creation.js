// Test script to create a profile for the existing user
// Run this with: node test-profile-creation.js

const userId = '85003093-81a2-4294-80a3-db969b976102';

async function createProfile() {
  try {
    const response = await fetch('http://localhost:3000/api/create-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile created successfully:', result);
    } else {
      console.error('❌ Error creating profile:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Test the subscription update after profile creation
async function testSubscriptionUpdate() {
  try {
    const response = await fetch('http://localhost:3000/api/stripe/update-subscription', {
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

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Subscription updated successfully:', result);
    } else {
      console.error('❌ Error updating subscription:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the tests
console.log('🔄 Creating profile for user:', userId);
createProfile().then(() => {
  setTimeout(() => {
    console.log('🔄 Testing subscription update...');
    testSubscriptionUpdate();
  }, 1000);
});

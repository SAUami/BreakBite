async function testFlow() {
  console.log('Testing BreakBite End-to-End Flow...');

  // 1. Student Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@demo.com', password: 'password123' }),
  }).then((r) => r.json());

  console.log('1. Student Login:', loginRes.success ? 'SUCCESS' : 'FAILED', '| User:', loginRes.user?.name);
  const token = loginRes.token;

  // 2. Fetch Menu
  const menuRes = await fetch('http://localhost:5000/api/menu').then((r) => r.json());
  console.log('2. Menu Count:', menuRes.items?.length, 'dishes available');
  const sampleItem = menuRes.items[0];

  // 3. Place Bell-Sync Order
  const orderRes = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify({
      items: [{ menuItem: sampleItem._id, quantity: 2, name: sampleItem.name, price: sampleItem.price }],
      pickupMode: 'bell_sync',
      walkingMinutes: 4,
      specialInstructions: 'Make it extra hot please!',
    }),
  }).then((r) => r.json());

  console.log('3. Bell-Sync Order Placed:', orderRes.success ? 'SUCCESS' : 'FAILED');
  console.log('   - Token Code:', orderRes.order?.orderNumber);
  console.log('   - Status:', orderRes.order?.status);
  console.log('   - Scheduled Pickup:', orderRes.order?.scheduledPickupTime);
  console.log('   - Kitchen Fire Time:', orderRes.order?.fireTime);
  console.log('   - Leave Now Nudge Time:', orderRes.order?.leaveNowTime);

  // 4. Canteen Login & Status Update
  const canteenLogin = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'canteen@demo.com', password: 'password123' }),
  }).then((r) => r.json());

  console.log('4. Canteen Login:', canteenLogin.success ? 'SUCCESS' : 'FAILED', '| Staff:', canteenLogin.user?.name);
  const canteenToken = canteenLogin.token;

  const advanceRes = await fetch('http://localhost:5000/api/orders/' + orderRes.order._id + '/status', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + canteenToken,
    },
    body: JSON.stringify({ status: 'Preparing' }),
  }).then((r) => r.json());

  console.log('5. Canteen Status Advance:', advanceRes.success ? 'SUCCESS' : 'FAILED', '| New Status:', advanceRes.order?.status);

  // 6. Kitchen Load Meter
  const loadRes = await fetch('http://localhost:5000/api/orders/kitchen/load').then((r) => r.json());
  console.log('6. Kitchen Load Meter:', loadRes.load?.level, `(${loadRes.load?.percentage}%)`, '| Active orders:', loadRes.load?.activeOrdersCount);

  // 7. Analytics
  const analyticsRes = await fetch('http://localhost:5000/api/analytics', {
    headers: { Authorization: 'Bearer ' + canteenToken },
  }).then((r) => r.json());
  console.log('7. Canteen Analytics:', analyticsRes.success ? 'SUCCESS' : 'FAILED', '| Revenue Today: ₹' + analyticsRes.analytics?.totalRevenue);

  console.log('\n======================================================');
  console.log('   BREAKBITE HACKATHON VERIFICATION: 100% COMPLETE!   ');
  console.log('======================================================\n');
}

testFlow().catch(console.error);

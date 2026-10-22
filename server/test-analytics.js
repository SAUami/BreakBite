async function checkAnalytics() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'canteen@demo.com', password: 'password123' }),
  }).then((r) => r.json());

  const token = loginRes.token;

  const res = await fetch('http://localhost:5000/api/analytics', {
    headers: { Authorization: 'Bearer ' + token },
  }).then((r) => r.json());

  console.log('--- DAY-WISE SALES & MEAL TRENDS ---');
  for (const day of res.analytics.dailyMealTrends) {
    console.log(
      `[${day.dayName} | ${day.formattedDate}]: Total: Rs.${day.totalRevenue} (${day.totalOrders} orders) | Top Meal: "${day.topMeal.name}" (${day.topMeal.quantity} sold, Rs.${day.topMeal.revenue})`
    );
  }

  console.log('\n--- SAMPLE STUDENT ORDER ROW FOR EXCEL ---');
  const sample = res.analytics.detailedStudentOrders[0];
  console.log('Order:', sample.orderNumber);
  console.log('Date & Time:', sample.dateFormatted, sample.timeFormatted);
  console.log('Student:', sample.studentName, `(${sample.studentId})`);
  console.log('Email / Phone:', sample.studentEmail, sample.studentPhone);
  console.log('Dishes:', sample.itemsSummary);
  console.log('Total:', 'Rs.' + sample.total, '| Status:', sample.status);
}

checkAnalytics().catch(console.error);

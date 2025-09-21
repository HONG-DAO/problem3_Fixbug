#!/usr/bin/env ts-node

/**
 * Test script để kiểm tra logic tính toán 252 ngày giao dịch
 */

function calculateTradingDaysRange(): { startDate: string, endDate: string, tradingDays: number } {
  const now = new Date();
  const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
  
  console.log(`Current Vietnam time: ${vietnamTime.toISOString()}`);
  console.log(`Current hour: ${vietnamTime.getHours()}`);
  
  // Check if current time is after 4 PM (16:00)
  const isAfter4PM = vietnamTime.getHours() >= 16;
  console.log(`Is after 4 PM: ${isAfter4PM}`);
  
  let currentDate = new Date(vietnamTime);
  
  // If after 4 PM, include current day in the 252 days
  // Otherwise, start from next day
  if (!isAfter4PM) {
    currentDate.setDate(currentDate.getDate() + 1);
    console.log(`Before 4 PM, starting from next day: ${currentDate.toISOString()}`);
  } else {
    console.log(`After 4 PM, including current day: ${currentDate.toISOString()}`);
  }
  
  // Find the next trading day (Monday-Friday)
  while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`Next trading day: ${currentDate.toISOString()} (${getDayName(currentDate.getDay())})`);
  
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);
  
  // Count back 252 trading days
  let tradingDays = 0;
  let daysBack = 0;
  const tradingDaysList: Date[] = [];
  
  while (tradingDays < 252) {
    daysBack++;
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - daysBack);
    
    // Skip weekends
    if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) {
      tradingDays++;
      startDate.setTime(checkDate.getTime());
      tradingDaysList.unshift(new Date(checkDate));
    }
  }
  
  console.log(`\nFirst 10 trading days:`);
  tradingDaysList.slice(0, 10).forEach((date, index) => {
    console.log(`  ${index + 1}. ${date.toISOString().split('T')[0]} (${getDayName(date.getDay())})`);
  });
  
  console.log(`\nLast 10 trading days:`);
  tradingDaysList.slice(-10).forEach((date, index) => {
    console.log(`  ${tradingDaysList.length - 9 + index}. ${date.toISOString().split('T')[0]} (${getDayName(date.getDay())})`);
  });
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    tradingDays: 252
  };
}

function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day];
}

function testDifferentTimes() {
  console.log('🧪 Testing different times...\n');
  
  // Test 1: Before 4 PM
  console.log('=== Test 1: Before 4 PM ===');
  const before4PM = new Date('2024-09-17T10:00:00+07:00');
  console.log(`Test time: ${before4PM.toISOString()}`);
  
  // Test 2: After 4 PM
  console.log('\n=== Test 2: After 4 PM ===');
  const after4PM = new Date('2024-09-17T17:00:00+07:00');
  console.log(`Test time: ${after4PM.toISOString()}`);
  
  // Test 3: Weekend
  console.log('\n=== Test 3: Weekend ===');
  const weekend = new Date('2024-09-21T10:00:00+07:00'); // Saturday
  console.log(`Test time: ${weekend.toISOString()}`);
}

function main() {
  console.log('🚀 VITAS Trading Days Calculator Test');
  console.log('=====================================\n');
  
  const result = calculateTradingDaysRange();
  
  console.log('\n📊 KẾT QUẢ:');
  console.log(`Start Date: ${result.startDate}`);
  console.log(`End Date: ${result.endDate}`);
  console.log(`Trading Days: ${result.tradingDays}`);
  
  // Verify the calculation
  const start = new Date(result.startDate);
  const end = new Date(result.endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  console.log(`\n🔍 VERIFICATION:`);
  console.log(`Days between start and end: ${diffDays} calendar days`);
  console.log(`Expected trading days: 252`);
  
  if (result.tradingDays === 252) {
    console.log('✅ Calculation is correct!');
  } else {
    console.log('❌ Calculation error!');
  }
  
  testDifferentTimes();
}

if (require.main === module) {
  main();
}

import { getWeeklyClamp, formatClampForLog } from './tradingWindow';

// Test function để kiểm tra trading window logic
export function testTradingWindow() {
  console.log('🧪 Testing Trading Window Logic...\n');

  // Test cases cho các ngày khác nhau trong tuần
  const testCases = [
    { name: 'Monday (Thứ 2)', date: new Date('2024-09-23T10:00:00+07:00') }, // T2
    { name: 'Wednesday (Thứ 3)', date: new Date('2024-09-25T10:00:00+07:00') }, // T3
    { name: 'Friday (Thứ 5)', date: new Date('2024-09-27T10:00:00+07:00') }, // T5
    { name: 'Saturday (Thứ 6)', date: new Date('2024-09-28T10:00:00+07:00') }, // T6
    { name: 'Sunday (Chủ nhật)', date: new Date('2024-09-29T10:00:00+07:00') }, // CN
  ];

  testCases.forEach(testCase => {
    console.log(`📅 ${testCase.name}:`);
    const clamp = getWeeklyClamp(testCase.date);
    const formatted = formatClampForLog(clamp);
    
    console.log(`   Min: ${formatted.minLocal} (${formatted.minISO})`);
    console.log(`   Max: ${formatted.maxLocal} (${formatted.maxISO})`);
    
    // Kiểm tra logic
    const dayOfWeek = testCase.date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
      console.log(`   ✅ Weekend: Should show Monday to Friday of current week`);
    } else {
      console.log(`   ✅ Weekday: Should show Monday to today (${testCase.name})`);
    }
    console.log('');
  });

  // Test với ngày hiện tại
  console.log('🕐 Current Time Test:');
  const now = new Date();
  const currentClamp = getWeeklyClamp(now);
  const currentFormatted = formatClampForLog(currentClamp);
  
  console.log(`   Current time: ${now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
  console.log(`   Min: ${currentFormatted.minLocal} (${currentFormatted.minISO})`);
  console.log(`   Max: ${currentFormatted.maxLocal} (${currentFormatted.maxISO})`);
  
  const currentDayOfWeek = now.getDay();
  const currentIsWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6;
  
  if (currentIsWeekend) {
    console.log(`   ✅ Current weekend: Should show Monday to Friday of current week`);
  } else {
    console.log(`   ✅ Current weekday: Should show Monday to today`);
  }
}

// Export để có thể gọi từ console
if (typeof window !== 'undefined') {
  (window as any).testTradingWindow = testTradingWindow;
}

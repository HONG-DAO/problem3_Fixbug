import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { NotificationService } from '../src/modules/notifications/services/notification.service.js';
import { UserWatchlistService } from '../src/modules/market-analysis/services/user-watchlist.service.js';

async function testMarketAnalysis() {
  console.log('🚀 Starting market analysis test...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const notificationService = app.get(NotificationService);
    const userWatchlistService = app.get(UserWatchlistService);
    
    // Test tickers
    const testTickers = ['VCB', 'VIC', 'FPT', 'HPG', 'VNM', 'ACB', 'BID', 'CTG', 'HDB', 'MBB'];
    
    console.log(`📊 Testing with ${testTickers.length} tickers: ${testTickers.join(', ')}`);
    
    // Add some test users to watchlist
    console.log('👥 Setting up test users...');
    await userWatchlistService.addToWatchlist('user1', 'VCB', ['telegram', 'dashboard']);
    await userWatchlistService.addToWatchlist('user1', 'VIC', ['telegram', 'dashboard']);
    await userWatchlistService.addToWatchlist('user2', 'FPT', ['telegram', 'email']);
    await userWatchlistService.addToWatchlist('user2', 'HPG', ['dashboard']);
    
    console.log('✅ Test users added to watchlist');
    
    // Test market analysis and notifications
    console.log('🔍 Running market analysis...');
    const result = await notificationService.sendMarketAnalysisAndSignals(testTickers);
    
    console.log('📈 Market Analysis Results:');
    console.log(`  Scenario: ${result.marketOverview.scenario.name}`);
    console.log(`  Alert Level: ${result.marketOverview.scenario.alertLevel}`);
    console.log(`  Total Tickers: ${result.marketOverview.metrics.totalTickers}`);
    console.log(`  Buy Signals: ${result.marketOverview.metrics.buySignals}`);
    console.log(`  Sell Signals: ${result.marketOverview.metrics.sellSignals}`);
    console.log(`  Risk Warnings: ${result.marketOverview.metrics.riskWarnings}`);
    console.log(`  Average RSI: ${result.marketOverview.metrics.averageRSI.toFixed(2)}`);
    console.log(`  Volume Increase: ${result.marketOverview.metrics.volumeIncreasePercent.toFixed(2)}%`);
    
    console.log('\n📱 Notification Results:');
    result.notificationResults.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.channel.toUpperCase()}:`);
      console.log(`     Success: ${notification.success}`);
      console.log(`     Recipients: ${notification.recipients}`);
      console.log(`     Message: ${notification.message}`);
      if (notification.error) {
        console.log(`     Error: ${notification.error}`);
      }
    });
    
    console.log('\n🎯 Ticker Categories:');
    console.log(`  Buy: ${result.marketOverview.tickers.buy.join(', ')}`);
    console.log(`  Sell: ${result.marketOverview.tickers.sell.join(', ')}`);
    console.log(`  Risk: ${result.marketOverview.tickers.risk.join(', ')}`);
    console.log(`  High Volume: ${result.marketOverview.tickers.highVolume.join(', ')}`);
    console.log(`  RSI Extreme: ${result.marketOverview.tickers.rsiExtreme.join(', ')}`);
    
    console.log('\n✅ Market analysis test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testMarketAnalysis().catch(console.error);


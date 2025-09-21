import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { Logger } from '@nestjs/common';
import { DataFetchService } from '../src/modules/market-data/services/data-fetch.service.js';
import { MarketDataService } from '../src/infrastructure/database/market-data.service.js';
import { FiinQuantDataService } from '../src/infrastructure/external-services/fiinquant-data.service.js';

async function run() {
  const logger = new Logger('FetchRangeScript');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log','error','warn'] });

  try {
    // Simple arg parsing: --batchSize=90 --delayMs=2000 --startBatch=1 --endBatch=9999
    const argv = process.argv.slice(2);
    const getArg = (key: string, def?: string) => {
      const match = argv.find(a => a.startsWith(`--${key}=`));
      return match ? match.split('=')[1] : def;
    };
    const batchSize = parseInt(getArg('batchSize', '50')!, 10);
    const delayMs = parseInt(getArg('delayMs', '2000')!, 10);
    const startBatch = parseInt(getArg('startBatch', '1')!, 10);
    const endBatch = parseInt(getArg('endBatch', '9999')!, 10);

    const dataFetchService = app.get(DataFetchService);
    const marketDataService = app.get(MarketDataService);
    const fiinQuantService = app.get(FiinQuantDataService);

    const fromDate = '2024-09-15';
    const toDate = '2025-09-15';
    const timeframes = ['4h'];

    // Load tickers from CSV via service
    const tickers = await fiinQuantService.getAllTickers();
    logger.log(`Loaded ${tickers.length} tickers from CSV`);

    // Chunk helper
    const chunks: string[][] = [];
    for (let i = 0; i < tickers.length; i += batchSize) {
      chunks.push(tickers.slice(i, i + batchSize));
    }
    logger.log(`Prepared ${chunks.length} batches (size <= ${batchSize})`);

    for (const timeframe of timeframes) {
      logger.log(`Fetching timeframe ${timeframe} from ${fromDate} to ${toDate} in batches...`);
      let totalInserted = 0;
      for (let idx = 0; idx < chunks.length; idx++) {
        const batchNumber = idx + 1;
        if (batchNumber < startBatch || batchNumber > endBatch) continue;

        const batchTickers = chunks[idx];
        logger.log(`Batch ${batchNumber}/${chunks.length} (${batchTickers.length} tickers)`);
        try {
          const result = await dataFetchService.fetchAndSaveHistoricalData(
            batchTickers,
            timeframe,
            90,
            fromDate,
            toDate
          );
          totalInserted += result.totalDataPoints;
          logger.log(`Batch ${batchNumber} done: ${result.successfulTickers}/${result.totalTickers} tickers, +${result.totalDataPoints} points`);
        } catch (e: any) {
          logger.error(`Batch ${batchNumber} failed: ${e?.message || e}`);
        }

        if (idx < chunks.length - 1 && delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
      logger.log(`Finished ${timeframe}: total inserted ${totalInserted}`);
    }

    // Count documents in collections within range
    const countForTimeframe = async (timeframe: string) => {
      const result = await marketDataService.findMany(
        {
          startDate: fromDate,
          endDate: toDate,
          limit: 1,
          offset: 0,
        },
        timeframe
      );
      return result.total;
    };

    const total4h = await countForTimeframe('4h');
    const total1d = await countForTimeframe('1d');

    logger.log(`Total documents fetched in stock-ss4h: ${total4h}`);
    logger.log(`Total documents fetched in stock-ss1d: ${total1d}`);

    // Print a concise JSON summary to stdout
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({
      success: true,
      fromDate,
      toDate,
      tickers: tickers.length,
      totals: {
        'stock-ss4h': total4h,
        'stock-ss1d': total1d,
      },
    }));
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ success: false, message: error?.message || String(error) }));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

run();



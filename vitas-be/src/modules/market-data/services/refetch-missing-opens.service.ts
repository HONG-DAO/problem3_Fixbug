import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RefetchMissingOpensDto, RefetchResultDto, RefetchSummaryDto } from '../dto/refetch-missing-opens.dto';
import { FiinQuantDataService } from '../../../infrastructure/external-services/fiinquant-data.service';
import { MarketDataService } from '../../../infrastructure/database/market-data.service';

@Injectable()
export class RefetchMissingOpensService {
  private readonly logger = new Logger(RefetchMissingOpensService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    private readonly fiinQuantService: FiinQuantDataService,
    private readonly marketDataService: MarketDataService,
  ) {}

  /**
   * Refetch missing opens for specified collections
   */
  async refetchMissingOpens(dto: RefetchMissingOpensDto): Promise<RefetchSummaryDto> {
    const startTime = Date.now();
    this.logger.log(`Starting refetch missing opens process...`);

    const summary: RefetchSummaryDto = {
      totalScanned: 0,
      totalRefetch: 0,
      totalFixed: 0,
      totalSkipped: 0,
      totalErrors: 0,
      results: [],
      processingTimeMs: 0
    };

    try {
      // Process each collection
      const collections = dto.collections || ['stock-ss1m', 'stock-ss15m', 'stock-ss1h', 'stock-ss4h', 'stock-ss1d'];
      for (const collectionName of collections) {
        this.logger.log(`Processing collection: ${collectionName}`);
        
        const result = await this.processCollection(collectionName, dto);
        summary.results.push(result);
        
        summary.totalScanned += result.scanned;
        summary.totalRefetch += result.refetch;
        summary.totalFixed += result.fixed;
        summary.totalSkipped += result.skipped;
        summary.totalErrors += result.errors;

        this.logger.log(`Collection ${collectionName} completed: scanned=${result.scanned}, refetch=${result.refetch}, fixed=${result.fixed}, skipped=${result.skipped}, errors=${result.errors}`);
      }

      summary.processingTimeMs = Date.now() - startTime;
      
      this.logger.log(`Refetch process completed in ${summary.processingTimeMs}ms`);
      this.logger.log(`Total: scanned=${summary.totalScanned}, refetch=${summary.totalRefetch}, fixed=${summary.totalFixed}, skipped=${summary.totalSkipped}, errors=${summary.totalErrors}`);

      return summary;

    } catch (error) {
      this.logger.error('Failed to refetch missing opens:', error);
      summary.processingTimeMs = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Process a single collection
   */
  private async processCollection(collectionName: string, dto: RefetchMissingOpensDto): Promise<RefetchResultDto> {
    const result: RefetchResultDto = {
      collection: collectionName,
      scanned: 0,
      refetch: 0,
      fixed: 0,
      skipped: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      // Detect timeframe from collection name
      const timeframe = this.extractTimeframeFromCollection(collectionName);
      if (!timeframe) {
        result.errorDetails.push(`Cannot extract timeframe from collection name: ${collectionName}`);
        result.errors++;
        return result;
      }

      // Find candidates with open = 0 using direct MongoDB query
      // MarketDataService doesn't support filtering by open = 0
      if (!this.connection.db) {
        throw new Error('Database connection not available');
      }
      
      const collection = this.connection.db.collection(collectionName);
      const filter = this.buildFilter(dto.fromDate, dto.toDate);
      
      const candidates = await collection.find(filter).limit(dto.limit || 1000).toArray();
      result.scanned = candidates.length;

      this.logger.log(`Found ${candidates.length} candidates in ${collectionName}`);

      if (candidates.length === 0) {
        return result;
      }

      // Process candidates with concurrency limit
      const concurrency = dto.concurrency || 5;
      const batches = this.chunkArray(candidates, concurrency);

      for (const batch of batches) {
        const promises = batch.map(doc => this.processDocument(collection, doc, timeframe, collectionName, dto.dryRun || false));
        const batchResults = await Promise.allSettled(promises);

        batchResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled') {
            const docResult = promiseResult.value;
            result.refetch += docResult.refetch ? 1 : 0;
            result.fixed += docResult.fixed ? 1 : 0;
            result.skipped += docResult.skipped ? 1 : 0;
            if (docResult.error) {
              result.errors++;
              result.errorDetails.push(docResult.error);
            }
          } else {
            result.errors++;
            result.errorDetails.push(`Promise rejected: ${promiseResult.reason}`);
          }
        });
      }

    } catch (error) {
      this.logger.error(`Failed to process collection ${collectionName}:`, error);
      result.errors++;
      result.errorDetails.push(`Collection processing error: ${error.message}`);
    }

    return result;
  }

  /**
   * Process a single document
   */
  private async processDocument(collection: any, doc: any, timeframe: string, collectionName: string, dryRun: boolean): Promise<{
    refetch: boolean;
    fixed: boolean;
    skipped: boolean;
    error?: string;
  }> {
    try {
      const ticker = doc.ticker;
      const timestamp = doc.timestamp;

      if (!ticker || !timestamp) {
        return { refetch: false, fixed: false, skipped: true, error: 'Missing ticker or timestamp' };
      }

      // Convert timestamp to milliseconds if needed
      const timeMs = this.normalizeTimestamp(timestamp);
      if (!timeMs) {
        return { refetch: false, fixed: false, skipped: true, error: 'Invalid timestamp format' };
      }

      this.logger.debug(`Refetching: ${ticker}@${new Date(timeMs).toISOString()} (${timeframe})`);

      // Call FiinQuant service to refetch data
      const refetchResult = await this.refetchFromFiinQuant(ticker, timeframe, timeMs);
      
      if (!refetchResult.success) {
        return { refetch: true, fixed: false, skipped: false, error: refetchResult.error };
      }

      if (refetchResult.data.open <= 0) {
        return { refetch: true, fixed: false, skipped: true, error: 'Open still <= 0 after refetch' };
      }

      if (!dryRun) {
        // Update document using MarketDataService
        const timeframe = this.extractTimeframeFromCollection(collectionName);
        if (!timeframe) {
          return { refetch: true, fixed: false, skipped: false, error: 'Cannot extract timeframe' };
        }

        try {
          // Use MarketDataService to update the document
          const updateData = {
            open: refetchResult.data.open,
            high: refetchResult.data.high,
            low: refetchResult.data.low,
            close: refetchResult.data.close,
            volume: refetchResult.data.volume,
            updatedAt: new Date()
          };

          // Note: MarketDataService doesn't have a direct update method for specific documents
          // We'll need to use the connection directly for this specific update
          if (!this.connection.db) {
            return { refetch: true, fixed: false, skipped: false, error: 'Database connection not available' };
          }

          const collection = this.connection.db.collection(collectionName);
          const updateResult = await collection.updateOne(
            { _id: doc._id },
            { $set: updateData }
          );

          if (updateResult.matchedCount === 0) {
            return { refetch: true, fixed: false, skipped: false, error: 'Document not found for update' };
          }
        } catch (updateError) {
          return { refetch: true, fixed: false, skipped: false, error: `Update failed: ${updateError.message}` };
        }
      }

      this.logger.debug(`Fixed: ${ticker}@${timeMs} - open: ${refetchResult.data.open}`);
      return { refetch: true, fixed: true, skipped: false };

    } catch (error) {
      this.logger.error(`Error processing document:`, error);
      return { refetch: false, fixed: false, skipped: false, error: error.message };
    }
  }

  /**
   * Refetch data using FiinQuantDataService
   */
  private async refetchFromFiinQuant(ticker: string, timeframe: string, timeMs: number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Calculate time range (±2h for 1m, ±1 day for others)
      const intervalMs = timeframe === '1m' ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const startMs = timeMs - intervalMs;
      const endMs = timeMs + intervalMs;

      const startDate = new Date(startMs).toISOString().split('T')[0];
      const endDate = new Date(endMs).toISOString().split('T')[0];

      this.logger.debug(`Refetching data for ${ticker} (${timeframe}) from ${startDate} to ${endDate}`);

      // Use FiinQuantDataService to fetch data
      const marketData = await this.fiinQuantService.fetchHistoricalData(
        [ticker],
        timeframe,
        100, // periods
        startDate,
        endDate
      );

      if (!marketData[ticker] || marketData[ticker].length === 0) {
        return { success: false, error: 'No data returned from FiinQuant' };
      }

      // Find the exact candle for the requested time
      const candles = marketData[ticker];
      const targetTime = timeMs;

      // Find closest candle (within 1 interval tolerance)
      const intervalMsForTolerance = this.getIntervalMs(timeframe);
      let bestCandle: any = null;
      let minDiff = Infinity;

      for (const candle of candles) {
        const candleTime = this.normalizeTimestamp(candle.timestamp);
        if (!candleTime) continue;

        const diff = Math.abs(candleTime - targetTime);
        if (diff <= intervalMsForTolerance && diff < minDiff) {
          minDiff = diff;
          bestCandle = candle;
        }
      }

      if (!bestCandle || !bestCandle.open || bestCandle.open <= 0) {
        return { success: false, error: 'No valid candle found or open <= 0' };
      }

      // Normalize the result
      const result = {
        time: this.normalizeTimestamp(bestCandle.timestamp),
        open: parseFloat(bestCandle.open),
        high: parseFloat(bestCandle.high),
        low: parseFloat(bestCandle.low),
        close: parseFloat(bestCandle.close),
        volume: parseFloat(bestCandle.volume) || 0
      };

      return { success: true, data: result };

    } catch (error) {
      this.logger.error(`Failed to refetch data for ${ticker}:`, error);
      return { success: false, error: `Refetch error: ${error.message}` };
    }
  }

  /**
   * Extract timeframe from collection name
   */
  private extractTimeframeFromCollection(collectionName: string): string | null {
    const match = collectionName.match(/stock-ss(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Build MongoDB filter for documents with open = 0
   */
  private buildFilter(fromDate?: string, toDate?: string): any {
    const filter: any = {
      $or: [
        { open: 0 },
        { open: { $exists: false } },
        { open: null }
      ]
    };

    if (fromDate || toDate) {
      filter.timestamp = {};
      if (fromDate) {
        filter.timestamp.$gte = new Date(fromDate + 'T00:00:00.000Z');
      }
      if (toDate) {
        filter.timestamp.$lte = new Date(toDate + 'T23:59:59.999Z');
      }
    }

    return filter;
  }

  /**
   * Normalize timestamp to milliseconds
   */
  private normalizeTimestamp(timestamp: any): number | null {
    if (typeof timestamp === 'number') {
      // Assume it's already milliseconds if > year 2000
      return timestamp > 946684800000 ? timestamp : timestamp * 1000;
    }

    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date.getTime();
    }

    if (timestamp instanceof Date) {
      return timestamp.getTime();
    }

    return null;
  }

  /**
   * Get interval in milliseconds
   */
  private getIntervalMs(timeframe: string): number {
    const intervals = {
      '1m': 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return intervals[timeframe] || 60 * 1000;
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

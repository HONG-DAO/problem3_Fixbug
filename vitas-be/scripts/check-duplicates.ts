#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { MarketDataService } from '../src/infrastructure/database/market-data.service.js';
import { getCollectionName, Timeframe } from '../src/common/constants/timeframe.constants.js';

interface DuplicateInfo {
  ticker: string;
  timestamp: Date;
  count: number;
  ids: string[];
}

interface DuplicateReport {
  timeframe: string;
  collectionName: string;
  totalDuplicates: number;
  duplicates: DuplicateInfo[];
}

class DuplicateChecker {
  private marketDataService: MarketDataService;

  constructor(marketDataService: MarketDataService) {
    this.marketDataService = marketDataService;
  }

  /**
   * Kiểm tra duplicate data trong tất cả các collection
   */
  async checkAllDuplicates(): Promise<DuplicateReport[]> {
    const reports: DuplicateReport[] = [];
    const timeframes = Object.values(Timeframe);

    console.log('🔍 Bắt đầu kiểm tra duplicate data...\n');

    for (const timeframe of timeframes) {
      console.log(`📊 Kiểm tra collection: ${getCollectionName(timeframe)}`);
      
      try {
        const duplicates = await this.findDuplicatesInTimeframe(timeframe);
        
        const report: DuplicateReport = {
          timeframe,
          collectionName: getCollectionName(timeframe),
          totalDuplicates: duplicates.length,
          duplicates
        };

        reports.push(report);

        if (duplicates.length > 0) {
          console.log(`   ❌ Tìm thấy ${duplicates.length} nhóm duplicate`);
          duplicates.forEach(dup => {
            console.log(`      - ${dup.ticker} tại ${dup.timestamp.toISOString()}: ${dup.count} bản ghi`);
          });
        } else {
          console.log(`   ✅ Không có duplicate`);
        }

      } catch (error) {
        console.error(`   ❌ Lỗi khi kiểm tra ${timeframe}:`, error.message);
      }

      console.log('');
    }

    return reports;
  }

  /**
   * Tìm duplicate trong một timeframe cụ thể
   */
  private async findDuplicatesInTimeframe(timeframe: string): Promise<DuplicateInfo[]> {
    const model = (this.marketDataService as any).getModel(timeframe);
    
    // Sử dụng aggregation pipeline để tìm duplicate
    const duplicates = await model.aggregate([
      {
        $group: {
          _id: {
            ticker: '$ticker',
            timestamp: '$timestamp'
          },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return duplicates.map(dup => ({
      ticker: dup._id.ticker,
      timestamp: dup._id.timestamp,
      count: dup.count,
      ids: dup.ids
    }));
  }

  /**
   * Xóa duplicate data (giữ lại bản ghi đầu tiên)
   */
  async removeDuplicates(timeframe: string, dryRun: boolean = true): Promise<{
    removed: number;
    kept: number;
    details: Array<{ticker: string, timestamp: Date, removed: number, kept: number}>
  }> {
    const model = (this.marketDataService as any).getModel(timeframe);
    const duplicates = await this.findDuplicatesInTimeframe(timeframe);
    
    let totalRemoved = 0;
    let totalKept = 0;
    const details: Array<{ticker: string, timestamp: Date, removed: number, kept: number}> = [];

    console.log(`\n${dryRun ? '🔍 [DRY RUN]' : '🗑️'} Xử lý duplicate cho ${getCollectionName(timeframe)}:`);

    for (const dup of duplicates) {
      // Sắp xếp IDs để đảm bảo thứ tự nhất quán
      const sortedIds = dup.ids.sort();
      const toKeep = sortedIds[0]; // Giữ lại bản ghi đầu tiên
      const toRemove = sortedIds.slice(1); // Xóa các bản ghi còn lại

      if (!dryRun) {
        // Thực hiện xóa
        const deleteResult = await model.deleteMany({
          _id: { $in: toRemove }
        });

        totalRemoved += deleteResult.deletedCount;
        totalKept += 1;
      } else {
        totalRemoved += toRemove.length;
        totalKept += 1;
      }

      details.push({
        ticker: dup.ticker,
        timestamp: dup.timestamp,
        removed: toRemove.length,
        kept: 1
      });

      console.log(`   ${dryRun ? 'Sẽ xóa' : 'Đã xóa'} ${toRemove.length} bản ghi của ${dup.ticker} tại ${dup.timestamp.toISOString()}`);
    }

    return {
      removed: totalRemoved,
      kept: totalKept,
      details
    };
  }

  /**
   * Xóa tất cả duplicate trong tất cả collection
   */
  async removeAllDuplicates(dryRun: boolean = true): Promise<void> {
    const timeframes = Object.values(Timeframe);
    let totalRemoved = 0;
    let totalKept = 0;

    console.log(`\n${dryRun ? '🔍 [DRY RUN]' : '🗑️'} Bắt đầu xóa duplicate data...\n`);

    for (const timeframe of timeframes) {
      try {
        const result = await this.removeDuplicates(timeframe, dryRun);
        totalRemoved += result.removed;
        totalKept += result.kept;
      } catch (error) {
        console.error(`❌ Lỗi khi xóa duplicate cho ${timeframe}:`, error.message);
      }
    }

    console.log(`\n📊 Tổng kết:`);
    console.log(`   ${dryRun ? 'Sẽ xóa' : 'Đã xóa'}: ${totalRemoved} bản ghi`);
    console.log(`   ${dryRun ? 'Sẽ giữ' : 'Đã giữ'}: ${totalKept} bản ghi`);
  }

  /**
   * Tạo báo cáo chi tiết
   */
  generateReport(reports: DuplicateReport[]): void {
    console.log('\n📋 BÁO CÁO DUPLICATE DATA');
    console.log('='.repeat(50));

    let totalDuplicates = 0;
    let totalRecords = 0;

    reports.forEach(report => {
      console.log(`\n📊 Collection: ${report.collectionName}`);
      console.log(`   Timeframe: ${report.timeframe}`);
      console.log(`   Số nhóm duplicate: ${report.totalDuplicates}`);

      if (report.totalDuplicates > 0) {
        report.duplicates.forEach(dup => {
          console.log(`   - ${dup.ticker} tại ${dup.timestamp.toISOString()}: ${dup.count} bản ghi`);
          totalDuplicates += dup.count - 1; // Trừ 1 vì giữ lại 1 bản ghi
          totalRecords += dup.count;
        });
      }
    });

    console.log('\n📈 TỔNG KẾT:');
    console.log(`   Tổng số bản ghi duplicate: ${totalRecords}`);
    console.log(`   Số bản ghi có thể xóa: ${totalDuplicates}`);
    console.log(`   Số bản ghi sẽ giữ lại: ${totalRecords - totalDuplicates}`);
  }
}

async function main() {
  console.log('🚀 VITAS Duplicate Data Checker');
  console.log('================================\n');

  try {
    // Khởi tạo NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const marketDataService = app.get(MarketDataService);

    const checker = new DuplicateChecker(marketDataService);

    // Lấy arguments từ command line
    const args = process.argv.slice(2);
    const action = args[0] || 'check';
    const timeframe = args[1];
    const dryRun = !args.includes('--execute');

    switch (action) {
      case 'check':
        console.log('🔍 Kiểm tra duplicate data...\n');
        const reports = await checker.checkAllDuplicates();
        checker.generateReport(reports);
        break;

      case 'remove':
        if (timeframe) {
          console.log(`🗑️ Xóa duplicate cho timeframe: ${timeframe}\n`);
          await checker.removeDuplicates(timeframe, dryRun);
        } else {
          console.log('🗑️ Xóa tất cả duplicate data...\n');
          await checker.removeAllDuplicates(dryRun);
        }
        break;

      default:
        console.log('❌ Action không hợp lệ. Sử dụng: check hoặc remove');
        console.log('\nCách sử dụng:');
        console.log('  npm run check-duplicates check                    # Kiểm tra duplicate');
        console.log('  npm run check-duplicates remove --dry-run         # Xem trước việc xóa');
        console.log('  npm run check-duplicates remove --execute        # Thực hiện xóa');
        console.log('  npm run check-duplicates remove 4h --execute     # Xóa duplicate cho 4h');
        break;
    }

    await app.close();
    console.log('\n✅ Hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  main();
}

export { DuplicateChecker };

#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module.js';
import { MarketDataService } from '../src/infrastructure/database/market-data.service.js';
import { getCollectionName, Timeframe } from '../src/common/constants/timeframe.constants.js';

/**
 * Script để xóa duplicate data trong database
 * Chỉ giữ lại bản ghi đầu tiên, xóa các bản ghi trùng lặp
 */
class DuplicateRemover {
  private marketDataService: MarketDataService;

  constructor(marketDataService: MarketDataService) {
    this.marketDataService = marketDataService;
  }

  /**
   * Xóa duplicate data cho một timeframe cụ thể
   * ⚠️ HÀM NÀY ĐÃ ĐƯỢC COMMENT ĐỂ ĐẢM BẢO AN TOÀN
   * Chỉ sử dụng khi thực sự cần thiết và đã backup database
   */
  /*
  async removeDuplicatesForTimeframe(timeframe: string): Promise<{
    removed: number;
    kept: number;
    duplicates: Array<{ticker: string, timestamp: Date, count: number}>
  }> {
    const model = (this.marketDataService as any).getModel(timeframe);
    const collectionName = getCollectionName(timeframe);
    
    console.log(`\n🔍 Kiểm tra duplicate trong ${collectionName}...`);

    // Tìm tất cả duplicate groups
    const duplicateGroups = await model.aggregate([
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
      }
    ]);

    if (duplicateGroups.length === 0) {
      console.log(`   ✅ Không có duplicate trong ${collectionName}`);
      return { removed: 0, kept: 0, duplicates: [] };
    }

    console.log(`   ❌ Tìm thấy ${duplicateGroups.length} nhóm duplicate`);

    let totalRemoved = 0;
    let totalKept = 0;
    const duplicates: Array<{ticker: string, timestamp: Date, count: number}> = [];

    for (const group of duplicateGroups) {
      const { ticker, timestamp } = group._id;
      const count = group.count;
      const ids = group.ids;

      // Sắp xếp IDs để đảm bảo thứ tự nhất quán
      const sortedIds = ids.sort();
      const toKeep = sortedIds[0]; // Giữ lại bản ghi đầu tiên
      const toRemove = sortedIds.slice(1); // Xóa các bản ghi còn lại

      // Thực hiện xóa
      const deleteResult = await model.deleteMany({
        _id: { $in: toRemove }
      });

      totalRemoved += deleteResult.deletedCount;
      totalKept += 1;

      duplicates.push({
        ticker,
        timestamp,
        count
      });

      console.log(`   🗑️ Xóa ${deleteResult.deletedCount} bản ghi của ${ticker} tại ${timestamp.toISOString()}`);
    }

    console.log(`   ✅ Hoàn thành: Xóa ${totalRemoved}, giữ lại ${totalKept}`);

    return {
      removed: totalRemoved,
      kept: totalKept,
      duplicates
    };
  }
  */

  /**
   * Xóa duplicate data cho tất cả timeframes
   * ⚠️ HÀM NÀY ĐÃ ĐƯỢC COMMENT ĐỂ ĐẢM BẢO AN TOÀN
   * Chỉ sử dụng khi thực sự cần thiết và đã backup database
   */
  /*
  async removeAllDuplicates(): Promise<void> {
    const timeframes = Object.values(Timeframe);
    let totalRemoved = 0;
    let totalKept = 0;

    console.log('🚀 Bắt đầu xóa duplicate data...\n');

    for (const timeframe of timeframes) {
      try {
        const result = await this.removeDuplicatesForTimeframe(timeframe);
        totalRemoved += result.removed;
        totalKept += result.kept;
      } catch (error) {
        console.error(`❌ Lỗi khi xóa duplicate cho ${timeframe}:`, error.message);
      }
    }

    console.log('\n📊 TỔNG KẾT:');
    console.log(`   Đã xóa: ${totalRemoved} bản ghi duplicate`);
    console.log(`   Đã giữ: ${totalKept} bản ghi`);
  }
  */

  /**
   * Kiểm tra duplicate trước khi xóa (dry run)
   */
  async checkDuplicates(): Promise<void> {
    const timeframes = Object.values(Timeframe);
    let totalDuplicates = 0;

    console.log('🔍 Kiểm tra duplicate data...\n');

    for (const timeframe of timeframes) {
      const model = (this.marketDataService as any).getModel(timeframe);
      const collectionName = getCollectionName(timeframe);
      
      try {
        const duplicateGroups = await model.aggregate([
          {
            $group: {
              _id: {
                ticker: '$ticker',
                timestamp: '$timestamp'
              },
              count: { $sum: 1 }
            }
          },
          {
            $match: {
              count: { $gt: 1 }
            }
          }
        ]);

        if (duplicateGroups.length > 0) {
          console.log(`📊 ${collectionName}: ${duplicateGroups.length} nhóm duplicate`);
          duplicateGroups.forEach(group => {
            console.log(`   - ${group._id.ticker} tại ${group._id.timestamp.toISOString()}: ${group.count} bản ghi`);
            totalDuplicates += group.count - 1; // Trừ 1 vì giữ lại 1 bản ghi
          });
        } else {
          console.log(`✅ ${collectionName}: Không có duplicate`);
        }

      } catch (error) {
        console.error(`❌ Lỗi khi kiểm tra ${collectionName}:`, error.message);
      }
    }

    console.log(`\n📈 Tổng số bản ghi có thể xóa: ${totalDuplicates}`);
  }
}

async function main() {
  console.log('🚀 VITAS Duplicate Data Remover');
  console.log('================================\n');

  try {
    // Khởi tạo NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const marketDataService = app.get(MarketDataService);

    const remover = new DuplicateRemover(marketDataService);

    // Lấy arguments từ command line
    const args = process.argv.slice(2);
    const action = args[0] || 'check';

    switch (action) {
      case 'check':
        await remover.checkDuplicates();
        break;

      case 'remove':
        console.log('⚠️  CẢNH BÁO: Chức năng xóa đã được comment để đảm bảo an toàn!');
        console.log('   Để sử dụng chức năng xóa, hãy uncomment các hàm trong script.');
        console.log('   Hoặc sử dụng script check-duplicates.ts với --execute flag.');
        break;

      default:
        console.log('❌ Action không hợp lệ. Sử dụng: check hoặc remove');
        console.log('\nCách sử dụng:');
        console.log('  npm run remove-duplicates check     # Kiểm tra duplicate');
        console.log('  npm run remove-duplicates remove    # Xóa duplicate');
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

export { DuplicateRemover };

#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MarketDataService } from '../src/infrastructure/database/market-data.service';
import { getCollectionName, Timeframe } from '../src/common/constants/timeframe.constants';

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

/**
 * Script để tìm và báo cáo duplicate data trong database
 * Chỉ đọc và báo cáo, không thực hiện xóa
 */
class DuplicateFinder {
  private marketDataService: MarketDataService;

  constructor(marketDataService: MarketDataService) {
    this.marketDataService = marketDataService;
  }

  /**
   * Tìm duplicate data trong tất cả các collection
   */
  async findAllDuplicates(): Promise<DuplicateReport[]> {
    const reports: DuplicateReport[] = [];
    const timeframes = Object.values(Timeframe);

    console.log('🔍 Bắt đầu tìm kiếm duplicate data...\n');

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
            console.log(`        IDs: ${dup.ids.slice(0, 3).join(', ')}${dup.ids.length > 3 ? '...' : ''}`);
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
   * Tạo báo cáo chi tiết
   */
  generateDetailedReport(reports: DuplicateReport[]): void {
    console.log('\n📋 BÁO CÁO CHI TIẾT DUPLICATE DATA');
    console.log('='.repeat(60));

    let totalDuplicates = 0;
    let totalRecords = 0;
    let totalCollections = 0;

    reports.forEach(report => {
      if (report.totalDuplicates > 0) {
        totalCollections++;
        console.log(`\n📊 Collection: ${report.collectionName}`);
        console.log(`   Timeframe: ${report.timeframe}`);
        console.log(`   Số nhóm duplicate: ${report.totalDuplicates}`);
        console.log('   Chi tiết:');

        report.duplicates.forEach((dup, index) => {
          console.log(`   ${index + 1}. ${dup.ticker} tại ${dup.timestamp.toISOString()}`);
          console.log(`      - Số bản ghi: ${dup.count}`);
          console.log(`      - Có thể xóa: ${dup.count - 1} bản ghi`);
          console.log(`      - IDs: ${dup.ids.slice(0, 5).join(', ')}${dup.ids.length > 5 ? '...' : ''}`);
          
          totalDuplicates += dup.count - 1; // Trừ 1 vì giữ lại 1 bản ghi
          totalRecords += dup.count;
        });
      }
    });

    console.log('\n📈 TỔNG KẾT:');
    console.log(`   Collections có duplicate: ${totalCollections}/${reports.length}`);
    console.log(`   Tổng số bản ghi duplicate: ${totalRecords}`);
    console.log(`   Số bản ghi có thể xóa: ${totalDuplicates}`);
    console.log(`   Số bản ghi sẽ giữ lại: ${totalRecords - totalDuplicates}`);

    if (totalDuplicates > 0) {
      console.log('\n⚠️  KHUYẾN NGHỊ:');
      console.log('   1. Backup database trước khi xóa duplicate');
      console.log('   2. Sử dụng script remove-duplicates.ts để xóa');
      console.log('   3. Kiểm tra kỹ dữ liệu trước khi xóa');
    }
  }

  /**
   * Tạo báo cáo tóm tắt
   */
  generateSummaryReport(reports: DuplicateReport[]): void {
    console.log('\n📊 BÁO CÁO TÓM TẮT');
    console.log('='.repeat(30));

    reports.forEach(report => {
      const status = report.totalDuplicates > 0 ? '❌' : '✅';
      console.log(`${status} ${report.collectionName}: ${report.totalDuplicates} nhóm duplicate`);
    });

    const totalDuplicates = reports.reduce((sum, report) => 
      sum + report.duplicates.reduce((dupSum, dup) => dupSum + dup.count - 1, 0), 0
    );

    console.log(`\n📈 Tổng số bản ghi có thể xóa: ${totalDuplicates}`);
  }

  /**
   * Xuất báo cáo ra file JSON
   */
  async exportToJson(reports: DuplicateReport[], filename: string = 'duplicate-report.json'): Promise<void> {
    const fs = require('fs');
    const path = require('path');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCollections: reports.length,
        collectionsWithDuplicates: reports.filter(r => r.totalDuplicates > 0).length,
        totalDuplicateGroups: reports.reduce((sum, r) => sum + r.totalDuplicates, 0),
        totalRecordsToRemove: reports.reduce((sum, report) => 
          sum + report.duplicates.reduce((dupSum, dup) => dupSum + dup.count - 1, 0), 0
        )
      },
      reports
    };

    const filePath = path.join(process.cwd(), filename);
    fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n💾 Đã xuất báo cáo ra file: ${filePath}`);
  }
}

async function main() {
  console.log('🔍 VITAS Duplicate Data Finder');
  console.log('===============================\n');

  try {
    // Khởi tạo NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const marketDataService = app.get(MarketDataService);

    const finder = new DuplicateFinder(marketDataService);

    // Lấy arguments từ command line
    const args = process.argv.slice(2);
    const format = args[0] || 'summary';
    const exportFile = args[1];

    console.log('🔍 Tìm kiếm duplicate data...\n');
    const reports = await finder.findAllDuplicates();

    switch (format) {
      case 'detailed':
        finder.generateDetailedReport(reports);
        break;
      case 'summary':
      default:
        finder.generateSummaryReport(reports);
        break;
    }

    if (exportFile) {
      await finder.exportToJson(reports, exportFile);
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

export { DuplicateFinder };

import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import { cn } from '../utils/cn';
import { 
  safeUpper // ví dụ: removed unused safeMap import
} from '../utils/safe';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const marketScenarios = [
  {
    name: 'THỊ TRƯỜNG TĂNG MẠNH (BULLISH MARKET)',
    description: 'Thị trường đang trong xu hướng tăng mạnh với nhiều cơ hội đầu tư',
    conditions: {
      buySignalRatio: '> 60%',
      rsiBelow50Ratio: '> 70%',
      psarUptrendRatio: '> 65%',
      volumeChange: 'Tăng > 20%',
      engulfingRatio: '> 40%'
    },
    recommendation: 'Tích cực tìm kiếm cơ hội mua vào. Quản lý rủi ro thận trọng do wave tăng mạnh.',
    riskLevel: 'medium',
    color: 'success'
  },
  {
    name: 'THỊ TRƯỜNG GIẢM MẠNH (BEARISH MARKET)',
    description: 'Thị trường đang trong xu hướng giảm mạnh với áp lực bán lớn',
    conditions: {
      sellSignalRatio: '> 50%',
      rsiAbove50Ratio: '> 70%',
      psarDowntrendRatio: '> 60%',
      volumeChange: 'Tăng > 15% (bán tháo)',
      engulfingRatio: '> 35%'
    },
    recommendation: 'Thận trọng, ưu tiên bảo toàn vốn. Có thể xuất hiện cơ hội đảo chiều ở các mức hỗ trợ.',
    riskLevel: 'high',
    color: 'danger'
  },
  {
    name: 'THỊ TRƯỜNG SIDEWAY (NEUTRAL MARKET)',
    description: 'Thị trường đang consolidate, chưa có xu hướng rõ ràng',
    conditions: {
      buySignalRatio: '30-50%',
      sellSignalRatio: '30-50%',
      rsiRange: '40-60',
      volumeChange: '< 10%',
      engulfingRatio: '< 30%'
    },
    recommendation: 'Chọn lọc từng cổ phiếu cụ thể. Thị trường chưa có xu hướng rõ ràng.',
    riskLevel: 'low',
    color: 'secondary'
  },
  {
    name: 'THỊ TRƯỜNG BIẾN ĐỘNG CAO (HIGH VOLATILITY)',
    description: 'Thị trường đang có biến động rất cao',
    conditions: {
      totalSignals: '> 80%',
      volumeAnomaly: '> 70%',
      engulfingPattern: '> 60%',
      rsiExtreme: 'Nhiều cổ phiếu ở vùng extreme'
    },
    recommendation: 'Quản lý rủi ro nghiêm ngặt, giảm kích thước lệnh. Phù hợp với traders kinh nghiệm.',
    riskLevel: 'critical',
    color: 'warning'
  },
  {
    name: 'THỊ TRƯỜNG PHỤC HỒI',
    description: 'Thị trường đang cho tín hiệu phục hồi tích cực',
    conditions: {
      buySignalIncrease: 'Từ < 30% lên > 45%',
      rsiRecovery: 'Từ vùng oversold lên trung tính',
      psarReversal: '> 40% chuyển từ DOWN sang UP',
      volumeTrend: 'Volume mua > Volume bán'
    },
    recommendation: 'Cân nhắc gia tăng positions từ từ. Xác nhận xu hướng bằng breakout các mức kháng cự.',
    riskLevel: 'medium',
    color: 'success'
  },
  {
    name: 'THỊ TRƯỜNG RỦI RO CAO (HIGH RISK ALERT)',
    description: 'Thị trường đang ở trạng thái rủi ro cao',
    conditions: {
      riskWarningRatio: '> 40%',
      rsiExtreme: '> 50% ở vùng < 25 hoặc > 75',
      volumeAnomaly: '> 60%',
      reversalPatterns: 'Engulfing + PSAR reversal đồng thời'
    },
    recommendation: 'DỪNG giao dịch mới, review portfolio. Cắt lỗ các positions yếu, giữ cash.',
    riskLevel: 'critical',
    color: 'danger'
  }
];

export function MarketAnalysis() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '1h'>('1d');

  // Fetch market overview
  const { data: marketOverview, refetch } = useApi(
    () => apiService.getMarketOverview(),
    []
  );

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-success-600 bg-success-100';
      case 'medium':
        return 'text-warning-600 bg-warning-100';
      case 'high':
        return 'text-danger-600 bg-danger-100';
      case 'critical':
        return 'text-danger-800 bg-danger-200';
      default:
        return 'text-secondary-600 bg-secondary-100';
    }
  };

  const getScenarioColor = (color: string) => {
    switch (color) {
      case 'success':
        return 'border-success-200 bg-success-50';
      case 'danger':
        return 'border-danger-200 bg-danger-50';
      case 'warning':
        return 'border-warning-200 bg-warning-50';
      case 'secondary':
        return 'border-secondary-200 bg-secondary-50';
      default:
        return 'border-secondary-200 bg-secondary-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Market Analysis</h1>
          <p className="mt-2 text-secondary-600">
            Comprehensive market scenario analysis and insights
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Timeframe Selector */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as '1d' | '1h')}
            className="input w-32"
          >
            <option value="1d">1 Day</option>
            <option value="1h">1 Hour</option>
          </select>
          
          <button
            onClick={() => refetch()}
            className="btn btn-primary flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Current Market Status */}
      {marketOverview && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-secondary-900">
              Current Market Status
            </h3>
            <div className="flex items-center space-x-2 text-sm text-secondary-500">
              <ClockIcon className="w-4 h-4" />
              <span>
                Last updated: {new Date(marketOverview.lastUpdated).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Scenario */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-secondary-900">Current Scenario</h4>
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  getScenarioColor(marketOverview.scenario.riskLevel)
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-secondary-900">
                      {marketOverview.scenario.name}
                    </h5>
                    <span className={cn("badge", getRiskLevelColor(marketOverview.scenario.riskLevel))}>
                      {safeUpper(marketOverview?.scenario?.riskLevel, 'UNKNOWN')}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-700 mb-3">
                    {marketOverview.scenario.description}
                  </p>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-secondary-900 mb-1">Recommendation:</p>
                    <p className="text-sm text-secondary-700">
                      {marketOverview.scenario.recommendation}
                    </p>
                  </div>
                </div>
              </div>

            {/* Market Metrics */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-secondary-900">Market Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <ChartBarIcon className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-secondary-700">Total Tickers</span>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">
                    {marketOverview.metrics.totalTickers.toLocaleString()}
                  </div>
                </div>
                
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <ExclamationTriangleIcon className="w-5 h-5 text-warning-600" />
                    <span className="text-sm font-medium text-secondary-700">Active Signals</span>
                  </div>
                  <div className="text-2xl font-bold text-secondary-900">
                    {marketOverview.metrics.activeSignals}
                  </div>
                </div>
                
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-success-600" />
                    <span className="text-sm font-medium text-secondary-700">Buy Signals</span>
                  </div>
                  <div className="text-2xl font-bold text-success-600">
                    {marketOverview.metrics.buySignals}
                  </div>
                </div>
                
                <div className="p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <ArrowTrendingDownIcon className="w-5 h-5 text-danger-600" />
                    <span className="text-sm font-medium text-secondary-700">Sell Signals</span>
                  </div>
                  <div className="text-2xl font-bold text-danger-600">
                    {marketOverview.metrics.sellSignals}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Scenarios */}
      <div className="card">
        <h3 className="text-xl font-semibold text-secondary-900 mb-6">
          Market Scenarios Reference
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {marketScenarios.map((scenario, index) => ( // ví dụ: use direct map instead of safeMap for known array
            <div
              key={index}
              className={cn(
                "p-6 rounded-lg border-2",
                getScenarioColor(scenario.color) // ví dụ: scenario is now properly typed
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold text-secondary-900">
                  {scenario.name} {/* ví dụ: scenario properties are now accessible */}
                </h4>
                <span className={cn("badge", getRiskLevelColor(scenario.riskLevel))}>
                  {safeUpper(scenario?.riskLevel, 'UNKNOWN')} {/* ví dụ: safeUpper handles unknown properly */}
                </span>
              </div>
              
              <p className="text-sm text-secondary-700 mb-4">
                {scenario.description} {/* ví dụ: scenario properties are now accessible */}
              </p>
              
              <div className="space-y-2 mb-4">
                <h5 className="text-sm font-medium text-secondary-900">Conditions:</h5>
                <div className="space-y-1 text-sm text-secondary-600">
                  {Object.entries(scenario?.conditions || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium">{String(value)}</span> {/* ví dụ: ensure value is string for ReactNode */}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-white rounded border">
                <p className="text-sm font-medium text-secondary-900 mb-1">Recommendation:</p>
                <p className="text-sm text-secondary-700">{scenario.recommendation}</p> {/* ví dụ: scenario properties are now accessible */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeframe Analysis */}
      {marketOverview && (
        <div className="card">
          <h3 className="text-xl font-semibold text-secondary-900 mb-6">
            Timeframe Analysis ({safeUpper(selectedTimeframe, 'UNKNOWN')})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(marketOverview?.timeframeAnalysis || {}).map(([timeframe, data]: [string, {
              totalSignals: number;
              buyRatio: number;
              sellRatio: number;
              avgVolume: number;
              avgRSI: number;
              volumeAnomaly: number;
            }]) => (
              <div key={timeframe} className="p-4 bg-secondary-50 rounded-lg">
                <h4 className="text-lg font-medium text-secondary-900 mb-4">
                  {timeframe === '1d' ? '1 Day' : '1 Hour'} Analysis
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Total Signals:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {data.totalSignals}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Buy Ratio:</span>
                    <span className="text-sm font-medium text-success-600">
                      {(data.buyRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Sell Ratio:</span>
                    <span className="text-sm font-medium text-danger-600">
                      {(data.sellRatio * 100).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-secondary-600">Avg Volume:</span>
                    <span className="text-sm font-medium text-secondary-900">
                      {data.avgVolume.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ShieldExclamationIcon,
  MinusIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import type { MarketOverview as MarketOverviewType } from '../../types/api';
import { cn } from '../../utils/cn';
import { safeToUpperCase, safeObjectEntries } from '../../utils/stringUtils';

interface MarketOverviewProps {
  data: MarketOverviewType | null;
  loading: boolean;
}

export function MarketOverview({ data, loading }: MarketOverviewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Market Scenario Skeleton */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500">Không có dữ liệu thị trường</p>
      </div>
    );
  }

  const { scenario, metrics, analysisData, recommendations, riskAlerts } = data || {};

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'BULLISH_MARKET':
        return ArrowTrendingUpIcon;
      case 'BEARISH_MARKET':
        return ArrowTrendingDownIcon;
      case 'SIDEWAY_MARKET':
        return MinusIcon;
      case 'HIGH_VOLATILITY':
        return BoltIcon;
      case 'RECOVERY_MARKET':
        return ArrowTrendingUpIcon;
      case 'HIGH_RISK_ALERT':
        return ShieldExclamationIcon;
      default:
        return ChartBarIcon;
    }
  };

  const getScenarioColor = (type: string) => {
    switch (type) {
      case 'BULLISH_MARKET':
        return 'from-green-400 to-green-600';
      case 'BEARISH_MARKET':
        return 'from-red-400 to-red-600';
      case 'SIDEWAY_MARKET':
        return 'from-gray-400 to-gray-600';
      case 'HIGH_VOLATILITY':
        return 'from-yellow-400 to-orange-500';
      case 'RECOVERY_MARKET':
        return 'from-blue-400 to-blue-600';
      case 'HIGH_RISK_ALERT':
        return 'from-red-500 to-red-700';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'bearish':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'volatile':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'high':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'critical':
        return 'text-red-800 bg-red-200 border-red-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const ScenarioIcon = getScenarioIcon(scenario.type);

  return (
    <div className="space-y-6">
      {/* Market Scenario Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-r text-white",
              getScenarioColor(scenario.type)
            )}>
              <ScenarioIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{scenario.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Kịch bản thị trường hiện tại</p>
            </div>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border",
            getRiskLevelColor(scenario.riskLevel)
          )}>
            {safeToUpperCase(scenario.riskLevel)}
          </span>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">{scenario.description}</p>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Khuyến nghị:</h4>
            <p className="text-gray-700 text-sm">{scenario.recommendation}</p>
          </div>

          {/* Recommendations and Risk Alerts */}
          {recommendations && Array.isArray(recommendations) && recommendations.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📋 Chiến lược giao dịch:</h4>
              <ul className="space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="text-blue-800 text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {riskAlerts && Array.isArray(riskAlerts) && riskAlerts.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Cảnh báo rủi ro:</h4>
              <ul className="space-y-1">
                {riskAlerts.map((alert, index) => (
                  <li key={index} className="text-red-800 text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Market Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tickers */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng số mã</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(metrics?.totalTickers || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Đã phân tích: {analysisData?.analyzedTickers || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Signals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tín hiệu hoạt động</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {metrics?.activeSignals || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Độ tin cậy TB: {(metrics.avgConfidence * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Buy Signals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tín hiệu mua</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {metrics.buySignals}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tỷ lệ: {((metrics.signalRatios?.buyRatio || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Sell Signals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tín hiệu bán</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {metrics.sellSignals}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tỷ lệ: {((metrics.signalRatios?.sellRatio || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Market Sentiment & Technical Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Sentiment */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tâm lý thị trường</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Xu hướng:</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-sm font-medium border",
                getSentimentColor(metrics.marketSentiment)
              )}>
                {safeToUpperCase(metrics.marketSentiment)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">RSI trung bình:</span>
              <span className="text-sm font-medium text-gray-900">
                {(metrics.technicalIndicators?.avgRSI || 0).toFixed(1)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tỷ lệ RSI &lt; 50:</span>
              <span className="text-sm font-medium text-gray-900">
                {((metrics.technicalIndicators?.rsiBelow50Ratio || 0) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PSAR Uptrend:</span>
              <span className="text-sm font-medium text-gray-900">
                {((metrics.technicalIndicators?.psarUptrendRatio || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Timeframe Analysis */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích theo khung thời gian</h3>
          <div className="space-y-4">
            {safeObjectEntries(data.timeframeAnalysis).map(([timeframe, analysis]) => (
              <div key={timeframe} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-900">{timeframe}</span>
                  <span className="text-sm text-gray-500">{analysis.totalSignals} tín hiệu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Mua: {(analysis.buyRatio * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                    Bán: {(analysis.sellRatio * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Cập nhật lần cuối: {new Date(data.lastUpdated).toLocaleString('vi-VN')}
        </p>
      </div>
    </div>
  );
}

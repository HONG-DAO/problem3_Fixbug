import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import type { TradingSignal } from '../types/api';
import { cn } from '../utils/cn';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  ArrowPathIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

export function TradingSignals() {
  const [filters, setFilters] = useState({
    signalType: '',
    ticker: '',
    timeframe: '',
    minConfidence: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dashboard signals (which includes filtering)
  const { data: dashboardSignals, loading, error } = useApi(
    () => apiService.getDashboardSignals(24),
    [refreshKey]
  );

  // Fetch all tickers for filter
  const { data: tickersResponse } = useApi(
    () => apiService.getAllTickers(),
    []
  );

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Filter signals based on current filters
  const allSignals = dashboardSignals?.signals || [];
  const filteredSignals = allSignals.filter((signal: TradingSignal) => {
    if (filters.signalType && signal.signalType !== filters.signalType) return false;
    if (filters.ticker && signal.ticker !== filters.ticker) return false;
    if (filters.timeframe && signal.timeframe !== filters.timeframe) return false;
    if (filters.minConfidence && signal.confidence < filters.minConfidence / 100) return false;
    return true;
  });

  const tickers = tickersResponse?.tickers || [];

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'buy':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />;
      case 'sell':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-600" />;
      case 'risk_warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <EyeIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSignalBadgeColor = (signalType: string) => {
    switch (signalType) {
      case 'buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sell':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'risk_warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  const getConfidenceBadge = (confidence: number) => {
    const percentage = Math.round(confidence * 100);
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tín hiệu giao dịch</h1>
          <p className="mt-1 text-gray-600">
            Tín hiệu mua bán và cảnh báo rủi ro real-time
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            Tổng: {filteredSignals?.length || 0} tín hiệu
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Lỗi khi tải tín hiệu. Vui lòng thử lại.</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Signal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại tín hiệu
            </label>
            <select
              value={filters.signalType}
              onChange={(e) => setFilters(prev => ({ ...prev, signalType: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            >
              <option value="">Tất cả</option>
              <option value="buy">Tín hiệu mua</option>
              <option value="sell">Tín hiệu bán</option>
              <option value="risk_warning">Cảnh báo rủi ro</option>
            </select>
          </div>

          {/* Ticker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mã cổ phiếu
            </label>
            <select
              value={filters.ticker}
              onChange={(e) => setFilters(prev => ({ ...prev, ticker: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            >
              <option value="">Tất cả</option>
              {(tickers || []).slice(0, 50).map((ticker: string) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khung thời gian
            </label>
            <select
              value={filters.timeframe}
              onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            >
              <option value="">Tất cả</option>
              <option value="1d">1 Ngày</option>
              <option value="1h">1 Giờ</option>
            </select>
          </div>

          {/* Min Confidence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Độ tin cậy tối thiểu
            </label>
            <select
              value={filters.minConfidence}
              onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: Number(e.target.value) }))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            >
              <option value={0}>Tất cả</option>
              <option value={60}>60%+</option>
              <option value={70}>70%+</option>
              <option value={80}>80%+</option>
              <option value={90}>90%+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <SignalIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách tín hiệu ({filteredSignals?.length || 0})
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ClockIcon className="w-4 h-4" />
            <span>Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</span>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4 h-24"></div>
            ))}
          </div>
        ) : !filteredSignals || filteredSignals.length === 0 ? (
          <div className="text-center py-12">
            <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có tín hiệu</h3>
            <p className="text-gray-500">Thử thay đổi bộ lọc để xem thêm tín hiệu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSignals.map((signal: TradingSignal, index: number) => (
              <div
                key={signal._id || index}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 p-2 rounded-lg bg-gray-50">
                      {getSignalIcon(signal.signalType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-900">
                          {signal.ticker}
                        </h4>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium border",
                          getSignalBadgeColor(signal.signalType)
                        )}>
                          {signal.signalType === 'buy' ? 'MUA' : 
                           signal.signalType === 'sell' ? 'BÁN' : 'RỦI RO'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {signal.timeframe}
                        </span>
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          getConfidenceBadge(signal.confidence)
                        )}>
                          {Math.round(signal.confidence * 100)}%
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4">
                        {signal.reason}
                      </p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Giá vào lệnh</p>
                          <p className="font-semibold text-gray-900">
                            {signal.entryPrice?.toLocaleString('vi-VN')} VND
                          </p>
                        </div>
                        
                        {signal.stopLoss && (
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="text-xs text-red-600 mb-1">Stop Loss</p>
                            <p className="font-semibold text-red-700">
                              {signal.stopLoss.toLocaleString('vi-VN')} VND
                            </p>
                          </div>
                        )}
                        
                        {signal.takeProfit && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-green-600 mb-1">Take Profit</p>
                            <p className="font-semibold text-green-700">
                              {signal.takeProfit.toLocaleString('vi-VN')} VND
                            </p>
                          </div>
                        )}
                        
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 mb-1">Thời gian</p>
                          <p className="font-semibold text-blue-700 text-sm">
                            {new Date(signal.timestamp).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Technical Indicators */}
                {signal.indicators && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">
                      Chỉ báo kỹ thuật
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {signal.indicators.rsi && (
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">RSI</p>
                          <p className="font-medium text-gray-900">
                            {signal.indicators.rsi.toFixed(1)}
                          </p>
                        </div>
                      )}
                      
                      {signal.indicators.psarTrend && (
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">PSAR</p>
                          <p className={cn(
                            "font-medium",
                            signal.indicators.psarTrend === 'up' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {signal.indicators.psarTrend === 'up' ? 'TĂNG' : 'GIẢM'}
                          </p>
                        </div>
                      )}
                      
                      {signal.indicators.volumeAnomaly !== undefined && (
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Volume</p>
                          <p className={cn(
                            "font-medium",
                            signal.indicators.volumeAnomaly ? 'text-yellow-600' : 'text-gray-600'
                          )}>
                            {signal.indicators.volumeAnomaly ? 'BẤT THƯỜNG' : 'BÌNH THƯỜNG'}
                          </p>
                        </div>
                      )}
                      
                      {signal.indicators.engulfingPattern !== undefined && (
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">Pattern</p>
                          <p className="font-medium text-gray-900">
                            {signal.indicators.engulfingPattern === 1 ? 'TĂNG' : 
                             signal.indicators.engulfingPattern === -1 ? 'GIẢM' : 'KHÔNG'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
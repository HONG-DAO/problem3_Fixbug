import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import { MarketOverview } from '../components/Dashboard/MarketOverview';
import { ApiMountainChart } from '../components/Charts/ApiMountainChart';
import { isMarketOpen } from '../utils/marketHours';
import { 
  ChartBarIcon, 
  ClockIcon, 
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import type { TradingSignal } from '../types/api';

export function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState('VCB');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '1h'>('1d');
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dashboard overview
  const { data: marketOverview, loading: overviewLoading, error: overviewError } = useApi(
    () => apiService.getDashboardOverview(),
    [refreshKey]
  );

  // Fetch dashboard signals
  const { data: dashboardSignals, loading: signalsLoading } = useApi(
    () => apiService.getDashboardSignals(24),
    [refreshKey]
  );

  // Fetch chart data
  const { data: chartResponse, loading: chartLoading } = useApi(
    () => apiService.getChartData(selectedTicker, selectedTimeframe, 100),
    [selectedTicker, selectedTimeframe]
  );

  // Fetch all tickers
  const { data: tickersResponse } = useApi(
    () => apiService.getAllTickers(),
    []
  );

  // Auto refresh every 5 minutes (300 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const timeframes = [
    { value: '1d', label: '1 Day' },
    { value: '1h', label: '1 Hour' },
  ];

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getSignalColor = (signalType: string) => {
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

  const recentSignals = dashboardSignals?.signals?.slice(0, 5) || [];
  const chartData = chartResponse?.data || [];
  const tickers = tickersResponse?.tickers || [];

  // Debug logging
  console.log('Dashboard chart data:', {
    chartResponse,
    chartDataLength: chartData.length,
    selectedTicker,
    selectedTimeframe,
    chartLoading
  });
  console.log('Chart data sample:', chartData.slice(0, 3));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-5xl py-2 font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Tổng quan thị trường và tín hiệu giao dịch real-time
          </p>
        </div>
        
        {/* Controls */}
        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={overviewLoading}
            className="flex items-center space-x-2 px-4 py-0 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${overviewLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          {/* Ticker Selector */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">
              Chọn mã cổ phiếu
            </label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tickers.slice(0, 50).map((ticker: string) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>
          </div>
          
          {/* Timeframe Selector */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">
              Khung thời gian
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as '1d' | '1h')}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {timeframes.map((tf) => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {overviewError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Lỗi khi tải dữ liệu thị trường. Vui lòng thử lại.</p>
        </div>
      )}

      {/* Market Overview */}
      <MarketOverview data={marketOverview || null} loading={overviewLoading} />

      {/* Chart and Signals Section */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Price Chart */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedTicker} - {selectedTimeframe === '1d' ? 'Ngày' : 'Giờ'}
                  </h3>
                  <p className="text-sm text-gray-500">Mountain Chart (Area Chart)</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span>Cập nhật: {new Date().toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>
            
            {chartLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500">Đang tải biểu đồ...</p>
                </div>
              </div>
            ) : chartData && chartData.length > 0 ? (
            <ApiMountainChart
              data={chartData}
              timeframe={selectedTimeframe}
              showVolume={false}
              marketStatus={isMarketOpen() ? 'open' : 'closed'}
              ticker={selectedTicker}
            />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>Không có dữ liệu biểu đồ</p>
                  <p className="text-sm text-gray-400 mt-1">Vui lòng chọn mã cổ phiếu khác</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Current Price Info */}
          {chartData && chartData.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Thông tin giá
              </h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Giá hiện tại</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {chartData[chartData.length - 1]?.close?.toLocaleString('vi-VN')} VND
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Cao nhất</p>
                    <p className="font-medium text-green-600">
                      {chartData[chartData.length - 1]?.high?.toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Thấp nhất</p>
                    <p className="font-medium text-red-600">
                      {chartData[chartData.length - 1]?.low?.toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mở cửa</p>
                    <p className="font-medium text-gray-900">
                      {chartData[chartData.length - 1]?.open?.toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Khối lượng</p>
                    <p className="font-medium text-gray-900">
                      {Math.round(chartData[chartData.length - 1]?.volume / 1000)}K
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Signals */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Tín hiệu gần đây
              </h4>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span>{dashboardSignals?.totalSignals || 0}</span>
              </div>
            </div>
            
            {signalsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-3 h-12"></div>
                ))}
              </div>
            ) : recentSignals.length > 0 ? (
              <div className="space-y-2">
                {recentSignals.map((signal: TradingSignal, index: number) => (
                  <div
                    key={signal._id || index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getSignalColor(signal.signalType)}`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {signal.ticker}
                        </span>
                        <span className="text-xs font-medium uppercase">
                          {signal.signalType}
                        </span>
                      </div>
                      <p className="text-xs opacity-75 mt-1">
                        Tin cậy: {(signal.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {signal.entryPrice?.toLocaleString('vi-VN')}
                      </p>
                      <p className="text-xs opacity-75">
                        {new Date(signal.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <EyeIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Chưa có tín hiệu nào</p>
              </div>
            )}
          </div>

          {/* Watchlist Quick Access */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Danh sách theo dõi
            </h4>
            <div className="space-y-2">
              {dashboardSignals?.watchlist?.slice(0, 5).map((ticker: string) => (
                <button
                  key={ticker}
                  onClick={() => setSelectedTicker(ticker)}
                  className={`w-full text-left p-2 rounded-lg border transition-colors ${
                    selectedTicker === ticker
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-medium text-sm">{ticker}</span>
                </button>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">
                  Chưa có mã nào trong watchlist
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

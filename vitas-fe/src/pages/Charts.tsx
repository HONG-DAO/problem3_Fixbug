import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import { ApiMountainChart } from '../components/Charts/ApiMountainChart';
// Xóa import cũ không còn sử dụng // ví dụ // Changed to use same chart engine as Dashboard
import type { OHLCVData } from '../types/api';
import { isMarketOpen, formatGmt7, type Interval } from '../utils/marketHours';
import { getSourceTimeframe, isSupportedView, type View } from '../utils/intervals';
import { 
  ChartBarIcon, 
  ClockIcon, 
  AdjustmentsHorizontalIcon,
  ArrowsPointingOutIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export function Charts() {
  const [selectedTicker, setSelectedTicker] = useState('VCB');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Interval>('1d'); // Changed default to match Dashboard
  const [chartPeriods, setChartPeriods] = useState(100);
  const [showVolume, setShowVolume] = useState(false); // Changed default to match Dashboard
  const [marketStatus, setMarketStatus] = useState<'open' | 'closed'>('open');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch chart data với interval đúng (ví dụ)
  const view = selectedTimeframe as View;
  const sourceInterval = isSupportedView(view) ? getSourceTimeframe(view) : '1m';
  const limit = sourceInterval === '15m' ? 200 : 2000; // ví dụ: 15m ~ 28*5≈140; 1m ~ 7*60*5=2100
  const { data: chartResponse, loading: chartLoading } = useApi(
    () => apiService.getChartData(selectedTicker, sourceInterval, limit), // ví dụ: limit theo interval
    [selectedTicker, sourceInterval]
  );

  // Fetch all tickers
  const { data: tickersResponse } = useApi(
    () => apiService.getAllTickers(),
    []
  );

  // Chỉ hỗ trợ 1h và 1d - matching Dashboard order
  const timeframes = [
    { value: '1d', label: '1 Day' }, // Changed order to match Dashboard
    { value: '1h', label: '1 Hour' },
  ];

  // Kiểm tra trạng thái thị trường
  useEffect(() => {
    const checkMarketStatus = () => {
      setMarketStatus(isMarketOpen() ? 'open' : 'closed');
      setLastUpdate(new Date());
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Kiểm tra mỗi phút

    return () => clearInterval(interval);
  }, []);

  const periods = [
    { value: 50, label: '50 phiên' },
    { value: 100, label: '100 phiên' },
    { value: 200, label: '200 phiên' },
    { value: 500, label: '500 phiên' },
  ];

  const chartData = chartResponse?.data || [];
  const tickers = tickersResponse?.tickers || [];

  return (
    <div className="space-y-6">
      {/* Market Status Banner */}
      {marketStatus === 'closed' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Thị trường đang đóng cửa
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Sẽ cập nhật lúc 09:00 GMT+7 (Thứ 2-6)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biểu đồ kỹ thuật</h1>
          <p className="mt-1 text-gray-600">
            Phân tích kỹ thuật với biểu đồ nến Nhật và các chỉ báo
          </p>
        </div>
        
        {/* Chart Controls */}
        <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
          {/* Ticker Selector */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">
              Mã cổ phiếu
            </label>
            <select
              value={selectedTicker}
              onChange={(e) => setSelectedTicker(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
            >
              {(tickers || []).slice(0, 100).map((ticker: string) => (
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

          {/* Periods Selector */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700 mb-1">
              Số phiên
            </label>
            <select
              value={chartPeriods}
              onChange={(e) => setChartPeriods(parseInt(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Settings */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Cài đặt biểu đồ</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Volume Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showVolume}
                onChange={(e) => setShowVolume(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Hiển thị volume</span>
            </label>

            {/* Fullscreen Button */}
            <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowsPointingOutIcon className="w-4 h-4" />
              <span>Toàn màn hình</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedTicker} - {selectedTimeframe === '1d' ? 'Ngày' : 'Giờ'}
                </h2>
                <p className="text-sm text-gray-500">
                  Mountain Chart (Area Chart) với {chartPeriods} phiên gần nhất
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>
                {marketStatus === 'open' 
                  ? `Cập nhật: ${formatGmt7(lastUpdate)}` 
                  : `Đóng cửa: ${formatGmt7(lastUpdate)}`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {chartLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-sm text-gray-500">Đang tải dữ liệu biểu đồ...</p>
              </div>
            </div>
          ) : chartData && Array.isArray(chartData) && chartData.length > 0 ? (
            <ApiMountainChart
              data={chartData}
              timeframe={selectedTimeframe}
              showVolume={showVolume}
              marketStatus={marketStatus}
              ticker={selectedTicker}
            />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có dữ liệu biểu đồ
                </h3>
                <p className="text-sm text-gray-500">
                  Vui lòng chọn mã cổ phiếu khác hoặc thử lại sau
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Information */}
      {chartData && Array.isArray(chartData) && chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Price Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tóm tắt giá</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Giá hiện tại</span>
                <span className="text-sm font-medium text-gray-900">
                  {chartData[chartData.length - 1]?.close?.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cao nhất</span>
                <span className="text-sm font-medium text-green-600">
                  {chartData && chartData.length > 0 ? Math.max(...chartData.map((d: OHLCVData) => d.high)).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Thấp nhất</span>
                <span className="text-sm font-medium text-red-600">
                  {chartData && chartData.length > 0 ? Math.min(...chartData.map((d: OHLCVData) => d.low)).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trung bình</span>
                <span className="text-sm font-medium text-gray-900">
                  {chartData && chartData.length > 0 ? (chartData.reduce((sum: number, d: OHLCVData) => sum + d.close, 0) / chartData.length).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Volume Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Khối lượng</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hiện tại</span>
                <span className="text-sm font-medium text-gray-900">
                  {(chartData[chartData.length - 1]?.volume / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cao nhất</span>
                <span className="text-sm font-medium text-green-600">
                  {chartData && chartData.length > 0 ? (Math.max(...chartData.map((d: OHLCVData) => d.volume)) / 1000).toFixed(0) + 'K' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Thấp nhất</span>
                <span className="text-sm font-medium text-red-600">
                  {chartData && chartData.length > 0 ? (Math.min(...chartData.map((d: OHLCVData) => d.volume)) / 1000).toFixed(0) + 'K' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Trung bình</span>
                <span className="text-sm font-medium text-gray-900">
                  {chartData && chartData.length > 0 ? (chartData.reduce((sum: number, d: OHLCVData) => sum + d.volume, 0) / chartData.length / 1000).toFixed(0) + 'K' : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Trading Range */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vùng giao dịch</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Biên độ</span>
                <span className="text-sm font-medium text-gray-900">
                  {chartData && chartData.length > 0 ? ((Math.max(...chartData.map((d: OHLCVData) => d.high)) - Math.min(...chartData.map((d: OHLCVData) => d.low))) / Math.min(...chartData.map((d: OHLCVData) => d.low)) * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Kháng cự</span>
                <span className="text-sm font-medium text-red-600">
                  {chartData && chartData.length > 0 ? Math.max(...chartData.slice(-20).map(d => d.high)).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Hỗ trợ</span>
                <span className="text-sm font-medium text-green-600">
                  {chartData && chartData.length > 0 ? Math.min(...chartData.slice(-20).map(d => d.low)).toLocaleString('vi-VN') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Statistics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Số phiên</span>
                <span className="text-sm font-medium text-gray-900">
                  {chartData.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phiên tăng</span>
                <span className="text-sm font-medium text-green-600">
                  {chartData.filter((d: OHLCVData) => d.close > d.open).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phiên giảm</span>
                <span className="text-sm font-medium text-red-600">
                  {chartData.filter((d: OHLCVData) => d.close < d.open).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phiên đứng giá</span>
                <span className="text-sm font-medium text-gray-600">
                  {chartData.filter((d: OHLCVData) => d.close === d.open).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

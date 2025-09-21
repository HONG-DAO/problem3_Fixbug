import { useMemo, useState, useEffect, useRef } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import '../../chart/register';
import type { OHLCVData } from '../../types/api';
import { formatNumber, type Interval } from '../../utils/marketHours';
import { 
  ensureMs,
  isValidUTCTimestamp,
  formatTimestampForDebug
} from '../../utils/chartHelpers';
import { resolveWeeklyWindow } from '../../utils/weeklyWindow';
import { getSourceTimeframe, isSupportedView, type View } from '../../utils/intervals';

interface ApiMountainChartProps {
  data: OHLCVData[];
  timeframe: Interval;
  showVolume?: boolean;
  marketStatus?: 'open' | 'closed';
  ticker?: string;
}

export function ApiMountainChart({ 
  data, 
  timeframe, 
  marketStatus = 'open',
  ticker = 'VCB'
}: ApiMountainChartProps) {
  const [hoveredData, setHoveredData] = useState<OHLCVData | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const chartRef = useRef<any>(null);

  // ===== Xác định nguồn dữ liệu dựa trên view (ví dụ)
  const view = timeframe as View;
  const sourceInterval = isSupportedView(view) ? getSourceTimeframe(view) : '1m'; // ví dụ: fallback to 1m

  // ===== Resolve weekly window trước khi chuẩn hoá dữ liệu (ví dụ)
  const window = useMemo(() => {
    // ví dụ: BE trả timestamp UTC+0, ensureMs đảm bảo convert đúng
    const timePoints = data?.map(d => ({ time: ensureMs(d.time) })) ?? [];
    return resolveWeeklyWindow(timePoints, Date.now());
  }, [data]);

  // ===== Chuẩn hoá & lọc dữ liệu (chỉ tuần hiển thị) (ví dụ)
  const displayData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .filter(n => isValidUTCTimestamp(n.time)) // ví dụ: chỉ lấy timestamp UTC+0 hợp lệ
      .map(n => ({ 
        time: ensureMs(n.time), // ví dụ: convert timestamp UTC+0 từ BE
        open: n.open, 
        high: n.high, 
        low: n.low, 
        close: n.close, 
        volume: n.volume 
      }))
      .filter(p => p.time >= window.startMs && p.time <= window.endMs)
      .sort((a, b) => a.time - b.time); // ví dụ: đảm bảo tăng dần trái→phải
  }, [data, window]);

  // Debug logging chỉ cho view 1D (ví dụ)
  if (view === '1d') {
    const validTimestamps = data?.filter(n => isValidUTCTimestamp(n.time)).length ?? 0;
    console.log(`[chart:1d] ApiMountainChart resolved`, {
      apiTF: sourceInterval, // phải là '15m'
      ww: window,
      rawLen: data?.length ?? 0,
      validTimestamps, // ví dụ: số timestamp UTC+0 hợp lệ
      afterLen: displayData.length,
      first: displayData[0]?.time, // ví dụ: UTC+0 milliseconds
      last: displayData.at(-1)?.time, // ví dụ: UTC+0 milliseconds
      firstFormatted: displayData[0] ? formatTimestampForDebug(displayData[0].time) : null, // ví dụ: UTC+0 formatted
      lastFormatted: displayData.at(-1) ? formatTimestampForDebug(displayData.at(-1)!.time) : null, // ví dụ: UTC+0 formatted
    }); // ví dụ
  }

  // Calculate current data (hovered or latest)
  const currentData = hoveredData || (displayData.length > 0 ? displayData[displayData.length - 1] : null);

  // Cập nhật giá và thay đổi từ display data (ví dụ)
  useEffect(() => {
    if (displayData && displayData.length > 0) {
      const latest = displayData[displayData.length - 1];
      const previous = displayData.length > 1 ? displayData[displayData.length - 2] : latest;
      
      setPriceChange(latest.close - previous.close);
      setPriceChangePercent(((latest.close - previous.close) / previous.close) * 100);
    }
  }, [displayData]);

  // Không còn logic volume phiên - chỉ dùng 1m (ví dụ)

  // ===== Volume chỉ từ display data (ví dụ) - removed unused volumeSeries

  // ===== Chuẩn hoá điểm vẽ (line chart kiểu "mountain") (ví dụ)
  const linePoints = useMemo(() => {
    return displayData.map(p => ({ x: p.time as number, y: p.close })); // ví dụ: mỗi 15m/1m là một "đỉnh"
  }, [displayData]);

  // Price chart data - sử dụng line points (ví dụ)
  const priceChartData = useMemo(() => {
    if (!displayData || displayData.length === 0) {
      return {
        datasets: []
      };
    }

    const priceData = linePoints.map(point => ({ 
      x: new Date(point.x), // ví dụ: time đã là milliseconds
      y: point.y 
    }));

    return {
      datasets: [
        {
          type: 'line' as const,
          label: 'Price',
          data: priceData,
          borderColor: '#14b8a6', // Teal color like in the image
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
            gradient.addColorStop(0.5, 'rgba(20, 184, 166, 0.1)');
            gradient.addColorStop(1, 'rgba(20, 184, 166, 0.05)');
            return gradient;
          },
          fill: true, // Enable fill for gradient effect
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2
        },
        // Current price indicator line
        {
          type: 'line' as const,
          label: 'Current Price',
          data: priceData.map(point => ({ x: point.x, y: currentData?.close || 0 })),
          borderColor: '#ef4444', // Red color
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.1)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
            return gradient;
          },
          fill: true,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 0,
          borderWidth: 1,
          order: 1
        }
      ],
    };
  }, [data, currentData]);


  // Price chart options - dark theme
  const priceChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'nearest' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: any[]) => {
            const t = items[0]?.parsed?.x;
            return t
              ? new Date(t).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
              : '';
          },
          label: (ctx: any) => {
            const p = displayData[ctx.dataIndex];
            return p ? `Close: ${p.close} | O:${p.open} H:${p.high} L:${p.low} V:${p.volume}` : '';
          }
        }
      }
    },
    scales: {
      x: {
        type: 'timeseries' as const,
        display: false, // Hide x-axis for price chart
        min: window.startMs,            // ví dụ - ép range trục X theo tuần
        max: window.endMs,              // ví dụ - ép range trục X theo tuần
        time: {
          tooltipFormat: 'dd/MM/yyyy HH:mm',
          // ví dụ: nếu có adapter dayjs/date-fns, set timezone VN ở tooltip callback
        },
        grid: {
          display: false
        }
      },
      y: { 
        beginAtZero: false,
        type: 'linear' as const,
        position: 'right' as const,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          borderDash: [2, 3],
          drawBorder: false
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          callback: (value: number | string) => {
            const num = Number(value);
            return num.toFixed(0);
          }
        },
        border: {
          display: false
        }
      }
    },
    onHover: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const dataIndex = element.index;
        if (dataIndex < displayData.length) {
          // Convert Bar1m back to OHLCVData format for hoveredData (ví dụ)
          const bar = displayData[dataIndex];
          setHoveredData({
            time: bar.time as number,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume
          });
        }
      } else {
        setHoveredData(null);
      }
    }
  }), [displayData, currentData, window, sourceInterval]);


  // Show no data message if no display data (ví dụ)
  if (!displayData || displayData.length === 0) {
    return (
      <div className="w-full">
        <div className="h-[420px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium">Không có dữ liệu từ API</p>
            <p className="text-sm text-gray-400 mt-1">
              Vui lòng kiểm tra kết nối API backend (localhost:3333)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-black via-gray-900 to-black rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              {ticker} - {timeframe === '1d' ? 'Ngày' : 'Giờ'}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-3xl font-bold text-white">
                {formatNumber(currentData?.close || 0)}
              </span>
              {hoveredData ? (
                <span className="text-lg font-medium text-blue-400">
                  Hover: {new Date(hoveredData.time).toLocaleString('vi-VN', { 
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour12: false,
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              ) : (
                <span className={`text-lg font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange >= 0 ? '+' : ''}{formatNumber(priceChange)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">
            {marketStatus === 'open' ? 'Thị trường đang mở cửa' : 'Thị trường đóng cửa'}
          </div>
          <div className="text-sm text-gray-300">
            {currentData && `At close: ${new Date(currentData.time).toLocaleString('vi-VN', { 
              timeZone: 'Asia/Ho_Chi_Minh',
              hour12: false,
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}`}
          </div>
        </div>
      </div>


      {/* Price Chart Container */}
      <div className="h-[420px] bg-gradient-to-b from-gray-900 to-black relative">
        <ReactChart 
          ref={chartRef}
          type="line"
          data={priceChartData} 
          options={priceChartOptions} 
        />
        {/* Current Price Indicator Box */}
        <div className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1 rounded text-sm font-medium shadow-lg">
          {formatNumber(currentData?.close || 0)}
        </div>
      </div>

      {/* Empty State UI khi không có dữ liệu trong window (ví dụ) */}
      {displayData.length === 0 && (
        <div className="mt-2 text-center">
          <p className="text-xs text-muted-foreground">
            {window.source === 'anchored-to-latest-data' 
              ? 'Không có dữ liệu trong tuần hiện tại. Đang neo về tuần gần nhất có dữ liệu.' // ví dụ
              : 'Không có dữ liệu trong tuần hiện tại.' // ví dụ
            }
          </p>
        </div>
      )}

    </div>
  );
}

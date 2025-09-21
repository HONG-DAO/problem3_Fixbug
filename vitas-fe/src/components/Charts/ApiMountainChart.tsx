import { useMemo, useState, useEffect, useRef } from 'react';
import { Chart as ReactChart } from 'react-chartjs-2';
import '../../chart/register';
import type { OHLCVData } from '../../types/api';
import { formatNumber, type Interval } from '../../utils/marketHours';

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

  // Calculate current data (hovered or latest)
  const currentData = hoveredData || (data.length > 0 ? data[data.length - 1] : null);

  // Cập nhật giá và thay đổi từ API data
  useEffect(() => {
    if (data && data.length > 0) {
      const latest = data[data.length - 1];
      const previous = data.length > 1 ? data[data.length - 2] : latest;
      
      setPriceChange(latest.close - previous.close);
      setPriceChangePercent(((latest.close - previous.close) / previous.close) * 100);
    }
  }, [data]);

  // Price chart data - chỉ sử dụng API data
  const priceChartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        datasets: []
      };
    }

    // Debug logging for time data
    console.log('Chart time data sample:', data.slice(0, 3).map(d => ({
      originalTime: d.time,
      convertedDate: new Date(d.time * 1000),
      formatted: new Date(d.time * 1000).toLocaleString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })));

    const priceData = data.map(c => ({ 
      x: new Date(c.time * 1000), // Convert from seconds to milliseconds
      y: c.close 
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
            if (!items?.length) return '';
            const d: Date = items[0].parsed.x ? new Date(items[0].parsed.x) : items[0].raw?.x;
            // Ensure we're working with a valid date
            if (isNaN(d.getTime())) return '';
            
            return d.toLocaleString('vi-VN', { 
              timeZone: 'Asia/Ho_Chi_Minh', // Use Vietnam timezone
              hour12: false,
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          },
          label: (ctx: any) => {
            const raw = ctx.raw;
            const dataIndex = ctx.dataIndex;
            if (dataIndex < data.length) {
              const pointData = data[dataIndex];
              return [
                `Close: ${pointData.close.toLocaleString('vi-VN')}`,
                `Open: ${pointData.open.toLocaleString('vi-VN')}`,
                `High: ${pointData.high.toLocaleString('vi-VN')}`,
                `Low: ${pointData.low.toLocaleString('vi-VN')}`,
                `Volume: ${Intl.NumberFormat('vi-VN').format(pointData.volume)}`
              ];
            }
            return `Price: ${raw?.y?.toLocaleString('vi-VN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'timeseries' as const,
        display: false, // Hide x-axis for price chart
        grid: {
          display: false
        }
      },
      y: {
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
        if (dataIndex < data.length) {
          setHoveredData(data[dataIndex]);
        }
      } else {
        setHoveredData(null);
      }
    }
  }), [data]);


  // Show no data message if no API data
  if (!data || data.length === 0) {
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
                  Hover: {new Date(hoveredData.time * 1000).toLocaleString('vi-VN', { 
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
            {currentData && `At close: ${new Date(currentData.time * 1000).toLocaleString('vi-VN', { 
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

    </div>
  );
}

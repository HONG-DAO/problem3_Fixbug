export function TestDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          VITAS Trading Dashboard
        </h1>
        <p className="text-gray-600">
          Hệ thống giao dịch và phân tích thị trường chứng khoán
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Market Status</h3>
          <div className="text-2xl font-bold text-green-600">Open</div>
          <p className="text-sm text-gray-600">VN-Index: +1.2%</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Signals</h3>
          <div className="text-2xl font-bold text-blue-600">12</div>
          <p className="text-sm text-gray-600">Buy: 8 | Sell: 4</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Watchlist</h3>
          <div className="text-2xl font-bold text-purple-600">25</div>
          <p className="text-sm text-gray-600">Tickers tracked</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Performance</h3>
          <div className="text-2xl font-bold text-green-600">+2.5%</div>
          <p className="text-sm text-gray-600">This week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Signals
          </h3>
          <div className="space-y-3">
            {[
              { ticker: 'VCB', type: 'BUY', confidence: 85, price: '86,500' },
              { ticker: 'VIC', type: 'SELL', confidence: 78, price: '45,200' },
              { ticker: 'FPT', type: 'BUY', confidence: 92, price: '128,000' },
            ].map((signal, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    signal.type === 'BUY' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {signal.type}
                  </span>
                  <span className="font-medium">{signal.ticker}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{signal.price} VND</div>
                  <div className="text-xs text-gray-500">{signal.confidence}% confidence</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Market Analysis
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Bullish Market</h4>
              <p className="text-sm text-green-700">
                Thị trường đang trong xu hướng tăng mạnh với nhiều cơ hội đầu tư.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">RSI Average</div>
                <div className="text-xl font-bold">45.2</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Volume</div>
                <div className="text-xl font-bold">+15%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


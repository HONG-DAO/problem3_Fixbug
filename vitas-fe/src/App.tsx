import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Component } from 'react';
import type { ReactNode } from 'react';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { MarketAnalysis } from './pages/MarketAnalysis';
import { TradingSignals } from './pages/TradingSignals';
import { Charts } from './pages/Charts';
import { Watchlist } from './pages/Watchlist';

// Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-red-200 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-red-900 mb-4">
              Có lỗi xảy ra
            </h1>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'Đã xảy ra lỗi không mong muốn'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="market-analysis" element={<MarketAnalysis />} />
            <Route path="signals" element={<TradingSignals />} />
            <Route path="charts" element={<Charts />} />
            <Route path="watchlist" element={<Watchlist />} />
            <Route path="notifications" element={<div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center"><h1 className="text-xl font-semibold text-gray-900">Notifications - Coming Soon</h1></div>} />
            <Route path="settings" element={<div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center"><h1 className="text-xl font-semibold text-gray-900">Settings - Coming Soon</h1></div>} />
          </Route>
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

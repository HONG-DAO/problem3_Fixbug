import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/api';
import type { UserWatchlist, TradingSignal, WatchlistItem } from '../types/api';
import { cn } from '../utils/cn';
import { safeUpper } from '../utils/safe';
import { 
  PlusIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon,
  BellIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export function Watchlist() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<UserWatchlist | null>(null);
  const [newWatchlist, setNewWatchlist] = useState({
    name: '',
    tickers: [] as WatchlistItem[],
    notificationChannels: [] as ('telegram' | 'dashboard')[],
    isActive: true,
  });

  // Fetch watchlists
  const { data: watchlistsData, loading: watchlistsLoading, refetch: refetchWatchlists } = useApi(
    () => apiService.getWatchlist(),
    []
  );

  // Fetch all tickers
  const { data: allTickersData } = useApi(
    () => apiService.getAllTickers(),
    []
  );

  // Fetch recent signals for selected watchlist
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
  const { data: signalsData, loading: signalsLoading } = useApi(
    () => {
      if (!selectedWatchlistId) return Promise.resolve({ success: true, data: [] });
      const watchlistItem = watchlistsData?.watchlist?.find((w: any) => w._id === selectedWatchlistId);
      if (!watchlistItem) return Promise.resolve({ success: true, data: [] });
      return apiService.getTradingSignals({
        ticker: (watchlistItem as any).ticker,
        limit: 20,
      });
    },
    [selectedWatchlistId, watchlistsData]
  );

  // Backend returns array of individual watchlist items (each ticker is separate)
  const watchlistItems = watchlistsData?.watchlist || [];
  const allTickers = allTickersData?.tickers || [];
  const signals = signalsData || [];

  // Group watchlist items by ticker for display
  const watchlists = watchlistItems.reduce((acc: any[], item: any) => {
    const existingGroup = acc.find(group => group.ticker === item.ticker);
    if (existingGroup) {
      // Merge notification channels
      existingGroup.notificationChannels = [...new Set([...existingGroup.notificationChannels, ...item.notificationChannels])];
    } else {
      acc.push({
        _id: item._id,
        ticker: item.ticker,
        notificationChannels: item.notificationChannels,
        isActive: item.isActive,
        addedAt: item.addedAt,
        preferences: item.preferences
      });
    }
    return acc;
  }, []);

  const handleCreateWatchlist = async () => {
    if (!newWatchlist.name.trim() || !newWatchlist.tickers || newWatchlist.tickers.length === 0) {
      alert('Please enter a name and select at least one ticker');
      return;
    }

    try {
      // Add each ticker to watchlist individually
      for (const tickerItem of newWatchlist.tickers) {
        await apiService.addToWatchlist(
          tickerItem.ticker,
          newWatchlist.notificationChannels,
          tickerItem.preferences
        );
      }
      
      setShowCreateModal(false);
      setNewWatchlist({
        name: '',
        tickers: [],
        notificationChannels: [],
        isActive: true,
      });
      refetchWatchlists();
    } catch (error) {
      console.error('Failed to create watchlist:', error);
      alert('Failed to create watchlist');
    }
  };

  const handleUpdateWatchlist = async () => {
    if (!editingWatchlist) return;

    try {
      // Update each ticker's preferences individually
      for (const tickerItem of editingWatchlist.tickers) {
        await apiService.updateWatchlistPreferences(
          tickerItem.ticker,
          tickerItem.preferences || {}
        );
      }
      
      setEditingWatchlist(null);
      refetchWatchlists();
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      alert('Failed to update watchlist');
    }
  };

  const handleDeleteWatchlist = async (watchlistItem: any) => {
    if (!confirm('Are you sure you want to remove this ticker from watchlist?')) return;

    try {
      await apiService.removeFromWatchlist(watchlistItem.ticker);
      refetchWatchlists();
    } catch (error) {
      console.error('Failed to remove ticker from watchlist:', error);
      alert('Failed to remove ticker from watchlist');
    }
  };


  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'buy':
        return <span className="text-success-600">↗</span>;
      case 'sell':
        return <span className="text-danger-600">↘</span>;
      case 'risk_warning':
        return <span className="text-warning-600">⚠</span>;
      default:
        return <span className="text-secondary-600">👁</span>;
    }
  };

  const getSignalBadgeColor = (signalType: string) => {
    switch (signalType) {
      case 'buy':
        return 'badge-success';
      case 'sell':
        return 'badge-danger';
      case 'risk_warning':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Watchlist</h1>
          <p className="mt-2 text-secondary-600">
            Manage your stock watchlists and monitor signals
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary mt-4 sm:mt-0 flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Watchlist</span>
        </button>
      </div>

      {/* Watchlists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {watchlistsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-secondary-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-secondary-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-secondary-200 rounded w-full"></div>
                <div className="h-3 bg-secondary-200 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : !watchlists || watchlists.length === 0 ? (
          <div className="lg:col-span-2 card text-center py-12">
            <EyeIcon className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No watchlists yet</h3>
            <p className="text-secondary-500 mb-4">Create your first watchlist to start monitoring stocks</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Watchlist
            </button>
          </div>
        ) : (
          watchlists.map((watchlistItem: any) => (
            <div key={watchlistItem._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {watchlistItem.ticker}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={cn(
                      "badge text-xs",
                      watchlistItem.isActive ? "badge-success" : "badge-secondary"
                    )}>
                      {watchlistItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-secondary-500">
                      Added: {new Date(watchlistItem.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingWatchlist(watchlistItem)}
                    className="p-1 text-secondary-600 hover:text-secondary-900"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWatchlist(watchlistItem)}
                    className="p-1 text-danger-600 hover:text-danger-900"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              
              {/* Notification Channels */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-secondary-700 mb-2">Notifications:</h4>
                <div className="flex space-x-2">
                  {watchlistItem.notificationChannels.map((channel: string) => (
                    <span
                      key={channel}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded flex items-center space-x-1"
                    >
                      <BellIcon className="w-3 h-3" />
                      <span className="capitalize">{channel}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferences */}
              {watchlistItem.preferences && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-secondary-700 mb-2">Preferences:</h4>
                  <div className="text-sm text-secondary-600 space-y-1">
                    {watchlistItem.preferences.minConfidence && (
                      <div>Min Confidence: {(watchlistItem.preferences.minConfidence * 100).toFixed(0)}%</div>
                    )}
                    {watchlistItem.preferences.signalTypes && (
                      <div>Signal Types: {watchlistItem.preferences.signalTypes.join(', ')}</div>
                    )}
                    {watchlistItem.preferences.timeframes && (
                      <div>Timeframes: {watchlistItem.preferences.timeframes.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedWatchlistId(watchlistItem._id!)}
                  className="btn btn-secondary text-sm flex items-center space-x-1"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>View Signals</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Signals for Selected Watchlist */}
      {selectedWatchlistId && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">
              Recent Signals for Selected Ticker
            </h3>
            <button
              onClick={() => setSelectedWatchlistId(null)}
              className="text-sm text-secondary-500 hover:text-secondary-700"
            >
              Close
            </button>
          </div>
          
          {signalsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-secondary-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : !signals || signals.length === 0 ? (
            <div className="text-center py-8">
              <EyeIcon className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-500">No signals found for this ticker</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signals.map((signal: TradingSignal) => (
                <div
                  key={signal._id}
                  className="flex items-center justify-between p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50"
                >
                  <div className="flex items-center space-x-3">
                    {getSignalIcon(signal.signalType)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-secondary-900">{signal.ticker}</span>
                        <span className={cn("badge text-xs", getSignalBadgeColor(signal.signalType))}>
                          {safeUpper(signal.signalType, 'UNKNOWN')}
                        </span>
                      </div>
                      <p className="text-sm text-secondary-600">{signal.reason}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-secondary-900">
                      {signal.entryPrice.toLocaleString('vi-VN')} VND
                    </div>
                    <div className="text-xs text-secondary-500">
                      {(signal.confidence * 100).toFixed(1)}% confidence
                    </div>
                    <div className="text-xs text-secondary-500">
                      {new Date(signal.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingWatchlist) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              {editingWatchlist ? 'Edit Watchlist' : 'Create New Watchlist'}
            </h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingWatchlist?.name || newWatchlist.name}
                  onChange={(e) => {
                    if (editingWatchlist) {
                      setEditingWatchlist({ ...editingWatchlist, name: e.target.value });
                    } else {
                      setNewWatchlist({ ...newWatchlist, name: e.target.value });
                    }
                  }}
                  className="input"
                  placeholder="Enter watchlist name"
                />
              </div>
              
              {/* Tickers */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Select Tickers
                </label>
                <div className="max-h-40 overflow-y-auto border border-secondary-300 rounded-md p-2">
                  {(allTickers || []).slice(0, 50).map((ticker: string) => {
                    const isSelected = (editingWatchlist?.tickers || newWatchlist.tickers).some((t: WatchlistItem | string) => 
                      typeof t === 'string' ? t === ticker : t.ticker === ticker
                    );
                    return (
                      <label key={ticker} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentTickers = editingWatchlist?.tickers || newWatchlist.tickers;
                            const newTickers = e.target.checked
                              ? [...currentTickers, { ticker, addedAt: new Date().toISOString() }]
                              : currentTickers.filter(t => (typeof t === 'string' ? t : t.ticker) !== ticker);
                            
                            if (editingWatchlist) {
                              setEditingWatchlist({ ...editingWatchlist, tickers: newTickers });
                            } else {
                              setNewWatchlist({ ...newWatchlist, tickers: newTickers });
                            }
                          }}
                          className="rounded border-secondary-300"
                        />
                        <span className="text-sm text-secondary-700">{ticker}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              {/* Notification Channels */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notification Channels
                </label>
                <div className="space-y-2">
                  {['telegram', 'dashboard'].map((channel) => {
                    const isSelected = (editingWatchlist?.notificationChannels || newWatchlist.notificationChannels).includes(channel as 'telegram' | 'dashboard' | 'email');
                    return (
                      <label key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const currentChannels = editingWatchlist?.notificationChannels || newWatchlist.notificationChannels;
                            const newChannels = e.target.checked
                              ? [...currentChannels, channel as 'telegram' | 'dashboard' | 'email']
                              : currentChannels.filter(c => c !== channel);
                            
                            if (editingWatchlist) {
                              setEditingWatchlist({ ...editingWatchlist, notificationChannels: newChannels });
                            } else {
                              setNewWatchlist({ ...newWatchlist, notificationChannels: newChannels.filter(c => c !== 'email') as ('telegram' | 'dashboard')[] });
                            }
                          }}
                          className="rounded border-secondary-300"
                        />
                        <span className="text-sm text-secondary-700 capitalize">{channel}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editingWatchlist?.isActive ?? newWatchlist.isActive}
                    onChange={(e) => {
                      if (editingWatchlist) {
                        setEditingWatchlist({ ...editingWatchlist, isActive: e.target.checked });
                      } else {
                        setNewWatchlist({ ...newWatchlist, isActive: e.target.checked });
                      }
                    }}
                    className="rounded border-secondary-300"
                  />
                  <span className="text-sm text-secondary-700">Active</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWatchlist(null);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={editingWatchlist ? handleUpdateWatchlist : handleCreateWatchlist}
                className="btn btn-primary"
              >
                {editingWatchlist ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

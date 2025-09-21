# VITAS Trading Frontend

Frontend application for VITAS Trading System - A real-time market analysis and trading signals platform.

## Features

- 📊 **Real-time Dashboard** - Market overview with key metrics and candlestick charts
- 📈 **Trading Signals** - Live trading signals with filtering and analysis
- 🔍 **Market Analysis** - 6 market scenarios with comprehensive analysis
- 👁️ **Watchlist Management** - Create and manage stock watchlists
- 📱 **Responsive Design** - Mobile-friendly interface
- ⚡ **Real-time Updates** - Live data updates and notifications

## Tech Stack

- **React 19** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Interactive charts and graphs
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Heroicons** - Beautiful SVG icons

## Prerequisites

- Node.js 18+ 
- npm or yarn
- VITAS Backend API running on `http://localhost:3333`

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vitas-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3333/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Charts/         # Chart components
│   └── Layout/         # Layout components
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## Key Components

### Dashboard
- Market overview with current scenario
- Real-time metrics and statistics
- Interactive candlestick charts (1d, 1h timeframes)
- Technical indicators display

### Trading Signals
- Live trading signals with filtering
- Signal details with confidence levels
- Technical analysis indicators
- Real-time updates

### Market Analysis
- 6 market scenarios analysis
- Current market status
- Timeframe-specific analysis
- Risk level indicators

### Watchlist
- Create and manage watchlists
- Add/remove tickers
- Notification channel configuration
- Signal monitoring for watchlist items

## API Integration

The frontend integrates with the VITAS Backend API:

- **Market Data** - Historical and real-time market data
- **Trading Signals** - Buy/sell/risk signals
- **Market Analysis** - Market scenarios and overview
- **User Watchlists** - Watchlist management
- **Portfolio** - Portfolio tracking (coming soon)

## Chart Features

- **Candlestick Charts** - OHLCV data visualization
- **Timeframe Support** - 1d and 1h timeframes
- **Volume Analysis** - Volume bars and anomalies
- **Technical Indicators** - RSI, PSAR, Engulfing patterns
- **Interactive Tooltips** - Detailed price information

## Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Touch-friendly interactions
- Optimized for all screen sizes

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx`
3. Update the sidebar navigation in `src/components/Layout/Sidebar.tsx`

### Adding New API Endpoints

1. Add the endpoint method in `src/services/api.ts`
2. Create TypeScript types in `src/types/api.ts`
3. Use the `useApi` hook for data fetching

### Styling

- Use Tailwind CSS classes
- Follow the design system in `src/index.css`
- Use the `cn` utility for conditional classes

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3333/api` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
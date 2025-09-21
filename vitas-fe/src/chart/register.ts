import {
  Chart as ChartJS,
  TimeScale, TimeSeriesScale, LinearScale, CategoryScale,
  BarController, BarElement, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from 'chart.js';
import { CandlestickController, CandlestickElement, OhlcController, OhlcElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns'; // adapter thời gian

ChartJS.register(
  // scales
  TimeScale, TimeSeriesScale, LinearScale, CategoryScale,
  // elements/controllers chung
  BarController, BarElement, LineElement, PointElement,
  // plugins
  Tooltip, Legend, Filler,
  // financial (candlestick/ohlc)
  CandlestickController, CandlestickElement, OhlcController, OhlcElement,
  // zoom plugin
  zoomPlugin,
);

// Không export gì khác. Chỉ cần import file này 1 lần ở app entry.

// Debug check (chỉ trong dev)
if (import.meta.env.DEV) {
  console.log('financial registered?', !!(ChartJS as any).registry.controllers.get('candlestick'));
}

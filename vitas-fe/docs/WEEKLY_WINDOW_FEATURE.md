# Weekly Trading Window Feature

## 🎯 Mục tiêu

Chart luôn hiển thị khung tuần hiện tại với giới hạn pan/zoom:

- **Thứ 7/Chủ nhật** → hiển thị Thứ 2 → Thứ 6 của tuần này
- **Thứ 3** → hiển thị Thứ 2 → Thứ 3 (ngày mới nhất là Thứ 3)
- **Tương tự các ngày khác**: min = Thứ 2, max = ngày hiện tại

## 🔧 Implementation

### 1. Dependencies Added
```bash
npm i -D chartjs-plugin-zoom@^2
```

### 2. Files Created/Modified

#### `src/utils/tradingWindow.ts`
```typescript
export function getWeeklyClamp(now = new Date()) {
  // Tính min = 00:00:00 thứ 2
  // Tính max = 23:59:59 của "ngày mới nhất"
}

export function filterByWeeklyWindow(data, now) {
  // Lọc dữ liệu theo cửa sổ tuần
}
```

#### `src/chart/register.ts`
```typescript
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
  // ... existing components
  zoomPlugin,
);
```

#### `src/components/Charts/CandlestickChart.tsx`
```typescript
// Tính clamp cho tuần hiện tại
const clamp = useMemo(() => getWeeklyClamp(new Date()), []);

// Lọc dữ liệu theo cửa sổ tuần
const filteredData = useMemo(() => {
  return filterByWeeklyWindow(data.map(c => ({ ...c, t: c.time })), new Date());
}, [data, timeframe]);

// Chart options với zoom/pan limits
const options = useMemo(() => ({
  plugins: {
    zoom: {
      zoom: { wheel: { enabled: false }, pinch: { enabled: false }, mode: 'x' },
      pan: { enabled: true, mode: 'x', modifierKey: 'ctrl' },
      limits: { x: { min: clamp.min, max: clamp.max } },
    },
  },
  scales: {
    x: {
      type: 'timeseries',
      min: clamp.min,
      max: clamp.max,
    },
  },
  onResize: (chart) => {
    chart.options.scales.x.min = clamp.min;
    chart.options.scales.x.max = clamp.max;
  },
}), [clamp.min, clamp.max, showVolume]);
```

## 📊 Behavior Examples

### Weekend (Thứ 7/Chủ nhật)
```
Current: Saturday 2024-09-28
Window: Monday 00:00:00 → Friday 23:59:59
Pan limits: Cannot go before Monday, cannot go after Friday
```

### Weekday (Thứ 3)
```
Current: Wednesday 2024-09-25
Window: Monday 00:00:00 → Wednesday 23:59:59
Pan limits: Cannot go before Monday, cannot go after Wednesday
```

### Weekday (Thứ 5)
```
Current: Friday 2024-09-27
Window: Monday 00:00:00 → Friday 23:59:59
Pan limits: Cannot go before Monday, cannot go after Friday
```

## 🎮 User Interactions

### Pan (Lướt ngang)
- **Ctrl + Drag**: Pan ngang trong cửa sổ tuần
- **Limits**: Bị chặn ở min (Thứ 2) và max (ngày mới nhất)

### Zoom
- **Disabled**: Tắt zoom wheel và pinch
- **Focus**: Chỉ pan, không zoom

### Resize
- **Auto-clamp**: Tự động duy trì limits khi resize window

## 📝 Logging

### Console Logs
```javascript
// Clamp information
clamp { 
  minISO: "2024-09-23T00:00:00.000Z", 
  maxISO: "2024-09-27T23:59:59.999Z",
  minLocal: "23/09/2024, 00:00:00",
  maxLocal: "27/09/2024, 23:59:59"
}

// Data filtering
data:filter { inRange: 25, total: 100, interval: "1d" }

// Sample data
data:sample
  (index) time open high low close volume
  0      1727049600000 85000 86000 84000 85500 1500000
  1      1727136000000 85500 87000 85000 86500 1800000
```

## 🧪 Testing

### Manual Test
```javascript
// Trong browser console
import { testTradingWindow } from './src/utils/testTradingWindow';
testTradingWindow();
```

### Test Cases
1. **Weekend**: Chart chỉ hiển thị T2→T6, pan bị chặn
2. **Weekday**: Chart hiển thị T2→hôm nay, pan bị chặn
3. **Pan limits**: Không thể lùi quá T2, không thể vượt quá ngày mới nhất
4. **Data filtering**: Chỉ hiển thị dữ liệu trong cửa sổ tuần

## ✅ Acceptance Criteria

- ✅ **Thứ 7/CN**: Chart chỉ hiển thị T2→T6 tuần này
- ✅ **Thứ 3**: Chart chỉ hiển thị T2→T3
- ✅ **Pan limits**: Bị chặn ở min (T2) và max (ngày mới nhất)
- ✅ **Logs**: Hiển thị clamp và data filtering
- ✅ **No fake candles**: Chỉ hiển thị dữ liệu có sẵn
- ✅ **Intervals**: Hỗ trợ 1h và 1d

## 🚀 Benefits

1. **User Experience**: Chart luôn "neo" trong tuần hiện tại
2. **Performance**: Chỉ load dữ liệu cần thiết
3. **Consistency**: Behavior nhất quán across different days
4. **Trading Focus**: Tập trung vào tuần giao dịch hiện tại
5. **No Confusion**: Không hiển thị dữ liệu cũ hoặc tương lai

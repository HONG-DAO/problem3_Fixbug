# Swagger Watchlist API Examples

## 📋 Endpoints với Examples

### 1. POST /api/dashboard/watchlist
**Add ticker to watchlist**

#### Request Body Example:
```json
{
  "ticker": "VCB",
  "notificationChannels": ["telegram", "dashboard"],
  "preferences": {
    "minConfidence": 0.8,
    "signalTypes": ["buy", "sell"],
    "timeframes": ["1h", "1d"]
  }
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Ticker added to watchlist successfully",
  "data": {
    "userId": "default",
    "ticker": "VCB",
    "notificationChannels": ["telegram", "dashboard"],
    "isActive": true,
    "addedAt": "2024-09-20T14:15:00.000Z",
    "preferences": {
      "minConfidence": 0.8,
      "signalTypes": ["buy", "sell"],
      "timeframes": ["1h", "1d"]
    }
  }
}
```

### 2. GET /api/dashboard/watchlist
**Get watchlist**

#### Response Example:
```json
{
  "success": true,
  "message": "Watchlist retrieved successfully",
  "data": {
    "watchlist": [
      {
        "userId": "default",
        "ticker": "VCB",
        "notificationChannels": ["telegram", "dashboard"],
        "isActive": true,
        "addedAt": "2024-09-20T14:15:00.000Z",
        "preferences": {
          "minConfidence": 0.8,
          "signalTypes": ["buy", "sell"],
          "timeframes": ["1h", "1d"]
        }
      },
      {
        "userId": "default",
        "ticker": "VIC",
        "notificationChannels": ["telegram"],
        "isActive": true,
        "addedAt": "2024-09-20T14:16:00.000Z",
        "preferences": {
          "minConfidence": 0.7,
          "signalTypes": ["buy", "sell"],
          "timeframes": ["1h", "1d"]
        }
      }
    ],
    "count": 2
  }
}
```

### 3. POST /api/dashboard/watchlist/remove
**Remove ticker from watchlist**

#### Request Body Example:
```json
{
  "ticker": "VCB"
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Ticker removed from watchlist successfully",
  "data": {
    "success": true,
    "ticker": "VCB"
  }
}
```

### 4. POST /api/dashboard/watchlist/preferences
**Update watchlist preferences**

#### Request Body Example:
```json
{
  "ticker": "VCB",
  "preferences": {
    "minConfidence": 0.9,
    "signalTypes": ["buy", "sell", "risk_warning"],
    "timeframes": ["1h", "1d", "4h"]
  }
}
```

#### Response Example:
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "success": true,
    "ticker": "VCB"
  }
}
```

### 5. GET /api/dashboard/watchlist-stats
**Get watchlist statistics**

#### Response Example:
```json
{
  "success": true,
  "message": "Watchlist statistics retrieved successfully",
  "data": {
    "totalUsers": 1,
    "totalTickers": 4,
    "channelStats": {
      "telegram": 3,
      "dashboard": 2,
      "email": 1
    },
    "topTickers": [
      {
        "ticker": "VCB",
        "count": 1
      },
      {
        "ticker": "VIC",
        "count": 1
      }
    ]
  }
}
```

## 🔧 Swagger UI Features

### Request Body Validation
- **ticker**: Required string, pattern `^[A-Z0-9]{3,10}$`
- **notificationChannels**: Optional array of strings, enum: `['telegram', 'dashboard', 'email']`
- **preferences**: Optional object with user preferences

### Response Schemas
- **Success responses**: Detailed schema with examples
- **Error responses**: Validation and server error examples
- **Data types**: Proper typing for all fields

### API Documentation
- **Descriptions**: Clear descriptions for each endpoint
- **Examples**: Real-world examples for all request/response bodies
- **Enums**: Proper enum values for notification channels
- **Patterns**: Regex patterns for ticker validation

## 🚀 How to Access

1. **Start the backend server**:
   ```bash
   cd /home/phuocdai/VITAS/vitas-be
   npm run start:dev
   ```

2. **Open Swagger UI**:
   ```
   http://localhost:3333/api/docs
   ```

3. **Navigate to Dashboard section**:
   - Expand "Dashboard" section
   - Find watchlist endpoints
   - Click "Try it out" to test

## 📝 Testing Examples

### Test with cURL:
```bash
# Add ticker to watchlist
curl -X POST "http://localhost:3333/api/dashboard/watchlist" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "VCB",
    "notificationChannels": ["telegram", "dashboard"],
    "preferences": {
      "minConfidence": 0.8,
      "signalTypes": ["buy", "sell"],
      "timeframes": ["1h", "1d"]
    }
  }'

# Get watchlist
curl -X GET "http://localhost:3333/api/dashboard/watchlist"

# Remove ticker
curl -X POST "http://localhost:3333/api/dashboard/watchlist/remove" \
  -H "Content-Type: application/json" \
  -d '{"ticker": "VCB"}'
```

## ✅ Benefits

1. **Clear Documentation**: Each endpoint has detailed descriptions
2. **Example Values**: Real examples for all request/response bodies
3. **Validation**: Proper validation rules and patterns
4. **Interactive Testing**: Test endpoints directly in Swagger UI
5. **Type Safety**: Proper TypeScript types and schemas

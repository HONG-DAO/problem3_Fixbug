#!/usr/bin/env python3
"""
FiinQuant Data Fetcher for VITAS Trading System
Uses FiinQuantX Python library for data fetching
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import pandas as pd

# Import FiinQuantX library
try:
    from FiinQuantX import FiinSession
    FIINQUANT_AVAILABLE = True
except ImportError as e:
    print(f"Warning: FiinQuantX library not available: {e}", file=sys.stderr)
    print("Please install FiinQuantX library: pip install --extra-index-url https://fiinquant.github.io/fiinquantx/simple fiinquantx", file=sys.stderr)
    FIINQUANT_AVAILABLE = False

# Load environment variables if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# Configure logging to stderr only
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr  # Send logs to stderr, not stdout
)
logger = logging.getLogger(__name__)


class FiinQuantFetcher:
    """Standalone FiinQuant data fetcher using FiinQuantX Python library."""
    
    def __init__(self):
        if not FIINQUANT_AVAILABLE:
            logger.error("FiinQuantX library is not available")
            raise ImportError("FiinQuantX library is required but not installed")
        
        self.username = os.getenv('FIINQUANT_USERNAME', '')
        self.password = os.getenv('FIINQUANT_PASSWORD', '')
        
        if not self.username or not self.password:
            logger.error("FiinQuant credentials not found in environment variables")
            raise ValueError("FIINQUANT_USERNAME and FIINQUANT_PASSWORD must be set")
        
        # Initialize FiinQuantX session
        self.session = None
        self.client = None
        self.authenticated = False
        
        try:
            # Create session and login
            self.session = FiinSession(username=self.username, password=self.password)
            self.client = self.session.login()
            logger.info("FiinQuantX session initialized successfully")
            self.authenticated = True
        except Exception as e:
            logger.error(f"Failed to initialize FiinQuantX session: {e}")
            raise
    
    def ensure_connection(self) -> bool:
        """Ensure we have a valid connection."""
        if not self.authenticated or not self.client:
            try:
                self.client = self.session.login()
                self.authenticated = True
                logger.info("Successfully authenticated with FiinQuant")
                return True
            except Exception as e:
                logger.error(f"Authentication failed: {str(e)}")
                return False
        return True
    
    def get_all_tickers(self) -> List[str]:
        """Get all available tickers from the market."""
        if not self.ensure_connection():
            logger.error("Failed to connect to FiinQuant")
            return []
        
        try:
            # Predefined VN30 and major Vietnamese stocks
            vn30_tickers = [
                'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HDB', 'HPG', 
                'LPB', 'MBB', 'MSN', 'MWG', 'PLX', 'SAB', 'SHB', 'SSB', 'SSI', 'STB', 
                'TCB', 'TPB', 'VCB', 'VHM', 'VIB', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE'
            ]
            
            # Additional major stocks
            additional_tickers = [
                'HSG', 'PNJ', 'SMC', 'DHG', 'REE', 'GMD', 'VND', 'DGC', 'HCM', 'DXG',
                'KDH', 'NVL', 'PDR', 'VGC', 'ACV', 'ASM', 'BGI', 'BMI', 'CEO', 'CTD',
                'DCM', 'DGW', 'DRC', 'DTL', 'DVP', 'EIB', 'EVE', 'FCN', 'FIT', 'GEX',
                'HAG', 'HAX', 'HNG', 'HTN', 'IMP', 'ITD', 'KBC', 'KDC', 'LGC', 'MAS',
                'NKG', 'NT2', 'OCB', 'PAN', 'PC1', 'PGD', 'PHR', 'POM', 'POW', 'PPC',
                'PVD', 'PVT', 'QCG', 'SAM', 'SBT', 'SC5', 'SCS', 'SGN', 'SHI', 'SJD',
                'SRC', 'SSC', 'SVC', 'TLG', 'TMT', 'TNA', 'TNG', 'TRC', 'TSC', 'TVN',
                'VCI', 'VGI', 'VHC', 'VPI', 'VTB', 'YEG'
            ]
            
            all_tickers = vn30_tickers + additional_tickers
            logger.info(f"Returning {len(all_tickers)} predefined tickers")
            return all_tickers
            
        except Exception as e:
            logger.error(f"Failed to get all tickers: {str(e)}")
            return []
    
    def fetch_historical_data(
        self, 
        tickers: List[str], 
        timeframe: str = '4h',
        period: int = 100,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Fetch historical market data for given tickers using FiinQuantX library.
        
        Args:
            tickers: List of stock symbols
            timeframe: Data timeframe (1m, 5m, 15m, 30m, 1h, 1d)
            period: Number of periods to fetch
            from_date: Start date (YYYY-MM-DD)
            to_date: End date (YYYY-MM-DD)
            
        Returns:
            Dictionary with ticker as key and list of market data as value
        """
        if not self.ensure_connection():
            logger.error("Failed to connect to FiinQuant")
            return {}
        
        try:
            # Convert timeframe to FiinQuantX format
            timeframe_map = {
                '1m': '1m',
                '15m': '15m',
                '1h': '1h',
                '4h': '4h',
                '1d': '1d'
            }
            
            fiinquant_timeframe = timeframe_map.get(timeframe, '4h')
            
            # Prepare date range
            if not from_date:
                from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            if not to_date:
                to_date = datetime.now().strftime('%Y-%m-%d')
            
            # Prepare fields to fetch
            fields = ['open', 'high', 'low', 'close', 'volume', 'bu', 'sd', 'fn', 'fs', 'fb']
            
            results = {}
            
            try:
                # Use FiinQuantX Fetch_Trading_Data method
                logger.info(f"Fetching data for tickers: {tickers}, timeframe: {fiinquant_timeframe}")
                df = self.client.Fetch_Trading_Data(
                    realtime=False,
                    tickers=tickers,
                    fields=fields,
                    adjusted=True,
                    from_date=from_date,
                    to_date=to_date,
                    by=fiinquant_timeframe
                ).get_data()
                
                logger.info(f"Raw data type: {type(df)}")
                if df is not None:
                    logger.info(f"Data shape: {df.shape if hasattr(df, 'shape') else 'No shape'}")
                    logger.info(f"Data columns: {df.columns.tolist() if hasattr(df, 'columns') else 'No columns'}")
                
                if df is not None and not df.empty:
                    logger.info(f"Fetched data shape: {df.shape}")
                    
                    # Group by ticker
                    for ticker in tickers:
                        ticker_data = df[df['ticker'] == ticker] if 'ticker' in df.columns else df
                        
                        if ticker_data.empty:
                            results[ticker] = []
                            continue
                        
                        market_data = []
                        for _, row in ticker_data.iterrows():
                            try:
                                # Convert timestamp
                                timestamp = row.get('timestamp', datetime.now())
                                if isinstance(timestamp, str):
                                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                                elif not isinstance(timestamp, datetime):
                                    timestamp = datetime.now()
                                
                                # Extract OHLCV data with NaN handling
                                open_price = float(row.get('open', 0)) if pd.notna(row.get('open')) else 0.0
                                high_price = float(row.get('high', 0)) if pd.notna(row.get('high')) else 0.0
                                low_price = float(row.get('low', 0)) if pd.notna(row.get('low')) else 0.0
                                close_price = float(row.get('close', 0)) if pd.notna(row.get('close')) else 0.0
                                
                                # Handle volume conversion safely
                                volume_raw = row.get('volume', 0)
                                if pd.notna(volume_raw) and not pd.isna(volume_raw):
                                    volume = int(float(volume_raw))
                                else:
                                    volume = 0
                                
                                # Calculate change
                                change = close_price - open_price
                                change_percent = (change / open_price * 100) if open_price > 0 else 0
                                
                                # Foreign trading data with NaN handling
                                fb_raw = row.get('fb', 0)
                                fs_raw = row.get('fs', 0)
                                foreign_buy = int(float(fb_raw)) if pd.notna(fb_raw) and not pd.isna(fb_raw) else 0
                                foreign_sell = int(float(fs_raw)) if pd.notna(fs_raw) and not pd.isna(fs_raw) else 0
                                
                                data_point = {
                                    'ticker': ticker,
                                    'timestamp': timestamp.isoformat(),
                                    'open': open_price,
                                    'high': high_price,
                                    'low': low_price,
                                    'close': close_price,
                                    'volume': volume,
                                    'change': change,
                                    'change_percent': change_percent,
                                    'total_match_value': volume * close_price,
                                    'foreign_buy_volume': foreign_buy,
                                    'foreign_sell_volume': foreign_sell,
                                    'match_volume': volume
                                }
                                market_data.append(data_point)
                                
                            except (ValueError, KeyError, TypeError) as e:
                                logger.warning(f"Failed to parse data point for {ticker}: {e}")
                                continue
                        
                        results[ticker] = market_data
                        logger.info(f"Fetched {len(market_data)} data points for {ticker}")
                
                else:
                    logger.warning("No data received from FiinQuantX")
                    for ticker in tickers:
                        results[ticker] = []
                        
            except Exception as e:
                logger.error(f"FiinQuantX API error: {str(e)}")
                logger.error(f"Error type: {type(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                for ticker in tickers:
                    results[ticker] = []
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to fetch historical data: {str(e)}")
            return {}
    
    def fetch_latest_data(self, tickers: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch latest market data for given tickers using FiinQuantX library.
        
        Args:
            tickers: List of stock symbols
            
        Returns:
            Dictionary with ticker as key and latest market data as value
        """
        if not self.ensure_connection():
            logger.error("Failed to connect to FiinQuant")
            return {}
        
        try:
            # Use FiinQuantX Fetch_Trading_Data for real-time data
            fields = ['open', 'high', 'low', 'close', 'volume', 'bu', 'sd', 'fn', 'fs', 'fb']
            
            df = self.client.Fetch_Trading_Data(
                realtime=True,
                tickers=tickers,
                fields=fields,
                adjusted=True,
                by='4h'
            ).get_data()
            
            results = {}
            
            if df is not None and not df.empty:
                logger.info(f"Fetched latest data shape: {df.shape}")
                
                for ticker in tickers:
                    try:
                        # Get latest data for ticker
                        ticker_data = df[df['ticker'] == ticker] if 'ticker' in df.columns else df
                        
                        if ticker_data.empty:
                            logger.warning(f"No latest data for {ticker}")
                            continue
                        
                        # Get the most recent row
                        latest_row = ticker_data.iloc[-1]
                        
                        # Extract data with NaN handling
                        open_price = float(latest_row.get('open', 0)) if pd.notna(latest_row.get('open')) else 0.0
                        high_price = float(latest_row.get('high', 0)) if pd.notna(latest_row.get('high')) else 0.0
                        low_price = float(latest_row.get('low', 0)) if pd.notna(latest_row.get('low')) else 0.0
                        close_price = float(latest_row.get('close', 0)) if pd.notna(latest_row.get('close')) else 0.0
                        
                        # Handle volume conversion safely
                        volume_raw = latest_row.get('volume', 0)
                        if pd.notna(volume_raw) and not pd.isna(volume_raw):
                            volume = int(float(volume_raw))
                        else:
                            volume = 0
                        
                        # Calculate change
                        change = close_price - open_price
                        change_percent = (change / open_price * 100) if open_price > 0 else 0
                        
                        # Foreign trading data with NaN handling
                        fb_raw = latest_row.get('fb', 0)
                        fs_raw = latest_row.get('fs', 0)
                        foreign_buy = int(float(fb_raw)) if pd.notna(fb_raw) and not pd.isna(fb_raw) else 0
                        foreign_sell = int(float(fs_raw)) if pd.notna(fs_raw) and not pd.isna(fs_raw) else 0
                        
                        data_point = {
                            'ticker': ticker,
                            'timestamp': datetime.now().isoformat(),
                            'open': open_price,
                            'high': high_price,
                            'low': low_price,
                            'close': close_price,
                            'volume': volume,
                            'change': change,
                            'change_percent': change_percent,
                            'total_match_value': volume * close_price,
                            'foreign_buy_volume': foreign_buy,
                            'foreign_sell_volume': foreign_sell,
                            'match_volume': volume
                        }
                        
                        results[ticker] = data_point
                        logger.info(f"Fetched latest data for {ticker}: {close_price}")
                        
                    except Exception as e:
                        logger.error(f"Failed to process latest data for {ticker}: {str(e)}")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to fetch latest data: {str(e)}")
            return {}
    
    def check_market_status(self) -> Dict[str, Any]:
        """
        Check market status and trading hours.
        
        Returns:
            Dictionary with market status information
        """
        now = datetime.now()
        weekday = now.weekday()
        hour = now.hour
        
        is_weekday = weekday < 5
        is_trading_hours = is_weekday and (9 <= hour < 15)
        
        return {
            'is_open': is_trading_hours,
            'is_weekday': is_weekday,
            'current_time': now.isoformat(),
            'trading_hours': '09:00-15:00',
            'timezone': 'Asia/Ho_Chi_Minh'
        }

def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(description='FiinQuant Data Fetcher')
    parser.add_argument('--action', required=True, 
                       choices=['historical', 'latest', 'market-status', 'all-tickers'],
                       help='Action to perform')
    parser.add_argument('--tickers', help='Comma-separated list of tickers')
    parser.add_argument('--timeframe', default='4h', help='Data timeframe (1m, 15m, 1h, 4h, 1d)')
    parser.add_argument('--period', type=int, default=100, help='Number of periods')
    parser.add_argument('--from-date', help='Start date (YYYY-MM-DD)')
    parser.add_argument('--to-date', help='End date (YYYY-MM-DD)')
    parser.add_argument('--hours', help='Comma-separated HH:MM list to filter timestamps (local)')
    
    args = parser.parse_args()
    
    # Redirect stdout to stderr temporarily to capture any unwanted output
    original_stdout = sys.stdout
    sys.stdout = sys.stderr
    
    try:
        fetcher = FiinQuantFetcher()
        
        if args.action == 'historical':
            if not args.tickers:
                raise ValueError("--tickers is required for historical data")
            
            tickers = args.tickers.split(',')
            result = fetcher.fetch_historical_data(
                tickers=tickers,
                timeframe=args.timeframe,
                period=args.period,
                from_date=getattr(args, 'from_date'),
                to_date=getattr(args, 'to_date')
            )
            
            # Optional hour filtering
            if args.hours:
                try:
                    wanted = set([h.strip() for h in args.hours.split(',') if h.strip()])
                    for t in list(result.keys()):
                        filtered = [r for r in result[t] if datetime.fromisoformat(r['timestamp']).strftime('%H:%M') in wanted]
                        result[t] = filtered
                except Exception as e:
                    logger.warning(f"Failed to filter by hours: {e}")
            
            # Restore stdout for JSON output
            sys.stdout = original_stdout
            print(json.dumps(result, default=str))
        
        elif args.action == 'latest':
            if not args.tickers:
                raise ValueError("--tickers is required for latest data")
            
            tickers = args.tickers.split(',')
            result = fetcher.fetch_latest_data(tickers)
            
            # Restore stdout for JSON output
            sys.stdout = original_stdout
            print(json.dumps(result, default=str))
        
        elif args.action == 'market-status':
            result = fetcher.check_market_status()
            
            # Restore stdout for JSON output
            sys.stdout = original_stdout
            print(json.dumps(result, default=str))
        
        elif args.action == 'all-tickers':
            result = fetcher.get_all_tickers()
            
            # Restore stdout for JSON output
            sys.stdout = original_stdout
            print(json.dumps({'tickers': result}, default=str))
    
    except Exception as e:
        logger.error(f"Error: {e}")
        # Return error as JSON instead of plain text
        error_response = {
            "error": str(e),
            "success": False,
            "data": {}
        }
        
        # Restore stdout for JSON output
        sys.stdout = original_stdout
        print(json.dumps(error_response))
        sys.exit(1)

if __name__ == "__main__":
    main()
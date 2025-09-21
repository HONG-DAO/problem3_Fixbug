import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, ChildProcess } from 'child_process';
import { IMarketDataPoint } from '../../common/interfaces/trading.interface';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FiinQuantDataService {
  private readonly logger = new Logger(FiinQuantDataService.name);
  private pythonProcess: ChildProcess | null = null;
  private readonly pythonScriptPath: string;
  private readonly venvPath: string;
  private readonly pythonExecutable: string;

  constructor(private readonly configService: ConfigService) {
    // Path to Python script for FiinQuant data fetching
    this.pythonScriptPath = path.join(process.cwd(), 'python-services', 'fiinquant_fetcher.py');
    
    // Python virtual environment configuration
    this.venvPath = process.env.PYTHON_VENV_PATH || path.join(process.cwd(), 'python-services', 'venv');
    this.pythonExecutable = this.getPythonExecutable();
  }

  /**
   * Get the correct Python executable path based on OS and virtual environment
   */
  private getPythonExecutable(): string {
    const isWindows = process.platform === 'win32';
    
    // Check if virtual environment exists
    const venvPythonPath = isWindows 
      ? path.join(this.venvPath, 'Scripts', 'python.exe')
      : path.join(this.venvPath, 'bin', 'python');
    
    // Check if venv python exists
    try {
      fs.accessSync(venvPythonPath);
      this.logger.log(`Using Python virtual environment: ${venvPythonPath}`);
      return venvPythonPath;
    } catch (error) {
      // Fallback to system python
      this.logger.warn(`Virtual environment not found at ${venvPythonPath}, using system python`);
      return isWindows ? 'python.exe' : 'python3';
    }
  }

  /**
   * Create environment variables for Python execution
   */
  private createPythonEnv(): NodeJS.ProcessEnv {
    const env = { ...process.env };
    
    // Add virtual environment to PATH if it exists
    if (this.pythonExecutable.includes(this.venvPath)) {
      const isWindows = process.platform === 'win32';
      const venvBinPath = isWindows 
        ? path.join(this.venvPath, 'Scripts')
        : path.join(this.venvPath, 'bin');
      
      env.PATH = `${venvBinPath}${path.delimiter}${env.PATH}`;
      env.VIRTUAL_ENV = this.venvPath;
      
      // Remove PYTHONHOME to avoid conflicts
      delete env.PYTHONHOME;
    }

    // Add FiinQuant credentials
    env.FIINQUANT_USERNAME = process.env.FIINQUANT_USERNAME;
    env.FIINQUANT_PASSWORD = process.env.FIINQUANT_PASSWORD;
    
    return env;
  }

  /**
   * Fetch historical data from FiinQuant via Python script
   */
  async fetchHistoricalData(
    tickers: string[],
    timeframe: string = '15m',
    period: number = 100,
    fromDate?: string,
    toDate?: string
  ): Promise<{ [ticker: string]: IMarketDataPoint[] }> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--action', 'historical',
        '--tickers', tickers.join(','),
        '--timeframe', timeframe,
        '--period', period.toString(),
      ];

      if (fromDate) {
        args.push('--from-date', fromDate);
      }
      if (toDate) {
        args.push('--to-date', toDate);
      }

      this.logger.debug(`Executing Python script: ${this.pythonExecutable} ${args.join(' ')}`);

      const pythonProcess = spawn(this.pythonExecutable, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.createPythonEnv(),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        this.logger.warn(`Python script stderr: ${data.toString()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            
            // Convert to IMarketDataPoint format
            const formattedResult: { [ticker: string]: IMarketDataPoint[] } = {};
            
            for (const [ticker, data] of Object.entries(result)) {
              if (Array.isArray(data)) {
                formattedResult[ticker] = (data as any[]).map(row => ({
                  ticker,
                  timestamp: new Date(row.timestamp),
                  timeframe,
                  open: row.open,
                  high: row.high,
                  low: row.low,
                  close: row.close,
                  volume: row.volume,
                  change: row.change,
                  changePercent: row.change_percent,
                  totalMatchValue: row.total_match_value,
                  foreignBuyVolume: row.foreign_buy_volume,
                  foreignSellVolume: row.foreign_sell_volume,
                  matchVolume: row.match_volume,
                }));
              }
            }
            
            this.logger.debug(`Fetched data for ${Object.keys(formattedResult).length} tickers`);
            resolve(formattedResult);
          } catch (error) {
            this.logger.error('Failed to parse Python script output:', error);
            this.logger.error('Raw output:', stdout);
            reject(new Error(`Failed to parse data: ${error.message}`));
          }
        } else {
          this.logger.error(`Python script exited with code ${code}`);
          this.logger.error('stderr:', stderr);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        this.logger.error('Failed to start Python script:', error);
        reject(error);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          reject(new Error('Python script timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Fetch latest data for specific ticker
   */
  async fetchLatestData(ticker: string): Promise<IMarketDataPoint | null> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--action', 'latest',
        '--tickers', ticker,
      ];

      const pythonProcess = spawn(this.pythonExecutable, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.createPythonEnv(),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            
            if (result[ticker]) {
              const data = result[ticker];
              const marketData: IMarketDataPoint = {
                ticker,
                timestamp: new Date(data.timestamp),
                timeframe: '1m', // Latest data is typically 1-minute
                open: data.open,
                high: data.high,
                low: data.low,
                close: data.close,
                volume: data.volume,
                change: data.change,
                changePercent: data.change_percent,
                totalMatchValue: data.total_match_value,
                foreignBuyVolume: data.foreign_buy_volume,
                foreignSellVolume: data.foreign_sell_volume,
                matchVolume: data.match_volume,
              };
              
              resolve(marketData);
            } else {
              resolve(null);
            }
          } catch (error) {
            this.logger.error('Failed to parse latest data:', error);
            reject(error);
          }
        } else {
          this.logger.error(`Python script failed with code ${code}: ${stderr}`);
          reject(new Error(`Failed to fetch latest data: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        this.logger.error('Failed to start Python script:', error);
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          reject(new Error('Latest data fetch timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Start real-time data stream
   */
  async startRealtimeStream(
    tickers: string[],
    callback: (data: IMarketDataPoint) => void
  ): Promise<boolean> {
    try {
      if (this.pythonProcess) {
        this.logger.warn('Real-time stream already running, stopping existing process');
        await this.stopRealtimeStream();
      }

      const args = [
        this.pythonScriptPath,
        '--action', 'stream',
        '--tickers', tickers.join(','),
      ];

      this.pythonProcess = spawn(this.pythonExecutable, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.createPythonEnv(),
      });

      this.pythonProcess!.stdout!.on('data', (data) => {
        try {
          const lines = data.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            const marketData = JSON.parse(line);
            
            const formattedData: IMarketDataPoint = {
              ticker: marketData.ticker,
              timestamp: new Date(marketData.timestamp),
              timeframe: '1m',
              open: marketData.open,
              high: marketData.high,
              low: marketData.low,
              close: marketData.close,
              volume: marketData.volume,
              change: marketData.change,
              changePercent: marketData.change_percent,
              totalMatchValue: marketData.total_match_value,
              foreignBuyVolume: marketData.foreign_buy_volume,
              foreignSellVolume: marketData.foreign_sell_volume,
              matchVolume: marketData.match_volume,
            };
            
            callback(formattedData);
          }
        } catch (error) {
          this.logger.error('Failed to parse real-time data:', error);
        }
      });

      this.pythonProcess!.stderr!.on('data', (data) => {
        this.logger.warn(`Python stream stderr: ${data.toString()}`);
      });

      this.pythonProcess.on('close', (code) => {
        this.logger.warn(`Python stream process exited with code ${code}`);
        this.pythonProcess = null;
      });

      this.pythonProcess.on('error', (error) => {
        this.logger.error('Python stream process error:', error);
        this.pythonProcess = null;
      });

      this.logger.log(`Started real-time stream for ${tickers.length} tickers`);
      return true;

    } catch (error) {
      this.logger.error('Failed to start real-time stream:', error);
      return false;
    }
  }

  /**
   * Stop real-time data stream
   */
  async stopRealtimeStream(): Promise<void> {
    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      
      // Wait for process to terminate
      await new Promise<void>((resolve) => {
        if (this.pythonProcess) {
          this.pythonProcess.on('close', () => {
            this.pythonProcess = null;
            resolve();
          });
          
          // Force kill after 5 seconds
          setTimeout(() => {
            if (this.pythonProcess) {
              this.pythonProcess.kill('SIGKILL');
              this.pythonProcess = null;
            }
            resolve();
          }, 5000);
        } else {
          resolve();
        }
      });
      
      this.logger.log('Stopped real-time stream');
    }
  }

  /**
   * Check if market is open
   */
  async isMarketOpen(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const args = [
        this.pythonScriptPath,
        '--action', 'market-status',
      ];

      const pythonProcess = spawn(this.pythonExecutable, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.createPythonEnv(),
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result.is_open === true);
          } catch (error) {
            this.logger.error('Failed to parse market status:', error);
            resolve(false);
          }
        } else {
          this.logger.error(`Market status check failed: ${stderr}`);
          resolve(false);
        }
      });

      pythonProcess.on('error', (error) => {
        this.logger.error('Failed to check market status:', error);
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!pythonProcess.killed) {
          pythonProcess.kill();
          resolve(false);
        }
      }, 5000);
    });
  }

  /**
   * Get all available tickers
   */
  async getAllTickers(): Promise<string[]> {
    // Load from CSV file
    try {
      const csvPath = path.join(process.cwd(), 'python-services', 'tickers.csv');
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const header = lines.shift();
      const tickers = lines.filter(l => l && l !== 'ticker');
      this.logger.debug(`Loaded ${tickers.length} tickers from CSV`);
      return tickers;
    } catch (error) {
      this.logger.error('Failed to load tickers from CSV, falling back to python script:', error);
      return new Promise((resolve, reject) => {
        const args = [
          this.pythonScriptPath,
          '--action', 'all-tickers',
        ];
        const pythonProcess = spawn(this.pythonExecutable, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: this.createPythonEnv(),
        });
        let stdout = '';
        pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
        pythonProcess.on('close', () => {
          try {
            const result = JSON.parse(stdout);
            resolve(result.tickers || []);
          } catch (e) {
            resolve([]);
          }
        });
        pythonProcess.on('error', () => resolve([]));
        setTimeout(() => { if (!pythonProcess.killed) { pythonProcess.kill(); resolve([]); } }, 10000);
      });
    }
  }

  /**
   * Health check for FiinQuant connection
   */
  async healthCheck(): Promise<{ status: string; message: string; lastUpdate?: Date }> {
    try {
      const testData = await this.fetchLatestData('VIC'); // Test with VIC stock
      
      if (testData) {
        return {
          status: 'healthy',
          message: 'FiinQuant connection successful',
          lastUpdate: testData.timestamp,
        };
      } else {
        return {
          status: 'warning',
          message: 'FiinQuant connection OK but no data received',
        };
      }
    } catch (error) {
      return {
        status: 'error',
        message: `FiinQuant connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Cleanup on service destruction
   */
  async onModuleDestroy() {
    await this.stopRealtimeStream();
  }
}

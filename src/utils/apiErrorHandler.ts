import { ErrorTrackingService, ErrorType, ErrorLevel } from '@/services/errorTrackingService';

export class APIErrorHandler {
  // Supabase error interceptor
  static setupSupabaseErrorTracking() {
    // Store original fetch
    const originalFetch = window.fetch;
    
    // Intercept all fetch requests
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        
        // Check if it's a Supabase request and if it failed
        const url = args[0] instanceof Request ? args[0].url : args[0];
        if (typeof url === 'string' && url.includes('supabase.co')) {
          if (!response.ok) {
            const responseText = await response.clone().text();
            let parsedError;
            
            try {
              parsedError = JSON.parse(responseText);
            } catch {
              parsedError = { message: responseText };
            }

            ErrorTrackingService.trackAPIError(response, {
              supabase_error: parsedError,
              request_args: args
            });
          }
        }
        
        return response;
      } catch (error) {
        // Network or other fetch errors
        const url = args[0] instanceof Request ? args[0].url : args[0];
        const method = args[0] instanceof Request ? args[0].method : (args[1]?.method || 'GET');
        
        let errorType: ErrorType = 'api_error';
        let errorLevel: ErrorLevel = 'critical';
        let errorMessage = `Network Error: ${error}`;
        
        // Categorize different types of fetch failures
        if (error instanceof TypeError) {
          if (error.message.includes('Failed to fetch')) {
            errorMessage = `Failed to fetch: ${url}`;
            // Check if it's a tracking script that's failing
            if (typeof url === 'string' && (
              url.includes('googletagmanager.com') ||
              url.includes('google-analytics.com') ||
              url.includes('doubleclick.net') ||
              url.includes('googlesyndication.com')
            )) {
              errorType = 'client_error';
              errorLevel = 'error'; // Less critical for tracking scripts
            }
          } else if (error.message.includes('NetworkError')) {
            errorMessage = `Network connectivity error: ${url}`;
          }
        }
        
        ErrorTrackingService.trackError(errorType, errorMessage, errorLevel, {
          url: typeof url === 'string' ? url : 'unknown',
          method,
          error_name: error.name,
          error_message: error.message,
          network_error: true,
          user_agent: navigator.userAgent,
          online_status: navigator.onLine,
          connection_type: this.getConnectionInfo()
        });
        throw error;
      }
    };
  }

  // Generic API error handler for custom API calls
  static async handleAPIResponse(response: Response, requestData?: any): Promise<Response> {
    if (!response.ok) {
      ErrorTrackingService.trackAPIError(response, requestData || {});
    }
    return response;
  }

  // Wrapper for async operations with error tracking
  static async wrapAsyncOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    additionalContext: Record<string, any> = {}
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      ErrorTrackingService.trackError(
        'client_error',
        `${operationName}: ${error}`,
        'error',
        {
          operation_name: operationName,
          ...additionalContext
        }
      );
      throw error;
    }
  }

  private static getConnectionInfo() {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    } : null;
  }
}
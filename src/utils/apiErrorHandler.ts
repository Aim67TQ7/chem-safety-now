import { ErrorTrackingService } from '@/services/errorTrackingService';

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
        ErrorTrackingService.trackError('api_error', `Network Error: ${error}`, 'critical', {
          request_args: args,
          network_error: true
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
}
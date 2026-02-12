
/**
 * API Error Handler
 *
 * This module provides custom error classes and utilities for handling API errors
 * in a consistent and informative way across the application.
 */

/**
 * Base class for all API-related errors
 */
export class ApiError extends Error {
  public status?: number;
  public endpoint: string;
  public method: string;

  constructor(message: string, endpoint: string, method: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.endpoint = endpoint;
    this.method = method;
    this.status = status;

    // This is necessary for proper instanceof checks with custom Error classes
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Error thrown when a network issue prevents the request from completing
 */
export class NetworkError extends ApiError {
  constructor(endpoint: string, method: string, originalError: Error) {
    super(`Network error while accessing ${endpoint}: ${originalError.message}`, endpoint, method);
    this.name = 'NetworkError';

    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown for HTTP 4xx client errors
 */
export class ClientError extends ApiError {
  public data: any;

  constructor(endpoint: string, method: string, status: number, message: string, data?: any) {
    super(message, endpoint, method, status);
    this.name = 'ClientError';
    this.data = data;

    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

/**
 * Error thrown for HTTP 5xx server errors
 */
export class ServerError extends ApiError {
  constructor(endpoint: string, method: string, status: number) {
    super(`Server error (${status}) while accessing ${endpoint}`, endpoint, method, status);
    this.name = 'ServerError';

    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error thrown when a parameter is missing in endpoint URL
 */
export class MissingParameterError extends Error {
  public paramName: string;

  constructor(paramName: string) {
    super(`Missing parameter: ${paramName}`);
    this.name = 'MissingParameterError';
    this.paramName = paramName;

    Object.setPrototypeOf(this, MissingParameterError.prototype);
  }
}

/**
 * Handles API response errors and throws appropriate custom error
 *
 * @param response - The fetch Response object
 * @param endpoint - The API endpoint that was called
 * @param method - The HTTP method that was used
 * @throws ApiError or its subclasses based on the response status
 */
export async function handleApiResponse(response: Response, endpoint: string, method: string): Promise<void> {
  // No error if response is OK
  if (response.ok) {
    return;
  }

  const status = response.status;

  // Try to parse response body for error details
  let errorData = null;
  try {
    // Only try to parse JSON if there's content
    if (response.headers.get('Content-Length') !== '0' &&
        response.headers.get('Content-Type')?.includes('application/json')) {
      errorData = await response.json();
    }
  } catch (e) {
    // Ignore JSON parsing errors, we'll proceed without error data
    console.warn('Could not parse error response as JSON', e);
  }

  // Client errors (4xx)
  if (status >= 400 && status < 500) {
    let message = `Client error (${status})`;

    // Extract error message from response if available
    if (errorData && typeof errorData === 'object') {
      if (errorData.message) {
        message = errorData.message;
      } else if (errorData.error) {
        message = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      }
    }

    // Override with more specific messages for common status codes
    switch (status) {
      case 400:
        message = errorData?.message || 'Bad request';
        break;
      case 401:
        message = 'Authentication required';
        break;
      case 403:
        message = 'Access forbidden';
        break;
      case 404:
        message = 'Resource not found';
        break;
      case 422:
        message = errorData?.message || 'Validation failed';
        break;
      case 429:
        message = 'Too many requests';
        break;
    }

    throw new ClientError(endpoint, method, status, message, errorData);
  }

  // Server errors (5xx)
  if (status >= 500) {
    let message = `Server error (${status}) while accessing ${endpoint}`;

    // Add more context if available
    if (errorData && typeof errorData === 'object' && errorData.message) {
      message = `Server error: ${errorData.message}`;
    }

    throw new ServerError(endpoint, method, status);
  }

  // Fallback for unexpected status codes
  throw new ApiError(`Unexpected status code: ${status}`, endpoint, method, status);
}

/**
 * Parses JSON safely with error handling
 *
 * @param response - The fetch Response object to parse
 * @returns The parsed JSON data or null if parsing fails
 */
export async function safeJsonParse(response: Response): Promise<any> {
  // Check if response is empty or not JSON
  if (response.status === 204 ||
      response.headers.get('Content-Length') === '0' ||
      !response.headers.get('Content-Type')?.includes('application/json')) {
    return null;
  }

  try {
    // Clone the response to avoid "body already read" errors
    // if the response body has been read before (e.g., in error handling)
    const clonedResponse = response.clone();
    return await clonedResponse.json();
  } catch (error) {
    console.warn('Failed to parse response as JSON:', error);
    return null; // Return null for non-JSON responses or parsing errors
  }
}

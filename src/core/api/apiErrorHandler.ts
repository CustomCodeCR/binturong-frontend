
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
  constructor(endpoint: string, method: string, status: number, detail?: string | null) {
    super(
      detail ? `Server error (${status}): ${detail}` : `Server error (${status})`,
      endpoint,
      method,
      status,
    );
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
 * `true` para `application/json` y para los sufijos `+json`
 * (`application/problem+json`, que es lo que devuelve ASP.NET en los 5xx).
 */
function isJsonPayload(contentType: string | null): boolean {
  const value = (contentType ?? '').toLowerCase();
  return value.includes('application/json') || value.includes('+json');
}

/**
 * Extrae el mensaje real que envió la API.
 *
 * El backend responde con tres formas distintas y ninguna usa `message`:
 *   - validación:  { errors: [{ description }], code, description }
 *   - negocio:     { code: "Taxes.CodeNotUnique", description: "..." }
 *   - ProblemDetails: { title, detail, status }
 * Sin esto, todos los 400 se mostraban como un genérico "Bad request".
 */
export function extractServerMessage(errorData: unknown): string | null {
  if (!errorData || typeof errorData !== 'object') return null;

  const data = errorData as Record<string, any>;

  // Errores de validación: se muestran todos, que es lo que necesita el usuario
  // para saber qué campos corregir.
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const details = data.errors
      .map((item: any) =>
        typeof item === 'string' ? item : item?.description ?? item?.message,
      )
      .filter((text: unknown): text is string => typeof text === 'string' && text.trim() !== '');

    if (details.length > 0) return [...new Set(details)].join(' · ');
  }

  const candidates = [data.description, data.detail, data.message, data.title, data.error];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim() !== '') return candidate;
  }

  return null;
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
        isJsonPayload(response.headers.get('Content-Type'))) {
      errorData = await response.json();
    }
  } catch (e) {
    // Ignore JSON parsing errors, we'll proceed without error data
    console.warn('Could not parse error response as JSON', e);
  }

  // Client errors (4xx)
  if (status >= 400 && status < 500) {
    // El mensaje del servidor siempre gana: dice *qué* falló ("The provided tax
    // code is not unique"), mientras que el genérico por código de estado solo
    // dice que algo falló.
    const serverMessage = extractServerMessage(errorData);

    const fallbackByStatus: Record<number, string> = {
      400: 'Bad request',
      401: 'Authentication required',
      403: 'Access forbidden',
      404: 'Resource not found',
      409: 'The record conflicts with existing data',
      422: 'Validation failed',
      429: 'Too many requests',
    };

    // En 401/403 el detalle del servidor no aporta y puede filtrar información,
    // así que ahí se mantiene el mensaje fijo.
    const message =
      status === 401 || status === 403
        ? fallbackByStatus[status]
        : serverMessage ?? fallbackByStatus[status] ?? `Client error (${status})`;

    throw new ClientError(endpoint, method, status, message, errorData);
  }

  // Server errors (5xx)
  if (status >= 500) {
    throw new ServerError(endpoint, method, status, extractServerMessage(errorData));
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

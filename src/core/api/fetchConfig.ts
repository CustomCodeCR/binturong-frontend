import type { RequestOptions } from "@/core/api/interfaces/requestOptions";
import {
  ApiError,
  ClientError,
  MissingParameterError,
  NetworkError,
  ServerError,
  handleApiResponse,
  safeJsonParse,
} from "@/core/api/apiErrorHandler";

const BASE_URL = import.meta.env.VITE_API_URL as string;

/**
 * Replaces parameters in an endpoint URL with their corresponding values.
 * Parameters in the URL should be in the format {{paramName}}.
 *
 * @param endpoint - The endpoint URL with parameters
 * @param params - Object containing parameter names and their values
 * @returns The endpoint with parameters replaced by their values
 * @throws MissingParameterError if a required parameter is not provided
 */
export function replaceEndpointParams(
  endpoint: string,
  params: Record<string, string>,
): string {
  return endpoint.replace(/{{(\w+)}}/g, (fullMatch, paramName) => {
    if (Object.prototype.hasOwnProperty.call(params, paramName)) {
      return params[paramName];
    }
    throw new MissingParameterError(paramName);
  });
}

/**
 * Makes an HTTP request to the API.
 *
 * @param endpoint - The API endpoint to call
 * @param options - Request configuration options
 * @returns Promise resolving to the response data
 * @throws ApiError or its subclasses if the request fails
 */
export async function fetchClient<T>(
  endpoint: string,
  options: RequestOptions,
): Promise<T> {
  const token = localStorage.getItem("token");

  const defaultHeaders: HeadersInit = {
    ...(options.isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config: RequestInit = {
    method: options.method,
    headers: defaultHeaders,
    body: options?.body
      ? options.isFormData
        ? (options.body as FormData)
        : (JSON.stringify(options.body) as string)
      : undefined,
  };

  try {
    const fullUrl = `${BASE_URL}${endpoint}`;
    const response = await fetch(fullUrl, config);

    // Handle no-content responses
    if (response.status === 204) {
      return {} as T;
    }

    // Special handling for 404 - return empty object instead of throwing error
    if (response.status === 404) {
      return {} as T;
    }

    // Check for other error responses
    if (!response.ok) {
      await handleApiResponse(response, endpoint, options.method);
      // If handleApiResponse doesn't throw, we'll continue (shouldn't happen)
    }

    // Parse JSON response safely
    const data = await safeJsonParse(response);

    // Handle null response (non-JSON or empty)
    if (data === null) {
      return {} as T;
    }

    return data as T;
  } catch (error) {
    // Log the error for debugging
    console.error("API request failed:", error);

    // Rethrow ApiErrors as they are already properly formatted
    if (error instanceof ApiError) {
      throw error;
    }

    // Convert generic errors to NetworkError for consistent error handling
    throw new NetworkError(endpoint, options.method, error as Error);
  }
}

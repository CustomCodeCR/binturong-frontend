import type { RequestOptions } from "@/core/api/interfaces/requestOptions";
import {
  ApiError,
  MissingParameterError,
  NetworkError,
  handleApiResponse,
  safeJsonParse,
} from "@/core/api/apiErrorHandler";

const BASE_URL = import.meta.env.VITE_API_URL as string;

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

function isJsonContentType(ct: string): boolean {
  const v = ct.toLowerCase();
  return v.includes("application/json") || v.includes("+json");
}

function isBinaryContentType(ct: string): boolean {
  const v = ct.toLowerCase();
  return (
    v.includes("application/pdf") ||
    v.includes("application/octet-stream") ||
    v.includes("application/vnd.ms-excel") || 
    v.includes("application/vnd.openxmlformats-officedocument") ||
    v.includes("application/zip")
  );
}

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

    // No content
    if (response.status === 204) return {} as T;

    // Mantener tu comportamiento actual para 404
    if (response.status === 404) return {} as T;

    // Errors
    if (!response.ok) {
      await handleApiResponse(response, endpoint, options.method);
    }

    const contentType = response.headers.get("content-type") ?? "";

    // ✅ Archivos (PDF/Excel/etc) => Blob
    if (isBinaryContentType(contentType)) {
      return (await response.blob()) as unknown as T;
    }

    // ✅ JSON => safeJsonParse (tu lógica actual) 
    if (isJsonContentType(contentType)) {
      const data = await safeJsonParse(response);
      return (data ?? ({} as unknown)) as T;
    }

    // ✅ Texto u otros => intenta text (y si viene vacío, {})
    if (contentType.toLowerCase().startsWith("text/")) {
      const txt = await response.text();
      return (txt as unknown as T) ?? ({} as T);
    }

    // Fallback: si no sabemos qué es, mejor Blob (más seguro que intentar JSON)
    return (await response.blob()) as unknown as T;
  } catch (error) {
    console.error("API request failed:", error);

    if (error instanceof ApiError) throw error;

    throw new NetworkError(endpoint, options.method, error as Error);
  }
}

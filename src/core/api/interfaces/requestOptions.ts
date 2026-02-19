/**
 * Configuration options for HTTP request operations.
 * Used to define the parameters and behavior of HTTP requests within the application.
 *
 * @interface RequestOptions
 * @since 1.0.0
 *
 * @property {('GET'|'POST'|'PUT'|'DELETE')} method
 *     The HTTP request method to be used. Supports standard RESTful operations.
 *     Required parameter that must be one of the specified HTTP methods.
 *
 * @property {object|FormData} [body]
 *     The payload to be sent with the request. Optional.
 *     - For JSON requests: provide a plain object that will be serialized
 *     - For FormData: provide a FormData instance for file uploads or form submissions
 *     Note: Ignored for GET requests per HTTP specification
 *
 * @property {HeadersInit} [headers]
 *     HTTP headers to be included with the request. Optional.
 *     Follows the standard Fetch API HeadersInit type specification.
 *     Common use cases include setting Content-Type, Authorization, etc.
 *
 * @property {boolean} [isFormData]
 *     Indicates whether the request body should be processed as FormData. Optional.
 *     - When true: the body will be sent as-is, suitable for file uploads
 *     - When false/undefined: the body will be JSON-serialized if necessary
 *
 * @throws {TypeError} Will throw if invalid method is provided
 *
 * @example
 * // Authentication request with JSON payload
 * const authRequest: RequestOptions = {
 *   method: 'POST',
 *   body: {
 *     username: 'user@example.com',
 *     password: '********'
 *   },
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Accept': 'application/json'
 *   }
 * };
 *
 * @example
 * // File upload using FormData
 * const fileUploadRequest: RequestOptions = {
 *   method: 'POST',
 *   body: new FormData(),
 *   isFormData: true,
 *   headers: {
 *     'Accept': 'application/json'
 *   }
 * };
 *
 * @example
 * // Simple data fetch
 * const getDataRequest: RequestOptions = {
 *   method: 'GET',
 *   headers: {
 *     'Authorization': 'Bearer ${token}',
 *     'Accept': 'application/json'
 *   }
 * };
 *
 * @remarks
 * - When using FormData, the Content-Type header is automatically set by the browser
 * - The body parameter is ignored for GET requests
 * - Headers are case-insensitive as per HTTP/1.1 specification
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API Fetch API}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/FormData FormData API}
 */
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: object | FormData;
  headers?: HeadersInit;
  isFormData?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function successResponse<T>(
  data: T,
  statusCode: number = 200,
): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

export function errorResponse(
  error: string,
  statusCode: number = 500,
): ApiResponse {
  return {
    success: false,
    error,
    statusCode,
  };
}

export function createdResponse<T>(data: T): ApiResponse<T> {
  return successResponse(data, HTTP_STATUS.CREATED);
}

export function notFoundResponse(): ApiResponse {
  return errorResponse("Not found", HTTP_STATUS.NOT_FOUND);
}

export function unauthorizedResponse(): ApiResponse {
  return errorResponse("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
}

export function forbiddenResponse(): ApiResponse {
  return errorResponse("Forbidden", HTTP_STATUS.FORBIDDEN);
}

export function badRequestResponse(message: string): ApiResponse {
  return errorResponse(message, HTTP_STATUS.BAD_REQUEST);
}

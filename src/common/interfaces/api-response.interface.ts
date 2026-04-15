export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  errors?: IApiError[];
  timestamp: string;
  traceId: string;
}

export interface IApiError {
  field?: string;
  message: string;
  code?: string | number;
  constraint?: string;
}

export class BusinessError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'BusinessError';
  }
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function success<T>(data: T, message: string = '操作成功'): ApiResponse<T> {
  return { code: 200, data, message };
}

export function fail(code: number = 500, message: string = '操作失败'): ApiResponse<null> {
  return { code, data: null, message };
}

export function page<T>(list: T[], total: number, page: number, pageSize: number): ApiResponse<PageResult<T>> {
  return success({ list, total, page, pageSize });
}

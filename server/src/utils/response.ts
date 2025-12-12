import { Response } from 'express';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function send<T>(res: Response, status: number, payload: ApiResponse<T>) {
  return res.status(status).json(payload);
}

export const ApiRes = {
  ok: <T>(res: Response, data: T) => 
    send(res, 200, { success: true, data }),

  created: <T>(res: Response, data: T) => 
    send(res, 201, { success: true, data }),

  noContent: (res: Response) => 
    res.status(204).send(),

  badRequest: (res: Response, error: string) => 
    send(res, 400, { success: false, error }),

  unauthorized: (res: Response, error = 'Unauthorized') => 
    send(res, 401, { success: false, error }),

  notFound: (res: Response, error = 'Not found') => 
    send(res, 404, { success: false, error }),

  serverError: (res: Response, error = 'Internal server error') => 
    send(res, 500, { success: false, error })
};
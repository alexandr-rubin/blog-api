import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpStatusCode } from '../../helpers/httpStatusCode';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    if(status === HttpStatusCode.BAD_REQUEST_400){
      const res: any = exception.getResponse()
      response
      .status(status)
      .json(res);
    }
    else{
      const res: any = exception.getResponse()
      response
      .status(status)
      .json({
        message: res.message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
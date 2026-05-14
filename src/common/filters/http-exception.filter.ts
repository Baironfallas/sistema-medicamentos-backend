import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponse = {
    statusCode: number;
    message: string | string[];
    error: string;
    path: string;
    timestamp: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const isHttpException = exception instanceof HttpException;

        const statusCode = isHttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = isHttpException
            ? exception.getResponse()
            : null;

        const message = this.getMessage(exceptionResponse);

        const errorResponse: ErrorResponse = {
            statusCode,
            message,
            error: isHttpException
                ? exception.name
                : 'InternalServerErrorException',
            path: request.url,
            timestamp: new Date().toISOString(),
        };

        response.status(statusCode).json(errorResponse);
    }

    private getMessage(exceptionResponse: string | object | null): string | string[] {
        if (typeof exceptionResponse === 'string') {
            return exceptionResponse;
        }

        if (
            exceptionResponse &&
            typeof exceptionResponse === 'object' &&
            'message' in exceptionResponse
        ) {
            const responseMessage = exceptionResponse.message;

            if (typeof responseMessage === 'string' || Array.isArray(responseMessage)) {
                return responseMessage;
            }
        }

        return 'Ha ocurrido un error inesperado.';
    }
}
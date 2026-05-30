import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, } from '@nestjs/common';
import { Request, Response } from 'express';

const TOO_MANY_REQUESTS_STATUS_CODE = 429;

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

        const message = this.getMessage(statusCode, exceptionResponse);

        const errorResponse: ErrorResponse = {
            statusCode,
            message,
            error: this.getErrorName(statusCode, exception),
            path: request.url,
            timestamp: new Date().toISOString(),
        };

        response.status(statusCode).json(errorResponse);
    }

    private getMessage(
        statusCode: number,
        exceptionResponse: string | object | null,
    ): string | string[] {
        if (statusCode === TOO_MANY_REQUESTS_STATUS_CODE) {
            return 'Demasiados intentos. Intenta nuevamente en unos segundos.';
        }

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

    private getErrorName(statusCode: number, exception: unknown): string {
        if (statusCode === TOO_MANY_REQUESTS_STATUS_CODE) {
            return 'Too Many Requests';
        }

        if (exception instanceof HttpException) {
            return exception.name;
        }

        return 'InternalServerErrorException';
    }
}
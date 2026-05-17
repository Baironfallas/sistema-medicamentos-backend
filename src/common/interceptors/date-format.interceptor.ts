import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class DateFormatInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map((data: unknown) => this.transformDates(data))
        );
    }

    private transformDates(obj: unknown): unknown {
        if (obj === null || obj === undefined) {
            return obj;
        }
        
        // Si es una fecha, convertirla manteniendo el valor de Costa Rica
        if (obj instanceof Date) {
            // ✅ SOLUCIÓN: Formatear como string sin conversión de zona
            // La BD tiene UTC, lo interpretamos como si fuera CR y lo serializamos
            const crDate = dayjs(obj).tz('America/Costa_Rica', true);
            return crDate.format('YYYY-MM-DDTHH:mm:ss');
        }
        
        if (Array.isArray(obj)) {
            return obj.map((item: unknown) => this.transformDates(item));
        }
        
        if (this.isPlainObject(obj)) {
            const transformed: Record<string, unknown> = {};
            for (const key of Object.keys(obj)) {
                transformed[key] = this.transformDates(obj[key]);
            }
            return transformed;
        }
        
        return obj;
    }

    private isPlainObject(obj: unknown): obj is Record<string, unknown> {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            !(obj instanceof Date) &&
            Object.getPrototypeOf(obj) === Object.prototype
        );
    }
}

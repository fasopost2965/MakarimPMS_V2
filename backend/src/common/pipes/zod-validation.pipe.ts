/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    if (
      metadata.type !== 'body' &&
      metadata.type !== 'query' &&
      metadata.type !== 'param'
    ) {
      return value;
    }
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const formatted = result.error.format();
      for (const key of Object.keys(formatted)) {
        if (key === '_errors') continue;
        const errs = (formatted as any)[key]?._errors;
        if (errs && errs.length > 0) {
          fieldErrors[key] = errs[0];
        }
      }
      console.error('Zod Validation Failure:', {
        metadatatype: metadata.type,
        dataReceived: value,
        zodErrors: fieldErrors,
        rawError: result.error.format(),
      });
      throw new BadRequestException({
        message: 'Erreur de validation Zod (Données invalides)',
        errors:
          Object.keys(fieldErrors).length > 0
            ? fieldErrors
            : { _root: 'Données invalides' },
      });
    }
    return result.data;
  }
}

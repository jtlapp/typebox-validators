import { ValueErrorType } from '@sinclair/typebox/errors';

import { ValidationException } from './validation-exception';
import { TObject, TUnion } from '@sinclair/typebox';

export const DEFAULT_UNKNOWN_TYPE_MESSAGE = 'not a type the union recognizes';

/**
 * Exception thrown when a value is not a member of a branded union.
 */
export class BrandedTypeException extends ValidationException {
  constructor(
    unionSchema: TUnion<TObject[]>,
    value: unknown,
    overallErrorMessage: string
  ) {
    super(overallErrorMessage, [
      {
        type: ValueErrorType.Union,
        path: '',
        schema: unionSchema,
        value,
        message: unionSchema.errorMessage ?? DEFAULT_UNKNOWN_TYPE_MESSAGE,
      },
    ]);
  }
}

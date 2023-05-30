import { Kind } from '@sinclair/typebox';
import { ValueError, ValueErrorIterator } from '@sinclair/typebox/errors';

import { ValidationException } from './validation-exception';

// TODO: rename file to error-utils.ts

// TODO: rename to _MESSAGE
export const DEFAULT_OVERALL_ERROR = 'Invalid value';
export const DEFAULT_UNKNOWN_TYPE_MESSAGE = 'not a type the union recognizes';

const TYPEBOX_REQUIRED_ERROR_MESSAGE = 'Expected required property';

export function adjustErrorMessage(error: ValueError): ValueError {
  if (error.schema.errorMessage !== undefined) {
    error.message = error.schema.errorMessage;
  }
  return error;
}

export function createErrorsIterable(
  typeboxErrorIterator: ValueErrorIterator
): Iterable<ValueError> {
  return {
    [Symbol.iterator]: function* () {
      const errors = typeboxErrorIterator[Symbol.iterator]();
      let result = errors.next();
      let customErrorPath = '???'; // signals no prior path ('' can be root path)
      while (result.value !== undefined) {
        const error = result.value;
        const standardMessage = error.message;
        if (error.path !== customErrorPath) {
          adjustErrorMessage(error);
          if (error.message != standardMessage) {
            customErrorPath = error.path;
            yield error;
          } else if (
            // drop 'required' errors for values that have constraints
            error.message != TYPEBOX_REQUIRED_ERROR_MESSAGE ||
            ['Any', 'Unknown'].includes(error.schema[Kind])
          ) {
            yield error;
          }
        }
        result = errors.next();
      }
    },
  };
}

export function throwInvalidAssert(
  overallError: string | undefined,
  firstError: ValueError
): never {
  adjustErrorMessage(firstError);
  throw new ValidationException(
    overallError === undefined
      ? DEFAULT_OVERALL_ERROR
      : overallError.replace(
          '{error}',
          ValidationException.errorToString(firstError)
        ),
    [firstError]
  );
}

export function throwInvalidValidate(
  overallError: string | undefined,
  errorOrErrors: ValueError | ValueErrorIterator
): never {
  throw new ValidationException(
    overallError ?? DEFAULT_OVERALL_ERROR,
    errorOrErrors instanceof ValueErrorIterator
      ? [...createErrorsIterable(errorOrErrors)]
      : [errorOrErrors]
  );
}

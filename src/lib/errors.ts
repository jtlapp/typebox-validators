import { ValueError, ValueErrorIterator } from '@sinclair/typebox/errors';

export const DEFAULT_OVERALL_ERROR = 'Invalid value';

export function createErrorsIterable(
  typeboxErrorIterator: ValueErrorIterator
): Iterable<ValueError> {
  return {
    [Symbol.iterator]: function* () {
      const errors = typeboxErrorIterator[Symbol.iterator]();
      let result = errors.next();
      let customErrorPath = '';
      while (result.value !== undefined) {
        const error = result.value;
        const standardMessage = error.message;
        if (error.path !== customErrorPath) {
          adjustErrorMessage(error);
          if (error.message != standardMessage) {
            customErrorPath = error.path;
          }
          yield error;
        }
        result = errors.next();
      }
    },
  };
}

export function adjustErrorMessage(error: ValueError): ValueError {
  const schema = error.schema;
  if (schema.errorMessage !== undefined) {
    error.message = schema.errorMessage.replace(
      '{field}',
      error.path.substring(1)
    );
  }
  return error;
}

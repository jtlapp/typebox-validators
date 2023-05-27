import { ValueError, ValueErrorIterator } from '@sinclair/typebox/errors';

export const DEFAULT_OVERALL_ERROR = 'Invalid value';

export function createErrorsIterable(
  typeboxErrorIterator: ValueErrorIterator
): Iterable<ValueError> {
  const errors = typeboxErrorIterator[Symbol.iterator]();
  return {
    [Symbol.iterator]: () => ({
      next: () => {
        const result = errors.next();
        return result.value === undefined
          ? result
          : {
              done: result.done,
              value: adjustErrorMessage(result.value),
            };
      },
    }),
  };
}

export function adjustErrorMessage(error: ValueError): ValueError {
  const schema = error.schema;
  if (schema.errorMessage !== undefined) {
    error.message = schema.errorMessage.replace('{field}', error.path);
  }
  return error;
}

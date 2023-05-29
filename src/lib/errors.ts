import { Kind } from '@sinclair/typebox';
import { ValueError, ValueErrorIterator } from '@sinclair/typebox/errors';

// TODO: rename to _MESSAGE
export const DEFAULT_OVERALL_ERROR = 'Invalid value';
export const DEFAULT_UNKNOWN_TYPE_MESSAGE = 'not a type the union recognizes';

const TYPEBOX_REQUIRED_ERROR_MESSAGE = 'Expected required property';

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
            error.schema[Kind] == 'Any'
          ) {
            yield error;
          }
        }
        result = errors.next();
      }
    },
  };
}

export function adjustErrorMessage(error: ValueError): ValueError {
  const schema = error.schema;
  if (schema.errorMessage !== undefined) {
    error.message = substituteFieldInMessage(error.path, schema.errorMessage);
  }
  return error;
}

export function substituteFieldInMessage(
  path: string,
  message: string
): string {
  const field = path.length <= 1 ? 'Value' : path.substring(1);
  return message.replace('{field}', field);
}

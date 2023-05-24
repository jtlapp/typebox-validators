import { TSchema } from '@sinclair/typebox';
import { ValueError, ValueErrorType } from '@sinclair/typebox/value';

/**
 * Class representing a single validation error, corresponding to an
 * instance of `ValueError` from TypeBox.
 */
export class SpecificValidationError implements ValueError {
  type: ValueErrorType;
  path: string;
  schema: TSchema;
  value: any;
  message: string;

  constructor(valueError: ValueError) {
    this.type = valueError.type;
    this.path = valueError.path;
    this.schema = valueError.schema;
    this.value = valueError.value;
    this.message = valueError.message;
  }

  /**
   * Returns a string representation of the specific error at the indicated
   * index. If the error is for a schema that provided an `specificError`
   * property, the string is the value of that property. In this case, if the
   * value is a property of an object, the substring "{field}" (when present)
   * is replaced with the name of the key path to the field that failed
   * validation. Otherwise, if the schema did not provide an `specificError`,
   * the string is the error message that TypeBox provides, though if it is
   * for a property of an object, the string has the form "{field}: {message}".
   * @returns a string representation of the validation error
   */
  toString(): string {
    if (this.schema.specificError !== undefined) {
      const field = this.path ? this.path.substring(1) : '';
      return this.schema.specificError.replace('{field}', field);
    }
    return this.path !== ''
      ? `${this.path.substring(1)}: ${this.message}`
      : this.message;
  }
}

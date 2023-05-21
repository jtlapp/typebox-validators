/**
 * Classes supporting LazyValidator validation errors.
 */

import type { ValueError } from '@sinclair/typebox/compiler';
import ExtendableError from 'es6-error';
import { ErrorSchemaOptions } from './error-schema-options';
import { TSchema } from '@sinclair/typebox';

/**
 * Reports the occurrence of one or more validation errors.
 */
export class ValidationException extends ExtendableError {
  /**
   * Details of the individual validation errors
   */
  readonly details: InvalidValueDetail[];

  /**
   * Constructor
   *
   * @param message Error message
   * @param errors Validation errors as reported by TypeBox
   *
   */
  constructor(message: string, errors: ValueError[] = []) {
    super(message);
    this.details = errors.map((err) => new InvalidValueDetail(err));
  }

  /**
   * Returns a string representation of the error.
   *
   * @param includeDetails Whether to append to the error message
   *    descriptions of the individual validation errors
   * @returns a string representation of the error.
   */
  override toString(includeDetails = true): string {
    let message = this.message;
    if (includeDetails && this.details.length > 0) {
      if (this.details.length == 1) {
        message += ': ' + this.details[0].toString();
      } else {
        message += ':';
        for (const detail of this.details) {
          message += '\n- ' + detail.toString();
        }
      }
    }
    return message;
  }
}

/**
 * Class representing a single validation error. Encapsulates TypeBox
 * error details in order to be able to give them string representations.
 */
export class InvalidValueDetail {
  /**
   * Associated TypeBox `ValueError` providing details of the error. If the
   * schema assigned a custom message to the error, that message will appear
   * verbatim within the key `error.schema.errorMessage`.
   */
  readonly error: ValueError;

  /**
   * Constructor
   *
   * @param error TypeBox detailed characterization of the error
   */
  constructor(error: ValueError) {
    this.error = error;
  }

  /**
   * Returns a string representation of the a TypeBox validation error.
   * If the schema assigned a custom message to the error, and if the
   * validated value was an object, the string "{field}" will be replaced
   * with the key of the object that failed validation.
   *
   * @returns a string representation of the a TypeBox validation error
   */
  toString(): string {
    const error = this.error;
    const schema: TSchema & ErrorSchemaOptions = error.schema;
    if (schema.errorMessage !== undefined) {
      const field = error.path ? error.path.substring(1) : '';
      return schema.errorMessage.replace('{field}', field);
    }
    return error.path
      ? `${error.path.substring(1)}: ${error.message}`
      : error.message;
  }
}

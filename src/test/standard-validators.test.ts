import { TSchema, Type } from '@sinclair/typebox';

import { StandardValidator } from '../validators/standard-validator';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import { ValidationException } from '../lib/validation-exception';
import { AbstractValidator } from '../validators/abstract-validator';

const OVERALL_MESSAGE = 'Invalid standard value';

describe('standard validators', () => {
  const schema1 = Type.Object({
    delta: Type.Integer(),
    count: Type.Integer({ exclusiveMinimum: 0 }),
    name: Type.RegEx(/[a-zA-Z]+/, {
      minLength: 5,
      maxLength: 10,
      specificError: 'name should consist of 5-10 letters',
    }),
  });

  const schema2 = Type.Object({
    int1: Type.Integer({ specificError: '{field} must be an integer' }),
    int2: Type.Integer({ specificError: '{field} must be an integer' }),
    alpha: Type.RegEx(/[a-zA-Z]+/, { maxLength: 4 }),
  });

  testStandardValidation(
    'StandardValidator()',
    new StandardValidator(schema1),
    new StandardValidator(schema2)
  );
  testStandardValidation(
    'CompilingStandardValidator()',
    new CompilingStandardValidator(schema1),
    new CompilingStandardValidator(schema2)
  );
});

function testStandardValidation(
  description: string,
  validator1: AbstractValidator<TSchema>,
  validator2: AbstractValidator<TSchema>
) {
  describe(description, () => {
    describe('safeValidate()', () => {
      it('accepts valid values', () => {
        let validObject = { delta: 0, count: 1, name: 'ABCDE' };
        let schema = validator1.safeValidate(validObject, OVERALL_MESSAGE);
        expect(schema).toBe(validator1.schema);

        validObject = { delta: -5, count: 125, name: 'ABCDEDEFGH' };
        schema = validator1.safeValidate(validObject, OVERALL_MESSAGE);
        expect(schema).toBe(validator1.schema);
      });

      it('rejects objects with single invalid fields reporting a single error', () => {
        expect.assertions(4);
        try {
          const invalidObject = { delta: 0.5, count: 1, name: 'ABCDE' };
          validator1.safeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = OVERALL_MESSAGE;
          const specific = 'delta: Expected integer';
          expect(err.message).toEqual(message);
          expect(err.specifics[0].toString()).toEqual(specific);
          expect(err.toString()).toEqual(`${message}: ${specific}`);
        }
      });

      it('rejects objects with multiple invalid fields reporting a single error', () => {
        expect.assertions(3);
        try {
          const invalidObject = { delta: 0.5, count: 0, name: 'ABCDE' };
          validator1.safeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = 'delta: Expected integer';
          expect(err.specifics[0].toString()).toEqual(message);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ` + message);
        }
      });

      it('rejects objects with multiply invalid field reporting a single error', () => {
        expect.assertions(3);
        try {
          const invalidObject = { int1: 1, int2: 1, alpha: 'ABCDE' };
          validator2.safeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = 'alpha: Expected string length less or equal to 4';
          expect(err.specifics[0].toString()).toEqual(message);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ` + message);
        }
      });

      it('rejects objects reporting a custom error message', () => {
        expect.assertions(3);
        try {
          const invalidObject = { delta: 1, count: 1, name: '12345' };
          validator1.safeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = 'name should consist of 5-10 letters';
          expect(err.specifics[0].toString()).toEqual(message);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ` + message);
        }
      });
    });

    describe('safeValidateAndCleanCopy()', () => {
      it('validates valid objects and returns schema and cleaned value', () => {
        let validObject = { delta: 0, count: 1, name: 'ABCDE' };
        let [schema, value] = validator1.safeValidateAndCleanCopy(
          validObject,
          OVERALL_MESSAGE
        );
        expect(schema).toBe(validator1.schema);
        expect(value).toEqual(validObject);
        expect(value).not.toBe(validObject);

        validObject = { delta: -5, count: 125, name: 'ABCDEDEFGH' };
        [schema, value] = validator1.safeValidateAndCleanCopy(
          validObject,
          OVERALL_MESSAGE
        );
        expect(schema).toBe(validator1.schema);
        expect(value).toEqual({ delta: -5, count: 125, name: 'ABCDEDEFGH' });
        expect(value).not.toBe(validObject);
      });

      it('fails to validate on invalid objects (default message)', () => {
        expect.assertions(4);
        try {
          const invalidObject = { delta: 0.5, count: 1, name: 'ABCDE' };
          validator1.safeValidateAndCleanCopy(invalidObject);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = 'Invalid value';
          const specific = 'delta: Expected integer';
          expect(err.message).toEqual(message);
          expect(err.specifics[0].toString()).toEqual(specific);
          expect(err.toString()).toEqual(`${message}: ${specific}`);
        }
      });

      it('fails to validate on invalid objects (custom message)', () => {
        expect.assertions(4);
        try {
          const invalidObject = { delta: 0.5, count: 1, name: 'ABCDE' };
          validator1.safeValidateAndCleanCopy(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = OVERALL_MESSAGE;
          const specific = 'delta: Expected integer';
          expect(err.message).toEqual(message);
          expect(err.specifics[0].toString()).toEqual(specific);
          expect(err.toString()).toEqual(`${message}: ${specific}`);
        }
      });
    });

    describe('safeValidateAndCleanOriginal()', () => {
      it('validates valid objects, returns schema, and cleans original value', () => {
        let value = { delta: 0, count: 1, name: 'ABCDE', foo: 'bar' };
        let schema = validator1.safeValidateAndCleanOriginal(
          value,
          OVERALL_MESSAGE
        );
        expect(schema).toBe(validator1.schema);
        expect(value).toEqual({ delta: 0, count: 1, name: 'ABCDE' });

        value = { foo: 'bar', delta: -5, count: 125, name: 'ABCDEDEFGH' };
        schema = validator1.safeValidateAndCleanOriginal(
          value,
          OVERALL_MESSAGE
        );
        expect(schema).toBe(validator1.schema);
        expect(value).toEqual({ delta: -5, count: 125, name: 'ABCDEDEFGH' });
      });

      it('fails to validate on invalid objects (default message)', () => {
        expect.assertions(4);
        try {
          const invalidObject = { delta: 0.5, count: 1, name: 'ABCDE' };
          validator1.safeValidateAndCleanOriginal(invalidObject);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = 'Invalid value';
          const specific = 'delta: Expected integer';
          expect(err.message).toEqual(message);
          expect(err.specifics[0].toString()).toEqual(specific);
          expect(err.toString()).toEqual(`${message}: ${specific}`);
        }
      });

      it('fails to validate on invalid objects (custom message)', () => {
        expect.assertions(4);
        try {
          const invalidObject = { delta: 0.5, count: 1, name: 'ABCDE' };
          validator1.safeValidateAndCleanOriginal(
            invalidObject,
            OVERALL_MESSAGE
          );
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = OVERALL_MESSAGE;
          const specific = 'delta: Expected integer';
          expect(err.message).toEqual(message);
          expect(err.specifics[0].toString()).toEqual(specific);
          expect(err.toString()).toEqual(`${message}: ${specific}`);
        }
      });
    });

    describe('unsafeValidate()', () => {
      it('accepts valid values', () => {
        let validObject = { delta: 0, count: 1, name: 'ABCDE' };
        let schema = validator1.unsafeValidate(validObject, OVERALL_MESSAGE);
        expect(schema).toBe(validator1.schema);

        validObject = { delta: -5, count: 125, name: 'ABCDEDEFGH' };
        schema = validator1.unsafeValidate(validObject, OVERALL_MESSAGE);
        expect(schema).toBe(validator1.schema);
      });

      it('rejects objects with single invalid field reporting a single error', () => {
        expect.assertions(3);
        try {
          const invalidObject = { delta: 0.5, count: 1, name: 'ABCDE' };
          validator1.unsafeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(1);
          const message = 'delta: Expected integer';
          expect(err.specifics[0].toString()).toEqual(message);
          expect(err.toString()).toEqual(`${OVERALL_MESSAGE}: ` + message);
        }
      });

      it('rejects objects with multiple invalid fields reporting all errors', () => {
        expect.assertions(5);
        try {
          const invalidObject = { delta: 0.5, count: 0, name: 'ABCDEGHIJKLMN' };
          validator1.unsafeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(3);
          const message1 = 'delta: Expected integer';
          const message2 = 'count: Expected integer to be greater than 0';
          const message3 = 'name should consist of 5-10 letters';
          expect(err.specifics[0].toString()).toEqual(message1);
          expect(err.specifics[1].toString()).toEqual(message2);
          expect(err.specifics[2].toString()).toEqual(message3);
          expect(err.toString()).toEqual(
            `${OVERALL_MESSAGE}:\n- ${message1}\n- ${message2}\n- ${message3}`
          );
        }
      });

      it('rejects objects with multiply invalid field reporting all errors', () => {
        expect.assertions(4);
        try {
          const invalidObject = { int1: 1, int2: 1, alpha: '12345' };
          validator2.unsafeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(2);
          const message1 = 'alpha: Expected string length less or equal to 4';
          const message2 = 'alpha: Expected string to match pattern [a-zA-Z]+';
          expect(err.specifics[0].toString()).toEqual(message1);
          expect(err.specifics[1].toString()).toEqual(message2);
          expect(err.toString()).toEqual(
            `${OVERALL_MESSAGE}:\n- ${message1}\n- ${message2}`
          );
        }
      });

      it('rejects objects reporting custom error messages with fields', () => {
        expect.assertions(4);
        try {
          const invalidObject = { int1: 0.5, int2: 0.5, alpha: 'ABCD' };
          validator2.unsafeValidate(invalidObject, OVERALL_MESSAGE);
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(2);
          const message1 = 'int1 must be an integer';
          const message2 = 'int2 must be an integer';
          expect(err.specifics[0].toString()).toEqual(message1);
          expect(err.specifics[1].toString()).toEqual(message2);
          expect(err.toString()).toEqual(
            `${OVERALL_MESSAGE}:\n- ${message1}\n- ${message2}`
          );
        }
      });

      it('allows exceptions having no specifics', () => {
        expect.assertions(2);
        try {
          throw new ValidationException('Invalid');
        } catch (err: unknown) {
          if (!(err instanceof ValidationException)) throw err;
          expect(err.specifics.length).toEqual(0);
          expect(err.toString()).toEqual('Invalid');
        }
      });
    });
  });
}

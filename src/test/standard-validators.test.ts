import { TSchema } from '@sinclair/typebox';

import { StandardValidator } from '../validators/standard-validator';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import { ValidationException } from '../lib/validation-exception';
import {
  SimpleWrapper1,
  SimpleWrapper2,
  ValidatorFactory,
} from './test-wrappers';

describe('StandardValidator', () => {
  const validatorFactory = <S extends TSchema>(
    schema: S
  ): StandardValidator<S> => new StandardValidator(schema);
  testSimpleValidation(validatorFactory);
});

describe('CompilingStandardValidator', () => {
  const validatorFactory = <S extends TSchema>(
    schema: S
  ): StandardValidator<S> => new CompilingStandardValidator(schema);
  testSimpleValidation(validatorFactory);
});

function testSimpleValidation(validatorFactory: ValidatorFactory) {
  describe('safeValidate()', () => {
    it('accepts valid objects', () => {
      expect(
        () => new SimpleWrapper1(validatorFactory, 0, 1, 'ABCDE')
      ).not.toThrow();
      expect(
        () => new SimpleWrapper1(validatorFactory, -5, 125, 'ABCDEDEFGH')
      ).not.toThrow();
    });

    it('rejects objects with single invalid fields reporting a single error', () => {
      expect.assertions(4);
      try {
        new SimpleWrapper1(validatorFactory, 0.5, 1, 'ABCDE').safeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(1);
        const message = 'Bad SimpleWrapper1';
        const detail = 'delta: Expected integer';
        expect(err.message).toEqual(message);
        expect(err.details[0].toString()).toEqual(detail);
        expect(err.toString()).toEqual(`${message}: ${detail}`);
      }
    });

    it('rejects objects with multiple invalid fields reporting a single error', () => {
      expect.assertions(3);
      try {
        new SimpleWrapper1(validatorFactory, 0.5, 0, 'ABCDE').safeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(1);
        const message = 'delta: Expected integer';
        expect(err.details[0].toString()).toEqual(message);
        expect(err.toString()).toEqual('Bad SimpleWrapper1: ' + message);
      }
    });

    it('rejects objects with multiply invalid field reporting a single error', () => {
      expect.assertions(3);
      try {
        new SimpleWrapper2(validatorFactory, 1, 1, 'ABCDE').safeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(1);
        const message = 'alpha: Expected string length less or equal to 4';
        expect(err.details[0].toString()).toEqual(message);
        expect(err.toString()).toEqual('Bad SimpleWrapper2: ' + message);
      }
    });

    it('rejects objects reporting a custom error message', () => {
      expect.assertions(3);
      try {
        new SimpleWrapper1(validatorFactory, 1, 1, '12345').safeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(1);
        const message = 'name should consist of 5-10 letters';
        expect(err.details[0].toString()).toEqual(message);
        expect(err.toString()).toEqual('Bad SimpleWrapper1: ' + message);
      }
    });
  });

  describe('unsafeValidate()', () => {
    it('rejects objects with single invalid field reporting a single error', () => {
      expect.assertions(3);
      try {
        new SimpleWrapper1(validatorFactory, 0.5, 1, 'ABCDE').unsafeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(1);
        const message = 'delta: Expected integer';
        expect(err.details[0].toString()).toEqual(message);
        expect(err.toString()).toEqual('Bad SimpleWrapper1: ' + message);
      }
    });

    it('rejects objects with multiple invalid fields reporting all errors', () => {
      expect.assertions(5);
      try {
        new SimpleWrapper1(
          validatorFactory,
          0.5,
          0,
          'ABCDEGHIJKLMN'
        ).unsafeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(3);
        const message1 = 'delta: Expected integer';
        const message2 = 'count: Expected integer to be greater than 0';
        const message3 = 'name should consist of 5-10 letters';
        expect(err.details[0].toString()).toEqual(message1);
        expect(err.details[1].toString()).toEqual(message2);
        expect(err.details[2].toString()).toEqual(message3);
        expect(err.toString()).toEqual(
          `Bad SimpleWrapper1:\n- ${message1}\n- ${message2}\n- ${message3}`
        );
      }
    });

    it('rejects objects with multiply invalid field reporting all errors', () => {
      expect.assertions(4);
      try {
        new SimpleWrapper2(validatorFactory, 1, 1, '12345').unsafeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(2);
        const message1 = 'alpha: Expected string length less or equal to 4';
        const message2 = 'alpha: Expected string to match pattern [a-zA-Z]+';
        expect(err.details[0].toString()).toEqual(message1);
        expect(err.details[1].toString()).toEqual(message2);
        expect(err.toString()).toEqual(
          `Bad SimpleWrapper2:\n- ${message1}\n- ${message2}`
        );
      }
    });

    it('rejects objects reporting custom error messages with fields', () => {
      expect.assertions(4);
      try {
        new SimpleWrapper2(validatorFactory, 0.5, 0.5, 'ABCD').unsafeValidate();
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(2);
        const message1 = 'int1 must be an integer';
        const message2 = 'int2 must be an integer';
        expect(err.details[0].toString()).toEqual(message1);
        expect(err.details[1].toString()).toEqual(message2);
        expect(err.toString()).toEqual(
          `Bad SimpleWrapper2:\n- ${message1}\n- ${message2}`
        );
      }
    });

    it('allows exceptions having no details', () => {
      expect.assertions(2);
      try {
        throw new ValidationException('Invalid');
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(0);
        expect(err.toString()).toEqual('Invalid');
      }
    });
  });

  describe('validate()', () => {
    it('performs safe or unsafe validation as requested', () => {
      expect.assertions(8);

      // test safe validation
      try {
        new SimpleWrapper1(validatorFactory, 0.5, 0, 'ABCDEGHIJKLMN').validate(
          true
        );
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(1);
        const message1 = 'delta: Expected integer';
        expect(err.details[0].toString()).toEqual(message1);
        expect(err.toString()).toEqual(`Bad SimpleWrapper1: ${message1}`);
      }

      // test unsafe validation
      try {
        new SimpleWrapper1(validatorFactory, 0.5, 0, 'ABCDEGHIJKLMN').validate(
          false
        );
      } catch (err: unknown) {
        if (!(err instanceof ValidationException)) throw err;
        expect(err.details.length).toEqual(3);
        const message1 = 'delta: Expected integer';
        const message2 = 'count: Expected integer to be greater than 0';
        const message3 = 'name should consist of 5-10 letters';
        expect(err.details[0].toString()).toEqual(message1);
        expect(err.details[1].toString()).toEqual(message2);
        expect(err.details[2].toString()).toEqual(message3);
        expect(err.toString()).toEqual(
          `Bad SimpleWrapper1:\n- ${message1}\n- ${message2}\n- ${message3}`
        );
      }
    });
  });
}

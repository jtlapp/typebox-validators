import { TSchema, Type } from '@sinclair/typebox';

import { StandardValidator } from '../validators/standard-validator';
import { CompilingStandardValidator } from '../validators/compiling-standard-validator';
import { ValidationException } from '../lib/validation-exception';
import { AbstractValidator } from '../validators/abstract-validator';

describe('standard validators', () => {
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
});

type ValidatorFactory = <S extends TSchema>(schema: S) => AbstractValidator<S>;

class SimpleWrapper {
  constructor(readonly validator: AbstractValidator<TSchema>) {}
}

class SimpleWrapper1 extends SimpleWrapper {
  delta: number;
  count: number;
  name: string;

  static readonly schema = Type.Object({
    delta: Type.Integer(),
    count: Type.Integer({ exclusiveMinimum: 0 }),
    name: Type.RegEx(/[a-zA-Z]+/, {
      minLength: 5,
      maxLength: 10,
      errorMessage: 'name should consist of 5-10 letters',
    }),
  });

  constructor(
    validatorFactory: ValidatorFactory,
    delta: number,
    count: number,
    name: string
  ) {
    super(validatorFactory(SimpleWrapper1.schema));
    this.delta = delta;
    this.count = count;
    this.name = name;
  }

  safeValidate() {
    return this.validator.safeValidate(this, 'Bad SimpleWrapper1');
  }

  safeValidateAndCleanCopy() {
    return this.validator.safeValidateAndCleanCopy(this, 'Bad SimpleWrapper1');
  }

  unsafeValidate() {
    return this.validator.unsafeValidate(this, 'Bad SimpleWrapper1');
  }

  validate(safely: boolean) {
    this.validator.validate(this, 'Bad SimpleWrapper1', safely);
  }
}

class SimpleWrapper2 extends SimpleWrapper {
  int1: number;
  int2: number;
  alpha: string;

  static readonly schema = Type.Object({
    int1: Type.Integer({ errorMessage: '{field} must be an integer' }),
    int2: Type.Integer({ errorMessage: '{field} must be an integer' }),
    alpha: Type.RegEx(/[a-zA-Z]+/, { maxLength: 4 }),
  });

  constructor(
    validatorFactory: ValidatorFactory,
    int1: number,
    int2: number,
    alpha: string
  ) {
    super(validatorFactory(SimpleWrapper2.schema));
    this.int1 = int1;
    this.int2 = int2;
    this.alpha = alpha;
  }

  safeValidate() {
    return this.validator.safeValidate(this, 'Bad SimpleWrapper2');
  }

  safeValidateAndCleanCopy() {
    return this.validator.safeValidateAndCleanCopy(this, 'Bad SimpleWrapper2');
  }

  unsafeValidate() {
    return this.validator.unsafeValidate(this, 'Bad SimpleWrapper2');
  }
}

function testSimpleValidation(validatorFactory: ValidatorFactory) {
  describe('safeValidate()', () => {
    it('accepts valid values', () => {
      let schema = new SimpleWrapper1(
        validatorFactory,
        0,
        1,
        'ABCDE'
      ).safeValidate();
      expect(schema).toBe(SimpleWrapper1.schema);

      schema = new SimpleWrapper1(
        validatorFactory,
        -5,
        125,
        'ABCDEDEFGH'
      ).safeValidate();
      expect(schema).toBe(SimpleWrapper1.schema);
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

  describe('safeValidateAndCleanCopy()', () => {
    it('validates on valid objects and returns schema and cleaned value', () => {
      let [schema, value] = new SimpleWrapper1(
        validatorFactory,
        0,
        1,
        'ABCDE'
      ).safeValidateAndCleanCopy();
      expect(schema).toBe(SimpleWrapper1.schema);
      expect(value).toEqual({ delta: 0, count: 1, name: 'ABCDE' });

      [schema, value] = new SimpleWrapper1(
        validatorFactory,
        -5,
        125,
        'ABCDEDEFGH'
      ).safeValidateAndCleanCopy();
      expect(schema).toBe(SimpleWrapper1.schema);
      expect(value).toEqual({ delta: -5, count: 125, name: 'ABCDEDEFGH' });
    });

    it('fails to validate on invalid objects', () => {
      expect.assertions(4);
      try {
        new SimpleWrapper1(
          validatorFactory,
          0.5,
          1,
          'ABCDE'
        ).safeValidateAndCleanCopy();
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
  });

  describe('unsafeValidate()', () => {
    it('accepts valid values', () => {
      let schema = new SimpleWrapper1(
        validatorFactory,
        0,
        1,
        'ABCDE'
      ).unsafeValidate();
      expect(schema).toBe(SimpleWrapper1.schema);

      schema = new SimpleWrapper1(
        validatorFactory,
        -5,
        125,
        'ABCDEDEFGH'
      ).unsafeValidate();
      expect(schema).toBe(SimpleWrapper1.schema);
    });

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

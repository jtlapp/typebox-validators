import { TObject, TUnion, Type } from '@sinclair/typebox';

import { ValueBrandedValidator } from '../validators/value-branded-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingValueBrandedValidator } from '../validators/compiling-value-branded-validator';

const OVERALL_MESSAGE = 'Bad union';

describe('value branded validators', () => {
  const union = Type.Union(
    [
      Type.Object(
        {
          t: Type.Literal('t1'),
          str1: Type.String(),
          str2: Type.Optional(Type.String()),
        },
        { uniqueKey: 's' }
      ),
      Type.Object(
        {
          t: Type.Literal('t2'),
          int1: Type.Integer(),
          int2: Type.Optional(Type.Integer()),
        },
        { uniqueKey: 'i' }
      ),
    ],
    { discriminantKey: 't' }
  );

  testValueBrandedValidation(
    'ValueBrandedValidator()',
    new ValueBrandedValidator(union)
  );
  testValueBrandedValidation(
    'CompilingValueBrandedValidator()',
    new CompilingValueBrandedValidator(union)
  );
});

function testValueBrandedValidation(
  description: string,
  validator: AbstractValidator<TUnion<TObject[]>>
) {
  describe(description, () => {
    it('accepts only valid value branded unions', () => {
      // expect(Value.Check(vSchema, { type: 's', str1: 'hello' })).toBe(true);
      // expect(Value.Check(vSchema, { type: 'i', int1: 1 })).toBe(true);

      // expect(Value.Check(vSchema, { type: 's', str1: 'hello', int1: 1 })).toBe(
      //   true
      // );
      // expect(Value.Check(vSchema, { type: 'i', str1: 'hello', int1: 1 })).toBe(
      //   true
      // );

      // expect(Value.Check(vSchema, { type: 's', int1: 1 })).toBe(false);
      // expect(Value.Check(vSchema, { type: 'i', str1: 'hello' })).toBe(false);
      // expect(Value.Check(vSchema, { type: 'x', str1: 'hello', int1: 1 })).toBe(
      //   false
      // );
      // expect(Value.Check(vSchema, { str1: 'hello', int1: 1 })).toBe(false);
      // expect(Value.Check(vSchema, {})).toBe(false);

      // expect(Value.Check(vSchema, undefined)).toBe(false);
      // expect(Value.Check(vSchema, null)).toBe(false);
      // expect(Value.Check(vSchema, true)).toBe(false);
      // expect(Value.Check(vSchema, 1)).toBe(false);
      // expect(Value.Check(vSchema, 'hello')).toBe(false);

      checkValidations(validator, { s: 'hello', str1: 'hello' }, true);
      checkValidations(validator, { i: 1, int1: 1 }, true);

      checkValidations(validator, { s: 'hello', str1: 'hello', int1: 1 }, true);
      checkValidations(validator, { i: 1, str1: 'hello', int1: 1 }, true);

      checkValidations(validator, { s: 'hello', int1: 1 }, false);
      checkValidations(validator, { i: 1, str1: 'hello' }, false);
      checkValidations(
        validator,
        { x: 'hello', str1: 'hello', int1: 1 },
        false
      );
      checkValidations(validator, { str1: 'hello', int1: 1 }, false);
      checkValidations(validator, {}, false);

      checkValidations(validator, undefined, false);
      checkValidations(validator, null, false);
      checkValidations(validator, true, false);
      checkValidations(validator, 1, false);
      checkValidations(validator, 'hello', false);
    });
  });
}

function checkValidations(
  validator: AbstractValidator<TUnion<TObject[]>>,
  value: any,
  valid: boolean
): void {
  tryValidation(valid, () => validator.safeValidate(value, OVERALL_MESSAGE));
  tryValidation(valid, () => validator.validate(value, OVERALL_MESSAGE, true));

  tryValidation(valid, () => validator.unsafeValidate(value, OVERALL_MESSAGE));
  tryValidation(valid, () => validator.validate(value, OVERALL_MESSAGE, false));
}

function tryValidation(valid: boolean, validate: () => void): void {
  if (valid) {
    expect(validate).not.toThrow();
  } else {
    expect(validate).toThrow(OVERALL_MESSAGE);
  }
}

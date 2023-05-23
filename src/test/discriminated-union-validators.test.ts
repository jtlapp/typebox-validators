import { TObject, TUnion, Type } from '@sinclair/typebox';

import { DiscriminatedUnionValidator } from '../validators/discriminated-union-validator';
import { AbstractValidator } from '../validators/abstract-validator';
import { CompilingDiscriminatedUnionValidator } from '../validators/compiling-discriminated-union-validator';

const OVERALL_MESSAGE = 'Bad union';

describe('discriminated union validators', () => {
  const union = Type.Union(
    [
      Type.Object({
        t: Type.Literal('s'),
        str1: Type.String(),
        str2: Type.Optional(Type.String()),
      }),
      Type.Object({
        t: Type.Literal('i'),
        int1: Type.Integer(),
        int2: Type.Optional(Type.Integer()),
      }),
    ],
    { discriminantKey: 't' }
  );

  testDiscriminatedUnionValidation(
    'DiscriminatedUnionValidator()',
    new DiscriminatedUnionValidator(union)
  );
  testDiscriminatedUnionValidation(
    'CompilingDiscriminatedUnionValidator()',
    new CompilingDiscriminatedUnionValidator(union)
  );
});

function testDiscriminatedUnionValidation(
  description: string,
  validator: AbstractValidator<TUnion<TObject[]>>
) {
  describe(description, () => {
    it('accepts only valid discriminated unions', () => {
      checkValidations(validator, { t: 's', str1: 'hello' }, true);
      checkValidations(validator, { t: 'i', int1: 1 }, true);
      checkValidations(validator, { t: 's', str1: 'hello', int1: 1 }, true);
      checkValidations(validator, { t: 'i', str1: 'hello', int1: 1 }, true);

      checkValidations(validator, { t: 's', int1: 1 }, false);
      checkValidations(validator, { t: 'i', str1: 'hello' }, false);
      checkValidations(validator, { t: 'x', str1: 'hello', int1: 1 }, false);
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

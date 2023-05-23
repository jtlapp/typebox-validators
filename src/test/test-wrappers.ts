import { TSchema, Type } from '@sinclair/typebox';

import { AbstractValidator } from '../validators/abstract-validator';

export type ValidatorFactory = <S extends TSchema>(
  schema: S
) => AbstractValidator<S>;

class SimpleWrapper {
  constructor(readonly validator: AbstractValidator<TSchema>) {}
}

export class SimpleWrapper1 extends SimpleWrapper {
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
    this.validator.safeValidate(this, 'Bad SimpleWrapper1');
  }

  unsafeValidate() {
    this.validator.unsafeValidate(this, 'Bad SimpleWrapper1');
  }

  validate(safely: boolean) {
    this.validator.validate(this, 'Bad SimpleWrapper1', safely);
  }
}

export class SimpleWrapper2 extends SimpleWrapper {
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
    this.validator.safeValidate(this, 'Bad SimpleWrapper2');
  }

  unsafeValidate() {
    this.validator.unsafeValidate(this, 'Bad SimpleWrapper2');
  }
}

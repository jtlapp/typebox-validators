import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { KeyBrandedUnion, ValueBrandedUnion } from './branded-unions';

describe('branded unions', () => {
  it('ValueBrandedUnion accepts only valid values', () => {
    const schema = ValueBrandedUnion({
      brandKey: 'type',
      schemas: [
        Type.Object({
          type: Type.Literal('s'),
          str: Type.String(),
        }),
        Type.Object({
          type: Type.Literal('i'),
          int: Type.Integer(),
        }),
      ],
    });
    expect(Value.Check(schema, { type: 's', str: 'hello' })).toBe(true);
    expect(Value.Check(schema, { type: 'i', int: 1 })).toBe(true);

    expect(Value.Check(schema, { type: 's', str: 'hello', int: 1 })).toBe(true);
    expect(Value.Check(schema, { type: 'i', str: 'hello', int: 1 })).toBe(true);

    expect(Value.Check(schema, { type: 's', int: 1 })).toBe(false);
    expect(Value.Check(schema, { type: 'i', str: 'hello' })).toBe(false);
    expect(Value.Check(schema, { type: 'x', str: 'hello', int: 1 })).toBe(
      false
    );
    expect(Value.Check(schema, { str: 'hello', int: 1 })).toBe(false);
    expect(Value.Check(schema, {})).toBe(false);

    expect(Value.Check(schema, undefined)).toBe(false);
    expect(Value.Check(schema, null)).toBe(false);
    expect(Value.Check(schema, true)).toBe(false);
    expect(Value.Check(schema, 1)).toBe(false);
    expect(Value.Check(schema, 'hello')).toBe(false);
  });

  it('KeyBrandedUnion accepts only valid values', () => {
    const schema = KeyBrandedUnion({
      schemas: [
        Type.Object(
          {
            s: Type.String(),
            str: Type.String(),
          },
          { uniqueKey: 's' }
        ),
        Type.Object(
          {
            i: Type.Integer(),
            int: Type.Integer(),
          },
          { uniqueKey: 'i' }
        ),
      ],
    });

    expect(Value.Check(schema, { s: 'hello', str: 'hello' })).toBe(true);
    expect(Value.Check(schema, { i: 1, int: 1 })).toBe(true);

    expect(Value.Check(schema, { s: 'hello', str: 'hello', int: 1 })).toBe(
      true
    );
    expect(Value.Check(schema, { i: 1, str: 'hello', int: 1 })).toBe(true);

    expect(Value.Check(schema, { s: 'hello', int: 1 })).toBe(false);
    expect(Value.Check(schema, { i: 1, str: 'hello' })).toBe(false);
    expect(Value.Check(schema, { x: 'hello', str: 'hello', int: 1 })).toBe(
      false
    );
    expect(Value.Check(schema, { str: 'hello', int: 1 })).toBe(false);
    expect(Value.Check(schema, {})).toBe(false);

    expect(Value.Check(schema, undefined)).toBe(false);
    expect(Value.Check(schema, null)).toBe(false);
    expect(Value.Check(schema, true)).toBe(false);
    expect(Value.Check(schema, 1)).toBe(false);
    expect(Value.Check(schema, 'hello')).toBe(false);
  });
});

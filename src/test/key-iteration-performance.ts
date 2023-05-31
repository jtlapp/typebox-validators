import { TSchema, Type } from '@sinclair/typebox';

const iterations = [1000, 10000] as const;

const schema = Type.Object({
  key1: Type.String(),
  key2: Type.String(),
  key3: Type.String(),
  key4: Type.String(),
  key5: Type.String(),
  key6: Type.String(),
  key7: Type.String(),
  key8: Type.String(),
  key9: Type.String(),
  key10: Type.String(),
});

console.log('key iteration performance');
{
  console.log('  key iteration speed\n');
  let forInTime = 0;
  let objectKeysTime = 0;
  let objectKeysForEachTime = 0;
  let objectGetOwnPropertyNamesTime = 0;
  let objectGetOwnPropertyNamesForEachTime = 0;

  // Mix the two tests to equally apply system slowdowns across them.
  for (let i = 0; i < iterations[0]; ++i) {
    forInTime += timeFunction(() => {
      let count = 0;
      for (const _ in schema.properties) {
        count++;
      }
      return count;
    });
    objectKeysTime += timeFunction(() => {
      let count = 0;
      for (const _ of Object.keys(schema.properties)) {
        count++;
      }
      return count;
    });
    objectKeysForEachTime += timeFunction(() => {
      let count = 0;
      Object.keys(schema.properties).forEach(() => {
        count++;
      });
      return count;
    });
    objectGetOwnPropertyNamesTime += timeFunction(() => {
      let count = 0;
      for (const _ of Object.getOwnPropertyNames(schema.properties)) {
        count++;
      }
      return count;
    });
    objectGetOwnPropertyNamesForEachTime += timeFunction(() => {
      let count = 0;
      Object.getOwnPropertyNames(schema.properties).forEach(() => {
        count++;
      });
      return count;
    });
  }

  const results: [string, number][] = [];
  results.push(['for in', forInTime]);
  results.push(['Object.keys of', objectKeysTime]);
  results.push(['Object.keys.forEach', objectKeysForEachTime]);
  results.push([
    'Object.getOwnPropertyNames of',
    objectGetOwnPropertyNamesTime,
  ]);
  results.push([
    'Object.getOwnPropertyNames.forEach',
    objectGetOwnPropertyNamesForEachTime,
  ]);
  showResults(results);

  function timeFunction(func: () => number): number {
    let start = performance.now();
    for (let i = 0; i < iterations[1]; ++i) {
      func();
    }
    return performance.now() - start;
  }
}

{
  console.log('  key lookup speed\n');
  let inTime = 0;
  let objectKeysIncludesTime = 0;
  let objectGetOwnPropertyIncludesTime = 0;

  // Mix the two tests to equally apply system slowdowns across them.
  for (let i = 0; i < iterations[0]; ++i) {
    const lookupKeys = ['key1', 'key5', 'key10'];
    inTime += timeFunction((schema) => {
      let count = 0;
      for (const key of lookupKeys) {
        if (key in schema.properties) {
          count++;
        }
      }
      return count;
    });
    objectKeysIncludesTime += timeFunction((schema) => {
      let count = 0;
      for (const key of lookupKeys) {
        if (Object.keys(schema.properties).includes(key)) {
          count++;
        }
      }
      return count;
    });
    objectGetOwnPropertyIncludesTime += timeFunction((schema) => {
      let count = 0;
      for (const key of lookupKeys) {
        if (Object.getOwnPropertyNames(schema.properties).includes(key)) {
          count++;
        }
      }
      return count;
    });
  }

  const results: [string, number][] = [];
  results.push(['in', inTime]);
  results.push(['Object.keys.includes', objectKeysIncludesTime]);
  results.push([
    'Object.getOwnPropertyNames.includes',
    objectGetOwnPropertyIncludesTime,
  ]);
  showResults(results);

  function timeFunction(func: (schema: TSchema) => number): number {
    let start = performance.now();
    for (let i = 0; i < iterations[1]; ++i) {
      func(schema);
    }
    return performance.now() - start;
  }
}

function showResults(results: [string, number][]) {
  results.sort((a, b) => b[1] - a[1]);
  for (const [name, time] of results) {
    console.log(
      `${
        Math.round((time / results[results.length - 1][1]) * 100) / 100
      }x - ${name} (${time}ms)`
    );
  }
  console.log();
}

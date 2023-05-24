# typebox-errors

TypeBox validators with custom errors, discriminated unions, and safe multi-tier handling

- TODO: revisit meaning of rootmost errorMessage
- TODO: test in browser context

## Introduction

The [TypeBox](https://github.com/sinclairzx81/typebox) JSON Schema validator may be the [fastest JSON validator](https://moltar.github.io/typescript-runtime-type-benchmarks/) for JavaScript/TypeScript not requiring a development-time precompilation step. TypeBox provides both the ability to construct and validate JSON, but it is strictly standards compliant and does not offer additional functionality that is commonly needed.

This library provides JSON Schema validators having this additional functionality. It wraps TypeBox validation so you can get TypeBox validation performance and limit your use of TypeBox to just JSON Schema specification. The library provides the following abilities, each of which is optional:

1. Replace TypeBox's validation error messages with your own error messages.
2. Fail validation at the first encountered validation error. This minimizes server resources consumed by faulty or malevolent clients.
3. Collect all validation failures, such as to report all the errors in a user interface form on the browser.
4. Remove unrecognized properties from validated objects, which is important for APIs.
5. Validate discriminated unions, yielding only errors for the schema indicated by the object's discriminant key.
6. Validate heterogeneous unions of objects that need not have any properties in common, yielding only errors for the matching schema.
7. Compile the underlying TypeBox validator only on the first use of a schema, thereafter caching the compilation for subsequent use.
8. Report all validation errors within a single string, such as for debugging purposes.

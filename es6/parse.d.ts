/// <reference types="shexjs" />
import { Store } from "n3.ts";
import { Either } from "fp-ts/Either";
import { FailureResult } from "@shexjs/validator";
import { APG } from "@underlay/apg";
export declare function parseString(input: string, schema: APG.Schema): Either<FailureResult, APG.Instance>;
export declare function parse(store: Store, schema: APG.Schema): Either<FailureResult, APG.Instance>;

/// <reference types="shexjs" />
import { APG } from "@underlay/apg";
import ShExParser from "@shexjs/parser";
export declare function makeShExSchema(typeCache: Map<Exclude<APG.Type, APG.Reference>, string>, schema: APG.Schema): ShExParser.Schema;

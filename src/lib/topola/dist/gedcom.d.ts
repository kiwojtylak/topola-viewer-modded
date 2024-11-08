import { GedcomEntry } from 'parse-gedcom';
import { DateOrRange, JsonGedcomData } from './data';
import {Language} from "../../../languages/languages-loader";

/** Parses a GEDCOM date or date range. */
export declare function getDate(gedcomDate: string): DateOrRange | undefined;
/** Parses a GEDCOM file into a JsonGedcomData structure. */
export declare function gedcomToJson(gedcomContents: string, allLanguages: Language[]): JsonGedcomData;
/** Converts parsed GEDCOM entries into a JsonGedcomData structure. */
export declare function gedcomEntriesToJson(gedcom: GedcomEntry[], allLanguages: Language[]): JsonGedcomData;

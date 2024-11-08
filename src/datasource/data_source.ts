import {IndiInfo} from '../lib/topola';
import {TopolaData} from '../util/gedcom_util';
import {Language} from "../languages/languages-loader";

/** Supported data sources. */
export enum DataSourceEnum {
    UPLOADED,
    GEDCOM_URL,
    EMBEDDED,
}

/** Source specification together with individual selection. */
export interface SourceSelection<SourceSpecT> {
    spec: SourceSpecT;
    selection?: IndiInfo;
    allLanguages?: Language[];
}

/** Interface encapsulating functions specific for a data source. */
export interface DataSource<SourceSpecT> {
    /**
     * Returns true if the application is now loading a completely new data set
     * and the existing one should be wiped.
     */
    isNewData(
        newSource: SourceSelection<SourceSpecT>,
        oldSource: SourceSelection<SourceSpecT>,
        data?: TopolaData,
    ): boolean;

    /** Loads data from the data source. */
    loadData(spec: SourceSelection<SourceSpecT>): Promise<TopolaData>;
}

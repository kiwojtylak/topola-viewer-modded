import {convertGedcom, TopolaData} from '../util/gedcom_util';
import {DataSource, DataSourceEnum, SourceSelection} from './data_source';
import {IndiInfo, JsonGedcomData} from '../lib/topola';
import {TopolaError} from '../util/error';
import AdmZip from 'adm-zip';
import {Language} from ".././model/languages-loader";

export interface UploadSourceSpec {
    source: DataSourceEnum.UPLOADED;
    gedcom: string;
    allLanguages: Language[];
    hash: string;
    images?: Map<string, string>;
}

export interface UrlSourceSpec {
    source: DataSourceEnum.GEDCOM_URL;
    url: string;
    allLanguages: Language[];
    handleCors: boolean;
}

/**
 * Returns a valid IndiInfo object, either with the given indi and generation
 * or with an individual taken from the data and generation 0.
 */
export function getSelection(data: JsonGedcomData, selection?: IndiInfo): IndiInfo {
    // If ID is not given, or it doesn't exist in the data, use the first ID in the data.
    const id = selection && data.indis.some((i) => i.id === selection.id)
        ? selection.id
        : data.indis[0].id;
    return {id, generation: selection?.generation || 0};
}

function prepareData(
    gedcom: string,
    cacheId: string,
    allLanguages: Language[],
    images?: Map<string, string>
): TopolaData {
    const data = convertGedcom(gedcom, allLanguages, images || new Map());
    const serializedData = JSON.stringify(data);
    try {
        sessionStorage.setItem(cacheId, serializedData);
    } catch (e) {
        console.warn('Failed to store data in session storage: ' + e);
    }
    return data;
}

async function loadGedzip(blob: Blob): Promise<{ gedcom: string; images: Map<string, string> }> {
    const zip = new AdmZip(Buffer.from(await blob.arrayBuffer()));
    const entries = zip.getEntries();
    let gedcom = undefined;
    const images = new Map<string, string>();
    for (const entry of entries) {
        if (entry.entryName.endsWith('.ged')) {
            if (gedcom) {
                console.warn('Multiple GEDCOM files found in zip archive.');
            } else {
                gedcom = entry.getData().toString();
            }
        } else {
            // Save image for later.
            images.set(
                entry.entryName,
                URL.createObjectURL(new Blob([entry.getData()])),
            );
        }
    }
    if (!gedcom) {
        throw new Error('GEDCOM file not found in zip archive.');
    }
    return {gedcom, images};
}

export async function loadFile(blob: Blob): Promise<{ gedcom: string; images: Map<string, string> }> {
    const fileHeader = await blob.slice(0, 2).text();
    if (fileHeader === 'PK') {
        return loadGedzip(blob);
    }
    return {gedcom: await blob.text(), images: new Map()};
}

/** Fetches data from the given URL. Uses cors-anywhere if handleCors is true. */
export async function loadFromUrl(
    url: string,
    handleCors: boolean,
    allLanguages: Language[]
) {
    try {
        const cachedData = sessionStorage.getItem(url);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (e) {
        console.warn('Failed to load data from session storage: ' + e);
    }

    // handle GoogleDrive files
    const driveUrlMatch = url.match(
        /https:\/\/drive\.google\.com\/file\/d\/(.*)\/.*/,
    );
    if (driveUrlMatch) {
        url = `https://drive.google.com/uc?id=${driveUrlMatch[1]}&export=download`;
    }

    const urlToFetch = handleCors ? 'https://universal-cors-proxy.glitch.me/' + encodeURIComponent(url) : url;
    const response = await fetch(urlToFetch);
    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/zip")) {
        const data = await response.blob();
        const {gedcom, images} = await loadFile(data)
        return prepareData(gedcom, url, allLanguages, images);
    } else if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return prepareData(data.contents, url, allLanguages, new Map());
    } else if (contentType && (contentType.includes("text/plain") || contentType.includes("text/html"))) {
        let data = await response.text();
        while (data.charCodeAt(0) > 127) {
            data = data.slice(1);
        }
        return prepareData(data, url, allLanguages, new Map());
    }
}

/** Loads data from the given GEDCOM file contents. */
export async function loadGedcom(
    hash: string,
    gedcom?: string,
    allLanguages?: Language[],
    images?: Map<string, string>
): Promise<TopolaData> {
    try {
        const cachedData = sessionStorage.getItem(hash);
        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (e) {
        console.warn('Failed to load data from session storage: ' + e);
    }
    if ((!gedcom) || (!allLanguages)) {
        throw new TopolaError('ERROR_LOADING_UPLOADED_FILE',
            'Error loading data. Please upload your file again.',
        );
    }
    return prepareData(gedcom, hash, allLanguages, images);
}


/** Files opened from the local computer. */
export class UploadedDataSource implements DataSource<UploadSourceSpec> {
    isNewData(
        newSource: SourceSelection<UploadSourceSpec>,
        oldSource: SourceSelection<UploadSourceSpec>,
        data?: TopolaData,
    ): boolean {
        return newSource.spec.hash !== oldSource.spec.hash;
    }

    async loadData(source: SourceSelection<UploadSourceSpec>): Promise<TopolaData> {
        try {
            return await loadGedcom(
                source.spec.hash,
                source.spec.gedcom,
                source.spec.allLanguages,
                source.spec.images,
            );
        } catch (error) {
            throw error;
        }
    }
}

/** GEDCOM file loaded by pointing to a URL. */
export class GedcomUrlDataSource implements DataSource<UrlSourceSpec> {
    isNewData(newSource: SourceSelection<UrlSourceSpec>, oldSource: SourceSelection<UrlSourceSpec>, data?: TopolaData) {
        return newSource.spec.url !== oldSource.spec.url;
    }
    async loadData(source: SourceSelection<UrlSourceSpec>): Promise<TopolaData> {
        try {
            return await loadFromUrl(source.spec.url, source.spec.handleCors, source.spec.allLanguages);
        } catch (error) {
            throw error;
        }
    }
}
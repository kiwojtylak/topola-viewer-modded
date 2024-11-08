import {DataSource, DataSourceEnum, SourceSelection} from './data_source';
import {TopolaData} from '../util/gedcom_util';
import {loadGedcom} from './load_data';
import {Language} from "../languages/languages-loader";

/**
 * Message types used in embedded mode.
 * When the parent is ready to receive messages, it sends PARENT_READY.
 * When the child (this app) is ready to receive messages, it sends READY.
 * When the child receives PARENT_READY, it sends READY.
 * When the parent receives READY, it sends data in a GEDCOM message.
 */
enum EmbeddedMessageType {
    GEDCOM = 'gedcom',
    READY = 'ready',
    PARENT_READY = 'parent_ready',
}

/** Message sent to parent or received from parent in embedded mode. */
interface EmbeddedMessage {
    message: EmbeddedMessageType;
}

interface GedcomMessage extends EmbeddedMessage {
    message: EmbeddedMessageType.GEDCOM;
    gedcom?: string;
    allLanguages?: Language[]
}

export interface EmbeddedSourceSpec {
    source: DataSourceEnum.EMBEDDED;
}

/** GEDCOM file received from outside the iframe. */
export class EmbeddedDataSource implements DataSource<EmbeddedSourceSpec> {
    isNewData(
        newSource: SourceSelection<EmbeddedSourceSpec>,
        oldSource: SourceSelection<EmbeddedSourceSpec>,
        data?: TopolaData,
    ): boolean {
        // Never reload data.
        return false;
    }

    private async onMessage(
        message: EmbeddedMessage,
        resolve: (value: TopolaData) => void,
        reject: (reason: any) => void,
    ) {
        if (message.message === EmbeddedMessageType.PARENT_READY) {
            // Parent didn't receive the first 'ready' message, so we need to send it again.
            window.parent.postMessage({message: EmbeddedMessageType.READY}, '*');
        } else if (message.message === EmbeddedMessageType.GEDCOM) {
            const gedcom = (message as GedcomMessage).gedcom;
            const allLanguages = (message as GedcomMessage).allLanguages;
            if (!gedcom || !allLanguages) {
                return;
            }
            try {
                const data = await loadGedcom('', gedcom, allLanguages);
                resolve(data);
            } catch (error) {
                reject(error);
            }
        }
    }

    async loadData(source: SourceSelection<EmbeddedSourceSpec>): Promise<TopolaData> {
        // Notify the parent window that we are ready.
        return new Promise<TopolaData>((resolve, reject) => {
            window.parent.postMessage({message: EmbeddedMessageType.READY}, '*');
            window.addEventListener('message', (data) =>
                this.onMessage(data.data, resolve, reject),
            );
        });
    }
}

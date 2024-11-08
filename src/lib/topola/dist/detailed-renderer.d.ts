import { FamDetails, IndiDetails } from './data';
import 'd3-transition';
import { Renderer, RendererOptions, TreeNodeSelection } from './api';
import { CompositeRenderer } from './composite-renderer';

/** Calculates the length of the given text in pixels when rendered. */
export declare function getLength(text: string, textClass: string): number;

/**
 * Renders some details about a person such as date and place of birth
 * and death.
 */
export declare class DetailedRenderer extends CompositeRenderer implements Renderer {
    readonly options: RendererOptions<IndiDetails, FamDetails>;
    constructor(options: RendererOptions<IndiDetails, FamDetails>);
    private getColoringClass;
    getPreferredIndiSize(id: string): [number, number];
    getPreferredFamSize(id: string): [number, number];
    render(enter: TreeNodeSelection, update: TreeNodeSelection): void;
    getCss(): string;
    resetCss(): void;
    private transition;
    private renderIndi;
    private renderFamily;
}

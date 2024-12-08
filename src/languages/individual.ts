const Graph = require("graphology");
const shortestPath = require("graphology-shortest-path");

export enum Sex {
    M = "M",
    F = "F"
}

export class Individual {
    id: string | null = null;
    sex: Sex | null = null;
    givenName?: string;
    surname?: string;
    nickname?: string;
    birthYear?: number;
    ethnicity?: string;
    tribe?: string;
    familySpouses: string[] = [];
    languages: string[] = [];
    familyChild?: string;
    notes?: string;

    constructor(params: {
        id: string;
        sex: Sex;
        givenName?: string;
        surname?: string;
        nickname?: string;
        birthYear?: number;
        ethnicity?: string;
        tribe?: string;
        familySpouses?: string[];
        languages?: string[];
        familyChild?: string;
        notes?: string;
    }) {
        Object.assign(this, params);
    }

    get name(): string | null {
        if (this.givenName || this.surname || this.nickname) {
            let name = "";
            if (this.givenName) name += this.givenName;
            if (this.nickname) name += ` "${this.nickname}"`;
            if (this.surname) name += ` /${this.surname}/`;
            return name;
        }
        return null;
    }

    generation(relationships: Record<string, [string | null, string | null]>): string {
        const g = new Graph({ type: "directed" });
        // Add all nodes
        for (const [indID, [fatherId, motherId]] of Object.entries(relationships)) {
            if (!g.hasNode(indID)) {
                g.addNode(indID);
            }
            if (!g.hasNode(fatherId)) {
                g.addNode(fatherId);
            }
            if (!g.hasNode(motherId)) {
                g.addNode(motherId);
            }
        }
        // Add all edges
        for (const [indID, [fatherId, motherId]] of Object.entries(relationships)) {
            if (fatherId) g.addEdge(fatherId, indID);
            if (motherId) g.addEdge(motherId, indID);
        }
        // @ts-ignore
        const source = g.nodes().reduce((min, current) => {
            const minValue = parseInt(min.slice(1), 10);
            const currentValue = parseInt(current.slice(1), 10);
            return currentValue < minValue ? current : min;
        });
        // @ts-ignore
        return shortestPath.singleSourceLength(g, source)[this.id]  // root MUST have the lowest ID!
    }

    asGedcom(): string {
        let gedcom = `0 @${this.id}@ INDI\n`;

        if (this.name) gedcom += `1 NAME ${this.name}\n`;
        if (this.givenName) gedcom += `2 GIVN ${this.givenName}\n`;
        if (this.surname) gedcom += `2 SURN ${this.surname}\n`;
        if (this.nickname) gedcom += `2 NICK ${this.nickname}\n`;
        gedcom += `1 SEX ${this.sex}\n`;
        if (this.birthYear) {
            gedcom += `1 BIRT\n`;
            gedcom += `2 DATE ${this.birthYear}\n`;
        }
        if (this.ethnicity) gedcom += `1 _ETHN ${this.capitalize(this.ethnicity)}\n`;
        if (this.tribe) gedcom += `1 _TRIB ${this.capitalize(this.tribe)}\n`;
        for (const language of this.languages) {
            gedcom += `1 LANG ${this.capitalize(language)}\n`;
        }
        for (const famID of this.familySpouses) {
            gedcom += `1 FAMS @${famID}@\n`;
        }
        if (this.familyChild) gedcom += `1 FAMC @${this.familyChild}@\n`;
        if (this.notes) gedcom += `1 NOTE ${this.notes}\n`;

        return gedcom;
    }

    private capitalize(str: string): string {
        return str
            .toLowerCase()
            .split(/[-\s]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join((str.includes('-') ? '-' : ' '));
    }
}

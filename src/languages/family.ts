export class Family {
    id: string;
    husband: string;
    wife: string;
    marriaged: boolean = false;
    children: string[] = [];
    divorced?: boolean = false;
    notes?: string;

    constructor(params: {
        id: string;
        husband: string;
        wife: string;
        marriaged?: boolean;
        children?: string[];
        divorced?: boolean;
        notes?: string;
    }) {
        this.id = params.id;
        this.husband = params.husband;
        this.wife = params.wife;
        this.marriaged = params.marriaged ?? false;
        this.children = params.children ?? [];
        this.divorced = params.divorced ?? false;
        this.notes = params.notes;
    }

    asGedcom(): string {
        let gedcom = `0 @${this.id}@ FAM\n`;
        gedcom += `1 HUSB @${this.husband}@\n`;
        gedcom += `1 WIFE @${this.wife}@\n`;
        if (this.marriaged) {
            gedcom += `1 MARR\n`;
        } else {
            gedcom += `1 MARS\n`;
            gedcom += `2 TYPE "Common Law"\n`;
        }
        for (const childId of this.children) {
            gedcom += `1 CHIL @${childId}@\n`;
        }
        if (this.divorced) {
            gedcom += `1 DIV\n`;
        }
        if (this.notes) {
            gedcom += `1 NOTE ${this.notes}\n`;
        }
        return gedcom;
    }
}

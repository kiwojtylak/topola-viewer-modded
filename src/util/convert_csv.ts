import * as fs from "fs/promises";

enum Sex {
    Male = "Male",
    Female = "Female"
}

interface Individual {
    id: string;
    givenName?: string;
    surname?: string;
    nickname?: string;
    sex: Sex;
    birthYear?: number;
    ethnicity?: string;
    tribe?: string;
    familyChild?: string;
    familySpouses: string[];
    languages: string[];
}

interface Language {
    id: string;
    name: string;
}

interface Family {
    id: string;
    husband: string;
    wife: string;
    children: string[];
}

type Relationships = Record<string, [string, string]>;

async function csvToGedcom(
    languagesFile: string | null,
    individualsFile: string,
    relationshipsFile: string,
    familiesFile: string,
    individualsLanguagesFile: string | null
): Promise<void> {
    try {
        const individuals = await parseIndividuals(individualsFile);
        const relationships = await parseRelationships(relationshipsFile);
        const families = await parseFamilies(familiesFile);

        mapFamiliesChildren(relationships, families, individuals);
        mapIndividualsSpouses(families, individuals);

        if (languagesFile && individualsLanguagesFile) {
            const languages = await parseLanguages(languagesFile);
            const individualsLanguages = await parseIndividualsLanguages(individualsLanguagesFile);
            mapIndividualsLanguages(individuals, individualsLanguages, languages);
        }

        await saveGedcomFile(individuals, relationships, families);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function parseIndividuals(filePath: string): Promise<Individual[]> {
    const data = await fs.readFile(filePath, "utf8");
    const rows = parseCSV(data);
    return rows.map(row => ({
        id: row["id"],
        givenName: row["name"] || undefined,
        surname: row["surname"] || undefined,
        nickname: row["nickname"] || undefined,
        sex: row["sex"] as Sex,
        birthYear: row["YOB"] ? parseInt(row["YOB"], 10) : undefined,
        ethnicity: row["ethnic"] || undefined,
        tribe: row["clan"] || undefined,
        familySpouses: [],
        languages: []
    }));
}

async function parseLanguages(filePath: string): Promise<Language[]> {
    const data = await fs.readFile(filePath, "utf8");
    const rows = parseCSV(data);
    return rows.map(row => ({
        id: row["id"],
        name: row["name"]
    }));
}

async function parseIndividualsLanguages(filePath: string): Promise<Record<string, string[]>> {
    const data = await fs.readFile(filePath, "utf8");
    const rows = parseCSV(data);
    const individualsLanguages: Record<string, string[]> = {};
    rows.forEach(row => {
        const personId = row["person_id"];
        if (!individualsLanguages[personId]) {
            individualsLanguages[personId] = [];
        }
        individualsLanguages[personId].push(row["language_id"]);
    });
    return individualsLanguages;
}

async function parseRelationships(filePath: string): Promise<Relationships> {
    const data = await fs.readFile(filePath, "utf8");
    const rows = parseCSV(data);
    const relationships: Relationships = {};
    rows.forEach(row => {
        if (row["father_id"] && row["mother_id"]) {
            relationships[row["person_id"]] = [row["father_id"], row["mother_id"]];
        }
    });
    return relationships;
}

async function parseFamilies(filePath: string): Promise<Family[]> {
    const data = await fs.readFile(filePath, "utf8");
    const rows = parseCSV(data);
    return rows.map(row => ({
        id: row["id"],
        husband: row["husband_id"],
        wife: row["wife_id"],
        children: []
    }));
}

function mapIndividualsLanguages(
    individuals: Individual[],
    individualsLanguages: Record<string, string[]>,
    languages: Language[]
): void {
    Object.entries(individualsLanguages).forEach(([personId, langIds]) => {
        const individual = individuals.find(ind => ind.id === personId);
        if (!individual) throw new Error(`Individual not found: ${personId}`);

        langIds.forEach(langId => {
            const language = languages.find(lang => lang.id === langId);
            if (!language) throw new Error(`Language not found: ${langId}`);
            individual.languages.push(language.name);
        });
    });
}

function mapFamiliesChildren(
    relationships: Relationships,
    families: Family[],
    individuals: Individual[]
): void {
    Object.entries(relationships).forEach(([childId, [fatherId, motherId]]) => {
        const family = families.find(fam => fam.husband === fatherId && fam.wife === motherId);
        if (!family) throw new Error(`Family not found: ${childId} (${fatherId}, ${motherId})`);

        family.children.push(childId);

        const individual = individuals.find(ind => ind.id === childId);
        if (!individual) throw new Error(`Individual not found: ${childId}`);
        individual.familyChild = family.id;
    });
}

function mapIndividualsSpouses(families: Family[], individuals: Individual[]): void {
    families.forEach(family => {
        const husband = individuals.find(ind => ind.id === family.husband);
        if (!husband) throw new Error(`Husband not found: ${family.husband}`);
        husband.familySpouses.push(family.id);

        const wife = individuals.find(ind => ind.id === family.wife);
        if (!wife) throw new Error(`Wife not found: ${family.wife}`);
        wife.familySpouses.push(family.id);
    });
}

const resourcesFolder = "" // TODO: how do you pass the ego indi now?
async function saveGedcomFile(
    individuals: Individual[],
    relationships: Relationships,
    families: Family[]
): Promise<string> {
    const egoIndividual = individuals.reduce((prev, current) => (
        `${prev.givenName}_${prev.surname}`.toLowerCase() === resourcesFolder.toLowerCase() &&
        prev.id < current.id ? prev : current
    ));

    const header = createHeader(resourcesFolder, egoIndividual.id, ""); // Add generation logic
    const indiRecords = individuals.map(indi => indiToGedcom(indi)).join("\n");
    const famRecords = families.map(fam => familyToGedcom(fam)).join("\n");
    const tail = createTail(resourcesFolder);

    return [header, indiRecords, famRecords, tail].join("\n")
}

// Placeholder functions for GEDCOM formatting
function createHeader(file: string, egoId: string, egoGen: string): string {
    return `0 HEAD\n1 SOUR Script\n1 DEST GEDCOM\n...`; // Example, expand as needed
}

function createTail(file: string): string {
    return `0 TRLR\n`;
}

function indiToGedcom(individual: Individual): string {
    return `0 @I${individual.id}@ INDI\n1 NAME ${individual.givenName} /${individual.surname}/\n...`;
}

function familyToGedcom(family: Family): string {
    return `0 @F${family.id}@ FAM\n1 HUSB @I${family.husband}@\n1 WIFE @I${family.wife}@\n...`;
}

// CSV parser utility
function parseCSV(data: string): Record<string, string>[] {
    const [header, ...rows] = data.split("\n").filter(line => line.trim() !== "");
    const keys = header.split(",");
    return rows.map(row => {
        const values = row.split(",");
        return keys.reduce((acc, key, index) => {
            acc[key] = values[index];
            return acc;
        }, {} as Record<string, string>);
    });
}

import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {Individual, Sex} from "../languages/individual";
import {Language} from "../languages/languages-loader";
import {Family} from "../languages/family";

type Relationships = Record<string, [string, string]>;

export function csvToGedcom(
    languagesFile: string | null,
    individualsFile: string,
    relationshipsFile: string,
    familiesFile: string,
    individualsLanguagesFile: string | null,
    egoIndiId: string | null
): string {
    try {
        const individuals = parseIndividuals(individualsFile);
        const relationships = parseRelationships(relationshipsFile);
        const families = parseFamilies(familiesFile);
        mapFamiliesChildren(relationships, families, individuals);
        mapIndividualsSpouses(families, individuals);
        if (languagesFile && individualsLanguagesFile) {
            const languages = parseLanguages(languagesFile);
            const individualsLanguages = parseIndividualsLanguages(individualsLanguagesFile);
            mapIndividualsLanguages(individuals, individualsLanguages, languages);
        }
        return createGedcomString(individuals, relationships, families, egoIndiId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function parseIndividuals(filePath: string): Individual[] {
    const data = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(data);
    return rows.map(row => new Individual({
        id: row["id"],
        sex: row["sex"] as Sex,
        givenName: row["name"] || undefined,
        surname: row["surname"] || undefined,
        nickname: row["nickname"] || undefined,
        birthYear: row["YOB"] ? parseInt(row["YOB"], 10) : undefined,
        ethnicity: row["ethnic"] || undefined,
        tribe: row["clan"] || undefined,
        familySpouses: [],
        languages: [],
        notes: row["notes"] || undefined
    }));

}

function parseLanguages(filePath: string): Language[] {
    const data = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(data);
    return rows.map(row => ({
        id: row["id"],
        name: row["name"]
    }));
}

function parseIndividualsLanguages(filePath: string): Record<string, string[]> {
    const data = fs.readFileSync(filePath, "utf-8");
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

function parseRelationships(filePath: string): Relationships {
    const data = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(data);
    const relationships: Relationships = {};
    rows.forEach(row => {
        if (row["father_id"] && row["mother_id"]) {
            relationships[row["person_id"]] = [row["father_id"], row["mother_id"]];
        }
    });
    return relationships;
}

function parseFamilies(filePath: string): Family[] {
    const data = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(data);
    return rows.map(row => new Family({
        id: row["id"],
        husband: row["husband_id"],
        wife: row["wife_id"],
        children: [],
        notes: row["notes"] || undefined
    }));
}

function mapIndividualsLanguages(
    individuals: Individual[],
    individualsLanguages: Record<string, string[]>,
    languages: Language[]
): void {
    Object.entries(individualsLanguages).forEach(([personId, langIds]) => {
        const individual = individuals.find(ind => ind.id === personId);
        if (!individual)
            throw new Error(`Individual not found: ${personId}`);
        langIds.forEach(langId => {
            const language = languages.find(lang => lang.id === langId);
            if (!language)
                throw new Error(`Language not found: ${langId}`);
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
        if (!family)
            throw new Error(`Family not found: ${childId} (${fatherId}, ${motherId})`);
        family.children.push(childId);
        const individual = individuals.find(ind => ind.id === childId);
        if (!individual)
            throw new Error(`Individual not found: ${childId}`);
        individual.familyChild = family.id;
    });
}

function mapIndividualsSpouses(families: Family[], individuals: Individual[]): void {
    families.forEach(family => {
        const husband = individuals.find(ind => ind.id === family.husband);
        if (!husband)
            throw new Error(`Husband not found: ${family.husband}`);
        husband.familySpouses.push(family.id);
        const wife = individuals.find(ind => ind.id === family.wife);
        if (!wife)
            throw new Error(`Wife not found: ${family.wife}`);
        wife.familySpouses.push(family.id);
    });
}

function createGedcomString(
    individuals: Individual[],
    relationships: Relationships,
    families: Family[],
    egoIndiId: string | null
): string {
    const egoIndi = individuals.filter(_i => _i.id === egoIndiId);
    // @ts-ignore
    const lowestEgoIndi = egoIndi.reduce((prev, current) => (prev.id < current.id ? prev : current));
    const filename = `${lowestEgoIndi.givenName} ${lowestEgoIndi.surname}`

    const header = createHeader(filename, lowestEgoIndi.id, lowestEgoIndi.generation(relationships));
    const indiRecords = individuals.map(indi => indi.asGedcom()).join("\n");
    const famRecords = families.map(fam => fam.asGedcom()).join("\n");
    const tail = createTail(filename);

    return [header, indiRecords, famRecords, tail].join("\n")
}

function createHeader(filename: string, egoId: string | null, egoGen: string | null): string {
    const headerTemplate = fs.readFileSync("header.ged", "utf-8");
    const date = new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});
    let replaced = headerTemplate
        .replace(/{file}/g, filename)
        .replace(/{date}/g, date)
        .replace(/{subm}/g, 'drexa1@hotmail.com')
    if (egoId && egoGen) {
        const egoSection = `0 @${egoId}@ EGO\n1 GEN ${egoGen}\n`;
        replaced += egoSection;
    }
    return replaced
}

function createTail(filename: string): string {
    const tailTemplate = fs.readFileSync("data/tail.ged", "utf-8");
    const uid = uuidv4().toUpperCase();
    const repo = `The ${filename.replace(/_/g, ' ').toUpperCase()} family`;
    return tailTemplate.replace(/{uid}/g, uid).replace(/{repo}/g, repo);
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

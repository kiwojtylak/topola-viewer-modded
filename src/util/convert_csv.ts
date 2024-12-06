import { v4 as uuidv4 } from 'uuid';
import {Individual, Sex} from "../languages/individual";
import {Language} from "../languages/languages-loader";
import {Family} from "../languages/family";

type Relationships = Record<string, [string, string]>;

export async function csvToGedcom(
    languagesContents: string,
    individualsContent: string,
    relationshipsContent: string,
    familiesContent: string,
    individualsLanguagesContent: string | null,
    egoIndiId: string | null
) {
    try {
        const individuals = parseIndividuals(individualsContent);
        const relationships = parseRelationships(relationshipsContent);
        const families = parseFamilies(familiesContent);
        mapFamiliesChildren(relationships, families, individuals);
        mapIndividualsSpouses(families, individuals);
        if (languagesContents && individualsLanguagesContent) {
            const languages = parseLanguages(languagesContents);
            const individualsLanguages = parseIndividualsLanguages(individualsLanguagesContent);
            mapIndividualsLanguages(individuals, individualsLanguages, languages);
        }
        return await createGedcomString(individuals, relationships, families, egoIndiId);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function parseIndividuals(individualsContent: string): Individual[] {
    const rows = parseCSV(individualsContent);
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

function parseLanguages(languagesContents: string): Language[] {
    const rows = parseCSV(languagesContents);
    return rows.map(row => ({
        id: row["id"],
        name: row["name"]
    }));
}

function parseIndividualsLanguages(individualsLanguagesContent: string): Record<string, string[]> {
    const rows = parseCSV(individualsLanguagesContent);
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

function parseRelationships(relationshipsContent: string): Relationships {
    const rows = parseCSV(relationshipsContent);
    const relationships: Relationships = {};
    rows.forEach(row => {
        if (row["father_id"] && row["mother_id"]) {
            relationships[row["person_id"]] = [row["father_id"], row["mother_id"]];
        }
    });
    return relationships;
}

function parseFamilies(familiesContent: string): Family[] {
    const rows = parseCSV(familiesContent);
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

async function createGedcomString(
    individuals: Individual[],
    relationships: Relationships,
    families: Family[],
    egoIndiId: string | null
) {
    let egoIndi = null
    let lowestEgoIndi = null
    let filename = null

    if (egoIndiId) {
        egoIndi = individuals.filter(_i => _i.id === egoIndiId);
        // @ts-ignore
        lowestEgoIndi = egoIndi.reduce((prev, current) => (prev.id < current.id ? prev : current));
        filename = `${lowestEgoIndi.givenName?.toLowerCase()}_${lowestEgoIndi.surname?.toLowerCase()}`
    }
    const header = await createHeader(
        filename,
        lowestEgoIndi ? lowestEgoIndi.id : null,
        lowestEgoIndi ? lowestEgoIndi.generation(relationships) : null
    );
    const indiRecords = individuals.map(indi => indi.asGedcom()).join("\n");
    const famRecords = families.map(fam => fam.asGedcom()).join("\n");
    const tail = await createTail(filename);

    return [header, indiRecords, famRecords, tail].join("\n")
}

async function createHeader(filename: string | null, egoId: string | null, egoGen: string | null) {
    const headerFile = await fetch("data/header.ged");
    const headerTemplate = await headerFile.text();
    const date = new Date().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'});
    let replaced = headerTemplate
        .replace(/{file}/g, filename ? filename: "genealogy.ged")
        .replace(/{date}/g, date)
        .replace(/{subm}/g, 'drexa1@hotmail.com')
    if (egoId && egoGen) {
        const egoSection = `0 @${egoId}@ EGO\n1 GEN ${egoGen}\n`;
        replaced += egoSection;
    }
    return replaced
}

async function createTail(filename: string | null) {
    let repoSection = ""
    const uid = uuidv4().toUpperCase();
    if (filename) {
        const repo = `The ${filename
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())} family`;
        repoSection += `0 @R0@ REPO\n1 _UID ${uid}\n1 NAME ${repo}\n`
    }
    const tailFile = await fetch("data/tail.ged");
    const tailTemplate = await tailFile.text();
    return repoSection + tailTemplate
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

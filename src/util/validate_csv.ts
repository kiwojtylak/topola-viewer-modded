const Papa = require("papaparse");

export const columnsValidation = {
    "1_individuals.csv": ["id", "name", "surname", "nickname", "sex", "YOB", "ethnic", "clan", "notes"],
    "2_relationships.csv": ["person_id", "father_id", "mother_id", "notes"],
    "3_families.csv": ["id", "husband_id", "wife_id"],
    "4_individuals_languages.csv": ["person_id", "language_id"]
}

export const valuesValidation = {
    "1_individuals.csv": ["id", "sex", "ethnic"],
    "2_relationships.csv": ["person_id"],
    "3_families.csv": ["id", "husband_id", "wife_id"],
    "4_individuals_languages.csv": ["person_id", "language_id"]
}

export function validateFilenames(files: File[], validFilenames: string[]): boolean {
    for (const file of files) {
        const filename = file.name;
        if (!validFilenames.includes(filename)) {
            console.error(`Invalid filename: ${filename}`);
            return false;
        }
    }
    return true;
}

export function validateCSV(filename: string, content: string) {
    const parsedData = Papa.parse(content, { header: true, skipEmptyLines: true });
    if (parsedData.errors.length) {
        console.error("CSV loading errors:", parsedData.errors);
        return false;
    }
    const rows = parsedData.data as Record<string, string>[];
    return checkColumns(filename, rows, columnsValidation[filename]) && checkMissingValues(filename, rows, valuesValidation[filename]);
}

export function checkColumns(filename: string, rows: Record<string, string>[], requiredColumns: string[]) {
    const headers = Object.keys(rows[0]);
    // Check for missing columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length) {
        const error = `${filename}: the following required columns are missing: ${missingColumns.join(", ")}`
        console.error(error);
        return false;
    }
    return true;
}

export function checkMissingValues(filename: string, rows: Record<string, string>[], requiredColumns: string[]) {
    const cellErrors: string[] = [];
    rows.forEach((row, index) => {
        requiredColumns.forEach(column => {
            if (!row[column] || row[column].trim() === "") {
                cellErrors.push(`${filename}: row ${index + 1} is missing a value in column: ${column}`);
            }
        });
    });
    if (cellErrors.length > 0) {
        console.error(`File ${filename} had ${cellErrors.length} missing values`)
    }
    return cellErrors.length <= 0
}


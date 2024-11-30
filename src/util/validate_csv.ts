const Papa = require("papaparse");

export const filesValidation = {
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
    return checkColumns(rows, filesValidation[filename]) && checkMissingValues(rows, filesValidation[filename]);
}

export function checkColumns(rows: Record<string, string>[], requiredColumns: string[]) {
    const headers = Object.keys(rows[0]);
    // Check for missing columns
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length) {
        console.error(`The following required columns are missing: ${missingColumns.join(", ")}`);
        return false;
    }
    return true;
}

export function checkMissingValues(rows: Record<string, string>[], requiredColumns: string[]) {
    const errors: string[] = [];
    rows.forEach((row, index) => {
        requiredColumns.forEach(column => {
            if (!row[column] || row[column].trim() === "") {
                errors.push(`Row ${index + 1} is missing a value in column: ${column}`);
            }
        });
    });
    return errors.length <= 0
}


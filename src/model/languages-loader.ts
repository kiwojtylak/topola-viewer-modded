export interface Language {
    id: string;
    name: string;
    iso?: string | null;
    abbreviation?: string;
}

export default class CSVLoader {
    // Singleton
    private static csvData: Language[] | null = null;

    static async loadLanguages(filePath: string) {
        if (CSVLoader.csvData) {
            return CSVLoader.csvData;
        }
        try {
            const data = await fetch(filePath);
            const text = await data.text();

            const rows = text.trim().split('\n');
            const headers = rows[0].split(',');

            const idIndex = headers.indexOf('id');
            const nameIndex = headers.indexOf('name');
            const isoIndex = headers.indexOf('ISO 639-3');

            CSVLoader.csvData = rows.slice(1).map(row => {
                const values = row.split(',');
                return {
                    id: values[idIndex],
                    name: CSVLoader.title_fn(values[nameIndex]),
                    iso: values[isoIndex],
                    abbreviation: values[isoIndex].toUpperCase() || (values[nameIndex].slice(0, 3).toUpperCase() + '*')
                } as Language;
            });
            return CSVLoader.csvData;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private static title_fn = (str: string) =>
        str.split(/[-_\s]/) // Split by hyphen, underscore, or space
           .map(word => word.charAt(0).toUpperCase() + word.slice(1))
           .join('-');
}

import {MenuItem, MenuType} from "./menu_item";
import {Button, Icon, SemanticCOLORS, Input, Form, Header, Label, Modal, Message} from "semantic-ui-react";
import {FormattedMessage} from "react-intl";
import {SyntheticEvent, useState} from "react";
import * as queryString from "query-string";
import {useHistory} from "react-router";
import {loadFile} from "../datasource/load_data";
import md5 from "md5";
import {
    FamiliesTableExample,
    IndividualsLanguagesTableExample,
    IndividualsTableExample,
    RelationshipsTableExample
} from "./convert_tables";
import {columnsValidation, validateCSV, validateFilenames} from "../util/validate_csv";
import {csvToGedcom} from "../util/convert_csv";
import fs from "fs";

interface Props {
    menuType: MenuType
}

export const initialHeaderColors: Record<string, SemanticCOLORS> = {
    "1_individuals.csv": "yellow",
    "2_relationships.csv": "yellow",
    "3_families.csv": "yellow",
    "4_individuals_languages.csv": "blue"
}

/** Displays and handles the "Convert CSV's" menu. */
export function ConvertCSVMenu(props: Props) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const[inputFiles, setInputFiles] = useState<File[]>([])
    const[headerColors, setHeaderColors] = useState<Record<string, SemanticCOLORS>>(initialHeaderColors)
    const [egoIndiId, setEgoIndiId] = useState<string | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const history = useHistory()

    function closeDialog() {
        setInputFiles([])
        setErrors([])
        setHeaderColors(initialHeaderColors)
        setDialogOpen(false)
    }

    function handleUpload(event: SyntheticEvent<HTMLInputElement>) {
        setErrors([])
        const files = (event.target as HTMLInputElement).files;
        // Validate number of files
        if (!files) {
            return
        }
        // Validate file names
        if (!validateFilenames(Array.from(files), Object.keys(columnsValidation))) {
            return
        }
        // Validate schemas
        const fileReadPromises = Array.from(files).map(file => {
            return new Promise<File | null>((resolve) => {
                const reader = new FileReader();
                reader.readAsText(file, "UTF-8");
                reader.onload = () => {
                    const fileContent = reader.result as string;
                    const validFile = validateCSV(file.name, fileContent);
                    if (validFile) {
                        resolve(file);
                    } else {
                        setErrors(["File '" + file.name + "' had errors. You can check them in the browser console"])
                        resolve(null);
                    }
                };
                reader.onerror = () => {
                    console.error("Error reading file:", file.name);
                    setErrors(["Error reading file:" + file.name])
                    resolve(null); // Resolve as null to exclude invalid files
                };
            });
        });
        // Wait for all file validations to complete
        Promise.all(fileReadPromises).then(results => {
            const validFiles = results.filter((file): file is File => file !== null);
            setInputFiles(validFiles)
            setHeaderColors(changeHeaderColors(files, validFiles));
            // Validate number of files
            if (!inputFiles || inputFiles.length < 3 || inputFiles.length > 4) {
                console.error("Upload should consist of at least 3 files and no more than 4")
                return
            }
            (event.target as HTMLInputElement).value = ''; // Reset the file input
        });
    }

    function changeHeaderColors(files: FileList, validFiles: File[]) {
        const newHeaderColors = { ...initialHeaderColors };
        Array.from(files).forEach(file => {
            if (newHeaderColors.hasOwnProperty(file.name)) {
                newHeaderColors[file.name] = validFiles.includes(file) ? "green" : "red";
            }
        });
        return newHeaderColors;
    }

    /** Load button clicked in the "Load from URL" dialog. */
    async function convert2gedcom() {
        try {
            const individualsFile = inputFiles.find(file => file.name === "1_individuals.csv");
            const relationshipsFile = inputFiles.find(file => file.name === "2_relationships.csv");
            const familiesFile = inputFiles.find(file => file.name === "3_families.csv");
            const individualsLanguagesFile = inputFiles.find(file => file.name === "4_individuals_languages.csv");

            const [individualsContent, relationshipsContent, familiesContent, individualsLanguagesContent] = await Promise.all([
                readFileContents(individualsFile!),
                readFileContents(relationshipsFile!),
                readFileContents(familiesFile!),
                readFileContents(individualsLanguagesFile!)
            ]);

            const languagesFile = fs.readFileSync("data/languages.csv", "utf-8");
            const gedcomString = csvToGedcom(
                languagesFile,
                individualsContent,
                relationshipsContent,
                familiesContent,
                individualsLanguagesContent,
                egoIndiId
            )
            const gedcomFile = new Blob([gedcomString])
            const {gedcom, images} = await loadFile(gedcomFile);

            // Hash GEDCOM contents with uploaded image file names.
            const imageFileNames = Array.from(images.keys()).sort().join('|');
            const hash = md5(md5(gedcom) + imageFileNames);

            const search = queryString.parse(window.location.search);
            const historyPush = search.file === hash ? history.replace : history.push;

            historyPush({
                pathname: '/view',
                search: queryString.stringify({file: hash}),
                state: {data: gedcom, images}
            });
        } catch (error) {
            console.error("Error converting to GEDCOM:", error);
            setErrors([error])
        }
    }

    const readFileContents = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file, "UTF-8");
        });
    };

    function convertCSVModal() {
        return (
            <Modal open={dialogOpen} onClose={closeDialog} centered={true}>
                <Header>
                    <Icon name="sitemap"/>
                    <FormattedMessage id="menu.convert_csv_gedcom" defaultMessage="Convert CSV files to GEDCOM"/>
                </Header>
                <Modal.Content>
                    <Message negative className={errors.length === 0 ? "hidden" : undefined}>
                        <p>{errors}</p>
                    </Message>
                    <Form onSubmit={() => convert2gedcom()}>
                        {<Label
                            color={inputFiles.some((file: File) => file.name === "1_individuals.csv") ? "green" : undefined}>
                            <Icon name="file text"/>1_individuals.csv
                        </Label>}
                        {<Label
                            color={inputFiles.some((file: File) => file.name === "2_relationships.csv") ? "green" : undefined}>
                            <Icon name="file text"/>2_relationships.csv
                        </Label>}
                        {<Label
                            color={inputFiles.some((file: File) => file.name === "3_families.csv") ? "green" : undefined}>
                            <Icon name="file text"/>3_families.csv
                        </Label>}
                        {<Label
                            color={inputFiles.some((file: File) => file.name === "4_individuals_languages.csv") ? "green" : undefined}
                            style={{float: "right"}}>
                            <Icon name="file text"/>4_individuals_languages.csv
                        </Label>}

                        <IndividualsTableExample headerColor={headerColors["1_individuals.csv"]}/>
                        <RelationshipsTableExample headerColor={headerColors["2_relationships.csv"]}/>
                        <FamiliesTableExample headerColor={headerColors["3_families.csv"]}/>
                        <IndividualsLanguagesTableExample headerColor={headerColors["4_individuals_languages.csv"]}/>

                        <div style={{textAlign: "center", marginBottom: 10}}>
                            <Input id="egoIndi"
                                   fluid
                                   disabled={!inputFiles.some((file: File) => file.name === "1_individuals.csv")}
                                   size="small"
                                   label="Ego ID"
                                   labelPosition="left"
                                   icon="user"
                                   placeholder="I..."
                                   onChange={(e, { value }) => setEgoIndiId(value)}
                            />
                        </div>

                        <input type="file"
                               accept=".csv"
                               id="fileInput"
                               multiple
                               onChange={(e) => handleUpload(e)}
                        />
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button secondary onClick={() => {
                        closeDialog()
                    }}>
                        <FormattedMessage id="load_from_url.cancel" defaultMessage="Cancel"/>
                    </Button>
                    <Button
                        disabled={!["1_individuals.csv", "2_relationships.csv", "3_families.csv"].every(fileName =>
                            inputFiles.some((file: File) => file.name === fileName)
                        )}
                        primary onClick={() => convert2gedcom()}>
                            <FormattedMessage id="load_from_gedcom.generate" defaultMessage="Generate"/>
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }

    return (
        <>
            <MenuItem onClick={() => setDialogOpen(true)} menuType={props.menuType}>
                <Icon name="sitemap"/>
                <FormattedMessage id="menu.convert_csv_gedcom" defaultMessage="Convert CSV's"/>
            </MenuItem>
            {convertCSVModal()}
        </>
    );
}
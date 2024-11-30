import {MenuItem, MenuType} from "./menu_item";
import {
    Button,
    Form,
    Header,
    Icon, Label,
    Modal
} from "semantic-ui-react";
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
import {filesValidation, validateCSV, validateFilenames} from "../util/validate_csv";

interface Props {
    menuType: MenuType
}

/** Displays and handles the "Convert CSV's" menu. */
export function ConvertCSVMenu(props: Props) {
    const[inputFiles, setInputFiles] = useState<File[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const history = useHistory()

    function handleUpload(event: SyntheticEvent<HTMLInputElement>) {
        const files = (event.target as HTMLInputElement).files;
        // Validate number of files
        if (!files) {
            return
        }
        // Validate file names
        if (!validateFilenames(Array.from(files), Object.keys(filesValidation))) {
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
                        console.log(file.name + ": validated");
                        resolve(file);
                    } else {
                        resolve(null);
                    }
                };
                reader.onerror = () => {
                    console.error("Error reading file:", file.name);
                    resolve(null); // Resolve as null to exclude invalid files
                };
            });
        });
        // Wait for all file validations to complete
        Promise.all(fileReadPromises).then(results => {
            const validFiles = results.filter((file): file is File => file !== null);
            setInputFiles(validFiles);
            // Validate number of files
            if (!inputFiles || inputFiles.length < 3 || inputFiles.length > 4) {
                console.error("Upload should consist of at least 3 files and no more than 4")
                return
            }
            (event.target as HTMLInputElement).value = ''; // Reset the file input
        });
    }

    /** Load button clicked in the "Load from URL" dialog. */
    async function convert2gedcom() {
        const gedcomFile = new Blob() // TODO: invoke converter
        const {gedcom, images} = await loadFile(gedcomFile);

        // Hash GEDCOM contents with uploaded image file names.
        const imageFileNames = Array.from(images.keys()).sort().join('|');
        const hash = md5(md5(gedcom) + imageFileNames);

        // Use history.replace() when re-uploading the same file and history.push() when loading a new file.
        const search = queryString.parse(window.location.search);
        const historyPush = search.file === hash ? history.replace : history.push;

        historyPush({
            pathname: '/view',
            search: queryString.stringify({file: hash}),
            state: {data: gedcom, images}
        });
    }

    function convertCSVModal() {
        return (
            <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} centered={false}>
                <Header>
                    <Icon name="sitemap"/>
                    <FormattedMessage id="menu.convert_csv_gedcom" defaultMessage="Convert CSV files to GEDCOM"/>
                </Header>
                <Modal.Content>
                    <Form onSubmit={() => convert2gedcom()}>
                        {<Label color={inputFiles.some((file: File) => file.name === "1_individuals.csv") ? "green" : undefined}>
                            <Icon name="file text"/>1_individuals.csv
                        </Label>}
                        {<Label color={inputFiles.some((file: File) => file.name === "2_relationships.csv") ? "green" : undefined}>
                            <Icon name="file text"/>2_relationships.csv
                        </Label>}
                        {<Label color={inputFiles.some((file: File) => file.name === "3_families.csv") ? "green" : undefined}>
                            <Icon name="file text"/>3_families.csv
                        </Label>}
                        {<Label
                            color={inputFiles.some((file: File) => file.name === "4_individuals_languages.csv") ? "green" : undefined}
                            style={{ float: "right" }}>
                                <Icon name="file text"/>4_individuals_languages.csv
                        </Label>}
                        {<IndividualsTableExample headerColor={
                            inputFiles.some((file: File) => file.name === "1_individuals.csv") ? "green" : "yellow"} />
                        }
                        {<RelationshipsTableExample headerColor={
                            inputFiles.some((file: File) => file.name === "2_relationships.csv") ? "green" : "yellow"} />
                        }
                        {<FamiliesTableExample headerColor={
                            inputFiles.some((file: File) => file.name === "3_families.csv") ? "green" : "yellow"} />
                        }
                        {<IndividualsLanguagesTableExample headerColor={
                            inputFiles.some((file: File) => file.name === "4_individuals_languages.csv") ? "green" : "pink"} />
                        }
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
                        setInputFiles([])
                        setDialogOpen(false)
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
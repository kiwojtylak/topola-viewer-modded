import {MenuItem, MenuType} from "./menu_item";
import {
    Button,
    Form,
    Header,
    Icon, Label,
    Modal, Segment
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

interface Props {
    menuType: MenuType;
}

const validFilenames = [
    "1_individuals.csv",
    "2_relationships.csv",
    "3_families.csv",
    "4_individuals_languages.csv"
];

/** Displays and handles the "Convert CSV's" menu. */
export function ConvertCSVMenu(props: Props) {
    const[inputFiles, setInputFiles] = useState<File[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const history = useHistory();

    function handleUpload(event: SyntheticEvent<HTMLInputElement>) {
        const files = (event.target as HTMLInputElement).files;
        // Validate number of files
        if (!files || files.length < 3 || files.length > 4) {
            console.error("Upload should consist of at least 3 files and no more than 4")
            return;
        }
        // Validate file names
        if (!validateFilenames(Array.from(files), validFilenames)) {
            return;
        }
        // Validate schemas
        // TODO: get file 1. and check schema, etc
        // TODO: for each file that I check, if success, change labels color

        setInputFiles(Array.from(files));
        (event.target as HTMLInputElement).value = ''; // Reset the file input
    }

    function validateFilenames(files: File[], validFilenames: string[]): boolean {
        for (const file of files) {
            const filename = file.name;
            if (!validFilenames.includes(filename)) {
                console.error(`Invalid filename: ${filename}`);
                return false;
            }
        }
        return true;
    }

    /** Load button clicked in the "Load from URL" dialog. */
    async function convert2gedcom() {
        const gedcomFile = inputFiles.length === 1
                ? inputFiles[0]
                : inputFiles.find((file) => file.name.toLowerCase().endsWith('.ged')) ||
            inputFiles[0];
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
                        {<Label><Icon name="file text"/>1_individuals.csv</Label>}
                        {<Label><Icon name="file text"/>2_relationships.csv</Label>}
                        {<Label><Icon name="file text"/>3_families.csv</Label>}
                        {<Label className="optional-file">
                            <Icon name="file text"/>4_individuals_languages.csv
                        </Label>}
                        {IndividualsTableExample}
                        {RelationshipsTableExample}
                        {FamiliesTableExample}
                        {IndividualsLanguagesTableExample}
                        <input type="file"
                               accept=".csv"
                               id="fileInput"
                               multiple
                               onChange={(e) => handleUpload(e)}
                        />
                    </Form>
                </Modal.Content>
                <Modal.Actions>
                    <Button secondary onClick={() => setDialogOpen(false)}>
                        <FormattedMessage id="load_from_url.cancel" defaultMessage="Cancel"/>
                    </Button>
                    {/* TODO: enable */}
                    <Button disabled={true} primary onClick={() => convert2gedcom()}>
                        <FormattedMessage id="load_from_url.load" defaultMessage="Generate"/>
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
import {SemanticCOLORS, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow} from "semantic-ui-react";

export function IndividualsTableExample({ headerColor }: { headerColor?: SemanticCOLORS }) {
    return (
        <Table compact size="small" color={headerColor}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell style={{ "color": "" }}>id *</TableHeaderCell>
                    <TableHeaderCell>name</TableHeaderCell>
                    <TableHeaderCell>surname</TableHeaderCell>
                    <TableHeaderCell>nickname</TableHeaderCell>
                    <TableHeaderCell style={{ "color": "" }}>sex *</TableHeaderCell>
                    <TableHeaderCell >YOB</TableHeaderCell>
                    <TableHeaderCell style={{ "color": "" }}>ethnic *</TableHeaderCell>
                    <TableHeaderCell>clan</TableHeaderCell>
                    <TableHeaderCell>notes</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>I200</TableCell>
                    <TableCell disabled>John</TableCell>
                    <TableCell disabled>Doe</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell>M</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell>WHITE</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell disabled></TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>I201</TableCell>
                    <TableCell disabled>Jane</TableCell>
                    <TableCell disabled>Doe</TableCell>
                    <TableCell></TableCell>
                    <TableCell>F</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell>WHITE</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell disabled>Some comments</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>I202</TableCell>
                    <TableCell disabled>John</TableCell>
                    <TableCell disabled>Doe</TableCell>
                    <TableCell disabled>Johnny</TableCell>
                    <TableCell>M</TableCell>
                    <TableCell disabled>1983</TableCell>
                    <TableCell>WHITE</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell disabled></TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

export function RelationshipsTableExample({ headerColor }: { headerColor?: SemanticCOLORS }) {
    return (
        <Table compact size="small" color={headerColor}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell style={{ "color": "" }}>person_id *</TableHeaderCell>
                    <TableHeaderCell>father_id</TableHeaderCell>
                    <TableHeaderCell>mother_id</TableHeaderCell>
                    <TableHeaderCell>notes</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>I200</TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell disabled></TableCell>
                    <TableCell disabled></TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>I202</TableCell>
                    <TableCell disabled>I200</TableCell>
                    <TableCell disabled>I201</TableCell>
                    <TableCell disabled></TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

export function FamiliesTableExample({ headerColor }: { headerColor?: SemanticCOLORS }) {
    return (
        <Table compact size="small" color={headerColor}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell style={{ "color": "" }}>id *</TableHeaderCell>
                    <TableHeaderCell style={{ "color": "" }}>husband_id *</TableHeaderCell>
                    <TableHeaderCell style={{ "color": "" }}>wife_id *</TableHeaderCell>
                    <TableHeaderCell>notes</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>F200</TableCell>
                    <TableCell>I200</TableCell>
                    <TableCell>I201</TableCell>
                    <TableCell disabled>Common Law settlement</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}

export function IndividualsLanguagesTableExample({ headerColor }: { headerColor?: SemanticCOLORS }) {
    return (
        <Table compact size="small" color={headerColor}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell style={{ "color": "" }}>person_id *</TableHeaderCell>
                    <TableHeaderCell style={{ "color": "" }}>language_id *</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>I200</TableCell>
                    <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>I202</TableCell>
                    <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>I202</TableCell>
                    <TableCell>3</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    )
}
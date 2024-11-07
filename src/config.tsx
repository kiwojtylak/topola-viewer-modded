import {Item, Checkbox, Form, Header} from 'semantic-ui-react';
import {FormattedMessage} from 'react-intl';
import {ParsedQuery} from 'query-string';

export enum ChartColors {
    NO_COLOR,
    COLOR_BY_SEX,
    COLOR_BY_GENERATION,
    COLOR_BY_TRIBE,
    COLOR_BY_NR_LANGUAGES = 4,
    COLOR_BY_LANGUAGE = 5,
}

export enum Languages {
    HIDE,
    SHOW,
}

export enum Tribe {
    HIDE,
    SHOW,
}

export enum Ids {
    HIDE,
    SHOW,
}

export enum Sex {
    HIDE,
    SHOW,
}

export interface Config {
    color: ChartColors;
    languages: Languages;
    tribe: Tribe;
    id: Ids;
    sex: Sex;
    renderLanguagesOption: boolean
    renderTribeOption: boolean
    languageOptions: string[]
}

export const DEFAULT_CONFIG: Config = {
    color: ChartColors.COLOR_BY_GENERATION,
    languages: Languages.HIDE,
    tribe: Tribe.HIDE,
    id: Ids.SHOW,
    sex: Sex.SHOW,
    renderLanguagesOption: false,
    renderTribeOption: false,
    languageOptions: []
};

const COLOR_ARG = new Map<string, ChartColors>([
    ['n', ChartColors.NO_COLOR],
    ['g', ChartColors.COLOR_BY_GENERATION],
    ['s', ChartColors.COLOR_BY_SEX],
    ['t', ChartColors.COLOR_BY_TRIBE],
    ['nl', ChartColors.COLOR_BY_NR_LANGUAGES],
    ['l', ChartColors.COLOR_BY_LANGUAGE],
]);
const COLOR_ARG_INVERSE = new Map<ChartColors, string>();
COLOR_ARG.forEach((v, k) => COLOR_ARG_INVERSE.set(v, k));

const LANGUAGES_ARG = new Map<string, Languages>([
    ['h', Languages.HIDE],
    ['s', Languages.SHOW],
]);
const LANGUAGES_ARG_INVERSE = new Map<Languages, string>();
LANGUAGES_ARG.forEach((v, k) => LANGUAGES_ARG_INVERSE.set(v, k));

const TRIBE_ARG = new Map<string, Tribe>([
    ['h', Tribe.HIDE],
    ['s', Tribe.SHOW],
]);
const TRIBE_ARG_INVERSE = new Map<Tribe, string>();
TRIBE_ARG.forEach((v, k) => TRIBE_ARG_INVERSE.set(v, k));

const ID_ARG = new Map<string, Ids>([
    ['h', Ids.HIDE],
    ['s', Ids.SHOW],
]);
const ID_ARG_INVERSE = new Map<Ids, string>();
ID_ARG.forEach((v, k) => ID_ARG_INVERSE.set(v, k));

const SEX_ARG = new Map<string, Sex>([
    ['h', Sex.HIDE],
    ['s', Sex.SHOW],
]);
const SEX_ARG_INVERSE = new Map<Sex, string>();
SEX_ARG.forEach((v, k) => SEX_ARG_INVERSE.set(v, k));

const RENDER_TRIBE_OPTION_ARG: boolean = false;
const RENDER_LANGUAGES_OPTION_ARG: boolean = false;

export function argsToConfig(args: ParsedQuery<any>): Config {
    const getParam = (name: string) => {
        return typeof args[name] === 'string' ? args[name] : undefined;
    };
    return {
        color: COLOR_ARG.get(getParam('c') ?? '') ?? DEFAULT_CONFIG.color,
        languages: LANGUAGES_ARG.get(getParam('l') ?? '') ?? DEFAULT_CONFIG.languages,
        tribe: TRIBE_ARG.get(getParam('t') ?? '') ?? DEFAULT_CONFIG.tribe,
        id: ID_ARG.get(getParam('i') ?? '') ?? DEFAULT_CONFIG.id,
        sex: SEX_ARG.get(getParam('s') ?? '') ?? DEFAULT_CONFIG.sex,
        renderTribeOption: RENDER_TRIBE_OPTION_ARG,
        renderLanguagesOption: RENDER_LANGUAGES_OPTION_ARG,
        languageOptions: DEFAULT_CONFIG.languageOptions,
    };
}

export function configToArgs(config: Config): ParsedQuery<any> {
    return {
        c: COLOR_ARG_INVERSE.get(config.color),
        l: LANGUAGES_ARG_INVERSE.get(config.languages),
        t: TRIBE_ARG_INVERSE.get(config.tribe),
        i: ID_ARG_INVERSE.get(config.id),
        s: SEX_ARG_INVERSE.get(config.sex),
    };
}

export function ConfigPanel(props: {
    config: Config;
    onChange: (config: Config) => void;
}) {
    const languageOptions = [];
    for (let i = 0; i < props.config.languageOptions.length; i++) {
        const language = props.config.languageOptions[i];
        languageOptions.push(
            <Form.Field key={i} className={!props.config.renderLanguagesOption ? 'hidden' : 'no-margin suboption'}>
                <Checkbox
                    radio
                    label={language}
                    name="checkboxRadioGroup"
                    value={"l"+i}
                />
            </Form.Field>
        );
    }
    return (
        <Form className="details no-border-bottom">
            <Item.Group>
                <Item>
                    <Item.Content>
                        <Header sub>
                            <FormattedMessage id="config.colors" defaultMessage="Colors"/>
                        </Header>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.NO_COLOR" defaultMessage="none"/>
                                }
                                name="checkboxRadioGroup"
                                value="none"
                                checked={props.config.color === ChartColors.NO_COLOR}
                                onClick={() => props.onChange({
                                    ...props.config,
                                    color: ChartColors.NO_COLOR,
                                    languages: Languages.HIDE,
                                    tribe: Tribe.HIDE
                                })
                                }
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_GENERATION" defaultMessage="by generation"/>
                                }
                                name="checkboxRadioGroup"
                                value="generation"
                                checked={props.config.color === ChartColors.COLOR_BY_GENERATION}
                                onClick={() => props.onChange({
                                    ...props.config,
                                    color: ChartColors.COLOR_BY_GENERATION,
                                    languages: Languages.HIDE,
                                    tribe: Tribe.HIDE
                                })
                                }
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_SEX" defaultMessage="by sex"/>
                                }
                                name="checkboxRadioGroup"
                                value="gender"
                                checked={props.config.color === ChartColors.COLOR_BY_SEX}
                                onClick={() => props.onChange({
                                    ...props.config,
                                    color: ChartColors.COLOR_BY_SEX,
                                    languages: Languages.HIDE,
                                    tribe: Tribe.HIDE
                                })
                                }
                            />
                        </Form.Field>
                        <Form.Field className={!props.config.renderTribeOption ? 'hidden' : 'no-margin'}>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_TRIBE" defaultMessage="by tribe"/>
                                }
                                name="checkboxRadioGroup"
                                value="tribe"
                                checked={props.config.color === ChartColors.COLOR_BY_TRIBE}
                                onClick={() => props.onChange({
                                    ...props.config,
                                    color: ChartColors.COLOR_BY_TRIBE,
                                    languages: Languages.HIDE,
                                    tribe: Tribe.SHOW
                                })
                                }
                            />
                        </Form.Field>
                        <Form.Field className={!props.config.renderLanguagesOption ? 'hidden' : 'no-margin'}>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_LANGUAGES" defaultMessage="by languages"/>
                                }
                                name="checkboxRadioGroup"
                                value="languages"
                                checked={props.config.color === ChartColors.COLOR_BY_NR_LANGUAGES}
                                onClick={() => props.onChange({
                                    ...props.config,
                                    color: ChartColors.COLOR_BY_NR_LANGUAGES,
                                    languages: Languages.SHOW,
                                    tribe: Tribe.HIDE
                                })
                                }
                            />
                        </Form.Field>
                        {languageOptions}
                    </Item.Content>
                </Item>

                <Item className={!props.config.renderLanguagesOption ? 'hidden' : ''}>
                    <Item.Content>
                        <Header sub>
                            <FormattedMessage id="config.languages" defaultMessage="Languages"/>
                        </Header>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.languages.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.languages === Languages.HIDE}
                                onClick={() => props.onChange({...props.config, languages: Languages.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.languages.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.languages === Languages.SHOW}
                                onClick={() => props.onChange({...props.config, languages: Languages.SHOW})}
                            />
                        </Form.Field>
                    </Item.Content>
                </Item>

                <Item className={!props.config.renderTribeOption ? 'hidden' : ''}>
                    <Item.Content>
                        <Header sub>
                            <FormattedMessage id="config.tribe" defaultMessage="Tribe"/>
                        </Header>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.tribe.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.tribe === Tribe.HIDE}
                                onClick={() => props.onChange({...props.config, tribe: Tribe.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.tribe.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.tribe === Tribe.SHOW}
                                onClick={() => props.onChange({...props.config, tribe: Tribe.SHOW})}
                            />
                        </Form.Field>
                    </Item.Content>
                </Item>

                <Item>
                    <Item.Content>
                        <Header sub>
                            <FormattedMessage id="config.ids" defaultMessage="IDs"/>
                        </Header>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.ids.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.id === Ids.HIDE}
                                onClick={() => props.onChange({...props.config, id: Ids.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.ids.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.id === Ids.SHOW}
                                onClick={() => props.onChange({...props.config, id: Ids.SHOW})}
                            />
                        </Form.Field>
                    </Item.Content>
                </Item>

                <Item>
                    <Item.Content>
                        <Header sub>
                            <FormattedMessage id="config.sex" defaultMessage="Sex"/>
                        </Header>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.sex.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.sex === Sex.HIDE}
                                onClick={() => props.onChange({...props.config, sex: Sex.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.sex.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.sex === Sex.SHOW}
                                onClick={() => props.onChange({...props.config, sex: Sex.SHOW})}
                            />
                        </Form.Field>
                    </Item.Content>
                </Item>
            </Item.Group>
            <div style={{textAlign: "center"}}>
                <Form.Button primary onClick={() => props.onChange(DEFAULT_CONFIG)}>
                    <FormattedMessage id="config.reset" defaultMessage="Reset"/>
                </Form.Button>
            </div>
        </Form>

);
}

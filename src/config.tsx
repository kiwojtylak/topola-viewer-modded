import {Item, Checkbox, Form, Header} from 'semantic-ui-react';
import {FormattedMessage} from 'react-intl';
import {ParsedQuery} from 'query-string';
import {Language} from "./languages/languages-loader";

export enum ChartColors {
    NO_COLOR,
    COLOR_BY_SEX,
    COLOR_BY_GENERATION,
    COLOR_BY_TRIBE,
    COLOR_BY_NR_LANGUAGES = 4,
    COLOR_BY_LANGUAGE = 5,
}

export enum LanguagesArg {
    HIDE,
    SHOW,
}

export enum TribeArg {
    HIDE,
    SHOW,
}

export enum IdsArg {
    HIDE,
    SHOW,
}

export enum SexArg {
    HIDE,
    SHOW,
}

export interface Config {
    color: ChartColors;
    languages: LanguagesArg;
    tribe: TribeArg;
    id: IdsArg;
    sex: SexArg;
    renderLanguagesOption: boolean
    renderTribeOption: boolean
    languageOptions: Language[],
    selectedLanguage: string | null
}

export const DEFAULT_CONFIG: Config = {
    color: ChartColors.COLOR_BY_GENERATION,
    languages: LanguagesArg.HIDE,
    tribe: TribeArg.HIDE,
    id: IdsArg.SHOW,
    sex: SexArg.SHOW,
    renderLanguagesOption: false,
    renderTribeOption: false,
    languageOptions: [],
    selectedLanguage: null,
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

const LANGUAGES_ARG = new Map<string, LanguagesArg>([
    ['h', LanguagesArg.HIDE],
    ['s', LanguagesArg.SHOW],
]);
const LANGUAGES_ARG_INVERSE = new Map<LanguagesArg, string>();
LANGUAGES_ARG.forEach((v, k) => LANGUAGES_ARG_INVERSE.set(v, k));

const TRIBE_ARG = new Map<string, TribeArg>([
    ['h', TribeArg.HIDE],
    ['s', TribeArg.SHOW],
]);
const TRIBE_ARG_INVERSE = new Map<TribeArg, string>();
TRIBE_ARG.forEach((v, k) => TRIBE_ARG_INVERSE.set(v, k));

const ID_ARG = new Map<string, IdsArg>([
    ['h', IdsArg.HIDE],
    ['s', IdsArg.SHOW],
]);
const ID_ARG_INVERSE = new Map<IdsArg, string>();
ID_ARG.forEach((v, k) => ID_ARG_INVERSE.set(v, k));

const SEX_ARG = new Map<string, SexArg>([
    ['h', SexArg.HIDE],
    ['s', SexArg.SHOW],
]);
const SEX_ARG_INVERSE = new Map<SexArg, string>();
SEX_ARG.forEach((v, k) => SEX_ARG_INVERSE.set(v, k));

export function argsToConfig(args: ParsedQuery<any>): Config {
    const getParam = (name: string) => {
        return typeof args[name] === 'string' || typeof args[name] === 'number' ? args[name] : undefined;
    };
    return {
        color: COLOR_ARG.get(getParam('c') ?? '') ?? DEFAULT_CONFIG.color,
        languages: LANGUAGES_ARG.get(getParam('l') ?? '') ?? DEFAULT_CONFIG.languages,
        selectedLanguage: getParam('n') ?? DEFAULT_CONFIG.selectedLanguage,
        tribe: TRIBE_ARG.get(getParam('t') ?? '') ?? DEFAULT_CONFIG.tribe,
        id: ID_ARG.get(getParam('i') ?? '') ?? DEFAULT_CONFIG.id,
        sex: SEX_ARG.get(getParam('s') ?? '') ?? DEFAULT_CONFIG.sex,
        renderTribeOption: DEFAULT_CONFIG.renderTribeOption,
        renderLanguagesOption: DEFAULT_CONFIG.renderLanguagesOption,
        languageOptions: DEFAULT_CONFIG.languageOptions
    };
}

export function configToArgs(config: Config): ParsedQuery<any> {
    return {
        c: COLOR_ARG_INVERSE.get(config.color),
        l: LANGUAGES_ARG_INVERSE.get(config.languages),
        t: TRIBE_ARG_INVERSE.get(config.tribe),
        i: ID_ARG_INVERSE.get(config.id),
        s: SEX_ARG_INVERSE.get(config.sex),
        n: config.selectedLanguage
    };
}

export function ConfigPanel(props: {config: Config; onChange: (config: Config) => void}) {
    const languageOptions = [];
    for (let i = 0; i < props.config.languageOptions.length; i++) {
        const language = props.config.languageOptions[i];
        languageOptions.push(
            <Form.Field key={i} className={!props.config.renderLanguagesOption ? 'hidden' : 'no-margin suboption'}>
                <Checkbox
                    radio
                    label={language.name}
                    name="checkboxRadioGroup"
                    value={i}
                    checked={props.config.selectedLanguage === language.id}
                    onClick={
                        () => props.onChange({
                            ...props.config,
                            selectedLanguage: language.id,
                            color: ChartColors.COLOR_BY_LANGUAGE,
                            languages: LanguagesArg.SHOW,
                        })
                    }
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
                                onClick={
                                    () => props.onChange({
                                        ...props.config,
                                        color: ChartColors.NO_COLOR,
                                        languages: LanguagesArg.HIDE,
                                        tribe: TribeArg.HIDE,
                                        selectedLanguage: null
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
                                onClick={
                                    () => props.onChange({
                                        ...props.config,
                                        color: ChartColors.COLOR_BY_GENERATION,
                                        languages: LanguagesArg.HIDE,
                                        tribe: TribeArg.HIDE,
                                        selectedLanguage: null,
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
                                onClick={
                                    () => props.onChange({
                                        ...props.config,
                                        color: ChartColors.COLOR_BY_SEX,
                                        languages: LanguagesArg.HIDE,
                                        tribe: TribeArg.HIDE,
                                        selectedLanguage: null,
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
                                onClick={
                                    () => props.onChange({
                                        ...props.config,
                                        color: ChartColors.COLOR_BY_TRIBE,
                                        languages: LanguagesArg.HIDE,
                                        tribe: TribeArg.SHOW,
                                        selectedLanguage: null,
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
                                onClick={
                                    () => props.onChange({
                                        ...props.config,
                                        color: ChartColors.COLOR_BY_NR_LANGUAGES,
                                        languages: LanguagesArg.SHOW,
                                        tribe: TribeArg.HIDE,
                                        selectedLanguage: null,
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
                                    <FormattedMessage tagName="label" id="config.toggle.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.languages === LanguagesArg.HIDE}
                                onClick={() => props.onChange({...props.config, languages: LanguagesArg.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.toggle.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.languages === LanguagesArg.SHOW}
                                onClick={() => props.onChange({...props.config, languages: LanguagesArg.SHOW})}
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
                                    <FormattedMessage tagName="label" id="config.toggle.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.tribe === TribeArg.HIDE}
                                onClick={() => props.onChange({...props.config, tribe: TribeArg.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.toggle.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.tribe === TribeArg.SHOW}
                                onClick={() => props.onChange({...props.config, tribe: TribeArg.SHOW})}
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
                                    <FormattedMessage tagName="label" id="config.toggle.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.id === IdsArg.HIDE}
                                onClick={() => props.onChange({...props.config, id: IdsArg.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.toggle.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.id === IdsArg.SHOW}
                                onClick={() => props.onChange({...props.config, id: IdsArg.SHOW})}
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
                                    <FormattedMessage tagName="label" id="config.toggle.HIDE" defaultMessage="hide"/>
                                }
                                name="checkboxRadioGroup"
                                value="hide"
                                checked={props.config.sex === SexArg.HIDE}
                                onClick={() => props.onChange({...props.config, sex: SexArg.HIDE})}
                            />
                        </Form.Field>
                        <Form.Field className="no-margin">
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.toggle.SHOW" defaultMessage="show"/>
                                }
                                name="checkboxRadioGroup"
                                value="show"
                                checked={props.config.sex === SexArg.SHOW}
                                onClick={() => props.onChange({...props.config, sex: SexArg.SHOW})}
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

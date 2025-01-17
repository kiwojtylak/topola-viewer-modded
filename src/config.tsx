import {Item, Checkbox, Form, Header} from 'semantic-ui-react';
import {FormattedMessage} from 'react-intl';
import {ParsedQuery} from 'query-string';
import {Language} from "././model/languages-loader";
import {useState} from "react";

export enum ChartColors {
    NO_COLOR,
    COLOR_BY_SEX,
    COLOR_BY_GENERATION,
    COLOR_BY_ETHNICITY,
    COLOR_BY_NR_LANGUAGES = 4,
    COLOR_BY_LANGUAGE = 5,
}

export enum LanguagesArg {
    HIDE,
    SHOW,
}

export enum EthnicityArg {
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
    ethnicity: EthnicityArg;
    id: IdsArg;
    sex: SexArg;
    renderLanguagesOption: boolean
    renderEthnicityOption: boolean
    languageOptions: Language[],
    selectedLanguage: string | null
}

export const DEFAULT_CONFIG: Config = {
    color: ChartColors.COLOR_BY_GENERATION,
    languages: LanguagesArg.HIDE,
    ethnicity: EthnicityArg.HIDE,
    id: IdsArg.SHOW,
    sex: SexArg.SHOW,
    renderLanguagesOption: false,
    renderEthnicityOption: false,
    languageOptions: [],
    selectedLanguage: null,
};

const COLOR_ARG = new Map<string, ChartColors>([
    ['n', ChartColors.NO_COLOR],
    ['g', ChartColors.COLOR_BY_GENERATION],
    ['s', ChartColors.COLOR_BY_SEX],
    ['e', ChartColors.COLOR_BY_ETHNICITY],
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

const ETHNICITY_ARG = new Map<string, EthnicityArg>([
    ['h', EthnicityArg.HIDE],
    ['s', EthnicityArg.SHOW],
]);
const ETHNICITY_ARG_INVERSE = new Map<EthnicityArg, string>();
ETHNICITY_ARG.forEach((v, k) => ETHNICITY_ARG_INVERSE.set(v, k));

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
        ethnicity: ETHNICITY_ARG.get(getParam('e') ?? '') ?? DEFAULT_CONFIG.ethnicity,
        id: ID_ARG.get(getParam('i') ?? '') ?? DEFAULT_CONFIG.id,
        sex: SEX_ARG.get(getParam('s') ?? '') ?? DEFAULT_CONFIG.sex,
        renderEthnicityOption: DEFAULT_CONFIG.renderEthnicityOption,
        renderLanguagesOption: DEFAULT_CONFIG.renderLanguagesOption,
        languageOptions: DEFAULT_CONFIG.languageOptions
    };
}

export function configToArgs(config: Config): ParsedQuery<any> {
    return {
        c: COLOR_ARG_INVERSE.get(config.color),
        l: LANGUAGES_ARG_INVERSE.get(config.languages),
        e: ETHNICITY_ARG_INVERSE.get(config.ethnicity),
        i: ID_ARG_INVERSE.get(config.id),
        s: SEX_ARG_INVERSE.get(config.sex),
        n: config.selectedLanguage
    };
}

export function ConfigPanel(props: {config: Config; onChange: (config: Config) => void}) {
    const [languagesEnabled, setLanguagesEnabled] = useState(props.config.languages === LanguagesArg.SHOW);
    const [ethnicityEnabled, setEthnicityEnabled] = useState(props.config.ethnicity === EthnicityArg.SHOW);
    const [idsEnabled, setIdsEnabled] = useState(props.config.id === IdsArg.SHOW);
    const [sexEnabled, setSexEnabled] = useState(props.config.sex === SexArg.SHOW);

    const toggleLanguages = (newState: LanguagesArg) => {
        setLanguagesEnabled(!languagesEnabled);
        props.onChange({...props.config, languages: newState});
    };
    const toggleEthnicity = (newState: EthnicityArg) => {
        setEthnicityEnabled(!ethnicityEnabled);
        props.onChange({...props.config, ethnicity: newState});
    };
    const toggleIds = (newState: IdsArg) => {
        setIdsEnabled(!idsEnabled);
        props.onChange({...props.config, id: newState});
    };
    const toggleSex = (newState: SexArg) => {
        setSexEnabled(!sexEnabled);
        props.onChange({...props.config, sex: newState});
    };

    const languageOptions = [];
    for (let i = 0; i < props.config.languageOptions.length; i++) {
        const language = props.config.languageOptions[i];
        languageOptions.push(
            <Form.Field key={i} className={!props.config.renderLanguagesOption ? 'hidden' : 'no-margin suboption'}>
                <Checkbox
                    radio
                    label={language.name + " (" + language.abbreviation + ")"}
                    name="checkboxRadioGroup"
                    value={i}
                    checked={props.config.selectedLanguage === language.id}
                    onClick={
                        () => {
                            props.onChange({
                                ...props.config,
                                selectedLanguage: language.id,
                                color: ChartColors.COLOR_BY_LANGUAGE,
                                languages: LanguagesArg.SHOW,
                            });
                            setLanguagesEnabled(true);
                        }
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
                        <Header sub style={{ "margin-bottom": "14px" }}>
                            <FormattedMessage id="config.colors" defaultMessage="Colors"/>
                        </Header>
                        <Form.Field>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.NO_COLOR" defaultMessage="none"/>
                                }
                                name="checkboxRadioGroup"
                                value="none"
                                checked={props.config.color === ChartColors.NO_COLOR}
                                onClick={
                                    () => {
                                        props.onChange({
                                            ...props.config,
                                            color: ChartColors.NO_COLOR,
                                            languages: LanguagesArg.HIDE,
                                            ethnicity: EthnicityArg.HIDE,
                                            selectedLanguage: null
                                        });
                                        setEthnicityEnabled(false);
                                        setLanguagesEnabled(false);
                                    }
                                }
                            />
                        </Form.Field>
                        <Form.Field>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_GENERATION" defaultMessage="by generation"/>
                                }
                                name="checkboxRadioGroup"
                                value="generation"
                                checked={props.config.color === ChartColors.COLOR_BY_GENERATION}
                                onClick={
                                    () => {
                                        props.onChange({
                                            ...props.config,
                                            color: ChartColors.COLOR_BY_GENERATION,
                                            languages: LanguagesArg.HIDE,
                                            ethnicity: EthnicityArg.HIDE,
                                            selectedLanguage: null,
                                        });
                                        setEthnicityEnabled(false);
                                        setLanguagesEnabled(false);
                                    }
                                }
                            />
                        </Form.Field>
                        <Form.Field>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_SEX" defaultMessage="by gender"/>
                                }
                                name="checkboxRadioGroup"
                                value="gender"
                                checked={props.config.color === ChartColors.COLOR_BY_SEX}
                                onClick={
                                    () => {
                                        props.onChange({
                                            ...props.config,
                                            color: ChartColors.COLOR_BY_SEX,
                                            languages: LanguagesArg.HIDE,
                                            ethnicity: EthnicityArg.HIDE,
                                            selectedLanguage: null,
                                        });
                                        setEthnicityEnabled(false);
                                        setLanguagesEnabled(false);
                                    }
                                }
                            />
                        </Form.Field>
                        <Form.Field className={!props.config.renderEthnicityOption ? 'hidden' : ''}>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_ETHNICITY" defaultMessage="by ethnicity"/>
                                }
                                name="checkboxRadioGroup"
                                value="ethnicity"
                                checked={props.config.color === ChartColors.COLOR_BY_ETHNICITY}
                                onClick={
                                    () => {
                                        props.onChange({
                                            ...props.config,
                                            color: ChartColors.COLOR_BY_ETHNICITY,
                                            languages: LanguagesArg.HIDE,
                                            ethnicity: EthnicityArg.SHOW,
                                            selectedLanguage: null,
                                        });
                                        setEthnicityEnabled(true);
                                        setLanguagesEnabled(false);
                                    }
                                }
                            />
                        </Form.Field>
                        <Form.Field className={!props.config.renderLanguagesOption ? 'hidden' : ''}>
                            <Checkbox
                                radio
                                label={
                                    <FormattedMessage tagName="label" id="config.colors.COLOR_BY_LANGUAGES" defaultMessage="by no. languages"/>
                                }
                                name="checkboxRadioGroup"
                                value="languages"
                                checked={props.config.color === ChartColors.COLOR_BY_NR_LANGUAGES}
                                onClick={
                                    () => {
                                        props.onChange({
                                            ...props.config,
                                            color: ChartColors.COLOR_BY_NR_LANGUAGES,
                                            languages: LanguagesArg.SHOW,
                                            ethnicity: EthnicityArg.HIDE,
                                            selectedLanguage: null,
                                        });
                                        setEthnicityEnabled(false);
                                        setLanguagesEnabled(true);
                                    }
                                }
                            />
                        </Form.Field>
                        {languageOptions}
                    </Item.Content>
                </Item>

                <Item className={!props.config.renderLanguagesOption ? 'hidden' : ''}>
                    <Item.Content>
                        <Checkbox toggle
                                  id="languages"
                                  checked={languagesEnabled}
                                  onClick={() => toggleLanguages(languagesEnabled ? LanguagesArg.HIDE : LanguagesArg.SHOW)}
                        />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <label style={{ verticalAlign: "top" }}>
                            {languagesEnabled ?
                                <FormattedMessage id="config.toggle.HIDE" defaultMessage="Hide"/> :
                                <FormattedMessage id="config.toggle.SHOW" defaultMessage="Show"/>
                            }
                            {" "}
                            <FormattedMessage id="config.languages" defaultMessage="languages"/>
                        </label>
                    </Item.Content>
                </Item>

                <Item className={!props.config.renderEthnicityOption ? 'hidden' : ''}>
                    <Item.Content>
                        <Checkbox toggle
                                  id="ethnicity"
                                  checked={ethnicityEnabled}
                                  onClick={() => toggleEthnicity(ethnicityEnabled ? EthnicityArg.HIDE : EthnicityArg.SHOW)}
                        />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <label style={{ verticalAlign: "top" }}>
                            {ethnicityEnabled ?
                                <FormattedMessage id="config.toggle.HIDE" defaultMessage="Hide"/> :
                                <FormattedMessage id="config.toggle.SHOW" defaultMessage="Show"/>
                            }
                            {" "}
                            <FormattedMessage id="config.ethnicity" defaultMessage="ethnicity"/>
                        </label>
                    </Item.Content>
                </Item>

                <Item>
                    <Item.Content>
                        <Checkbox toggle
                                  id="ids"
                                  checked={idsEnabled}
                                  onClick={() => toggleIds(idsEnabled ? IdsArg.HIDE : IdsArg.SHOW)}
                        />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <label style={{ verticalAlign: "top" }}>
                            {idsEnabled ?
                                <FormattedMessage id="config.toggle.HIDE" defaultMessage="Hide"/> :
                                <FormattedMessage id="config.toggle.SHOW" defaultMessage="Show"/>
                            }
                            {" "}
                            <FormattedMessage id="config.ids" defaultMessage="IDs"/>
                        </label>
                    </Item.Content>
                </Item>

                <Item>
                    <Item.Content>
                        <Checkbox toggle
                                  id="sex"
                                  checked={sexEnabled}
                                  onClick={() => toggleSex(sexEnabled ? SexArg.HIDE : SexArg.SHOW)}
                        />
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <label style={{ verticalAlign: "top" }}>
                            {sexEnabled ?
                                <FormattedMessage id="config.toggle.HIDE" defaultMessage="Hide"/> :
                                <FormattedMessage id="config.toggle.SHOW" defaultMessage="Show"/>
                            }
                            {" "}
                            <FormattedMessage id="config.sex" defaultMessage="sex"/>
                        </label>
                    </Item.Content>
                </Item>
            </Item.Group>
            <div style={{textAlign: "center"}}>
                <Form.Button primary onClick={
                    () => {
                        props.onChange(DEFAULT_CONFIG);
                        setEthnicityEnabled(false);
                        setLanguagesEnabled(false);
                        setIdsEnabled(true);
                        setSexEnabled(true);
                    }
                }>
                    <FormattedMessage id="config.reset" defaultMessage="Reset"/>
                </Form.Button>
            </div>
        </Form>

);
}

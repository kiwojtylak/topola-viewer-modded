import * as H from 'history';
import * as queryString from 'query-string';
import {analyticsEvent} from './util/analytics';
import {DataSourceEnum, SourceSelection} from './datasource/data_source';
import {Details} from './details/details';
import {EmbeddedDataSource, EmbeddedSourceSpec} from './datasource/embedded';
import {FormattedMessage, useIntl} from 'react-intl';
import {getI18nMessage} from './util/error_i18n';
import {IndiInfo} from './lib/topola';
import {Loader, Message, Portal, Tab} from 'semantic-ui-react';
import {Media} from './util/media';
import {Redirect, Route, Switch} from 'react-router-dom';
import {TopBar} from './menu/top_bar';
import {GedcomData, idToIndiMap, jsonToGedcom, TopolaData} from './util/gedcom_util';
import {useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router';
import {
    Chart,
    ChartType,
    downloadGedcom,
    downloadPdf,
    downloadPng,
    downloadSvg,
    getFilename
} from './chart';
import {
    GedcomUrlDataSource,
    getSelection,
    UploadedDataSource,
    UploadSourceSpec,
    UrlSourceSpec
} from './datasource/load_data';
import CSVLoader, {Language} from "././model/languages-loader";
import {
    argsToConfig,
    Config,
    ConfigPanel,
    configToArgs,
    DEFAULT_CONFIG,
    EthnicityArg,
    IdsArg,
    LanguagesArg,
    SexArg
} from './config';
import SidePanel from "./util/side_panel";


/**
 * Load GEDCOM URL from REACT_APP_STATIC_URL environment variable.
 *
 * If this environment variable is provided, the viewer is switched to
 * single-tree mode without the option to load other data.
 */
const staticUrl = process.env.REACT_APP_STATIC_URL;

/** Shows an error message in the middle of the screen. */
function ErrorMessage(props: { message?: string }) {
    return (
        <Message negative className="error">
            <Message.Header>
                <FormattedMessage
                    id="error.failed_to_load_file"
                    defaultMessage={'Failed to load file'}
                />
            </Message.Header>
            <p>{props.message}</p>
        </Message>
    );
}

interface ErrorPopupProps {
    message?: string;
    open: boolean;
    onDismiss: () => void;
}

/**
 * Shows a dismissable error message in the bottom left corner of the screen.
 */
function ErrorPopup(props: ErrorPopupProps) {
    return (
        <Portal open={props.open} onClose={props.onDismiss}>
            <Message negative className="errorPopup" onDismiss={props.onDismiss}>
                <Message.Header>
                    <FormattedMessage id="error.error" defaultMessage={'Error'}/>
                </Message.Header>
                <p>{props.message}</p>
            </Message>
        </Portal>
    );
}

enum AppState {
    INITIAL,
    LOADING,
    ERROR,
    SHOWING_CHART,
    LOADING_MORE
}

type DataSourceSpec = UrlSourceSpec | UploadSourceSpec | EmbeddedSourceSpec;

/**
 * Arguments passed to the application, primarily through URL parameters.
 * Non-optional arguments get populated with default values.
 */
interface Arguments {
    sourceSpec?: DataSourceSpec;
    selection?: IndiInfo;
    chartType: ChartType;
    standalone: boolean;
    freezeAnimation: boolean;
    showSidePanel: boolean;
    config: Config;
}

function getParamFromSearch(name: string, search: queryString.ParsedQuery) {
    const value = search[name];
    return typeof value === 'string' ? value : undefined;
}

function startIndi(data: TopolaData | undefined) {
    const egoGen = getEgoGen(data)
    return {
        id: getLowestId(data) || 'I0',  // lowest ID on the chart, focus at the root, not at the EGO
        generation: egoGen !== undefined ? -parseInt(egoGen, 10) : 0
    };
}

function getEgoGen(data: TopolaData | undefined) {
    return getEgoRecord(data?.gedcom)
        .map(([_, value]) => value.tree.find(sub => sub.tag === "GEN")?.data)
        .find(data => data !== undefined);
}

export function getEgoRecord(gedcom: GedcomData | undefined) {
    return Object.entries(gedcom?.other || {}).filter(([_, value]) => value.tag === "EGO")
}

function getLowestId(data: TopolaData | undefined) {
    return data?.chartData?.indis?.reduce((lowest, current) =>
            current.id.startsWith('I') && parseInt(current.id.slice(1), 10) < parseInt(lowest.id.slice(1), 10)
            ? current
            : lowest,
        data?.chartData?.indis?.[0]
    )?.id;
}

function loadLanguageOptions(data: TopolaData | undefined, allLanguages: Language[]) {
    const gedcomLanguages = Array.from(getGedcomLanguages(data));
    return allLanguages.filter((l: Language) => gedcomLanguages.includes(l.name)).sort();
}

function getGedcomLanguages(data: TopolaData | undefined) {
    return Object.entries(data?.gedcom?.indis || {})
        .reduce<Set<string>>((acc, [_, value]) => {
            const langDataArray = value.tree.filter((sub: any) => sub.tag === "LANG");
            langDataArray.forEach(lang => {
                if (lang.data) acc.add(lang.data);
            });
            return acc;
        }, new Set<string>());
}

function getEthnicities(data: TopolaData | undefined) {
    return Object.entries(data?.gedcom?.indis || {})
        .reduce<Set<string>>((acc, [_, value]) => {
            const langDataArray = value.tree.filter((sub: any) => sub.tag === "_ETHN");
            langDataArray.forEach(lang => {
                if (lang.data) acc.add(lang.data);
            });
            return acc;
        }, new Set<string>());
}

/**
 * Retrieve arguments passed into the application through the URL and uploaded data.
 */
function getArguments(location: H.Location<any>, allLanguages: Language[]): Arguments {
    const search = queryString.parse(location.search);
    const getParam = (name: string) => getParamFromSearch(name, search);
    const view = getParam("view");
    const chartTypes = new Map<string | undefined, ChartType>([
        ["relatives", ChartType.Relatives]
    ]);
    const hash = getParam("file");
    const url = getParam("url");
    const embedded = getParam("embedded") === "true"; // False by default.
    let sourceSpec: DataSourceSpec | undefined = undefined;
    if (staticUrl) {
        sourceSpec = {
            source: DataSourceEnum.GEDCOM_URL,
            url: staticUrl,
            handleCors: false,
            allLanguages: allLanguages
        };
    } else if (hash) {
        sourceSpec = {
            source: DataSourceEnum.UPLOADED,
            hash,
            gedcom: location.state && location.state.data,
            allLanguages: allLanguages,
            images: location.state && location.state.images,
        };
    } else if (url) {
        sourceSpec = {
            source: DataSourceEnum.GEDCOM_URL,
            url,
            allLanguages: allLanguages,
            handleCors: getParam("handleCors") !== "false", // True by default.
        };
    } else if (embedded) {
        sourceSpec = {source: DataSourceEnum.EMBEDDED};
    }

    const indi = getParam("indi");
    const parsedGen = Number(getParam("gen"));
    const selection = indi
        ? {id: indi, generation: !isNaN(parsedGen) ? parsedGen : 0}
        : undefined

    return {
        sourceSpec,
        selection,
        chartType: chartTypes.get(view) || ChartType.Hourglass,
        showSidePanel: getParam("sidePanel") !== "false", // True by default.
        standalone: getParam("standalone") !== "false" && !embedded && !staticUrl,
        freezeAnimation: getParam("freeze") === "true", // False by default
        config: argsToConfig(search),
    };
}

export function App() {
    /** State of the application. */
    const [state, setState] = useState<AppState>(AppState.INITIAL);
    /** Loaded data. */
    const [data, setData] = useState<TopolaData>();
    /** Selected individual. */
    const [selection, setSelection] = useState<IndiInfo>();
    /** Error to display. */
    const [error, setError] = useState<string>();
    /** Whether the side panel is shown. */
    const [showSidePanel, setShowSidePanel] = useState(false);
    /** Whether the app is in standalone mode, i.e. showing 'open file' menus. */
    const [standalone, setStandalone] = useState(true);
    /** Type of displayed chart. */
    const [chartType, setChartType] = useState<ChartType>(ChartType.Hourglass);
    /** Whether to show the error popup. */
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    /** Specification of the source of the data. */
    const [sourceSpec, setSourceSpec] = useState<DataSourceSpec>();
    const [gedcomString, setGedcomString] = useState<String>()
    /** Freeze animations after initial chart render. */
    const [freezeAnimation, setFreezeAnimation] = useState(false);
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    /** All languages. */
    const [allLanguages, setAllLanguages] = useState<Language[]>([]);


    const intl = useIntl();
    const history = useHistory();
    const location = useLocation();

    /** Sets the state with a new individual selection and chart type. */
    function updateDisplay(newSelection: IndiInfo) {
        if (!selection || selection.id !== newSelection.id || selection!.generation !== newSelection.generation) {
            setSelection(newSelection);
        }
    }

    function toggleDetails(config: Config, data: TopolaData | undefined, allLanguages: Language[]) {
        if (data === undefined) {
            return;
        }
        // Find if there are languages
        config.languageOptions = loadLanguageOptions(data, allLanguages)
        config.renderLanguagesOption = config.languageOptions.length > 0
        // Find if there are ethnicities/tribes
        config.renderEthnicityOption = Array.from(getEthnicities(data)).length > 0
        idToIndiMap(data.chartData).forEach((indi) => {
            indi.hideLanguages = config.languages === LanguagesArg.HIDE;
            indi.hideEthnicity = config.ethnicity === EthnicityArg.HIDE;
            indi.hideId = config.id === IdsArg.HIDE;
            indi.hideSex = config.sex === SexArg.HIDE;
        });
    }

    /** Sets error message after data load failure. */
    function setErrorMessage(message: string) {
        setError(message);
        setState(AppState.ERROR);
    }

    const uploadedDataSource = new UploadedDataSource();
    const gedcomUrlDataSource = new GedcomUrlDataSource();
    const embeddedDataSource = new EmbeddedDataSource();

    function isNewData(newSourceSpec: DataSourceSpec, newSelection?: IndiInfo) {
        if (!sourceSpec || sourceSpec.source !== newSourceSpec.source) {
            // New data source means new data
            return true;
        }
        const newSource = {spec: newSourceSpec, selection: newSelection};
        const oldSource = {
            spec: sourceSpec,
            selection: selection,
        };
        switch (newSource.spec.source) {
            case DataSourceEnum.UPLOADED:
                return uploadedDataSource.isNewData(
                    newSource as SourceSelection<UploadSourceSpec>,
                    oldSource as SourceSelection<UploadSourceSpec>,
                    data,
                );
            case DataSourceEnum.GEDCOM_URL:
                return gedcomUrlDataSource.isNewData(
                    newSource as SourceSelection<UrlSourceSpec>,
                    oldSource as SourceSelection<UrlSourceSpec>,
                    data,
                );
            case DataSourceEnum.EMBEDDED:
                return embeddedDataSource.isNewData(
                    newSource as SourceSelection<EmbeddedSourceSpec>,
                    oldSource as SourceSelection<EmbeddedSourceSpec>,
                    data,
                );
        }
    }

    function loadData(newSourceSpec: DataSourceSpec, newSelection?: IndiInfo, allLanguages?: Language[]) {
        switch (newSourceSpec.source) {
            case DataSourceEnum.UPLOADED:
                analyticsEvent('topola_gedcom_upload');
                return uploadedDataSource.loadData({spec: newSourceSpec, selection: newSelection, allLanguages: allLanguages});
            case DataSourceEnum.GEDCOM_URL:
                analyticsEvent('topola_url_load');
                return gedcomUrlDataSource.loadData({spec: newSourceSpec, selection: newSelection, allLanguages: allLanguages});
            case DataSourceEnum.EMBEDDED:
                return embeddedDataSource.loadData({spec: newSourceSpec, selection: newSelection, allLanguages: allLanguages});
        }
    }

    // Function to load languages from CSV
    const loadAllLanguages = async () => {
        const allLanguages = await CSVLoader.loadLanguages("data/languages.csv") || [];
        setAllLanguages(allLanguages);
    };

    // useEffect to load languages when pathname is '/view'
    useEffect(() => {
        loadAllLanguages();
    }, [location.pathname]);

    useEffect(() => {
        analyticsEvent("topola_landing");
        const rootElement = document.getElementById('root');
        if (location.pathname === '/') {
            // @ts-ignore
            rootElement.classList.add("bgLogo");
        } else {
            // @ts-ignore
            rootElement.classList.remove("bgLogo");
        }

        (async () => {
            if (location.pathname !== "/view") {
                if (state !== AppState.INITIAL) {
                    setState(AppState.INITIAL);
                }
                return;
            }

            const args = getArguments(location, allLanguages);
            if (!args.sourceSpec) {
                history.replace({pathname: '/'});
                return;
            }
            if (
                state === AppState.INITIAL || isNewData(args.sourceSpec, args.selection)
            ) {
                setState(AppState.LOADING);
                setSourceSpec(args.sourceSpec);
                setStandalone(args.standalone);
                setChartType(args.chartType);
                setFreezeAnimation(args.freezeAnimation);
                setConfig(args.config);
                try {
                    const data = await loadData(args.sourceSpec, args.selection);
                    setData(data);
                    setGedcomString(jsonToGedcom(data.gedcom))
                    setSelection(args.selection !== undefined ? args.selection : startIndi(data));
                    toggleDetails(args.config, data, allLanguages);
                    setShowSidePanel(args.showSidePanel);
                    setState(AppState.SHOWING_CHART);
                } catch (error: any) {
                    setErrorMessage(getI18nMessage(error, intl));
                }
            } else if (
                state === AppState.SHOWING_CHART || state === AppState.LOADING_MORE
            ) {
                setChartType(args.chartType);
                setState(AppState.SHOWING_CHART);
                updateDisplay(args.selection !== undefined ? args.selection : startIndi(data));
            }
        })();
    });

    function updateUrl(args: queryString.ParsedQuery<any>) {
        const search = queryString.parse(location.search);
        for (const key in args) {
            search[key] = args[key];
        }
        location.search = queryString.stringify(search);
        history.push(location);
    }

    /**
     * Called when the user clicks an individual box in the chart. Updates the browser URL.
     */
    function onSelection(selection: IndiInfo) {
        updateUrl({
            indi: selection.id,
            gen: selection.generation,
        });
    }

    function displayErrorPopup(message: string) {
        setShowErrorPopup(true);
        setError(message);
    }

    async function onDownloadPdf() {
        try {
            analyticsEvent("topola_download_pdf");
            const filename = getFilename(data?.gedcom)
            await downloadPdf(filename);
        } catch (e) {
            displayErrorPopup(
                intl.formatMessage({
                    id: "error.failed_pdf",
                    defaultMessage: "Failed to generate PDF file. Please try with a smaller diagram or download an SVG file.",
                })
            );
        }
    }

    async function onDownloadPng() {
        try {
            analyticsEvent("topola_download_png");
            const filename = getFilename(data?.gedcom)
            await downloadPng(filename);
        } catch (e) {
            displayErrorPopup(
                intl.formatMessage({
                    id: "error.failed_png",
                    defaultMessage: "Failed to generate PNG file. Please try with a smaller diagram or download an SVG file."
                })
            );
        }
    }

    async function onDownloadSvg() {
        analyticsEvent("topola_download_svg");
        const filename = getFilename(data?.gedcom)
        await downloadSvg(filename);
    }

    async function onDownloadGedcom() {
        analyticsEvent("topola_download_gedcom");
        const filename = getFilename(data?.gedcom)
        await downloadGedcom(gedcomString as string, filename);
    }

    function onResetView() {
        const s = startIndi(data);
        const args = {
            indi: s.id,
            gen:  s.generation
        };
        const search = queryString.parse(location.search);
        for (const key in args) {
            delete search[key]
        }
        location.search = queryString.stringify(search);
        history.push(location);
    }

    function onDismissErrorPopup() {
        setShowErrorPopup(false);
    }

    function renderMainArea() {
        switch (state) {
            case AppState.SHOWING_CHART:
            case AppState.LOADING_MORE:
                const updatedSelection = getSelection(data!.chartData, selection);
                const sidePanelTabs = [
                    {
                        menuItem: intl.formatMessage({id: "tab.info", defaultMessage: "Info"}),
                        render: () => (
                            <Details gedcom={data!.gedcom} indi={updatedSelection.id}/>
                        ),
                    },
                    {
                        menuItem: intl.formatMessage({
                            id: "tab.settings",
                            defaultMessage: "Settings",
                        }),
                        render: () => (
                            <ConfigPanel
                                config={config}
                                onChange={(config) => {
                                    setConfig(config);
                                    toggleDetails(config, data, allLanguages);
                                    updateUrl(configToArgs(config));
                                }}
                            />
                        ),
                    },
                ];
                return (
                    <div id="content">
                        <ErrorPopup
                            open={showErrorPopup}
                            message={error}
                            onDismiss={onDismissErrorPopup}
                        />
                        {state === AppState.LOADING_MORE ? (
                            <Loader active size="small" className="loading-more"/>
                        ) : null}
                        <Chart
                            data={data!.chartData}
                            selection={updatedSelection}
                            chartType={chartType}
                            onSelection={onSelection}
                            freezeAnimation={freezeAnimation}
                            colors={config.color}
                            selectedLanguage={config.selectedLanguage}
                            hideLanguages={config.languages}
                            hideEthnicity={config.ethnicity}
                            hideIds={config.id}
                            hideSex={config.sex}
                        />
                        {showSidePanel ? (
                            <Media greaterThanOrEqual="large" className="sidePanel">
                                <Tab panes={sidePanelTabs}/>
                            </Media>
                        ) : null}
                    </div>
                );
            case AppState.ERROR:
                return <ErrorMessage message={error!}/>;
            case AppState.INITIAL:
            case AppState.LOADING:
                return <Loader active size="large"/>;
        }
    }
    return (
        <>
            <Route
                render={() => (
                    <TopBar
                        data={data?.chartData}
                        showingChart={
                            history.location.pathname === "/view" &&
                            (state === AppState.SHOWING_CHART || state === AppState.LOADING_MORE)
                        }
                        standalone={standalone}
                        eventHandlers={{
                            onSelection,
                            onDownloadPdf,
                            onDownloadPng,
                            onDownloadSvg,
                            onDownloadGedcom,
                            onResetView,
                        }}
                    />
                )}
            />
            {staticUrl ? (
                <Switch>
                    <Route exact path="/view" render={renderMainArea}/>
                    <Redirect to={"/view"}/>
                </Switch>
            ) : (
                <Switch>
                    <Route exact path="/view" render={renderMainArea}/>
                    <Redirect to={'/'}/>
                </Switch>
            )}
        </>
    );
}

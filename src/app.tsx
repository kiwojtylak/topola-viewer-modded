import * as H from 'history';
import * as queryString from 'query-string';
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
import {TopolaData} from './util/gedcom_util';
import {useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router';
import {idToIndiMap} from './util/gedcom_util';
import {
    Chart,
    ChartType,
    downloadPdf,
    downloadPng,
    downloadSvg,
} from './chart';
import {
    argsToConfig,
    Config,
    ConfigPanel,
    configToArgs,
    DEFAULT_CONFIG,
    Languages,
    Tribe,
    Ids,
    Sex,
} from './config';
import {
    getSelection,
    UploadSourceSpec,
    UrlSourceSpec,
    GedcomUrlDataSource,
    UploadedDataSource,
} from './datasource/load_data';

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
    LOADING_MORE,
}

type DataSourceSpec =
    | UrlSourceSpec
    | UploadSourceSpec
    | EmbeddedSourceSpec;

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
        id: data?.chartData?.indis?.[0]?.id || 'I0',  // lowest ID on the chart
        generation: egoGen !== undefined ? -parseInt(egoGen, 10) : 0
    };
}

function getEgoIndi(data: TopolaData | undefined) {
    return Object.entries(data?.gedcom?.other || {})
        .filter(([_, value]) => value.tag === "EGO")
}

function getEgoGen(data: TopolaData | undefined) {
    return getEgoIndi(data)
        .map(([_, value]) => value.tree.find(sub => sub.tag === "GEN")?.data)
        .find(data => data !== undefined);
}

function getLanguageOptions(data: TopolaData | undefined) {
    return Object.entries(data?.gedcom?.indis || {})
        .reduce<Set<string>>((acc, [_, value]) => {
            const langDataArray = value.tree.filter((sub: any) => sub.tag === "LANG");
            langDataArray.forEach(lang => {
                if (lang.data) acc.add(lang.data);
            });
            return acc;
        }, new Set<string>());
}

function getTribes(data: TopolaData | undefined) {
    return Object.entries(data?.gedcom?.indis || {})
        .reduce<Set<string>>((acc, [_, value]) => {
            const langDataArray = value.tree.filter((sub: any) => sub.tag === "_TRIB");
            langDataArray.forEach(lang => {
                if (lang.data) acc.add(lang.data);
            });
            return acc;
        }, new Set<string>());
}

/**
 * Retrieve arguments passed into the application through the URL and uploaded data.
 */
function getArguments(location: H.Location<any>): Arguments {
    const chartTypes = new Map<string | undefined, ChartType>([
        ['hourglass', ChartType.Hourglass]
    ]);
    const search = queryString.parse(location.search);
    const getParam = (name: string) => getParamFromSearch(name, search);
    const view = getParam('view');
    const hash = getParam('file');
    const url = getParam('url');
    const embedded = getParam('embedded') === 'true'; // False by default.
    let sourceSpec: DataSourceSpec | undefined = undefined;
    if (staticUrl) {
        sourceSpec = {
            source: DataSourceEnum.GEDCOM_URL,
            url: staticUrl,
            handleCors: false,
        };
    } else if (hash) {
        sourceSpec = {
            source: DataSourceEnum.UPLOADED,
            hash,
            gedcom: location.state && location.state.data,
            images: location.state && location.state.images,
        };
    } else if (url) {
        sourceSpec = {
            source: DataSourceEnum.GEDCOM_URL,
            url,
            handleCors: getParam('handleCors') !== 'false', // True by default.
        };
    } else if (embedded) {
        sourceSpec = {source: DataSourceEnum.EMBEDDED};
    }

    const indi = getParam('indi');
    const parsedGen = Number(getParam('gen'));
    const selection = indi
        ? {id: indi, generation: !isNaN(parsedGen) ? parsedGen : 0}
        : undefined

    return {
        sourceSpec,
        selection,
        // Hourglass is the default view.
        chartType: chartTypes.get(view) || ChartType.Hourglass,
        showSidePanel: getParam('sidePanel') !== 'false', // True by default.
        standalone: getParam('standalone') !== 'false' && !embedded && !staticUrl,
        freezeAnimation: getParam('freeze') === 'true', // False by default
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
    /** Freeze animations after initial chart render. */
    const [freezeAnimation, setFreezeAnimation] = useState(false);
    const [config, setConfig] = useState(DEFAULT_CONFIG);

    const intl = useIntl();
    const history = useHistory();
    const location = useLocation();

    /** Sets the state with a new individual selection and chart type. */
    function updateDisplay(newSelection: IndiInfo) {
        if (!selection || selection.id !== newSelection.id || selection!.generation !== newSelection.generation) {
            setSelection(newSelection);
        }
    }

    function toggleDetails(config: Config, data: TopolaData | undefined) {
        if (data === undefined) {
            return;
        }
        // Find if there are languages
        config.languageOptions = Array.from(getLanguageOptions(data)).sort()
        config.renderLanguagesOption = config.languageOptions.length > 0
        // Find if there are tribes
        config.renderTribeOption = Array.from(getTribes(data)).length > 0
        idToIndiMap(data.chartData).forEach((indi) => {
            indi.hideLanguages = config.languages === Languages.HIDE;
            indi.hideTribe = config.tribe === Tribe.HIDE;
            indi.hideId = config.id === Ids.HIDE;
            indi.hideSex = config.sex === Sex.HIDE;
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

    function loadData(newSourceSpec: DataSourceSpec, newSelection?: IndiInfo) {
        switch (newSourceSpec.source) {
            case DataSourceEnum.UPLOADED:
                return uploadedDataSource.loadData({
                    spec: newSourceSpec,
                    selection: newSelection,
                });
            case DataSourceEnum.GEDCOM_URL:
                return gedcomUrlDataSource.loadData({
                    spec: newSourceSpec,
                    selection: newSelection,
                });
            case DataSourceEnum.EMBEDDED:
                return embeddedDataSource.loadData({
                    spec: newSourceSpec,
                    selection: newSelection,
                });
        }
    }

    useEffect(() => {
        const rootElement = document.getElementById('root');
        if (location.pathname === '/') {
            // @ts-ignore
            rootElement.classList.add('bgLogo');
        } else {
            // @ts-ignore
            rootElement.classList.remove('bgLogo');
        }

        (async () => {
            if (location.pathname !== '/view') {
                if (state !== AppState.INITIAL) {
                    setState(AppState.INITIAL);
                }
                return;
            }
            const args = getArguments(location);
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
                    setSelection(args.selection !== undefined ? args.selection : startIndi(data));
                    toggleDetails(args.config, data);
                    setShowSidePanel(args.showSidePanel);
                    setState(AppState.SHOWING_CHART);
                } catch (error: any) {
                    setErrorMessage(getI18nMessage(error, intl));
                }
            } else if (
                state === AppState.SHOWING_CHART || state === AppState.LOADING_MORE
            ) {
                // Update selection if it has changed in the URL.
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
            await downloadPdf();
        } catch (e) {
            displayErrorPopup(
                intl.formatMessage({
                    id: 'error.failed_pdf',
                    defaultMessage:
                        'Failed to generate PDF file.' +
                        ' Please try with a smaller diagram or download an SVG file.',
                }),
            );
        }
    }

    async function onDownloadPng() {
        try {
            await downloadPng();
        } catch (e) {
            displayErrorPopup(
                intl.formatMessage({
                    id: 'error.failed_png',
                    defaultMessage:'Failed to generate PNG file. Please try with a smaller diagram or download an SVG file.'
                }),
            );
        }
    }

    function onDownloadSvg() {
        downloadSvg();
    }

    function onCenterView() {
        onSelection(startIndi(data))
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
                        menuItem: intl.formatMessage({
                            id: 'tab.info',
                            defaultMessage: 'Info',
                        }),
                        render: () => (
                            <Details gedcom={data!.gedcom} indi={updatedSelection.id}/>
                        ),
                    },
                    {
                        menuItem: intl.formatMessage({
                            id: 'tab.settings',
                            defaultMessage: 'Settings',
                        }),
                        render: () => (
                            <ConfigPanel
                                config={config}
                                onChange={(config) => {
                                    setConfig(config);
                                    toggleDetails(config, data);
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
                            hideTribe={config.tribe}
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
                            history.location.pathname === '/view' &&
                            (state === AppState.SHOWING_CHART || state === AppState.LOADING_MORE)
                        }
                        standalone={standalone}
                        eventHandlers={{
                            onSelection,
                            onDownloadPdf,
                            onDownloadPng,
                            onDownloadSvg,
                            onCenterView,
                        }}
                    />
                )}
            />
            {staticUrl ? (
                <Switch>
                    <Route exact path="/view" render={renderMainArea}/>
                    <Redirect to={'/view'}/>
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


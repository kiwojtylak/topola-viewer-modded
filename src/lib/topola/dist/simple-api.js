Object.defineProperty(exports, "__esModule", { value: true });
exports.createChart = void 0;
const d3_selection_1 = require("d3-selection");
const data_1 = require("./data");
const DEFAULT_SVG_SELECTOR = 'svg';

function createChartOptions(chartOptions, renderOptions, options) {
    const data = new data_1.JsonDataProvider(chartOptions.json);
    const indiHrefFunc = chartOptions.indiUrl ? function (id) {
            return chartOptions.indiUrl.replace(`${id}`, id);
        } : undefined;
    const famHrefFunc = chartOptions.famUrl ? function (id) {
            return chartOptions.famUrl.replace(`${id}`, id);
        } : undefined;
    // If startIndi nor startFam is provided, select the first indi in the data.
    if (!renderOptions.startIndi && !renderOptions.startFam) {
        renderOptions.startIndi = chartOptions.json.indis[0].id;
    }
    const animate = !options.initialRender && chartOptions.animate;
    return {
        data: data,
        renderer: new chartOptions.renderer({
            data: data,
            indiHrefFunc: indiHrefFunc,
            famHrefFunc: famHrefFunc,
            indiCallback: chartOptions.indiCallback,
            famCallback: chartOptions.famCallback,
            horizontal: chartOptions.horizontal,
            colors: chartOptions.colors,
            selectedLanguage: chartOptions.selectedLanguage,
            animate: animate,
            locale: chartOptions.locale,
        }),
        startIndi: renderOptions.startIndi,
        startFam: renderOptions.startFam,
        svgSelector: chartOptions.svgSelector || DEFAULT_SVG_SELECTOR,
        horizontal: chartOptions.horizontal,
        baseGeneration: renderOptions.baseGeneration,
        animate: animate,
    };
}

const SimpleChartHandle = /** @class */ (function () {

    function SimpleChartHandle(options) {
        this.options = options;
        this.initialRender = true;
    }

    SimpleChartHandle.prototype.render = function (renderOptions) {
        if (renderOptions === void 0) {
            renderOptions = {};
        }
        const chartOptions = createChartOptions(this.options, renderOptions, {
            initialRender: this.initialRender
        });
        // Reset CSS maps
        if (this.initialRender) {
            chartOptions.renderer.resetCss();
        }
        this.initialRender = false;
        const chart = new this.options.chartType(chartOptions);
        const info = chart.render();
        if (this.options.updateSvgSize !== false) {
            d3_selection_1.select(chartOptions.svgSelector)
                .attr('width', info.size[0])
                .attr('height', info.size[1]);
        }
        return info;
    };
    /**
     * Updates the chart input data.
     * This is useful when the data is dynamically loaded and a different subset
     * of data will be displayed.
     */
    SimpleChartHandle.prototype.setData = function (json) {
        this.options.json = json;
    };
    return SimpleChartHandle;
}());

function createChart(options) {
    return new SimpleChartHandle(options);
}
exports.createChart = createChart;

Object.defineProperty(exports, "__esModule", { value: true });
exports.HourglassChart = void 0;

var ancestor_chart_1 = require("./ancestor-chart");
var chart_util_1 = require("./chart-util");
var descendant_chart_1 = require("./descendant-chart");

/**
 * Renders an hourglass chart. It consists of an ancestor chart and
 * a descendant chart for a family.
 */
var HourglassChart = /** @class */ (function () {
    function HourglassChart(options) {
        this.options = options;
        this.util = new chart_util_1.ChartUtil(options);
    }

    HourglassChart.prototype.markHiddenRelatives = function (nodes, gedcomData) {
        let displayedNodes = nodes.flatMap(function (node) {
            if (node.data.family) {
                return [node.data.indi.id, node.data.spouse.id];
            } else {
                return [node.data.indi.id];
            }
        });
        displayedNodes = displayedNodes.sort((a, b) => {
            const numA = parseInt(a.slice(1));
            const numB = parseInt(b.slice(1));
            return numA - numB;
        });
        for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            if (node.data.family) {
                const fam = gedcomData.fams.get(node.data.family.id)
                // this family has children who are not displayed
                for (var c = 0; c < fam.json.children.length; c++) {
                    const childId = fam.json.children[c]
                    if (!displayedNodes.includes(childId)) {
                        node.data.hiddenRelatives = true
                        break;
                    }
                }
                // check the wife parents
                this.markHiddenRelativesForIndi(node.data.spouse, gedcomData, displayedNodes);
            } else {
                // go through each family to find the parents of this indi
                this.markHiddenRelativesForIndi(node.data.indi, gedcomData, displayedNodes);
            }
        }
    }

    HourglassChart.prototype.markHiddenRelativesForIndi = function (node, gedcomData, displayedNodes) {
        // check all parent until it finds the child
        for (var f = 0; f < gedcomData.fams.size; f++) {
            const fam = Array.from(gedcomData.fams.values())[f]
            if (fam.json.children.length > 0) {
                if (fam.json.children.includes(node.id)) {
                    // parents found
                    if (!displayedNodes.includes(fam.json.husb)) {
                        node.hiddenRelatives = true
                        break;
                    }
                    if (!displayedNodes.includes(fam.json.wife)) {
                        node.hiddenRelatives = true
                        break;
                    }
                }
            }
        }
    }

    HourglassChart.prototype.render = function () {
        const ancestorsRoot = ancestor_chart_1.getAncestorsTree(this.options);
        const ancestorNodes = this.util.layOutChart(ancestorsRoot, { flipVertically: true });
        const descendantNodes = descendant_chart_1.layOutDescendants(this.options);
        // slice(1) removes the duplicated start node.
        const nodes = ancestorNodes.slice(1).concat(descendantNodes);
        // dash the stroke of indis having non-visible relatives
        this.markHiddenRelatives(nodes, this.options.data)

        const animationPromise = this.util.renderChart(nodes);
        const info = chart_util_1.getChartInfo(nodes);
        this.util.updateSvgDimensions(info);
        return Object.assign(info, { animationPromise: animationPromise });
    };
    return HourglassChart;
}());
exports.HourglassChart = HourglassChart;

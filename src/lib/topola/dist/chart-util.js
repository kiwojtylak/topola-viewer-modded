Object.defineProperty(exports, "__esModule", { value: true });

exports.ChartUtil = exports.getChartInfoWithoutMargin = exports.getChartInfo = exports.linkId = exports.V_SPACING = exports.H_SPACING = void 0;
const d3_selection_1 = require("d3-selection");
const d3_flextree_1 = require("d3-flextree");
const d3_array_1 = require("d3-array");
require("d3-transition");

/** Horizontal distance between boxes. */
exports.H_SPACING = 15;
/** Vertical distance between boxes. */
exports.V_SPACING = 30;
/** Margin around the whole drawing. */
const MARGIN = 15;
const HIDE_TIME_MS = 200;
const MOVE_TIME_MS = 500;

/** Assigns an identifier to a link. */
function linkId(node) {
    if (!node.parent) {
        return node.id + ":A";
    }
    const _a = node.data.generation > node.parent.data.generation
        ? [node.data, node.parent.data]
        : [node.parent.data, node.data], child = _a[0], parent = _a[1];
    if (child.additionalMarriage) {
        return child.id + ":A";
    }
    return parent.id + ":" + child.id;
}
exports.linkId = linkId;

function getChartInfo(nodes) {
    // Calculate chart boundaries.
    const x0 = d3_array_1.min(nodes, function (d) {
        return d.x - d.data.width / 2;
    }) - MARGIN;
    const y0 = d3_array_1.min(nodes, function (d) {
        return d.y - d.data.height / 2;
    }) - MARGIN;
    const x1 = d3_array_1.max(nodes, function (d) {
        return d.x + d.data.width / 2;
    }) + MARGIN;
    const y1 = d3_array_1.max(nodes, function (d) {
        return d.y + d.data.height / 2;
    }) + MARGIN;
    return { size: [x1 - x0, y1 - y0], origin: [-x0, -y0] };
}
exports.getChartInfo = getChartInfo;

function getChartInfoWithoutMargin(nodes) {
    // Calculate chart boundaries.
    const x0 = d3_array_1.min(nodes, function (d) {
        return d.x - d.data.width / 2;
    });
    const y0 = d3_array_1.min(nodes, function (d) {
        return d.y - d.data.height / 2;
    });
    const x1 = d3_array_1.max(nodes, function (d) {
        return d.x + d.data.width / 2;
    });
    const y1 = d3_array_1.max(nodes, function (d) {
        return d.y + d.data.height / 2;
    });
    return { size: [x1 - x0, y1 - y0], origin: [-x0, -y0] };
}
exports.getChartInfoWithoutMargin = getChartInfoWithoutMargin;

/** Utility class with common code for all chart types. */
let ChartUtil = /** @class */ (function () {

    function ChartUtil(options) {
        this.options = options;
    }

    /** Creates a path from parent to the child node (horizontal layout). */
    ChartUtil.prototype.linkHorizontal = function (s, d) {
        const sAnchor = this.options.renderer.getFamilyAnchor(s.data);
        const dAnchor = s.id === d.data.spouseParentNodeId
            ? this.options.renderer.getSpouseAnchor(d.data)
            : this.options.renderer.getIndiAnchor(d.data);
        const _a = [s.x + sAnchor[0], s.y + sAnchor[1]], sx = _a[0], sy = _a[1];
        const _b = [d.x + dAnchor[0], d.y + dAnchor[1]], dx = _b[0], dy = _b[1];
        const midX = (s.x + s.data.width / 2 + d.x - d.data.width / 2) / 2;
        return "M " + sx + " " + sy + "\n            L " + midX + " " + sy + ",\n              " + midX + " " + dy + ",\n              " + dx + " " + dy;
    };

    /** Creates a path from parent to the child node (vertical layout). */
    ChartUtil.prototype.linkVertical = function (s, d) {
        const sAnchor = this.options.renderer.getFamilyAnchor(s.data);
        const dAnchor = s.id === d.data.spouseParentNodeId
            ? this.options.renderer.getSpouseAnchor(d.data)
            : this.options.renderer.getIndiAnchor(d.data);
        const _a = [s.x + sAnchor[0], s.y + sAnchor[1]], sx = _a[0], sy = _a[1];
        const _b = [d.x + dAnchor[0], d.y + dAnchor[1]], dx = _b[0], dy = _b[1];
        const midY = s.y + s.data.height / 2 + exports.V_SPACING / 2;
        return "M " + sx + " " + sy + "\n            L " + sx + " " + midY + ",\n              " + dx + " " + midY + ",\n              " + dx + " " + dy;
    };

    ChartUtil.prototype.linkAdditionalMarriage = function (node) {
        const nodeIndex = node.parent.children.findIndex(function (n) {
            return n.data.id === node.data.id;
        });
        // Assert nodeIndex > 0.
        const siblingNode = node.parent.children[nodeIndex - 1];
        const sAnchor = this.options.renderer.getIndiAnchor(node.data);
        const dAnchor = this.options.renderer.getIndiAnchor(siblingNode.data);
        const _a = [node.x + sAnchor[0], node.y + sAnchor[1]], sx = _a[0], sy = _a[1];
        const _b = [siblingNode.x + dAnchor[0], siblingNode.y + dAnchor[1]], dx = _b[0], dy = _b[1];
        return "M " + sx + ", " + sy + "\n            L " + dx + ", " + dy;
    };

    ChartUtil.prototype.updateSvgDimensions = function (chartInfo) {
        const svg = d3_selection_1.select(this.options.svgSelector);
        const group = svg.select('g');
        const transition = this.options.animate
            ? group.transition().delay(HIDE_TIME_MS).duration(MOVE_TIME_MS)
            : group;
        transition.attr('transform', "translate(" + chartInfo.origin[0] + ", " + chartInfo.origin[1] + ")");
    };

    ChartUtil.prototype.layOutChart = function (root, layoutOptions) {
        const _this = this;
        if (layoutOptions === void 0) { layoutOptions = {}; }
        // Add styles so that calculating text size is correct.
        const svg = d3_selection_1.select(this.options.svgSelector);
        if (svg.select('style').empty()) {
            svg.append('style').text(this.options.renderer.getCss());
        }
        // Assign generation number.
        root.each(function (node) {
            node.data.generation =
                node.depth * (layoutOptions.flipVertically ? -1 : 1) +
                    (_this.options.baseGeneration || 0);
        });
        // Set preferred sizes.
        this.options.renderer.updateNodes(root.descendants());
        const vSizePerDepth = new Map();
        root.each(function (node) {
            const depth = node.depth;
            const maxVSize = d3_array_1.max([
                _this.options.horizontal ? node.data.width : node.data.height,
                vSizePerDepth.get(depth),
            ]);
            vSizePerDepth.set(depth, maxVSize);
        });
        // Set sizes of whole nodes.
        root.each(function (node) {
            const vSize = vSizePerDepth.get(node.depth);
            if (_this.options.horizontal) {
                node.data.width = vSize;
            }
            else {
                node.data.height = vSize;
            }
        });
        const vSpacing = layoutOptions.vSpacing !== undefined ? layoutOptions.vSpacing : exports.V_SPACING;
        const hSpacing = layoutOptions.hSpacing !== undefined ? layoutOptions.hSpacing : exports.H_SPACING;
        // Assigns the x and y position for the nodes.
        const treemap = d3_flextree_1.flextree()
            .nodeSize(function (node) {
                if (_this.options.horizontal) {
                    const maxChildSize_1 = d3_array_1.max(node.children || [], function (n) {
                        return n.data.width;
                    }) || 0;
                    return [
                        node.data.height,
                        (maxChildSize_1 + node.data.width) / 2 + vSpacing,
                    ];
                }
                const maxChildSize = d3_array_1.max(node.children || [], function (n) {
                    return n.data.height;
                }) || 0;
                return [
                    node.data.width,
                    (maxChildSize + node.data.height) / 2 + vSpacing,
                ];
            }).spacing(function () {
                return hSpacing;
            });
        const nodes = treemap(root).descendants();
        // Swap x-y coordinates for horizontal layout.
        nodes.forEach(function (node) {
            let _a;
            if (layoutOptions.flipVertically) {
                node.y = -node.y;
            }
            if (_this.options.horizontal) {
                _a = [node.y, node.x];
                node.x = _a[0];
                node.y = _a[1];
            }
        });
        return nodes;
    };

    ChartUtil.prototype.renderChart = function (nodes) {
        const svg = this.getSvgForRendering();
        const nodeAnimation = this.renderNodes(nodes, svg);
        const linkAnimation = this.renderLinks(nodes, svg);
        return Promise.all([
            nodeAnimation,
            linkAnimation,
        ]);
    };

    ChartUtil.prototype.renderNodes = function (nodes, svg) {
        const _this = this;
        return new Promise(function (resolve) {
            const boundNodes = svg
                .select('g')
                .selectAll('g.node')
                .data(nodes, function (d) {
                    return d.id;
                });
            const nodeEnter = boundNodes.enter().append('g');
            let transitionsPending = boundNodes.exit().size() + boundNodes.size() + nodeEnter.size();
            const transitionDone = function () {
                transitionsPending--;
                if (transitionsPending === 0) {
                    resolve();
                }
            };
            if (!_this.options.animate || transitionsPending === 0) {
                resolve();
            }
            nodeEnter
                .merge(boundNodes)
                .attr('class', function (node) {
                    return "node generation" + node.data.generation;
                });
            nodeEnter.attr('transform', function (node) {
                return "translate(" + (node.x - node.data.width / 2) + ", " + (node.y - node.data.height / 2) + ")";
            });
            if (_this.options.animate) {
                nodeEnter
                    .style('opacity', 0)
                    .transition()
                    .delay(HIDE_TIME_MS + MOVE_TIME_MS)
                    .duration(HIDE_TIME_MS)
                    .style('opacity', 1)
                    .on('end', transitionDone);
            }
            const updateTransition = _this.options.animate
                ? boundNodes
                    .transition()
                    .delay(HIDE_TIME_MS)
                    .duration(MOVE_TIME_MS)
                    .on('end', transitionDone)
                : boundNodes;
            updateTransition.attr('transform', function (node) {
                return "translate(" + (node.x - node.data.width / 2) + ", " + (node.y - node.data.height / 2) + ")";
            });
            _this.options.renderer.options.startIndi = _this.options.startIndi
            _this.options.renderer.render(nodeEnter, boundNodes);
            if (_this.options.animate) {
                boundNodes
                    .exit()
                    .transition()
                    .duration(HIDE_TIME_MS)
                    .style('opacity', 0)
                    .remove()
                    .on('end', transitionDone);
            } else {
                boundNodes.exit().remove();
            }
        });
    };

    ChartUtil.prototype.renderLinks = function (nodes, svg) {
        const _this = this;
        return new Promise(function (resolve) {
            const link = function (parent, child) {
                if (child.data.additionalMarriage) {
                    return _this.linkAdditionalMarriage(child);
                }
                const flipVertically = parent.data.generation > child.data.generation;
                if (_this.options.horizontal) {
                    if (flipVertically) {
                        return _this.linkHorizontal(child, parent);
                    }
                    return _this.linkHorizontal(parent, child);
                }
                if (flipVertically) {
                    return _this.linkVertical(child, parent);
                }
                return _this.linkVertical(parent, child);
            };
            const links = nodes.filter(function (n) {
                return !!n.parent || n.data.additionalMarriage;
            });
            const boundLinks = svg
                .select('g')
                .selectAll('path.link')
                .data(links, linkId);
            const path = boundLinks
                .enter()
                .insert('path', 'g')
                .attr('class', function (node) {
                    return node.data.additionalMarriage ? 'link additional-marriage' : 'link';
                })
                .attr('d', function (node) {
                    return link(node.parent, node);
                });
            let transitionsPending = boundLinks.exit().size() + boundLinks.size() + path.size();
            const transitionDone = function () {
                transitionsPending--;
                if (transitionsPending === 0) {
                    resolve();
                }
            };
            if (!_this.options.animate || transitionsPending === 0) {
                resolve();
            }
            const linkTransition = _this.options.animate
                ? boundLinks
                    .transition()
                    .delay(HIDE_TIME_MS)
                    .duration(MOVE_TIME_MS)
                    .on('end', transitionDone)
                : boundLinks;
            linkTransition.attr('d', function (node) {
                return link(node.parent, node);
            });
            if (_this.options.animate) {
                path
                    .style('opacity', 0)
                    .transition()
                    .delay(2 * HIDE_TIME_MS + MOVE_TIME_MS)
                    .duration(0)
                    .style('opacity', 1)
                    .on('end', transitionDone);
            }
            if (_this.options.animate) {
                boundLinks
                    .exit()
                    .transition()
                    .duration(0)
                    .style('opacity', 0)
                    .remove()
                    .on('end', transitionDone);
            } else {
                boundLinks.exit().remove();
            }
        });
    };

    ChartUtil.prototype.getSvgForRendering = function () {
        const svg = d3_selection_1.select(this.options.svgSelector);
        if (svg.select('g').empty()) {
            svg.append('g');
        }
        return svg;
    };

    ChartUtil.prototype.markHiddenRelatives = function (nodes, gedcomData) {
        const displayedIndiIDs = nodes.sort((a, b) => {
            const numA = parseInt(a.id.slice(1));
            const numB = parseInt(b.id.slice(1));
            return numA - numB;
        }).map(function (n) { return n.id });

        for (var n = 0; n < nodes.length; n++) {
            this.markHiddenAncestorsForIndi(nodes[n], gedcomData, displayedIndiIDs);
            this.markHiddenDescendantsForIndi(nodes[n], gedcomData, displayedIndiIDs);
        }
    }

    ChartUtil.prototype.markHiddenAncestorsForIndi = function (node, gedcomData, displayedIndiIDs) {
        // go through each family to find the parents of this indi
        for (var f = 0; f < gedcomData.fams.size; f++) {
            const fam = Array.from(gedcomData.fams.values())[f]
            if (fam.json.children.length > 0) {
                if (fam.json.children.includes(node.id)) {
                    // parents found
                    const fatherID = fam.json.husb
                    const motherID = fam.json.wife
                    if (!displayedIndiIDs.includes(fatherID) || !displayedIndiIDs.includes(motherID)) {
                        node.hiddenRelatives = true
                        break;
                    }
                }
            }
        }
    }

    ChartUtil.prototype.markHiddenDescendantsForIndi = function (node, gedcomData, displayedIndiIDs) {
        // go through each family to find the children
        for (var f = 0; f < gedcomData.fams.size; f++) {
            const fam = Array.from(gedcomData.fams.values())[f]
            if (fam.json.husb === node.id) {  // || fam.json.wife === node.id mark only the father. Otherwise difficult to distinguish from women with missing parents
                // family found
                if (fam.json.children.length > 0) {
                    for (var c = 0; c < fam.json.children.length; c++) {
                        const childId = fam.json.children[c]
                        if (!displayedIndiIDs.includes(childId)) {
                            // some children are not displayed
                            node.hiddenRelatives = true
                            break;
                        }
                    }
                }
            }
        }
    }

    return ChartUtil;
}());
exports.ChartUtil = ChartUtil;

Object.defineProperty(exports, "__esModule", { value: true });
exports.getFamPositionHorizontal = exports.getFamPositionVertical = exports.CompositeRenderer = void 0;

const d3_array_1 = require("d3-array");

/**
 * Common code for tree nodes that are composed of individual and family boxes.
 */
let CompositeRenderer = /** @class */ (function () {

    function CompositeRenderer(options) {
        this.options = options;
    }

    CompositeRenderer.prototype.getPreferredFamSize = function (id) {
        // No family box in the simple renderer.
        return [0, 0];
    };

    CompositeRenderer.prototype.setPreferredIndiSize = function (indi) {
        let _a;
        if (!indi) {
            return;
        }
        _a = this.getPreferredIndiSize(indi.id);
        indi.width = _a[0];
        indi.height = _a[1];
    };

    CompositeRenderer.prototype.updateNodes = function (nodes) {
        const _this = this;
        // Calculate individual vertical size per depth.
        const indiVSizePerDepth = new Map();
        nodes.forEach(function (node) {
            let _a;
            _this.setPreferredIndiSize(node.data.indi);
            _this.setPreferredIndiSize(node.data.spouse);
            const family = node.data.family;
            if (family) {
                _a = _this.getPreferredFamSize(family.id);
                family.width = _a[0];
                family.height = _a[1];
            }
            const depth = node.depth;
            const maxIndiVSize = d3_array_1.max([
                getIndiVSize(node.data, !!_this.options.horizontal),
                indiVSizePerDepth.get(depth),
            ]);
            indiVSizePerDepth.set(depth, maxIndiVSize);
        });
        // Set same width for each depth.
        nodes.forEach(function (node) {
            let _a;
            if (_this.options.horizontal) {
                if (node.data.indi) {
                    node.data.indi.width = indiVSizePerDepth.get(node.depth);
                }
                if (node.data.spouse) {
                    node.data.spouse.width = indiVSizePerDepth.get(node.depth);
                }
            } else {
                if (node.data.indi) {
                    node.data.indi.height = indiVSizePerDepth.get(node.depth);
                }
                if (node.data.spouse) {
                    node.data.spouse.height = indiVSizePerDepth.get(node.depth);
                }
            }
            const vSize = getVSize(node.data, !!_this.options.horizontal);
            const hSize = getHSize(node.data, !!_this.options.horizontal);
            _a = _this.options.horizontal ? [vSize, hSize] : [hSize, vSize];
            node.data.width = _a[0];
            node.data.height = _a[1];
        });
    };

    CompositeRenderer.prototype.getFamilyAnchor = function (node) {
        if (this.options.horizontal) {
            const x_1 = -node.width / 2 + getIndiVSize(node, this.options.horizontal) / 2;
            const famYOffset = node.family
                ? d3_array_1.max([-getFamPositionHorizontal(node), 0])
                : 0;
            const y_1 = -(node.indi && node.spouse ? node.height / 2 - node.indi.height : 0) +
                famYOffset;
            return [x_1, y_1];
        }
        const famXOffset = node.family
            ? d3_array_1.max([-getFamPositionVertical(node), 0])
            : 0;
        const x = -(node.indi && node.spouse ? node.width / 2 - node.indi.width : 0) +
            famXOffset;
        const y = -node.height / 2 + getIndiVSize(node, this.options.horizontal) / 2;
        return [x, y];
    };

    CompositeRenderer.prototype.getSpouseAnchor = function (node) {
        if (this.options.horizontal) {
            const x_2 = -node.width / 2 + getIndiVSize(node, this.options.horizontal) / 2;
            const y_2 = node.indi ? node.indi.height / 2 : 0;
            return [x_2, y_2];
        }
        const x = node.indi ? node.indi.width / 2 : 0;
        const y = -node.height / 2 + getIndiVSize(node, !!this.options.horizontal) / 2;
        return [x, y];
    };

    CompositeRenderer.prototype.getIndiAnchor = function (node) {
        if (this.options.horizontal) {
            const x_3 = -node.width / 2 + getIndiVSize(node, this.options.horizontal) / 2;
            const y_3 = node.spouse ? -node.spouse.height / 2 : 0;
            return [x_3, y_3];
        }
        const x = node.spouse ? -node.spouse.width / 2 : 0;
        const y = -node.height / 2 + getIndiVSize(node, !!this.options.horizontal) / 2;
        return [x, y];
    };

    return CompositeRenderer;
}());
exports.CompositeRenderer = CompositeRenderer;

/**
 * Returns the relative position of the family box for the vertical layout.
 */
function getFamPositionVertical(node) {
    const indiWidth = node.indi ? node.indi.width : 0;
    const spouseWidth = node.spouse ? node.spouse.width : 0;
    const familyWidth = node.family.width;
    if (!node.indi || !node.spouse || indiWidth + spouseWidth <= familyWidth) {
        return (indiWidth + spouseWidth - familyWidth) / 2;
    }
    if (familyWidth / 2 >= spouseWidth) {
        return indiWidth + spouseWidth - familyWidth;
    }
    if (familyWidth / 2 >= indiWidth) {
        return 0;
    }
    return indiWidth - familyWidth / 2;
}
exports.getFamPositionVertical = getFamPositionVertical;

/**
 * Returns the relative position of the family box for the horizontal layout.
 */
function getFamPositionHorizontal(node) {
    const indiHeight = node.indi ? node.indi.height : 0;
    const spouseHeight = node.spouse ? node.spouse.height : 0;
    const familyHeight = node.family.height;
    if (!node.indi || !node.spouse) {
        return (indiHeight + spouseHeight - familyHeight) / 2;
    }
    return indiHeight - familyHeight / 2;
}
exports.getFamPositionHorizontal = getFamPositionHorizontal;

/** Returns the horizontal size. */
function getHSize(node, horizontal) {
    if (horizontal) {
        return ((node.indi ? node.indi.height : 0) +
            (node.spouse ? node.spouse.height : 0));
    }
    const indiHSize = (node.indi ? node.indi.width : 0) + (node.spouse ? node.spouse.width : 0);
    return d3_array_1.max([indiHSize, node.family ? node.family.width : 0]);
}

function getFamVSize(node, horizontal) {
    if (horizontal) {
        return node.family ? node.family.width : 0;
    }
    return node.family ? node.family.height : 0;
}

/** Returns the vertical size of individual boxes. */
function getIndiVSize(node, horizontal) {
    if (horizontal) {
        return d3_array_1.max([
            node.indi ? node.indi.width : 0,
            node.spouse ? node.spouse.width : 0,
        ]);
    }
    return d3_array_1.max([
        node.indi ? node.indi.height : 0,
        node.spouse ? node.spouse.height : 0,
    ]);
}

/** Returns the vertical size. */
function getVSize(node, horizontal) {
    return getIndiVSize(node, horizontal) + getFamVSize(node, horizontal);
}

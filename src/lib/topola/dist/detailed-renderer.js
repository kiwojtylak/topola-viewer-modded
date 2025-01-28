var __extends = (this && this.__extends) || (function () {
    let extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({__proto__: []} instanceof Array && function (d, b) {
                d.__proto__ = b;
            }) ||
            function (d, b) {
                for (const p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
            };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        if (b === null) {
            d.prototype = Object.create(b);
        } else {
            __.prototype = b.prototype;  // Set the prototype of __ to b's prototype
            d.prototype = new __();      // Create a new instance of __ to set as d's prototype
        }
    };
})();

Object.defineProperty(exports, "__esModule", { value: true });
exports.DetailedRenderer = exports.getLength = void 0;

var chart_util_1 = require("./chart-util");
const d3_selection_1 = require("d3-selection");
const _1 = require("./index");
const date_format_1 = require("./date-format");
const d3_array_1 = require("d3-array");
require("d3-transition");
const composite_renderer_1 = require("./composite-renderer");
const INDI_MIN_HEIGHT = 44;
const INDI_MIN_WIDTH = 64;
const FAM_MIN_HEIGHT = 10;
const FAM_MIN_WIDTH = 15;
const IMAGE_WIDTH = 70;

/** Minimum box height when an image is present. */
const IMAGE_HEIGHT = 90;
const ETHNICITY_HEIGHT = 17;
const LANGUAGES_HEIGHT = 17;
const DETAILS_HEIGHT = 17;
const ANIMATION_DELAY_MS = 200;
const ANIMATION_DURATION_MS = 500;
const textLengthCache = new Map();

/** Calculates the length of the given text in pixels when rendered. */
function getLength(text, textClass) {
    const cacheKey = text + '|' + textClass;
    if (textLengthCache.has(cacheKey)) {
        return textLengthCache.get(cacheKey);
    }
    const g = d3_selection_1.select("svg").append('g').attr("class", "detailed node");
    const x = g.append("text").attr("class", textClass).text(text);
    const length = x.node().getComputedTextLength();
    g.remove();
    textLengthCache.set(cacheKey, length);
    return length;
}
exports.getLength = getLength;

const SEX_SYMBOLS = new Map([
    ['F', '\u2640'],
    ['M', '\u2642'],
]);

/**
 * Renders some details about a person such as date and place of birth
 * and death.
 */
var DetailedRenderer = /** @class */ (function (_super) {
    __extends(DetailedRenderer, _super);

    function DetailedRenderer(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        this.util = new chart_util_1.ChartUtil(options);
        return _this;
    }

    DetailedRenderer.prototype.getColoringClass = function () {
        switch (this.options.colors) {
            case _1.ChartColors.NO_COLOR:
                return "nocolor";
            case _1.ChartColors.COLOR_BY_GENERATION:
                return "bygeneration";
            case _1.ChartColors.COLOR_BY_SEX:
                return "bysex";
            case _1.ChartColors.COLOR_BY_ETHNICITY:
                return "byethnicity";
            case _1.ChartColors.COLOR_BY_NR_LANGUAGES:
                return "bylanguages";
            case _1.ChartColors.COLOR_BY_LANGUAGE:
                return "bylanguages";
            default:
                return "bygeneration";
        }
    };

    /** Extracts lines of details for a person. */
    DetailedRenderer.prototype.getIndiDetails = function (indi) {
        const detailsList = [];
        const birthDate = indi.getBirthDate() && date_format_1.formatDateOrRange(indi.getBirthDate(), this.options.locale);
        const birthPlace = indi.getBirthPlace();
        const deathDate = indi.getDeathDate() && date_format_1.formatDateOrRange(indi.getDeathDate(), this.options.locale);
        const deathPlace = indi.getDeathPlace();
        if (birthDate) {
            detailsList.push({ symbol: '', text: birthDate });
        }
        if (birthPlace) {
            detailsList.push({ symbol: '', text: birthPlace });
        }
        if (birthDate || birthPlace) {
            detailsList[0].symbol = '*';
        }
        const listIndex = detailsList.length;
        if (deathDate) {
            detailsList.push({ symbol: '', text: deathDate });
        }
        if (deathPlace) {
            detailsList.push({ symbol: '', text: deathPlace });
        }
        if (deathDate || deathPlace) {
            detailsList[listIndex].symbol = '+';
        }
        else if (indi.isConfirmedDeath()) {
            detailsList.push({ symbol: '+', text: '' });
        }
        return detailsList;
    };

    DetailedRenderer.prototype.getPreferredIndiSize = function (id) {
        // Height
        const indi = this.options.data.getIndi(id);
        const details = this.getIndiDetails(indi);
        const ethnicityHeight = indi.showEthnicity() && indi.getEthnicity() != null ? ETHNICITY_HEIGHT : 0;
        const languagesHeight = indi.showLanguages() && indi.getLanguages().length > 0 ? LANGUAGES_HEIGHT : 0;
        const idAndSexHeight = indi.showId() || indi.showSex() ? DETAILS_HEIGHT : 0;
        const height = d3_array_1.max([
            INDI_MIN_HEIGHT + languagesHeight + ethnicityHeight + (details.length * DETAILS_HEIGHT) + idAndSexHeight,
            indi.getImageUrl() ? IMAGE_HEIGHT : 0,
        ]);
        // Width
        const maxDetailsWidth = d3_array_1.max(details.map(detail => getLength(detail.text, "details")));
        const width = d3_array_1.max([
            maxDetailsWidth + 22,
            getLength(indi.getFirstName() || '', "name") + 8,
            getLength(indi.getLastName() || '', "name") + 8,
            indi.showLanguages() && indi.getLanguages().length > 0 ? (getLength(indi.getLanguagesLabel(), "languages") + 28) : 0,
            indi.showEthnicity() && indi.getEthnicity() != null ? (getLength(indi.getEthnicity(), "ethnicity") + 28) : 0,
            getLength(id, "id") + 32,
            INDI_MIN_WIDTH,
        ]) + (indi.getImageUrl() ? IMAGE_WIDTH : 0);
        return [width, height];
    };

    /** Extracts lines of details for a family. */
    DetailedRenderer.prototype.getFamDetails = function (fam) {
        const detailsList = [];
        const marriageDate = fam.getMarriageDate() &&
            date_format_1.formatDateOrRange(fam.getMarriageDate(), this.options.locale);
        const marriagePlace = fam.getMarriagePlace();
        if (marriageDate) {
            detailsList.push({ symbol: '', text: marriageDate });
        }
        if (marriagePlace) {
            detailsList.push({ symbol: '', text: marriagePlace });
        }
        if (marriageDate || marriagePlace) {
            detailsList[0].symbol = '\u26AD';
        }
        return detailsList;
    };

    DetailedRenderer.prototype.getPreferredFamSize = function (id) {
        const fam = this.options.data.getFam(id);
        const details = this.getFamDetails(fam);
        const height = d3_array_1.max([10 + details.length * DETAILS_HEIGHT, FAM_MIN_HEIGHT]);
        const maxDetailsWidth = d3_array_1.max(details.map(function (x) { return getLength(x.text, "details"); }));
        const width = d3_array_1.max([maxDetailsWidth + 22, FAM_MIN_WIDTH]);
        return [width, height];
    };

    DetailedRenderer.prototype.render = function (enter, update) {
        const _this = this;
        enter = enter.append('g').attr("class", "detailed");
        update = update.select('g');

        const indisToStroke = []
        const indiUpdate = enter
            .merge(update)
            .selectAll("g.indi")
            .data(function (node) {
                const result = [];
                const famXOffset = !_this.options.horizontal && node.data.family
                    ? d3_array_1.max([-composite_renderer_1.getFamPositionVertical(node.data), 0])
                    : 0;
                const famYOffset = _this.options.horizontal && node.data.family
                    ? d3_array_1.max([-composite_renderer_1.getFamPositionHorizontal(node.data), 0])
                    : 0;

                if (node.data.indi) {
                    indisToStroke.push(node.data.indi)
                    node.data.indi.hiddenRelatives = node.data.hiddenRelatives;
                    result.push({
                        indi: node.data.indi,
                        generation: node.data.generation,
                        xOffset: famXOffset,
                        yOffset: 0
                    });
                }
                if (node.data.spouse) {
                    indisToStroke.push(node.data.spouse)
                    result.push({
                        indi: node.data.spouse,
                        generation: node.data.generation,
                        xOffset: !_this.options.horizontal && node.data.indi ? node.data.indi.width + famXOffset : 0,
                        yOffset: _this.options.horizontal && node.data.indi ? node.data.indi.height + famYOffset : 0
                });
            }
            return result;
        }, function (data) { return data.indi.id; });

        // dash the stroke of indis having non-visible relatives
        this.util.markHiddenRelatives(indisToStroke, this.options.data)

        const indiEnter = indiUpdate
            .enter()
            .append('g')
            .attr("class", "indi");
        this.transition(indiEnter.merge(indiUpdate)).attr("transform", function (node) {
            return "translate(" + node.xOffset + ", " + node.yOffset + ")";
        });
        this.renderIndi(indiEnter, indiUpdate);

        const familyEnter = enter.select(function (node) {
            return node.data.family ? this : null;
        }).append('g').attr("class", "family");
        const familyUpdate = update.select(function (node) {
            return node.data.family ? this : null;
        }).select("g.family");
        this.transition(familyEnter.merge(familyUpdate)).attr("transform", function (node) {
            return _this.getFamTransform(node.data);
        });
        this.renderFamily(familyEnter);
    };

    DetailedRenderer.prototype.getCss = function () {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "./styles/detailed-renderer.css", false);
        try {
            xhr.send();
            if (xhr.status === 200) {
                const cssCode = xhr.responseText
                return cssCode;
            } else {
                throw new Error("Failed to load CSS file:" + xhr.statusText);
            }
        } catch (error) {
            console.error("Error occurred while loading CSS:", error);
            return null;
        }
    };

    DetailedRenderer.prototype.transition = function (selection) {
        return this.options.animate
            ? selection
                .transition()
                .delay(ANIMATION_DELAY_MS)
                .duration(ANIMATION_DURATION_MS)
            : selection;
    };

    DetailedRenderer.prototype.getFamTransform = function (node) {
        if (this.options.horizontal) {
            return "translate("
                + ((node.indi && node.indi.width) || node.spouse.width) + ", "
                + d3_array_1.max([composite_renderer_1.getFamPositionHorizontal(node), 0])
                + ")";
        }
        return "translate("
            + d3_array_1.max([composite_renderer_1.getFamPositionVertical(node), 0]) + ", "
            + ((node.indi && node.indi.height) || node.spouse.height)
            + ")";
    };

    DetailedRenderer.prototype.getSexClass = function (indiId) {
        let _a;
        const sex = (_a = this.options.data.getIndi(indiId)) === null || _a === void 0 ? void 0 : _a.getSex();
        switch (sex) {
            case 'M':
                return "male";
            case 'F':
                return "female";
            default:
                break;
        }
    };

    const ethnicityCss = new Map();
    DetailedRenderer.prototype.getEthnicityClass = function (indiId) {
        if (ethnicityCss.size === 0) {
            this.buildEthnicityMap()
        }
        let _a;
        const ethnicity = (_a = this.options.data.getIndi(indiId)) === null || _a === void 0 ? void 0 : _a.getEthnicity();
        if (ethnicity) {
            return ethnicityCss.get(ethnicity);
        }
        return ''  // Blank if no ethnicity
    };

    DetailedRenderer.prototype.buildEthnicityMap = function () {
        try {
            // Assign the ethnicity of the ego as eth0
            if (!ethnicityCss.has("eth0")) {
                const egoEthnicity = Array.from(this.options.data.indis?.values() || []).find(indi => indi.isEgo())?.json.ethnicity
                if (egoEthnicity) {
                    ethnicityCss.set(egoEthnicity, "ego")
                }
            }
            ethnicityCss.set("Blanco", "blanco")
            ethnicityCss.set("Afroamerican", "afroamerican")
            // Assign the ethnicities of the the rest individuals
            Array.from(this.options.data.indis?.values() || [])
                .filter(indi => indi.getEthnicity() != null)
                .forEach(indi => {
                    const ethnicity = indi.getEthnicity()
                    if (!ethnicityCss.has(ethnicity)) {
                        // Might be a tree with no ego individual. Then there is no eth0
                        const classNum = Object.keys(ethnicityCss).find(k => ethnicityCss[k] === "ego") ? ethnicityCss.size : ethnicityCss.size + 1
                        ethnicityCss.set(ethnicity, "eth" + classNum)
                    }
                    if (ethnicityCss.size > 14) {
                        throw new Error("No CSS for more than 14 different ethnicities")
                    }
                })
        } catch (e) {
            console.log(e)
        }
    }

    DetailedRenderer.prototype.getEgoStroke = function (indiId) {
        // TODO someday return " ego-stroke"
        return ' '
    }

    DetailedRenderer.prototype.getLanguagesClass = function (indiId, selectedLanguageId) {
        let _a;
        const languages = (_a = this.options.data.getIndi(indiId)) === null || _a === void 0 ? void 0 : _a.getLanguages();
        if (selectedLanguageId != null) {
            // By specific language
            const hasSelectedLanguage = languages.some(language => language.id === selectedLanguageId);
            if (hasSelectedLanguage) {
                return "l" + selectedLanguageId;
            }
        } else {
            // By nr. languages
            return languages.length > 0 ? 'n' + Math.min(languages.length, 7) : '';
        }
        return '' // Blank if no language
    }

    DetailedRenderer.prototype.resetCss = function () {
        ethnicityCss.clear()
        console.log("Cleared CSS maps")
    }

    DetailedRenderer.prototype.renderIndi = function (enter, update) {
        const _this = this;

        if (this.options.indiHrefFunc) {
            enter = enter
                .append('a')
                .attr("href", function (data) { return _this.options.indiHrefFunc(data.indi.id); });
            update = update.select('a');
        }

        if (this.options.indiCallback) {
            enter.on("click", function (event, data) {
                data.indi.hiddenRelatives = false
                return _this.options.indiCallback({
                    id: data.indi.id,
                    generation: data.generation,
                });
            });
        }

        // Background
        const background = enter
            .append("rect")
            .attr("rx", 5)
            .attr("stroke-width", 0)
            .attr("class", function (node) {
                return "background "
                    + _this.getColoringClass() + " "
                    + _this.getSexClass(node.indi.id) + " "
                    + _this.getEthnicityClass(node.indi.id) + " "
                    + _this.getLanguagesClass(node.indi.id, _this.options.selectedLanguage) + " "
            })
            .merge(update.select("rect.background"));

        this.transition(background)
            .attr("width", function (node) { return node.indi.width; })
            .attr("height", function (node) { return node.indi.height; });

        // Clip path
        const getClipId = function (id) {
            return "clip-" + id;
        };
        enter
            .append("clipPath")
            .attr("id", function (node) { return getClipId(node.indi.id); })
            .append("rect")
            .attr("rx", 5)
            .merge(update.select("clipPath rect"))
            .attr("width", function (node) { return node.indi.width; })
            .attr("height", function (node) { return node.indi.height; });
        const getIndi = function (data) {
            return _this.options.data.getIndi(data.indi.id);
        };
        const getDetailsWidth = function (data) {
            return data.indi.width - (getIndi(data).getImageUrl() ? IMAGE_WIDTH : 0);
        };

        // Name
        enter
            .append("text")
            .attr("text-anchor", "middle")
            .attr("class", "name")
            .attr("transform", function (node) { return "translate(" + getDetailsWidth(node) / 2 + ", 17)"; })
            .text(function (node) { return getIndi(node).getFirstName(); });
        enter
            .append("text")
            .attr("text-anchor", "middle")
            .attr("class", "name")
            .attr("transform", function (node) { return "translate(" + getDetailsWidth(node) / 2 + ", 33)"; })
            .text(function (node) { return getIndi(node).getLastName(); })

        // Languages
        const languages = enter
            .filter(function (node) {
                return getIndi(node).showLanguages() && getIndi(node).getLanguages().length > 0
            })
            .append("text")
            .attr("text-anchor", "middle")
            .attr("class", "languages")
            .text(function (node) {
                return getIndi(node).getLanguagesLabel()
            });
        this.transition(languages).attr("transform", function (node) {
            // if the indi does not have languages to show, the height start does not apply
            const languages_height_start =  getIndi(node).showLanguages() && getIndi(node).getLanguages().length > 0 ? 52 : null
            return "translate(" + getDetailsWidth(node) / 2 + ", " + languages_height_start + ")";
        });

        // Ethnicity
        const ethnicity = enter
            .filter(function (node) {
                return getIndi(node).showEthnicity() && getIndi(node).getEthnicity() != null
            })
            .append("text")
            .attr("class", "ethnicity")
            .text(function (node) {
                return '¤ ' + getIndi(node).getEthnicity()
            });
        this.transition(ethnicity).attr("transform", function (node) {
            let ethnicity_height_start =  null
            if (getIndi(node).showLanguages() && getIndi(node).getLanguages().length > 0) {
                ethnicity_height_start = 71
            } else if (getIndi(node).showEthnicity() && getIndi(node).getEthnicity() != null) {
                ethnicity_height_start = 55
            }
            return "translate(5, " + ethnicity_height_start + ")";
        });

        // Extract details
        const details = new Map();
        enter.each(function (node) {
            const indi = getIndi(node);
            const detailsList = _this.getIndiDetails(indi);
            details.set(node.indi.id, detailsList);
        });
        const maxDetails = d3_array_1.max(Array.from(details.values(), function (v) {
            return v.length;
        }));

        function details_height_start(node) {
            return 55
                + ((getIndi(node).showLanguages() && getIndi(node).getLanguages().length > 0) ? LANGUAGES_HEIGHT : 0)
                + ((getIndi(node).showEthnicity() && getIndi(node).getEthnicity() != null) ? ETHNICITY_HEIGHT : 0)
        }

        const _loop_2 = function (i) {
            const lineGroup = enter.filter(function (node) {
                return details.get(node.indi.id).length > i;
            });

            lineGroup
                .append("text")
                .attr("text-anchor", "middle")
                .attr("class", "details")
                .attr("transform", function (node) {
                    return "translate(9, " + (details_height_start(node) + i * DETAILS_HEIGHT) + ")"
                })
                .text(function (node) {
                    return details.get(node.indi.id)[i].symbol;
                });
            lineGroup
                .append("text")
                .attr("class", "details")
                .attr("transform", function (node) {
                    return "translate(15, " + (details_height_start(node) + i * DETAILS_HEIGHT) + ")"
                })
                .text(function (node) {
                    return details.get(node.indi.id)[i].text;
                });
        };
        // Render details
        for (let i = 0; i < maxDetails; ++i) {
            _loop_2(i);
        }

        // Render id
        const id = enter
            .append("text")
            .attr("class", "id")
            .text(function (node) {
                return (getIndi(node).showId() ? node.indi.id : '');
            })
            .merge(update.select("text.id"));
        this.transition(id).attr("transform", function (node) { return "translate(9, " + (node.indi.height - 5) + ")"; });

        // Render sex
        const sex = enter
            .append("text")
            .attr("class", "details sex")
            .attr("text-anchor", "end")
            .text(function (node) {
                const sexSymbol = SEX_SYMBOLS.get(getIndi(node).getSex() || '') || '';
                return getIndi(node).showSex() ? sexSymbol : '';
            })
            .merge(update.select("text.sex"));
        this.transition(sex).attr("transform", function (node) {
            return "translate(" + (getDetailsWidth(node) - 5) + ", " + (node.indi.height - 5) + ")";
        });

        // Image
        enter.filter(function (node) { return !!getIndi(node).getImageUrl(); })
            .append("image")
            .attr("width", IMAGE_WIDTH)
            .attr("height", function (node) { return node.indi.height; })
            .attr("preserveAspectRatio", "xMidYMin")
            .attr("transform", function (node) { return "translate(" + (node.indi.width - IMAGE_WIDTH) + ", 0)"; })
            .attr("clip-path", function (node) { return "url(#" + getClipId(node.indi.id) + ")"; })
            .attr("href", function (node) { return getIndi(node).getImageUrl(); });

        // Border on top
        const border = enter
            .append("rect")
            .attr("rx", 5)
            .attr("fill-opacity", 0)
            .attr("class", function (node) {
                return "border" + _this.getEgoStroke(node.indi.id);
            })
            .attr("stroke-dasharray", function (node) {
                if (node.indi.hiddenRelatives) {
                    return "5, 5"
                } else {
                    return "0, 0"
                }
            })
            .merge(update.select("rect.border"));
        this.transition(border)
            .attr("width", function (node) { return node.indi.width; })
            .attr("height", function (node) { return node.indi.height; });
    };

    DetailedRenderer.prototype.renderFamily = function (enter) {
        const _this = this;

        if (this.options.famHrefFunc) {
            enter = enter
                .append('a')
                .attr("href", function (node) {
                return _this.options.famHrefFunc(node.data.family.id);
            });
        }

        if (this.options.famCallback) {
            enter.on("click", function (event, node) {
                return _this.options.famCallback({
                    id: node.data.family.id,
                    generation: node.data.generation,
                });
            });
        }

        // Extract details
        const details = new Map();
        enter.each(function (node) {
            const famId = node.data.family.id;
            const fam = _this.options.data.getFam(famId);
            const detailsList = _this.getFamDetails(fam);
            details.set(famId, detailsList);
        });
        const maxDetails = d3_array_1.max(Array.from(details.values(), function (v) {
            return v.length;
        }));

        // Box
        enter.filter(function (node) {
                const detail = details.get(node.data.family.id);
                return 0 < detail.length;
        }).append("rect")
        .attr("class", this.getColoringClass())
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("width", function (node) { return node.data.family.width; })
        .attr("height", function (node) { return node.data.family.height; });
        const _loop_2 = function (i) {
            const lineGroup = enter.filter(function (node) {
                return details.get(node.data.family.id).length > i;
            });
            lineGroup
                .append("text")
                .attr("text-anchor", "middle")
                .attr("class", "details")
                .attr("transform", "translate(9, " + (16 + i * DETAILS_HEIGHT) + ")")
                .text(function (node) {
                    return details.get(node.data.family.id)[i].symbol;
                });
            lineGroup
                .append("text")
                .attr("text-anchor", "start")
                .attr("class", "details")
                .attr("transform", "translate(15, " + (16 + i * DETAILS_HEIGHT) + ")")
                .text(function (node) {
                    return details.get(node.data.family.id)[i].text;
                });
        };
        // Render details
        for (let i = 0; i < maxDetails; ++i) {
            _loop_2(i);
        }
    };

    return DetailedRenderer;
}(composite_renderer_1.CompositeRenderer));
exports.DetailedRenderer = DetailedRenderer;

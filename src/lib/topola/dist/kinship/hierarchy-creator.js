import {ChildNodes, LinkType, otherSideLinkType} from "./api";
import {hierarchy} from "d3-hierarchy";
import {HierarchyFilter} from "./hierarchy-filter";
import {IdGenerator} from "../id-generator";
import {nonEmpty} from "../utils";

/* ID of indi or fam */
const EntryId = /** @class */ (function () {
    class EntryId {
        constructor(indiId, famId) {
            if (!indiId && !famId)
                throw new Error('Invalid EntryId');
            this.id = (indiId || famId);
            this.isFam = !!famId;
        }

        static indi(id) {
            return new EntryId(id, null);
        }

        static fam(id) {
            return new EntryId(null, id);
        }
    }

    return EntryId;
}());
(function () {
    class HierarchyCreator {
        constructor(data, startEntryId) {
            let _a;
            this.data = data;
            this.queuedNodesById = new Map();
            this.idGenerator = new IdGenerator();
            _a = this.expandStartId(startEntryId);
            this.startEntryId = _a[0];
            this.startFamIndi = _a[1];
        }

        // Convert entry id to values of startEntryId and startFamIndi fields
        expandStartId(startEntryId) {
            if (startEntryId.isFam)
                return [startEntryId, null];
            const indi = this.data.getIndi(startEntryId.id);
            if (!indi)
                throw new Error('Invalid startId');
            const famsIds = indi.getFamiliesAsSpouse();
            if (famsIds.length)
                return [EntryId.fam(famsIds[0]), startEntryId.id];
            return [startEntryId, null];
        }

        createHierarchy() {
            const upRoot = this.idToNode(this.startEntryId, null, null, false);
            const downRoot = this.idToNode(this.startEntryId, null, null, false);
            if (!upRoot || !downRoot)
                throw new Error('Invalid root node');
            if (this.startFamIndi) {
                upRoot.indi = {id: this.startFamIndi};
                downRoot.indi = {id: this.startFamIndi};
            }
            const queue = [upRoot, downRoot];
            while (queue.length) {
                const node = queue.shift();
                const filter = node === upRoot
                    ? HierarchyCreator.UP_FILTER
                    : node === downRoot
                        ? HierarchyCreator.DOWN_FILTER
                        : HierarchyCreator.ALL_ACCEPTING_FILTER;
                this.fillNodeData(node, filter);
                let _i = 0, _a = node.childNodes.getAll();
                for (; _i < _a.length; _i++) {
                    const childNode = _a[_i];
                    queue.push(childNode);
                }
            }
            const getChildNodes = function (node) {
                const childNodes = node.childNodes.getAll();
                return childNodes.length ? childNodes : null;
            };
            return {
                upRoot: hierarchy(upRoot, getChildNodes),
                downRoot: hierarchy(downRoot, getChildNodes),
            };
        }

        fillNodeData(node, filter) {
            if (this.isFamNode(node)) {
                const fam = this.data.getFam(node.id);
                const _a = node.indi && node.indi.id === fam.getMother()
                    ? [fam.getMother(), fam.getFather()]
                    : [fam.getFather(), fam.getMother()], indiId = _a[0], spouseId = _a[1];
                Object.assign(node, {
                    id: this.idGenerator.getId(node.id),
                    indi: indiId && {id: indiId},
                    spouse: spouseId && {id: spouseId},
                });
                if (!node.duplicateOf && !node.duplicated) {
                    node.childNodes = this.childNodesForFam(fam, node, filter);
                }
            } else {
                const indi = this.data.getIndi(node.id);
                Object.assign(node, {
                    id: this.idGenerator.getId(node.id),
                    indi: {id: indi.getId()},
                });
                if (!node.duplicateOf && !node.duplicated) {
                    node.childNodes = this.childNodesForIndi(indi, node, filter);
                }
            }
            node.linkStubs = this.createLinkStubs(node);
        }

        childNodesForFam(fam, parentNode, filter) {
            const indi = parentNode.indi ? this.data.getIndi(parentNode.indi.id) : null;
            const spouse = parentNode.spouse
                ? this.data.getIndi(parentNode.spouse.id)
                : null;
            const _a = this.getParentsAndSiblings(indi), indiParentsFamsIds = _a[0], indiSiblingsIds = _a[1];
            const _b = this.getParentsAndSiblings(spouse), spouseParentsFamsIds = _b[0], spouseSiblingsIds = _b[1];
            const childrenIds = fam.getChildren();
            return new ChildNodes({
                indiParents: filter.indiParents
                    ? this.famAsSpouseIdsToNodes(indiParentsFamsIds, parentNode, LinkType.IndiParents)
                    : [],
                indiSiblings: filter.indiSiblings
                    ? this.indiIdsToFamAsSpouseNodes(indiSiblingsIds, parentNode, LinkType.IndiSiblings)
                    : [],
                spouseParents: filter.spouseParents
                    ? this.famAsSpouseIdsToNodes(spouseParentsFamsIds, parentNode, LinkType.SpouseParents)
                    : [],
                spouseSiblings: filter.spouseSiblings
                    ? this.indiIdsToFamAsSpouseNodes(spouseSiblingsIds, parentNode, LinkType.SpouseSiblings)
                    : [],
                children: filter.children
                    ? this.indiIdsToFamAsSpouseNodes(childrenIds, parentNode, LinkType.Children)
                    : [],
            });
        }

        childNodesForIndi(indi, parentNode, filter) {
            const _a = this.getParentsAndSiblings(indi), indiParentsFamsIds = _a[0], indiSiblingsIds = _a[1];
            return new ChildNodes({
                indiParents: filter.indiParents
                    ? this.famAsSpouseIdsToNodes(indiParentsFamsIds, parentNode, LinkType.IndiParents)
                    : [],
                indiSiblings: filter.indiSiblings
                    ? this.indiIdsToFamAsSpouseNodes(indiSiblingsIds, parentNode, LinkType.IndiSiblings)
                    : [],
            });
        }

        areParentsAndSiblingsPresent(indiId) {
            const indi = indiId && this.data.getIndi(indiId);
            const famcId = indi && indi.getFamilyAsChild();
            const famc = famcId && this.data.getFam(famcId);
            if (!famc)
                return [false, false];
            return [
                !!(famc.getFather() || famc.getMother()),
                famc.getChildren().length > 1,
            ];
        }

        getParentsAndSiblings(indi) {
            const indiFamcId = indi && indi.getFamilyAsChild();
            const indiFamc = this.data.getFam(indiFamcId);
            if (!indiFamc)
                return [[], []];
            const father = this.data.getIndi(indiFamc.getFather());
            const mother = this.data.getIndi(indiFamc.getMother());
            const parentFamsIds = []
                .concat(father ? father.getFamiliesAsSpouse() : [], mother ? mother.getFamiliesAsSpouse() : [])
                .filter(function (id) {
                    return id !== indiFamcId;
                });
            parentFamsIds.unshift(indiFamcId);
            const siblingsIds = Array.from(indiFamc.getChildren());
            siblingsIds.splice(siblingsIds.indexOf(indi.getId()), 1); // Remove indi from indi's siblings
            return [parentFamsIds, siblingsIds];
        }

        indiIdsToFamAsSpouseNodes(indiIds, parentNode, childNodeType) {
            const _this = this;
            return indiIds.flatMap(function (id) {
                return _this.indiIdToFamAsSpouseNodes(id, parentNode, childNodeType);
            });
        }

        indiIdToFamAsSpouseNodes(indiId, parentNode, childNodeType) {
            const _this = this;
            if (this.isChildNodeTypeForbidden(childNodeType, parentNode))
                return [];
            const famsIds = this.data.getIndi(indiId).getFamiliesAsSpouse();
            if (!famsIds.length) {
                const node = this.idToNode(EntryId.indi(indiId), parentNode, childNodeType);
                return node ? [node] : [];
            }
            const famsNodes = famsIds.map(function (id) {
                return {
                    id: id,
                    indi: {id: indiId},
                    family: {id: id},
                    parentNode: parentNode,
                    linkFromParentType: childNodeType,
                    childNodes: ChildNodes.EMPTY,
                    linkStubs: [],
                };
            });
            famsNodes.forEach(function (node, i) {
                if (i !== 0)
                    node.primaryMarriage = famsNodes[0];
                const duplicateOf = _this.queuedNodesById.get(node.id);
                if (duplicateOf) {
                    node.duplicateOf = duplicateOf;
                    duplicateOf.duplicated = true;
                } else
                    _this.queuedNodesById.set(node.id, node);
            });
            return famsNodes;
        }

        famAsSpouseIdsToNodes(famsIds, parentNode, childNodeType) {
            const nodes = this.idsToNodes(famsIds.map(EntryId.fam), parentNode, childNodeType);
            nodes.slice(1).forEach(function (node) {
                return (node.primaryMarriage = nodes[0]);
            });
            return nodes;
        }

        idsToNodes(entryIds, parentNode, childNodeType, duplicateCheck) {
            const _this = this;
            if (duplicateCheck === void 0) {
                duplicateCheck = true;
            }
            return entryIds
                .map(function (entryId) {
                    return _this.idToNode(entryId, parentNode, childNodeType, duplicateCheck);
                })
                .filter(function (node) {
                    return node != null;
                });
        }

        idToNode(entryId, parentNode, childNodeType, duplicateCheck) {
            if (duplicateCheck === void 0) {
                duplicateCheck = true;
            }
            if (this.isChildNodeTypeForbidden(childNodeType, parentNode))
                return null;
            const id = entryId.id, isFam = entryId.isFam;
            if (isFam) {
                const fam = this.data.getFam(id);
                if (!fam || (!fam.getFather() && !fam.getMother()))
                    return null; // Don't create fam nodes that are missing both husband and wife
            }
            const duplicateOf = this.queuedNodesById.get(id);
            const node = {
                id: id,
                parentNode: parentNode,
                linkFromParentType: childNodeType,
                childNodes: ChildNodes.EMPTY,
                linkStubs: [],
            };
            if (isFam)
                node.family = {id: id};
            if (duplicateCheck && duplicateOf) {
                node.duplicateOf = duplicateOf;
                duplicateOf.duplicated = true;
            }
            if (!duplicateOf)
                this.queuedNodesById.set(id, node);
            return node;
        }

        createLinkStubs(node) {
            const _this = this;
            if (!this.isFamNode(node) ||
                (!node.duplicateOf && !node.duplicated && !node.primaryMarriage)) {
                return [];
            }
            const fam = this.data.getFam(node.family.id);
            const _a = this.areParentsAndSiblingsPresent(node.indi ? node.indi.id : null), indiParentsPresent = _a[0],
                indiSiblingsPresent = _a[1];
            const _b = this.areParentsAndSiblingsPresent(node.spouse ? node.spouse.id : null),
                spouseParentsPresent = _b[0],
                spouseSiblingsPresent = _b[1];
            const childrenPresent = nonEmpty(fam.getChildren());
            return [
                indiParentsPresent ? [LinkType.IndiParents] : [],
                indiSiblingsPresent ? [LinkType.IndiSiblings] : [],
                spouseParentsPresent ? [LinkType.SpouseParents] : [],
                spouseSiblingsPresent ? [LinkType.SpouseSiblings] : [],
                childrenPresent ? [LinkType.Children] : [],
            ]
                .flat()
                .filter(function (linkType) {
                    return !_this.isChildNodeTypeForbidden(linkType, node) &&
                        !node.childNodes.get(linkType).length;
                });
        }

        isChildNodeTypeForbidden(childNodeType, parentNode) {
            if (childNodeType === null || !parentNode)
                return false;
            switch (otherSideLinkType(parentNode.linkFromParentType)) {
                case LinkType.IndiParents:
                case LinkType.IndiSiblings:
                    if (childNodeType === LinkType.IndiParents ||
                        childNodeType === LinkType.IndiSiblings) {
                        return true;
                    }
                    break;
                case LinkType.Children:
                    if (!parentNode.primaryMarriage &&
                        childNodeType === LinkType.Children) {
                        return true;
                    }
                    break;
                default:
                    return null;
            }
            if (parentNode.primaryMarriage) {
                // Forbid indi/spouse from parentNode that is also indi/spouse in primaryMarriage from having parents and siblings, as they are already added to primaryMarriage node. This prevents drawing parents/siblings of a person for each marriage of this person.
                const indiId = parentNode.indi.id;
                const spouseId = parentNode.spouse.id;
                const pmIndiId = parentNode.primaryMarriage.indi.id;
                const pmSpouseId = parentNode.primaryMarriage.spouse.id;
                if (indiId === pmIndiId || indiId === pmSpouseId) {
                    if (childNodeType === LinkType.IndiParents ||
                        childNodeType === LinkType.IndiSiblings) {
                        return true;
                    }
                } else if (spouseId === pmIndiId || spouseId === pmSpouseId) {
                    if (childNodeType === LinkType.SpouseParents ||
                        childNodeType === LinkType.SpouseSiblings) {
                        return true;
                    }
                }
            }
            return false;
        }

        isFamNode(node) {
            return !!node.family;
        }

        static createHierarchy(data, startEntryId) {
            return new HierarchyCreator(data, startEntryId).createHierarchy();
        }
    }

    HierarchyCreator.UP_FILTER = HierarchyFilter.allRejecting().modify({
        indiParents: true,
        spouseParents: true,
        indiSiblings: true,
        spouseSiblings: true,
    });
    HierarchyCreator.DOWN_FILTER = HierarchyFilter.allRejecting().modify({
        children: true,
    });
    HierarchyCreator.ALL_ACCEPTING_FILTER = HierarchyFilter.allAccepting();
    return HierarchyCreator;
}());

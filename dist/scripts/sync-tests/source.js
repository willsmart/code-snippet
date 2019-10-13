"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const locate_end_1 = __importStar(require("./locate-end"));
var ContextType;
(function (ContextType) {
    ContextType["class"] = "class";
    ContextType["function"] = "function";
    ContextType["none"] = "none";
})(ContextType || (ContextType = {}));
function blockBefore(block) {
    return ((block.parent && block.indexInParent && block.parent.children && block.parent.children[block.indexInParent - 1]) ||
        undefined);
}
function rangeBefore(block) {
    if (!block.parent)
        return { range: [block.range[0], block.range[0]], lineRange: [block.lineRange[0], block.lineRange[0]] };
    const sibling = blockBefore(block);
    if (!(sibling && sibling.range[1] !== undefined && sibling.lineRange[1] !== undefined)) {
        return {
            range: [block.parent.range[0], block.range[0]],
            lineRange: [block.parent.lineRange[0], block.lineRange[0]],
        };
    }
    return {
        range: [sibling.range[1], block.range[0]],
        lineRange: [sibling.lineRange[1], block.lineRange[0]],
    };
}
const reverseClassHeaderRegex = /\A\s*(?:<[^>]*>)?\s*(\w+)\s+ssalc\b/;
const reverseFunctionHeaderRegex = /\A\s*(?:(?!:\)).)*:\)[^(]*\(\s*(\w+)(?:\s*(?:noitcnuf|citats|tropxe|retteg|rettes))*\s*\n/;
function reverseString(string) {
    let reversedString = "";
    for (let i = string.length - 1; i >= 0; i--)
        reversedString += string.charAt(i);
    return reversedString;
}
class Source {
    constructor(file) {
        this.body = "";
        this.reverseBody = "";
        this.lines = [];
        this.tests = [];
        this.file = file;
        this.block = this.convertBaseBlock(locate_end_1.default(this.body, false));
    }
    convertBaseBlock(baseBlock, parent, indexInParent) {
        const { range, type, customCloseChar, children: baseChildren } = baseBlock;
        const block = {
            range,
            type,
            context: { type: ContextType.none },
            customCloseChar,
            lineRange: [
                this.lineIndexForCharIndex(range[0]),
                range[1] === undefined ? undefined : this.lineIndexForCharIndex(range[1]),
            ],
            parent,
            indexInParent,
            children: [],
        };
        block.children = baseChildren
            .filter(baseChild => baseChild.type == locate_end_1.BlockType.braces)
            .map((baseChild, childIndex) => this.convertBaseBlock(baseChild, block, childIndex));
        block.context = this.contextForBlock(block);
        return block;
    }
    stringForRange(range) {
        return this.body.substring(range[0], range[1]);
    }
    reverseStringForRange(range) {
        return this.reverseBody.substring(range[1] === undefined ? 0 : this.reverseBody.length - range[1], this.reverseBody.length - range[0]);
    }
    lineIndexForCharIndex(charIndex) {
        let charCount = 0;
        return this.lines.findIndex(line => charIndex < (charCount += line.length + 1));
    }
    contextForBlock(block) {
        const preceedingString = this.reverseStringForRange(rangeBefore(block).range);
        switch (block.type) {
            case locate_end_1.BlockType.braces:
                {
                    let match = reverseClassHeaderRegex.exec(preceedingString);
                    if (match)
                        return { type: ContextType.class, description: match[1] };
                    match = reverseFunctionHeaderRegex.exec(preceedingString);
                    if (match)
                        return { type: ContextType.function, description: match[1] };
                }
                break;
        }
        return { type: ContextType.none };
    }
    static async withFile(file) {
        const source = new Source(file);
        await source.asyncInit();
        return source;
    }
    blockAtCharIndex(charIndex) {
        if (charIndex < this.block.range[0] || (this.block.range[1] !== undefined && charIndex >= this.block.range[1]))
            return undefined;
        return touchedSubBlock(this.block);
        function touchedSubBlock(block) {
            for (const child of block.children) {
                if (charIndex >= child.range[0] && (child.range[1] === undefined || charIndex < child.range[1])) {
                    return touchedSubBlock(child);
                }
            }
            return block;
        }
    }
    async asyncInit() {
        this.body = await this.file.readSourceFile();
        this.reverseBody = reverseString(this.body);
        this.lines = this.body.split("\n");
        this.block = this.convertBaseBlock(locate_end_1.default(this.body, false));
        this.tests = [];
        const re = /^ *\/\/\/? *Test(?:: *(.*)$|s: *)((?:\n\s*\/\/\/.*)+))/g;
        let match;
        while ((match = re.exec(this.body))) {
            const { 1: test, 2: tests, index } = match;
            let lineNumber = this.lineIndexForCharIndex(index);
            const block = this.blockAtCharIndex(index) || this.block;
            if (test) {
                this.tests.push({
                    line: lineNumber,
                    block,
                    description: test,
                });
            }
            if (tests) {
                for (const line of tests.split("\n")) {
                    const match = /^\s*\/\/\/?\s*(.*?)\s*$/.exec(line);
                    if (match) {
                        this.tests.push({
                            line: lineNumber,
                            block,
                            description: match[1],
                        });
                    }
                    lineNumber++;
                }
            }
        }
    }
}
exports.Source = Source;
//# sourceMappingURL=source.js.map
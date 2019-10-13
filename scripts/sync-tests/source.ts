import { SourceFile } from "./source-file";
import locateEnd, { Block as BaseBlock, BlockType } from "./locate-end";

enum ContextType {
  class = "class",
  function = "function",
  none = "none",
}

type Context = {
  type: ContextType;
  description?: string;
};

type Block = {
  range: [number, number | undefined];
  type: BlockType;
  customCloseChar?: string;

  lineRange: [number, number | undefined];
  context: Context;
  children: Block[];
  parent?: Block;
  indexInParent?: number;
};

type Test = {
  block: Block;
  line: number;
  description: string;
};

function blockBefore(block: Block): Block | undefined {
  return (
    (block.parent && block.indexInParent && block.parent.children && block.parent.children[block.indexInParent - 1]) ||
    undefined
  );
}

function rangeBefore(block: Block): { range: [number, number]; lineRange: [number, number] } {
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

function reverseString(string: string): string {
  let reversedString = "";
  for (let i = string.length - 1; i >= 0; i--) reversedString += string.charAt(i);
  return reversedString;
}

export class Source {
  file: SourceFile;
  body = "";
  reverseBody = "";
  lines: string[] = [];
  block: Block;
  tests: Test[] = [];

  constructor(file: SourceFile) {
    this.file = file;
    this.block = this.convertBaseBlock(locateEnd(this.body, false));
  }

  convertBaseBlock(baseBlock: BaseBlock, parent?: Block, indexInParent?: number): Block {
    const { range, type, customCloseChar, children: baseChildren } = baseBlock;
    const block: Block = {
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
      .filter(baseChild => baseChild.type == BlockType.braces)
      .map((baseChild, childIndex) => this.convertBaseBlock(baseChild, block, childIndex));
    block.context = this.contextForBlock(block);
    return block;
  }

  stringForRange(range: [number, number | undefined]): string {
    return this.body.substring(range[0], range[1]);
  }

  reverseStringForRange(range: [number, number | undefined]): string {
    return this.reverseBody.substring(
      range[1] === undefined ? 0 : this.reverseBody.length - range[1],
      this.reverseBody.length - range[0]
    );
  }

  lineIndexForCharIndex(charIndex: number): number {
    let charCount = 0;
    return this.lines.findIndex(line => charIndex < (charCount += line.length + 1));
  }

  contextForBlock(block: Block): Context {
    const preceedingString = this.reverseStringForRange(rangeBefore(block).range);
    switch (block.type) {
      case BlockType.braces:
        {
          let match = reverseClassHeaderRegex.exec(preceedingString);
          if (match) return { type: ContextType.class, description: match[1] };

          match = reverseFunctionHeaderRegex.exec(preceedingString);
          if (match) return { type: ContextType.function, description: match[1] };
        }
        break;
    }
    return { type: ContextType.none };
  }

  static async withFile(file: SourceFile) {
    const source = new Source(file);
    await source.asyncInit();
    return source;
  }

  blockAtCharIndex(charIndex: number): Block | undefined {
    if (charIndex < this.block.range[0] || (this.block.range[1] !== undefined && charIndex >= this.block.range[1]))
      return undefined;
    return touchedSubBlock(this.block);

    function touchedSubBlock(block: Block): Block {
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
    this.block = this.convertBaseBlock(locateEnd(this.body, false));

    this.tests = [];
    const re = /^ *\/\/\/? *Test(?:: *(.*)$|s: *)((?:\n\s*\/\/\/.*)+))/g;
    let match;
    while ((match = re.exec(this.body))) {
      const { 1: test, 2: tests, index } = <{ 1: string | null; 2: string | null; index: number }>(<unknown>match);
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

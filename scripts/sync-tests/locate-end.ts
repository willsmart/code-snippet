// locate-end
// © Will Smart 2018. Licence: MIT

// This locates the end of a string literal or code block from some point in a string

// API is the function. Use via
//   const locateEnd = require(pathToFile)

/* eg:

locateEnd('` ${1+"\\"two\\""+three(four[5])}`+six')
=
{
  range: [0, 32],
  type: "``",
  children: [
    {
      range: [2, 31],
      type: "${}",
      children: [
        { range: [6, 15], type: '""' },
        { range: [21, 30], type: "()", children: [{ range: [26, 29], type: "[]" }] }
      ]
    }
  ]
}

locateEnd('eeepies','p') == {"range":[0,4],"type":"p"}
*/

export enum BlockType {
  braces = "{}",
  parentheses = "()",
  squareBrackets = "[]",
  templateInterpolation = "${}",
  singleQuotes = "''",
  doubleQuotes = '""',
  template = "``",
  openEnded = "...",
  customClosingCharacter = "custom",
}
export type Block = {
  range: [number, number | undefined];
  type: BlockType;
  customCloseChar?: string;
  children: Block[];
};

export function locateEndOfString(string: string, closeChar: string | false | undefined, openIndex: number): Block {
  const openIndexWas = openIndex;
  if (closeChar !== false && (typeof closeChar != "string" || closeChar.length != 1)) {
    closeChar = string.charAt(openIndex);
    switch (closeChar) {
      case '"':
      case "'":
      case "`":
        break;
      default:
        return locateEnd(string, undefined, openIndex);
    }
    openIndex++;
  }

  let regex;
  switch (closeChar) {
    case false:
      regex = /(?:\\$|(?!\$\{)[\s\S])*/g;
      break;
    case "`":
      regex = /(?:\\`|\\$|(?!\$\{)[^`])*/g;
      break;
    case "'":
      regex = /(?=((?:\\'|[^'])*))\1'/g;
      break;
    case '"':
      regex = /(?=((?:\\"|[^"])*))\1"/g;
      break;
    default:
      return locateEnd(string, closeChar, openIndex);
  }
  let range: [number, number | undefined] = [openIndexWas, undefined],
    type: BlockType | undefined =
      closeChar === false
        ? BlockType.openEnded
        : closeChar == "'"
        ? BlockType.singleQuotes
        : closeChar == '"'
        ? BlockType.doubleQuotes
        : closeChar == "`"
        ? BlockType.template
        : BlockType.customClosingCharacter,
    customCloseChar: string | undefined = type === BlockType.customClosingCharacter ? <string>closeChar : undefined,
    children: Block[] = [];

  if (closeChar !== false && closeChar != "`") {
    regex.lastIndex = openIndex;
    const match = regex.exec(string);
    if (match) range[1] = regex.lastIndex;
    return { range, type, customCloseChar, children };
  }

  regex.lastIndex = openIndex;
  while (true) {
    regex.exec(string);
    if (regex.lastIndex == string.length) return { range, type, customCloseChar, children };
    const endChar = string.charAt(regex.lastIndex);
    if (endChar === closeChar) {
      return { range: [range[0], regex.lastIndex + 1], type, customCloseChar, children };
    }

    // must be a ${
    const child = locateEnd(string, undefined, regex.lastIndex + 1);
    if (!child) throw new Error(`Could not find matching ${closeChar}`);
    if (child.type == "{}") {
      child.type = BlockType.templateInterpolation;
      child.range[0]--;
    }
    children.push(child);
    if (child.range[1] === undefined) return { range, type, customCloseChar, children };
    regex.lastIndex = child.range[1];
  }
}

type OpenBracket = "{" | "[" | "(";
const bracketTypes = {
  "(": ")",
  "[": "]",
  "{": "}",
};

locateEnd.locateEndOfString = locateEndOfString;
export default function locateEnd(
  string: string,
  closeChar: string | false | undefined = undefined,
  openIndex: number = 0
): Block {
  let range: [number, number | undefined] = [openIndex, undefined],
    type: BlockType | undefined,
    customCloseChar: string | undefined,
    children: Block[] = [];

  let closeCharClass = "";
  if (closeChar !== false && (typeof closeChar != "string" || closeChar.length != 1)) {
    const openChar = string.charAt(openIndex);
    switch (openChar) {
      case '"':
      case "'":
      case "`":
        return locateEndOfString(string, undefined, openIndex);
    }

    if (!(openChar in bracketTypes)) throw new Error(`Expected a bracket type to open the block, found ${openChar}`);
    closeChar = bracketTypes[<OpenBracket>openChar];
    openIndex++;
  }
  switch (closeChar) {
    case false:
      type = BlockType.openEnded;
      break;
    case '"':
    case "'":
    case "`":
      return locateEndOfString(string, closeChar, openIndex);
    case "}":
      type = BlockType.braces;
      break;
    case ")":
      type = BlockType.parentheses;
      break;
    case "]":
      type = BlockType.squareBrackets;
      break;
    default:
      type = BlockType.customClosingCharacter;
      customCloseChar = closeChar;
      closeCharClass = `\\${closeChar}`;
      break;
  }

  const regex = new RegExp(`[^'"\\\`{}()[\\]${closeCharClass}]*`, "g");

  regex.lastIndex = openIndex;
  while (true) {
    if (regex.lastIndex == string.length) return { range, type, customCloseChar, children };
    const endChar = string.charAt(regex.lastIndex);
    if (endChar === closeChar) {
      return { range: [range[0], regex.lastIndex + 1], type, customCloseChar, children };
    }
    let child;
    switch (endChar) {
      case "`":
      case "'":
      case '"':
        child = locateEndOfString(string, undefined, regex.lastIndex);
        break;
      case "[":
      case "{":
      case "(":
        child = locateEnd(string, undefined, regex.lastIndex);
        break;
      default:
        throw new Error(`Could not find matching ${closeChar}`);
    }
    children.push(child);
    if (child.range[1] === undefined) return { range, type, customCloseChar, children };
    regex.lastIndex = child.range[1];
  }
}

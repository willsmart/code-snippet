import { start } from "repl"

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

export enum EndChar {
  brace = '}',
  parenthesis = ")",
  squareBracket = "]",
  singleQuote = "'",
  doubleQuote = '"',
  backTick = "`",
  endOfLine = '',
  blockComment = "*/",
  endOfString = ''
}

export enum StartChar {
  brace = '{',
  templateInterpolation = '${',
  parenthesis = "(",
  squareBracket = "[",
  singleQuote = "'",
  doubleQuote = '"',
  backTick = "`",
  lineComment = "//",
  blockComment = "/*",
  startOfString = ''
}

export enum BlockType {
  braces = "{}",
  parentheses = "()",
  squareBrackets = "[]",
  templateInterpolation = "${}",
  singleQuotes = "''",
  doubleQuotes = '""',
  template = "``",
  lineComment = "//",
  blockComment = "/**/",
  wholeString = "...",
}

const bookendsByBlockType:{[type:string]:{startChar:StartChar, endChar:EndChar}} = {
  [BlockType.braces]: {startChar: StartChar.brace, endChar:EndChar.brace},
  [BlockType.parentheses]: {startChar: StartChar.parenthesis, endChar:EndChar.parenthesis},
  [BlockType.squareBrackets]: {startChar: StartChar.squareBracket, endChar:EndChar.squareBracket},
  [BlockType.templateInterpolation]: {startChar: StartChar.templateInterpolation, endChar:EndChar.brace},
  [BlockType.singleQuotes]: {startChar: StartChar.singleQuote, endChar:EndChar.singleQuote},
  [BlockType.doubleQuotes]: {startChar: StartChar.doubleQuote, endChar:EndChar.doubleQuote},
  [BlockType.template]: {startChar: StartChar.backTick, endChar:EndChar.backTick},
  [BlockType.wholeString]: {startChar: StartChar.startOfString, endChar:EndChar.endOfString},
  [BlockType.lineComment]: {startChar: StartChar.lineComment, endChar:EndChar.endOfLine},
  [BlockType.blockComment]: {startChar: StartChar.blockComment, endChar:EndChar.blockComment}
}

export type Block = {
  range: [number, number];
  type: BlockType;
  children: Block[];
  string: string;
};

function blockTypeForString(string:string):BlockType {
  for (const blockType of [BlockType.braces,BlockType.templateInterpolation,BlockType.parentheses,BlockType.squareBrackets,BlockType.singleQuotes,BlockType.doubleQuotes,BlockType.template, BlockType.lineComment, BlockType.blockComment]) {
    const {startChar}:{startChar:StartChar} = bookendsByBlockType[blockType]
    if (string.substring(0,startChar.length)===startChar) return blockType;
  }
  return BlockType.wholeString
}

export default function locateEnd(string: string, blockType: BlockType|'auto' = 'auto', openIndex:number = 0): Block {
  if (blockType==='auto') blockType = blockTypeForString(string.substring(openIndex))

  let children: Block[] = [];
  const {endChar, startChar} = bookendsByBlockType[blockType]

  let regex:RegExp;
    switch (blockType) {
      case BlockType.singleQuotes:
      case BlockType.doubleQuotes:
          switch (blockType) {
            default: case BlockType.singleQuotes:
              regex = /'(?=((?:\\'|[^'])*))\1(?=')/g;
              break;
              case BlockType.doubleQuotes:
                  regex = /"(?=((?:\\"|[^"])*))\1(?=")/g;
                  break;
          }
          regex.lastIndex = openIndex;
          const match = regex.exec(string);
        if (!match) {
          throw new Error(`Could not match string of type ${blockType}`)
        }
    default:
        switch (blockType) {
          case BlockType.template: regex = /(?:\\`|\\$|(?!\$\{)[^`])*/g; break;
          case BlockType.lineComment: regex = /(?:(?!$).)*/g; break;
          case BlockType.blockComment: regex = /(?:(?!\*\/)[\\s\\S])*/g; break;
          default: regex = /(?:(?!\/\*|\/\/)[^'"\\`{}()[\]])*/g;break;
        }
        regex.lastIndex = openIndex + startChar.length;
        while (true) {
          regex.exec(string);

          if (blockType===BlockType.lineComment) break;
          if (blockType===BlockType.wholeString && regex.lastIndex == string.length) break;
          if (endChar && string.substring(regex.lastIndex, regex.lastIndex+endChar.length) === endChar) break;

          if (regex.lastIndex == string.length) {
            throw new Error(`Could not match block of type ${blockType}`)
          }

          const nextChar = string.substring(regex.lastIndex, regex.lastIndex+StartChar.templateInterpolation.length) === StartChar.templateInterpolation ? StartChar.templateInterpolation :
          string.substring(regex.lastIndex, regex.lastIndex+StartChar.lineComment.length) === StartChar.lineComment ? StartChar.lineComment :
          string.substring(regex.lastIndex, regex.lastIndex+StartChar.blockComment.length) === StartChar.blockComment ? StartChar.blockComment :
           string.charAt(regex.lastIndex);
          switch (nextChar) {
              case StartChar.templateInterpolation:case StartChar.blockComment:case StartChar.lineComment:case StartChar.backTick:case StartChar.brace:case StartChar.parenthesis:case StartChar.squareBracket:case StartChar.singleQuote:case StartChar.doubleQuote:
                  const child = locateEnd(string, 'auto', regex.lastIndex)
                  children.push(child);
                  regex.lastIndex = child.range[1];
                  break;

              default: throw new Error(`Could not find matching ${endChar} (found ${nextChar} instead)`)
            }
        }
      }

      return { range: [openIndex, regex.lastIndex + endChar.length], type:blockType, children, string: string.substring(openIndex, regex.lastIndex + endChar.length) };
}

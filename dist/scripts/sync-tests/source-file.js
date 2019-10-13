"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const util_1 = require("util");
const path_1 = require("path");
const mkdir = util_1.promisify(fs_1.mkdir);
const readFile = util_1.promisify(fs_1.readFile);
const writeFile = util_1.promisify(fs_1.writeFile);
class SourceFile {
    constructor(subpath, sourceDir, testsDir) {
        this.sourceDir = sourceDir;
        this.testsDir = testsDir;
        this.filename = subpath;
    }
    get sourcePath() {
        return this.sourceDir + this.filename;
    }
    get testPath() {
        return this.testsDir + this.filename;
    }
    async makeTestDir() {
        await mkdir(path_1.dirname(this.testPath), { recursive: true });
    }
    async writeTestFile(body) {
        this.makeTestDir();
        await writeFile(this.testPath, body);
    }
    async readTestFile() {
        return this.testBody || (this.testBody = await readFile(this.testPath, "utf8").catch(() => ""));
    }
    async readSourceFile() {
        return this.sourceBody || (this.sourceBody = await readFile(this.sourcePath, "utf8"));
    }
}
exports.SourceFile = SourceFile;
//# sourceMappingURL=source-file.js.map
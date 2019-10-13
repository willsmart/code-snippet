"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const util_1 = require("util");
const source_file_1 = require("./source-file");
const source_1 = require("./source");
const readdir = util_1.promisify(fs_1.readdir);
const mkdir = util_1.promisify(fs_1.mkdir);
const readFile = util_1.promisify(fs_1.readFile);
const writeFile = util_1.promisify(fs_1.writeFile);
const realpath = util_1.promisify(fs_1.realpath);
const stat = util_1.promisify(fs_1.stat);
(async () => {
    const sourceDir = await realpath(__dirname + "/../../../source");
    const testsDir = await realpath(__dirname + "/../../../tests");
    await processDir();
    async function processDir(subdir = "") {
        const files = await readdir(sourceDir + subdir);
        for (const name of files) {
            const childSubpath = `${subdir}/${name}`;
            const dirent = await stat(sourceDir + childSubpath);
            if (dirent.isFile() && name.endsWith(".ts")) {
                const sourceFile = new source_file_1.SourceFile(childSubpath, sourceDir, testsDir);
                const source = await source_1.Source.withFile(sourceFile);
                debugger;
                console.log(source.tests);
            }
            if (dirent.isDirectory()) {
                await processDir(childSubpath);
            }
        }
    }
})();
//# sourceMappingURL=sync-tests.js.map
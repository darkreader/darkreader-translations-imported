// @ts-check
const fs = require('fs/promises');
const exists = require('fs').existsSync;
const path = require('path');

/**
 * @param {string} filePath
 * @param {string} content
 */
async function writeFile(filePath, content) {
    const dir = path.dirname(filePath);
    if (!exists(dir)) {
        await fs.mkdir(dir, {recursive: true});
    }
    await fs.writeFile(filePath, content);
}

/**
 * @param {string} filePath
 * @param {string | string[] | ((localeName: string) => (string | string[]))} outputPathOrPaths
 */
async function bundleLocale(filePath, outputPathOrPaths) {
    let file = await fs.readFile(filePath, 'utf8');
    file = file.replace(/^#.*?$/gm, '');

    const messages = {};

    const regex = /@([a-z0-9_]+)/ig;
    let match;
    while ((match = regex.exec(file))) {
        const messageName = match[1];
        const messageStart = match.index + match[0].length;
        let messageEnd = file.indexOf('@', messageStart);
        if (messageEnd < 0) {
            messageEnd = file.length;
        }
        messages[messageName] = {
            message: file.substring(messageStart, messageEnd).trim()
        };
    }

    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    const locale = fileName.substring(0, fileName.lastIndexOf('.')).replace('-', '_');
    const json = `${JSON.stringify(messages, null, 4)}\n`;
    /** @type {string[]} */
    let outputPaths;
    if (typeof outputPathOrPaths === 'string') {
        outputPaths = [outputPathOrPaths];
    } else if (Array.isArray(outputPathOrPaths)) {
        outputPaths = outputPathOrPaths;
    } else if (typeof outputPathOrPaths === 'function') {
        const result = outputPathOrPaths(locale);
        outputPaths = Array.isArray(result) ? result : [result];
    }
    await Promise.all(outputPaths.map((p) => writeFile(p, json)));
}

/**
 * @param {(locale: string) => (string | string[])} getOutputPath
 */
async function bundleLocales(getOutputPath) {
    const localesSrcDir = './locales';
    const list = await fs.readdir(localesSrcDir);
    for (const name of list) {
        if (!name.endsWith('.config')) {
            continue;
        }
        await bundleLocale(`${localesSrcDir}/${name}`, getOutputPath);
    }
}

module.exports = {
    bundleLocale,
    bundleLocales,
};

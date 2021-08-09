// @ts-check
const {readFile, readdir: readDir} = require('fs/promises');
const {resolve: resolvePath} = require('path');
const {log} = require('./utils');

const LOCALES_DIR = './locales/';

/**
 * @param {string} name
 * @returns {Promise<string>}
 */
async function readLocale(name) {
    return await readFile(
        resolvePath(__dirname, LOCALES_DIR, name),
        {encoding: 'utf-8'},
    );
}

async function test() {
    log('Running tests...');

    let failures = 0;

    const files = await readDir(LOCALES_DIR);
    const enLocale = await readLocale('en.config');
    const enLines = enLocale.split('\n');
    /** @type {string[]} */
    const locales = [];
    for (const file of files) {
        const locale = await readLocale(file);
        locales.push(locale);
    }

    /**
     * @param {string} message
     * @param {(loc: string) => boolean} predicate
     */
    function checkLocales(message, predicate) {
        for (let i = 0; i < locales.length; i++) {
            const name = files[i];
            const loc = locales[i];
            if (!predicate(loc)) {
                failures++;
                log.error(`FAIL ${message} (${name})`);
                return;
            }
        }
        log.ok(message);
    }

    /**
     * @param {string} message
     * @param {(loc: string, en?: string) => boolean} predicate
     */
    function checkLines(message, predicate) {
        for (let j = 0; j < locales.length; j++) {
            const name = files[j];
            const loc = locales[j];
            const lines = loc.split('\n');
            const minLines = Math.min(lines.length, enLines.length);
            for (let i = 0; i < minLines; i++) {
                if (!predicate(lines[i], enLines[i])) {
                    failures++
                    log.error(`FAIL ${message} (${name}, line ${i + 1})`);
                    return;
                }
            }
        }
        log.ok(message);
    }

    checkLocales(
        'Line count is the same',
        (loc) => loc.split('\n').length === enLines.length
    );

    checkLocales(
        'Locales end with new line',
        (loc) => loc.endsWith('\n')
    );

    checkLines(
        'Line spaces are the same',
        (loc, en) => !en === !loc
    );

    checkLines(
        'Message codes are on the same positions',
        (loc, en) => !en.startsWith('@') || (en.startsWith('@') && en === loc)
    );

    checkLines(
        'No extra whitespace',
        (loc) => loc.trim() === loc
    );
}

test();

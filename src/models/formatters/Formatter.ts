import path from "path";
import fs from "fs";
import {LangFile, KeysetFile, ContextFile} from "../../types";
import { DEFAULT_KEYSET } from "../../const";

const STATUSES_FILE_NAME = 'keyset.json';
const CONTEXT_FILE_NAME = 'context.json';

function ensureTrailingNewLine(content: string) {
    return content[content.length - 1] === '\n' ? content : content + '\n';
}

export abstract class Formatter {

    abstract extension: string;

    /**
     * Extracts keys from a file into the library's internal format
     *
     * @param {String} content File contents
     * @param {String} language Keyset language
     *
     * @returns {LangFile}
     */
    abstract parseKeyset(content: string, language: string): LangFile;

    /**
     * Converts keys from the library's internal format to the contents of a keyset file
     *
     * @param {LangFile} data Keys in the library's internal format
     * @param {String} language Keyset language
     *
     * @returns {String}
     */
    abstract formatKeyset(data: LangFile, language: string): string;

    loadKeyset(dirname: string, language: string) {
        try {
            const content = this.load(dirname, language);
            return this.parseKeyset(content, language);
        } catch (err) {
             // no such file or directory
             if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        return {};
    }

    saveKeyset(dirname: string, language: string, data: LangFile) {
        const content = this.formatKeyset(data, language);
        return this.save(dirname, language, content);
    }

    loadContexts(dirname: string): ContextFile {
        try {
            const data = this.load(dirname, CONTEXT_FILE_NAME);
            return JSON.parse(data);
        } catch (err) {
            // no such file or directory
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        return DEFAULT_KEYSET.context;
    }

    saveContexts(dirname: string, data: ContextFile) {
        return this.save(dirname, CONTEXT_FILE_NAME, JSON.stringify(data, null, 2));
    }

    loadStatuses(dirname: string): KeysetFile {
        try {
            const data = this.load(dirname, STATUSES_FILE_NAME);
            return JSON.parse(data);
        } catch (err) {
            // no such file or directory
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }

        return DEFAULT_KEYSET.keyset;
    }

    saveStatuses(dirname: string, data: KeysetFile) {
        return this.save(dirname, STATUSES_FILE_NAME, JSON.stringify(data, null, 2));
    }

    appendExtension(filename: string) {
        if (filename === CONTEXT_FILE_NAME || filename === STATUSES_FILE_NAME) {
            return filename;
        }

        return filename.endsWith(`.${this.extension}`) ? filename : `${filename}.${this.extension}`;
    }

    removeExtension(filename: string) {
        return filename.endsWith(`.${this.extension}`)
            ? filename.substring(0, filename.length - `.${this.extension}`.length)
            : filename;
    }

    protected load(dirname: string, filename: string) {
        const fullname = path.resolve(dirname, this.appendExtension(filename));

        return fs.readFileSync(fullname, {
            encoding: 'utf-8',
        });
    }

    protected save(dirname: string, filename: string, data: string) {
        const content = ensureTrailingNewLine(data);
        fs.writeFileSync(path.resolve(dirname, this.appendExtension(filename)), content);
    }
}

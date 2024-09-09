import { LangFile } from "../../types";
import { Formatter } from "./Formatter";

export class JsonFormatter extends Formatter {
    extension = 'json';

    parseKeyset(content: string): LangFile {
        const keyset = JSON.parse(content) as LangFile;
        return keyset;
    }

    formatKeyset(data: LangFile) {
        return JSON.stringify(data, null, 2);
    }
}

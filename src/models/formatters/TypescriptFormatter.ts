import { LangFile, LangFileValue } from "../../types";
import { Formatter } from "./Formatter";
import traverse from '@babel/traverse';
import { parse, ParserPlugin } from '@babel/parser';
import { Node } from "@babel/traverse";

const FILE_TEMPLATE = 'export default {{KEYSET}};';

function parseKey(node: Node): string | undefined {
    if (node.type === 'Identifier') {
        return node.name;
    }

    if (node.type === 'StringLiteral') {
        return node.value;
    }

    return undefined;
}

function parseValue(node: Node): LangFileValue | undefined {
    if (node.type === 'StringLiteral') {
        return node.value || '';
    }

    if (node.type === 'ArrayExpression') {
        const value: string[] = [];

        node.elements.forEach((element) => {
            if (element?.type !== 'StringLiteral' || typeof element.value !== 'string') {
                throw new Error(
                    `Invalid type ${element?.type} for plural form value in array`,
                );
            }

            value.push(element.value || '');
        });

        return value;
    }

    if (node.type === 'ObjectExpression') {
        const value: Record<string, string> = {};

        node.properties.forEach((prop) => {
            if (prop.type !== 'ObjectProperty') {
                return;
            }

            const key = parseKey(prop.key);

            if (!key) {
                throw new Error(`Failed to parse key with type ${prop.key.type}`);
            }

            const formValue = parseValue(prop.value);

            if (typeof formValue !== 'string') {
                throw new Error(`Incorrect type ${prop.value.type} for plural form ${key}`);
            }

            value[key] = formValue;
        });

        return value;
    }

    return undefined;
}

const parseToAst = (content: string) => {
    const plugins: ParserPlugin[] = ['typescript', 'decorators'];

    return parse(content, {
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        plugins,
    });
};

function parseKeysetFromCode(content: string): LangFile {
    const ast = parseToAst(content);
    const keyset: LangFile = {};

    traverse(
        ast,
        {
            ObjectExpression: (path) => {
                path.node.properties.forEach((prop) => {
                    if (prop.type !== 'ObjectProperty') {
                        return;
                    }

                    const key = parseKey(prop.key);
                    if (!key) {
                        throw new Error(`Failed to parse key with type ${prop.key.type}`);
                    }

                    const value = parseValue(prop.value);
                    if (typeof value === 'undefined') {
                        throw new Error(
                            `Failed to parse value with type ${prop.value.type}`,
                        );
                    }
                    
                    keyset[key] = value;
                });
            }
        },
    );

    return keyset;
}

export class TypescriptFormatter extends Formatter {
    extension = 'ts';

    parseKeyset(content: string): LangFile {
        return parseKeysetFromCode(content);
    }

    formatKeyset(data: LangFile) {
        const keyset = JSON.stringify(data, null, 4);
        return FILE_TEMPLATE.replace('{{KEYSET}}', keyset);
    }
}

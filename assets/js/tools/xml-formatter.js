
'use strict';

/*
 * Conservative XML formatter.
 *
 * The XML parser checks well-formedness.
 * Formatting is limited to adjacent element
 * tags without existing text or special nodes.
 *
 * Existing text, whitespace, CDATA, comments,
 * processing instructions and declarations
 * are left unchanged.
 */

function xmlInputChanged() {
    const status = document.getElementById('status');

    if (status) {
        status.textContent = '';
    }

    window.xmlCopyRevision =
        (window.xmlCopyRevision || 0) + 1;
}

function parseXMLDocument(source) {
    try {
        const documentXML = new DOMParser()
            .parseFromString(
                source,
                'application/xml'
            );

        if (
            documentXML.getElementsByTagName(
                'parsererror'
            ).length > 0
        ) {
            return null;
        }

        return documentXML;

    } catch (error) {
        return null;
    }
}

/*
 * Text nodes are deliberately rejected,
 * including whitespace-only text nodes.
 *
 * This avoids rewriting whitespace already
 * present in the source document.
 */
function xmlHasSensitiveContent(node) {
    if (
        node.nodeType === 1 &&
        typeof node.hasAttribute === 'function' &&
        node.hasAttribute('xml:space')
    ) {
        return true;
    }

    const children = Array.from(
        node.childNodes || []
    );

    for (const child of children) {
        if (child.nodeType !== 1) {
            return true;
        }

        if (xmlHasSensitiveContent(child)) {
            return true;
        }
    }

    return false;
}

/*
 * Scan raw element tags without splitting on
 * a > character inside a quoted attribute.
 *
 * Never rewrite individual tag contents.
 */
function xmlTokenizeElementTags(source) {
    const tokens = [];

    let index = 0;

    while (index < source.length) {
        if (source[index] !== '<') {
            return null;
        }

        let quote = '';
        let end = -1;

        for (
            let i = index + 1;
            i < source.length;
            i++
        ) {
            const character = source[i];

            if (quote) {
                if (character === quote) {
                    quote = '';
                }
            } else if (
                character === '"' ||
                character === "'"
            ) {
                quote = character;
            } else if (character === '>') {
                end = i;
                break;
            }
        }

        if (end < 0) {
            return null;
        }

        const token = source.slice(
            index,
            end + 1
        );

        if (
            token.startsWith('<?') ||
            token.startsWith('<!')
        ) {
            return null;
        }

        tokens.push(token);

        index = end + 1;
    }

    return tokens;
}

function xmlIndentSimpleElements(source) {
    const tokens = xmlTokenizeElementTags(source);

    if (!tokens || tokens.length === 0) {
        return null;
    }

    let depth = 0;
    const lines = [];

    for (const token of tokens) {
        const closing = token.startsWith('</');

        const selfClosing = /\/\s*>$/.test(token);

        if (closing) {
            depth--;

            if (depth < 0) {
                return null;
            }
        }

        lines.push(
            '  '.repeat(depth) + token
        );

        if (!closing && !selfClosing) {
            depth++;
        }
    }

    if (depth !== 0) {
        return null;
    }

    return lines.join('\n');
}

function formatXML() {
    const input = document.getElementById('xmlInput');
    const status = document.getElementById('status');

    const source = input.value;

    if (!source.trim()) {
        status.textContent =
            'Enter XML before formatting.';
        return;
    }

    const documentXML = parseXMLDocument(source);

    if (!documentXML) {
        status.textContent =
            'Invalid XML. Input unchanged.';
        return;
    }

    if (xmlHasSensitiveContent(documentXML)) {
        status.textContent =
            'Valid XML. Left unchanged to protect text, whitespace or special content.';
        return;
    }

    const formatted = xmlIndentSimpleElements(source);

    if (formatted === null) {
        status.textContent =
            'Valid XML. Formatting skipped to preserve the original content.';
        return;
    }

    if (formatted === source) {
        status.textContent =
            'Valid XML. No formatting changes needed.';
        return;
    }

    input.value = formatted;

    xmlInputChanged();

    status.textContent =
        'Valid XML formatted. Review added indentation whitespace before use.';
}

function validateXML() {
    const input = document.getElementById('xmlInput');
    const status = document.getElementById('status');

    const source = input.value;

    if (!source.trim()) {
        status.textContent =
            'Enter XML before validating.';
        return;
    }

    const documentXML = parseXMLDocument(source);

    status.textContent = documentXML
        ? 'Valid XML OK'
        : 'Invalid XML ERROR';
}

async function copyXML() {
    const input = document.getElementById('xmlInput');
    const status = document.getElementById('status');

    const text = input.value;

    const revision = window.xmlCopyRevision || 0;

    if (!text.trim()) {
        status.textContent =
            'Enter XML before copying.';
        return;
    }

    try {
        const safety = window.FTOSafety;

        if (
            !safety ||
            typeof safety.copyText !== 'function'
        ) {
            throw new Error(
                'Clipboard service unavailable.'
            );
        }

        await safety.copyText(text);

        if (
            revision !==
                (window.xmlCopyRevision || 0) ||
            input.value !== text
        ) {
            return;
        }

        status.textContent =
            'XML copied successfully.';

    } catch (error) {
        if (
            revision !==
                (window.xmlCopyRevision || 0) ||
            input.value !== text
        ) {
            return;
        }

        status.textContent =
            'Copy failed. Select and copy the XML manually.';
    }
}

function clearXML() {
    document.getElementById('xmlInput').value = '';
    xmlInputChanged();
}

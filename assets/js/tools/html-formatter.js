'use strict';

const BLOCK_TAGS = new Set([
    'html', 'head', 'body',
    'address', 'article', 'aside', 'blockquote',
    'caption', 'colgroup',
    'dd', 'details', 'dialog', 'div', 'dl', 'dt',
    'fieldset', 'figcaption', 'figure', 'footer',
    'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'header', 'hr', 'li', 'main', 'menu', 'nav',
    'ol', 'p', 'pre', 'section', 'summary', 'textarea',
    'table', 'tbody', 'td', 'tfoot', 'th',
    'thead', 'tr', 'ul', 'script', 'style'
]);

const PRESERVED_CONTENT_TAGS = new Set([
    'script', 'style', 'textarea', 'pre',
    'title', 'xmp', 'iframe', 'noembed',
    'noframes', 'noscript', 'plaintext'
]);

function findTagEnd(source, start) {
    let quote = '';

    for (let i = start + 1; i < source.length; i++) {
        const char = source[i];

        if (quote) {
            if (char === quote) quote = '';
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }

        if (char === '>') return i;
    }

    return -1;
}

function findDeclarationEnd(source, start) {
    let quote = '';
    let bracketDepth = 0;

    for (let i = start + 2; i < source.length; i++) {
        const char = source[i];

        if (quote) {
            if (char === quote) quote = '';
            continue;
        }

        if (char === '"' || char === "'") {
            quote = char;
        } else if (char === '[') {
            bracketDepth++;
        } else if (char === ']' && bracketDepth > 0) {
            bracketDepth--;
        } else if (char === '>' && bracketDepth === 0) {
            return i;
        }
    }

    return -1;
}

function tokenizeHTML(source) {
    const tokens = [];
    let index = 0;

    while (index < source.length) {
        const start = source.indexOf('<', index);

        if (start === -1) {
            tokens.push({
                type: 'text',
                value: source.slice(index)
            });
            break;
        }

        if (start > index) {
            tokens.push({
                type: 'text',
                value: source.slice(index, start)
            });
        }

        if (source.startsWith('<!--', start)) {
            const end = source.indexOf('-->', start + 4);

            if (end === -1) {
                tokens.push({
                    type: 'opaque',
                    value: source.slice(start)
                });
                break;
            }

            tokens.push({
                type: 'opaque',
                value: source.slice(start, end + 3)
            });

            index = end + 3;
            continue;
        }

        if (source.startsWith('<![CDATA[', start)) {
            const end = source.indexOf(']]>', start + 9);

            if (end === -1) {
                tokens.push({
                    type: 'opaque',
                    value: source.slice(start)
                });
                break;
            }

            tokens.push({
                type: 'opaque',
                value: source.slice(start, end + 3)
            });

            index = end + 3;
            continue;
        }

        if (
            source.startsWith('<!', start) ||
            source.startsWith('<?', start)
        ) {
            const end = findDeclarationEnd(source, start);

            if (end === -1) {
                tokens.push({
                    type: 'opaque',
                    value: source.slice(start)
                });
                break;
            }

            tokens.push({
                type: 'opaque',
                value: source.slice(start, end + 1)
            });

            index = end + 1;
            continue;
        }

        const end = findTagEnd(source, start);

        if (end === -1) {
            tokens.push({
                type: 'opaque',
                value: source.slice(start)
            });
            break;
        }

        const rawTag = source.slice(start, end + 1);

        const match = rawTag.match(
            /^<(\/?)([A-Za-z][A-Za-z0-9:-]*)(?=[\s/>])/
        );

        if (!match) {
            tokens.push({
                type: 'text',
                value: '<'
            });

            index = start + 1;
            continue;
        }

        const closing = match[1] === '/';
        const name = match[2].toLowerCase();
        const selfClosing = /\/\s*>$/.test(rawTag);

        tokens.push({
            type: 'tag',
            name,
            closing,
            selfClosing,
            value: rawTag
        });

        index = end + 1;

        if (
            !closing &&
            !selfClosing &&
            PRESERVED_CONTENT_TAGS.has(name)
        ) {
            if (name === 'plaintext') {
                if (index < source.length) {
                    tokens.push({
                        type: 'opaque',
                        value: source.slice(index)
                    });
                }
                break;
            }

            const closePattern = new RegExp(
                '</\\s*' + name + '\\s*>',
                'ig'
            );

            closePattern.lastIndex = index;

            const closeMatch = closePattern.exec(source);

            if (!closeMatch) {
                if (index < source.length) {
                    tokens.push({
                        type: 'opaque',
                        value: source.slice(index)
                    });
                }
                break;
            }

            if (closeMatch.index > index) {
                tokens.push({
                    type: 'opaque',
                    value: source.slice(index, closeMatch.index)
                });
            }

            tokens.push({
                type: 'tag',
                name,
                closing: true,
                selfClosing: false,
                value: closeMatch[0]
            });

            index = closePattern.lastIndex;
        }
    }

    return tokens;
}

function isEligibleGap(previous, next) {
    if (
        previous.type !== 'tag' ||
        next.type !== 'tag'
    ) {
        return false;
    }

    if (
        !BLOCK_TAGS.has(previous.name) ||
        !BLOCK_TAGS.has(next.name)
    ) {
        return false;
    }

    // Preserve whitespace inside an empty element.
    if (
        !previous.closing &&
        !previous.selfClosing &&
        next.closing &&
        previous.name === next.name
    ) {
        return false;
    }

    return true;
}

function transformHTML(source, mode) {
    const tokens = tokenizeHTML(source);
    const output = [];
    const lineBreak = source.includes('\r\n') ? '\r\n' : '\n';

    let changes = 0;

    for (let i = 0; i < tokens.length; i++) {
        const current = tokens[i];

        output.push(current.value);

        if (current.type !== 'tag') continue;

        const next = tokens[i + 1];

        // Handle directly adjacent block tags.
        if (
            next &&
            next.type === 'tag' &&
            isEligibleGap(current, next)
        ) {
            if (mode === 'format') {
                output.push(lineBreak);
                changes++;
            }

            continue;
        }

        // Handle whitespace between adjacent block tags.
        if (
            next &&
            next.type === 'text' &&
            /^[\t\n\f\r ]+$/u.test(next.value)
        ) {
            const after = tokens[i + 2];

            if (
                after &&
                after.type === 'tag' &&
                isEligibleGap(current, after)
            ) {
                const replacement =
                    mode === 'format' ? lineBreak : '';

                if (replacement !== next.value) {
                    changes++;
                }

                output.push(replacement);
                i++;
            }
        }
    }

    return {
        value: output.join(''),
        changes
    };
}

function setStatus(message) {
    document.getElementById('status').textContent = message;
}

function formatHTML() {
    const input = document.getElementById('htmlInput');
    const source = input.value;

    if (!source.trim()) {
        setStatus('Paste HTML code before formatting.');
        return;
    }

    const result = transformHTML(source, 'format');

    input.value = result.value;

    setStatus(
        result.changes
            ? 'Formatted ' + result.changes +
              ' block-tag spacing gaps. Review the result before publishing.'
            : 'No additional block-tag line breaks were needed.'
    );
}

function minifyHTML() {
    const input = document.getElementById('htmlInput');
    const source = input.value;

    if (!source.trim()) {
        setStatus('Paste HTML code before minifying.');
        return;
    }

    const result = transformHTML(source, 'minify');

    input.value = result.value;

    setStatus(
        result.changes
            ? 'Removed ' + result.changes +
              ' whitespace-only block-tag gaps.'
            : 'No removable block-tag whitespace was found.'
    );
}

async function copyHTML() {
    const text = document.getElementById('htmlInput').value;

    if (!text.trim()) {
        setStatus('Paste HTML code before copying.');
        return;
    }

    try {
        if (
            !window.FTOSafety ||
            typeof window.FTOSafety.copyText !== 'function'
        ) {
            throw new Error('Copy service is unavailable.');
        }

        await window.FTOSafety.copyText(text);

        setStatus('HTML copied successfully.');
    } catch (error) {
        setStatus(
            'Copy failed: ' +
            (error.message || 'Please try again.')
        );
    }
}

function clearHTML() {
    document.getElementById('htmlInput').value = '';
    setStatus('HTML input and results cleared.');
}

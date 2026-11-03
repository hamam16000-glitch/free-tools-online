
'use strict';

// Recognize LF, CRLF and CR line endings.
// Do not change the original textarea content.
function getLines() {
    const text =
        document.getElementById('text').value;

    return text === ''
        ? []
        : text.split(/\r\n|\n|\r/);
}

function resetSorterFeedback() {
    const box =
        document.getElementById('copySuccess');

    clearTimeout(window.textSorterCopyTimer);

    if (box) {
        box.style.display = 'none';
        box.style.color = '';
        box.style.backgroundColor = '';
        box.textContent = '';
    }
}

function invalidateSortedResult() {
    window.textSorterRevision =
        (window.textSorterRevision || 0) + 1;

    document.getElementById('result').value = '';

    resetSorterFeedback();
}

function displaySortedResult(lines) {
    invalidateSortedResult();

    document.getElementById('result').value =
        lines.join('\n');
}

// Locale-aware, lexicographic sorting.
function sortAZ() {
    displaySortedResult(
        getLines().sort(
            (a, b) => a.localeCompare(b)
        )
    );
}

function sortZA() {
    displaySortedResult(
        getLines().sort(
            (a, b) => b.localeCompare(a)
        )
    );
}

// Remove empty and whitespace-only lines.
// Preserve whitespace in remaining lines.
function removeEmpty() {
    displaySortedResult(
        getLines().filter(
            line => line.trim() !== ''
        )
    );
}

function countLines() {
    invalidateSortedResult();

    document.getElementById('info').textContent =
        'Lines: ' + getLines().length;
}

function showSorterFeedback(message, failed) {
    const box =
        document.getElementById('copySuccess');

    if (!box) return;

    clearTimeout(window.textSorterCopyTimer);

    box.textContent = message;
    box.style.display = 'block';

    box.style.color =
        failed ? '#b91c1c' : '';

    box.style.backgroundColor =
        failed ? '#fef2f2' : '';

    if (!failed) {
        const revision =
            window.textSorterRevision || 0;

        window.textSorterCopyTimer = setTimeout(
            () => {
                if (
                    revision ===
                    (window.textSorterRevision || 0)
                ) {
                    box.style.display = 'none';
                }
            },
            3000
        );
    }
}

async function copyResult() {
    const result =
        document.getElementById('result');

    const text = result.value;

    const revision =
        window.textSorterRevision || 0;

    if (text === '') {
        showSorterFeedback(
            'Generate a result before copying.',
            true
        );
        return;
    }

    try {
        if (
            !window.FTOSafety ||
            typeof window.FTOSafety.copyText !==
                'function'
        ) {
            throw new Error(
                'Clipboard service unavailable'
            );
        }

        const copied =
            await window.FTOSafety.copyText(text);

        if (copied === false) {
            throw new Error(
                'Copy was not confirmed'
            );
        }

        if (
            revision !==
                (window.textSorterRevision || 0) ||
            result.value !== text
        ) {
            return;
        }

        showSorterFeedback(
            'Result copied successfully.',
            false
        );

    } catch (error) {
        if (
            revision !==
                (window.textSorterRevision || 0) ||
            result.value !== text
        ) {
            return;
        }

        showSorterFeedback(
            'Copy failed. Select and copy the result manually.',
            true
        );
    }
}

function clearText() {
    document.getElementById('text').value = '';
    countLines();
}

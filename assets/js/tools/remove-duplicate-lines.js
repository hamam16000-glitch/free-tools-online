
'use strict';

// Normalize line separators, not line contents.
function duplicateLines(text) {
    return text === ''
        ? []
        : text.split(/\r\n|\n|\r/);
}

function resetDuplicateFeedback() {
    const box =
        document.getElementById('copySuccess');

    clearTimeout(window.duplicateCopyTimer);

    if (box) {
        box.style.display = 'none';
        box.style.color = '';
        box.style.backgroundColor = '';
        box.textContent = '';
    }
}

function invalidateDuplicateOutput() {
    window.duplicateResultRevision =
        (window.duplicateResultRevision || 0) + 1;

    document.getElementById('result').value = '';

    resetDuplicateFeedback();
}

function removeDuplicates() {
    const text =
        document.getElementById('text').value;

    const lines = duplicateLines(text);

    const unique = [...new Set(lines)];

    invalidateDuplicateOutput();

    document.getElementById('result').value =
        unique.join('\n');

    document.getElementById('info').innerHTML =
        'Original Lines: ' + lines.length +
        '<br>Unique Lines: ' + unique.length +
        '<br>Removed Lines: ' +
        (lines.length - unique.length);
}

function countLines() {
    const text =
        document.getElementById('text').value;

    const count = duplicateLines(text).length;

    invalidateDuplicateOutput();

    document.getElementById('info').textContent =
        'Original Lines: ' + count;
}

function showDuplicateFeedback(message, failed) {
    const box =
        document.getElementById('copySuccess');

    if (!box) return;

    clearTimeout(window.duplicateCopyTimer);

    box.textContent = message;
    box.style.display = 'block';

    box.style.color =
        failed ? '#b91c1c' : '';

    box.style.backgroundColor =
        failed ? '#fef2f2' : '';

    if (!failed) {
        const revision =
            window.duplicateResultRevision || 0;

        window.duplicateCopyTimer = setTimeout(() => {
            if (
                revision ===
                (window.duplicateResultRevision || 0)
            ) {
                box.style.display = 'none';
            }
        }, 3000);
    }
}

async function copyResult() {
    const result =
        document.getElementById('result');

    const text = result.value;

    const revision =
        window.duplicateResultRevision || 0;

    if (text === '') {
        showDuplicateFeedback(
            'Remove duplicates to create a result before copying.',
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
                'Clipboard helper unavailable'
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
                (window.duplicateResultRevision || 0) ||
            result.value !== text
        ) {
            return;
        }

        showDuplicateFeedback(
            'Result copied successfully.',
            false
        );

    } catch (error) {
        if (
            revision !==
                (window.duplicateResultRevision || 0) ||
            result.value !== text
        ) {
            return;
        }

        showDuplicateFeedback(
            'Copy failed. Select and copy the result manually.',
            true
        );
    }
}

function clearText() {
    document.getElementById('text').value = '';

    invalidateDuplicateOutput();

    document.getElementById('info').textContent =
        'Original Lines: 0';
}

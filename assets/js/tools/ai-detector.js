'use strict';

const MAX_TEXT_LENGTH = 50000;

let lastReport = '';
let messageTimer = null;

function extractWords(text) {
    return String(text).normalize('NFKC').match(
        /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu
    ) || [];
}

function buildAnalysis(text) {
    const words = extractWords(text);
    const frequencies = new Map();

    for (const word of words) {
        const key = word.toLowerCase();

        if (!frequencies.has(key)) {
            frequencies.set(key, {
                word,
                count: 0
            });
        }

        frequencies.get(key).count++;
    }

    const uniqueWords = frequencies.size;

    const lexicalDiversity = words.length
        ? uniqueWords / words.length * 100
        : 0;

    const sentenceParts = String(text)
        .normalize('NFKC')
        .split(/[.!?؟。！？]+/u)
        .filter(part => extractWords(part).length > 0);

    const sentenceCount = sentenceParts.length ||
        (words.length ? 1 : 0);

    const averageWordsPerSentence = sentenceCount
        ? words.length / sentenceCount
        : 0;

    const topRepeatedWords = Array.from(frequencies.values())
        .filter(item => item.count > 1)
        .sort((a, b) =>
            b.count - a.count ||
            a.word.localeCompare(b.word)
        )
        .slice(0, 5);

    return {
        wordCount: words.length,
        characterCount: Array.from(String(text)).length,
        sentenceCount,
        uniqueWords,
        lexicalDiversity,
        averageWordsPerSentence,
        repeatedWords: words.length - uniqueWords,
        topRepeatedWords
    };
}

function createReport(stats) {
    const repeated = stats.topRepeatedWords.length
        ? stats.topRepeatedWords.map(item =>
            item.word + ' (' + item.count + ')'
        ).join(', ')
        : 'No word appeared more than once.';

    return [
        'WRITING PATTERN ANALYSIS REPORT',
        '================================',
        '',
        'Word count: ' + stats.wordCount,
        'Character count: ' + stats.characterCount,
        'Estimated sentence count: ' + stats.sentenceCount,
        'Unique words: ' + stats.uniqueWords,
        'Repeated word occurrences: ' + stats.repeatedWords,
        'Lexical diversity: ' + stats.lexicalDiversity.toFixed(1) + '%',
        'Average words per sentence: ' +
            stats.averageWordsPerSentence.toFixed(1),
        '',
        'Most repeated words:',
        repeated,
        '',
        'METHOD:',
        'Words are extracted using Unicode letters, combining marks and numbers.',
        'Sentence boundaries are estimated using common punctuation.',
        '',
        'IMPORTANT LIMITATION:',
        'This report measures text statistics only.',
        'It cannot determine whether text was written by a human or AI.',
        'It is not an authorship probability or plagiarism assessment.'
    ].join('\n');
}

function showMessage(message, type) {
    const box = document.getElementById('success');

    if (!box) return;

    box.textContent = String(message);

    box.className = 'success' +
        (type === 'error' ? ' success-error' : '');

    box.style.display = 'block';

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {
        box.style.display = 'none';
        box.className = 'success';
    }, 3500);
}

function resetAnalysisResults() {
    document.getElementById('result').style.display = 'none';

    document.getElementById('wordCount').textContent = '0 Words';
    document.getElementById('charCount').textContent = '0 Characters';
    document.getElementById('sentenceCount').textContent = '0 Sentences';

    document.getElementById('diversityValue').textContent = '0%';

    document.getElementById('levelText').textContent =
        'Lexical diversity: unique words divided by total words.';

    document.getElementById('details').textContent = '';

    document.getElementById('copyReportButton').disabled = true;
    document.getElementById('downloadReportButton').disabled = true;

    lastReport = '';
}

function analyzeText() {
    resetAnalysisResults();

    const input = document.getElementById('inputText');
    const text = input.value;

    if (!text.trim()) {
        showMessage(
            'Enter text before starting the analysis.',
            'error'
        );
        return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
        showMessage(
            'Maximum supported length is 50,000 characters.',
            'error'
        );
        return;
    }

    const stats = buildAnalysis(text);

    if (!stats.wordCount) {
        showMessage(
            'No recognizable words were found. Enter Arabic or English text.',
            'error'
        );
        return;
    }

    document.getElementById('wordCount').textContent =
        stats.wordCount + ' Words';

    document.getElementById('charCount').textContent =
        stats.characterCount + ' Characters';

    document.getElementById('sentenceCount').textContent =
        stats.sentenceCount + ' Sentences';

    document.getElementById('diversityValue').textContent =
        stats.lexicalDiversity.toFixed(1) + '%';

    document.getElementById('levelText').textContent =
        'Lexical diversity: unique words divided by total words.';

    const repeated = stats.topRepeatedWords.length
        ? stats.topRepeatedWords.map(item =>
            item.word + ' (' + item.count + ')'
        ).join(', ')
        : 'No repeated words found.';

    document.getElementById('details').textContent = [
        'Unique words: ' + stats.uniqueWords,
        'Repeated word occurrences: ' + stats.repeatedWords,
        'Average words per sentence: ' +
            stats.averageWordsPerSentence.toFixed(1),
        '',
        'Most repeated words:',
        repeated
    ].join('\n');

    document.getElementById('result').style.display = 'block';

    lastReport = createReport(stats);

    document.getElementById('copyReportButton').disabled = false;
    document.getElementById('downloadReportButton').disabled = false;

    showMessage('Text statistics calculated successfully.');
}

async function copyReport() {
    if (!lastReport) {
        showMessage(
            'Analyze text before copying the report.',
            'error'
        );
        return;
    }

    try {
        if (
            !window.FTOSafety ||
            typeof window.FTOSafety.copyText !== 'function'
        ) {
            throw new Error('Copy service is unavailable.');
        }

        await window.FTOSafety.copyText(lastReport);

        showMessage('Analysis report copied successfully.');

    } catch (error) {
        showMessage(
            'Copy failed: ' +
            (error.message || 'Please try again.'),
            'error'
        );
    }
}

function downloadReport() {
    if (!lastReport) {
        showMessage(
            'Analyze text before downloading the report.',
            'error'
        );
        return;
    }

    try {
        if (
            !window.FTOSafety ||
            typeof window.FTOSafety.downloadBlob !== 'function'
        ) {
            throw new Error('Download service is unavailable.');
        }

        const blob = new Blob(
            [lastReport],
            { type: 'text/plain;charset=utf-8' }
        );

        window.FTOSafety.downloadBlob(
            blob,
            'writing-pattern-report.txt'
        );

        showMessage('Analysis report download requested.');

    } catch (error) {
        showMessage(
            'Download failed: ' +
            (error.message || 'Please try again.'),
            'error'
        );
    }
}

function clearText() {
    document.getElementById('inputText').value = '';

    resetAnalysisResults();

    showMessage('Text and analysis results cleared.');
}


const inputElement = document.getElementById('inputText');

if (inputElement) {
    inputElement.addEventListener('input', () => {
        const hadReport = Boolean(lastReport);

        resetAnalysisResults();

        if (hadReport) {
            showMessage(
                'Text changed. Analyze again to update the report.'
            );
        }
    });
}

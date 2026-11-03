'use strict';

let tagMessageTimer = null;

function showMessage(message) {
    const box = document.getElementById('success');

    if (!box) return;

    box.textContent = String(message);
    box.style.display = 'block';

    clearTimeout(tagMessageTimer);

    tagMessageTimer = setTimeout(() => {
        box.style.display = 'none';
    }, 3500);
}

function cleanTag(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/[,،;\r\n]+/g, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
}

function countCharacters(text) {
    return Array.from(text).length;
}

function generateTags() {
    const title = cleanTag(
        document.getElementById('title').value
    );

    const keywordsInput = document.getElementById('keywords').value;

    const category = cleanTag(
        document.getElementById('category').value
    );

    const output = document.getElementById('output');
    const hashtagsBox = document.getElementById('hashtags');

    const tagCount = document.getElementById('tagCount');
    const charCount = document.getElementById('charCount');

    const keywords = keywordsInput
        .split(/[,،;\n]+/u)
        .map(cleanTag)
        .filter(Boolean);

    output.value = '';
    hashtagsBox.textContent = '';

    if (!title && !keywords.length) {
        tagCount.textContent = '0 Tags';
        charCount.textContent = '0 / 500 Characters';

        showMessage('Enter your video title or main keywords.');
        return;
    }

    const titleWords = title
        ? title.split(/\s+/u)
        : [];

    const candidates = [
        title,
        ...keywords,
        category,
        ...titleWords
    ];

    const tags = [];
    const used = new Set();

    let finalOutput = '';

    for (const candidate of candidates) {
        const tag = cleanTag(candidate);

        if (!tag || !/[\p{L}\p{N}]/u.test(tag)) {
            continue;
        }

        const key = tag.toLowerCase();

        if (used.has(key)) {
            continue;
        }

        const nextOutput = finalOutput
            ? finalOutput + ', ' + tag
            : tag;

        if (countCharacters(nextOutput) > 500) {
            continue;
        }

        tags.push(tag);
        used.add(key);
        finalOutput = nextOutput;
    }

    output.value = finalOutput;

    const actualCount = countCharacters(finalOutput);

    tagCount.textContent = tags.length + ' Tags';

    charCount.textContent =
        actualCount + ' / 500 Characters';

    const hashtagCandidates = [
        ...keywords,
        ...titleWords,
        category
    ];

    const hashtags = [];
    const hashtagSet = new Set();

    for (const candidate of hashtagCandidates) {
        const word = cleanTag(candidate)
            .replace(/[^\p{L}\p{N}_]/gu, '');

        if (!word || countCharacters(word) > 50) {
            continue;
        }

        const key = word.toLowerCase();

        if (hashtagSet.has(key)) {
            continue;
        }

        hashtags.push('#' + word);
        hashtagSet.add(key);

        if (hashtags.length === 3) {
            break;
        }
    }

    hashtagsBox.textContent = hashtags.join(' ');

    if (!tags.length) {
        showMessage(
            'No suggestions fit the 500-character limit. Try shorter keywords.'
        );
        return;
    }

    showMessage(
        'Generated ' + tags.length +
        ' suggestions within the 500-character limit. Review relevance before publishing.'
    );
}

async function copyTags() {
    const text = document.getElementById('output').value.trim();

    if (!text) {
        showMessage('Generate tags before copying.');
        return;
    }

    try {
        const safety = window.FTOSafety;

        if (!safety || typeof safety.copyText !== 'function') {
            throw Error('Copy service is unavailable.');
        }

        await safety.copyText(text);

        showMessage('Tags copied successfully.');
    } catch (error) {
        showMessage('Copy failed: ' + error.message);
    }
}

function downloadTags() {
    const text = document.getElementById('output').value.trim();

    if (!text) {
        showMessage('Generate tags before downloading.');
        return;
    }

    try {
        const safety = window.FTOSafety;

        if (!safety || typeof safety.downloadBlob !== 'function') {
            throw Error('Download service is unavailable.');
        }

        const blob = new Blob(
            [text],
            {type: 'text/plain;charset=utf-8'}
        );

        safety.downloadBlob(blob, 'youtube-tags.txt');

        showMessage('TXT file download requested.');
    } catch (error) {
        showMessage('Download failed: ' + error.message);
    }
}

function clearTags() {
    document.getElementById('title').value = '';

    document.getElementById('keywords').value = '';

    document.getElementById('category').value = '';

    document.getElementById('output').value = '';

    document.getElementById('hashtags').textContent = '';

    document.getElementById('tagCount').textContent = '0 Tags';

    document.getElementById('charCount').textContent =
        '0 / 500 Characters';

    showMessage('All fields cleared.');
}

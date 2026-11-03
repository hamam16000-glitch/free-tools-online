'use strict';

let hashtagMessageTimer = null;

function showMessage(message) {
    const box = document.getElementById('success');

    if (!box) return;

    box.textContent = String(message);
    box.style.display = 'block';

    clearTimeout(hashtagMessageTimer);

    hashtagMessageTimer = setTimeout(() => {
        box.style.display = 'none';
    }, 3500);
}

function normalizeTopic(value) {
    return String(value ?? '')
        .normalize('NFKC')
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\s+/gu, ' ')
        .trim()
        .slice(0, 2000);
}

function generateHashtags() {
    const topic = normalizeTopic(
        document.getElementById('topic').value
    );

    const platform = document.getElementById('platform').value;
    const amount = Number(
        document.getElementById('amount').value
    );

    const output = document.getElementById('output');
    const count = document.getElementById('count');

    output.textContent = '';
    output.style.display = 'none';
    count.textContent = '0 Hashtags';

    const validPlatforms = [
        'instagram',
        'tiktok',
        'youtube',
        'x'
    ];

    if (!/[\p{L}\p{N}]/u.test(topic)) {
        showMessage('Enter a topic containing letters or numbers.');
        return;
    }

    if (!validPlatforms.includes(platform) ||
        ![10, 20, 30].includes(amount)) {
        showMessage('Choose a valid platform and hashtag amount.');
        return;
    }

    const words = topic.match(/[\p{L}\p{N}]+/gu) || [];

    if (!words.length) {
        showMessage('No valid topic words were found.');
        return;
    }

    const compactTopic = words.join('');

    const phrases = [];

    for (let size = Math.min(words.length, 3); size >= 2; size--) {
        for (let i = 0; i <= words.length - size; i++) {
            phrases.push(words.slice(i, i + size).join(''));
        }
    }

    const bases = [
        compactTopic,
        ...words.slice(0, 12),
        ...phrases.slice(0, 12)
    ];

    const suffixes = [
        'Tips', 'Guide', 'Ideas', 'Basics', 'Examples',
        'Learning', 'Community', 'Resources', 'Projects',
        'HowTo', 'Tools', 'Practice', 'Explained',
        'Questions', 'Tutorial', 'Support', 'Daily',
        'Updates', 'Inspiration', 'Skills', 'Discussion',
        'Stories', 'Review', 'Checklist', 'Methods',
        'Advice', 'Insights', 'Planning', 'News', 'Trends'
    ];

    const candidates = [...bases];

    for (const base of bases) {
        for (const suffix of suffixes) {
            candidates.push(base + suffix);
        }
    }

    const tags = [];
    const used = new Set();

    for (const candidate of candidates) {
        const tag = String(candidate)
            .replace(/[^\p{L}\p{N}_]/gu, '');

        if (!tag || !/[\p{L}\p{N}]/u.test(tag)) {
            continue;
        }

        if (Array.from(tag).length > 100) {
            continue;
        }

        const key = tag.toLowerCase();

        if (used.has(key)) {
            continue;
        }

        used.add(key);
        tags.push('#' + tag);

        if (tags.length >= amount) {
            break;
        }
    }

    if (!tags.length) {
        showMessage('No suitable hashtags found. Try a shorter topic.');
        return;
    }

    output.textContent = tags.join(' ');
    output.style.display = 'block';

    count.textContent = tags.length + ' Hashtags';

    const platformNames = {
        instagram: 'Instagram',
        tiktok: 'TikTok',
        youtube: 'YouTube',
        x: 'X'
    };

    showMessage(
        'Generated ' + tags.length +
        ' topic-based suggestions for ' +
        platformNames[platform] +
        '. Live popularity is not measured.'
    );
}

async function copyHashtags() {
    const output = document.getElementById('output');
    const text = output.textContent.trim();

    if (!text) {
        showMessage('Generate hashtags before copying.');
        return;
    }

    try {
        const safety = window.FTOSafety;

        if (!safety || typeof safety.copyText !== 'function') {
            throw Error('Copy service is unavailable.');
        }

        await safety.copyText(text);

        showMessage('Hashtags copied successfully.');

    } catch (error) {
        showMessage('Copy failed: ' + error.message);
    }
}

function downloadHashtags() {
    const text = document.getElementById('output')
        .textContent.trim();

    if (!text) {
        showMessage('Generate hashtags before downloading.');
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

        safety.downloadBlob(blob, 'hashtags.txt');

        showMessage('Hashtag file download requested.');

    } catch (error) {
        showMessage('Download failed: ' + error.message);
    }
}

function clearHashtags() {
    document.getElementById('topic').value = '';
    document.getElementById('platform').value = 'instagram';
    document.getElementById('amount').value = '10';

    const output = document.getElementById('output');

    output.textContent = '';
    output.style.display = 'none';

    document.getElementById('count').textContent = '0 Hashtags';

    showMessage('All fields and results cleared.');
}

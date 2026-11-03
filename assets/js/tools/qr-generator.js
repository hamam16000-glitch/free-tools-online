'use strict';

let finalQRData = '';
let qrPayload = '';
let qrRevision = 0;

function showMessage(message) {
    const box = document.getElementById('success');

    box.textContent = String(message);
    box.style.display = 'block';

    clearTimeout(window.qrMessageTimer);

    window.qrMessageTimer = setTimeout(() => {
        box.style.display = 'none';
    }, 4000);
}

function invalidateQR() {
    qrRevision++;
    finalQRData = '';
    qrPayload = '';

    const image = document.getElementById('qrImage');

    image.removeAttribute('src');
    image.style.display = 'none';
}

function changeType() {
    invalidateQR();

    const type = document.getElementById('type').value;
    const box = document.getElementById('fields');

    const definitions = {
        url: [
            ['mainInput', 'Website URL', 'url', 'https://example.com']
        ],
        text: [
            ['mainInput', 'Text', 'textarea', 'Enter your text here']
        ],
        wifi: [
            ['wifiName', 'WiFi network name', 'text', 'Network name'],
            ['wifiPass', 'WiFi password', 'password', 'Password']
        ],
        email: [
            ['email', 'Email address', 'email', 'name@example.com'],
            ['subject', 'Email subject', 'text', 'Optional subject']
        ],
        phone: [
            ['phone', 'Phone number', 'tel', '+201000000000']
        ],
        vcard: [
            ['name', 'Full name', 'text', 'Contact name'],
            ['vphone', 'Phone number', 'tel', '+201000000000'],
            ['vemail', 'Email address', 'email', 'name@example.com']
        ]
    };

    if (!definitions[type]) {
        box.replaceChildren();
        showMessage('Select a valid QR type.');
        return;
    }

    box.replaceChildren();

    for (const [id, title, fieldType, placeholder] of definitions[type]) {
        const label = document.createElement('label');
        const field = document.createElement(
            fieldType === 'textarea' ? 'textarea' : 'input'
        );

        label.htmlFor = id;
        label.textContent = title;

        field.id = id;
        field.placeholder = placeholder;
        field.autocomplete = 'off';

        if (fieldType === 'textarea') {
            field.rows = 4;
            field.maxLength = 2000;
        } else {
            field.type = fieldType;
        }

        box.append(label, field);
    }

    if (type === 'wifi') {
        const label = document.createElement('label');
        const select = document.createElement('select');

        label.htmlFor = 'wifiSecurity';
        label.textContent = 'WiFi Security';

        select.id = 'wifiSecurity';

        for (const [value, title] of [
            ['WPA', 'WPA/WPA2'],
            ['WEP', 'WEP'],
            ['nopass', 'No password']
        ]) {
            const option = document.createElement('option');

            option.value = value;
            option.textContent = title;

            select.append(option);
        }

        box.append(label, select);
    }
}

function getValue(id) {
    return document.getElementById(id)?.value ?? '';
}

function validEmail(email) {
    return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/u.test(email);
}

function validatePhone(phone) {
    const normalized = String(phone).replace(/[()\s-]/g, '');

    if (!/^\+?\d{3,20}$/.test(normalized)) {
        throw Error('Enter a valid phone number.');
    }

    return normalized;
}

function escapeWiFi(value) {
    return String(value).replace(
        /[\\;,:"]/g,
        character => "\\" + character
    );
}

function escapeVCard(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/\r\n|\r|\n/g, '\\n')
        .replace(/([;,])/g, '\\$1');
}

function luminance(hex) {
    if (!/^#[a-f0-9]{6}$/i.test(hex)) {
        throw Error('Choose valid QR colors.');
    }

    const channels = [1, 3, 5].map(index => {
        const value = parseInt(hex.slice(index, index + 2), 16) / 255;

        return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    });

    return channels[0] * 0.2126
        + channels[1] * 0.7152
        + channels[2] * 0.0722;
}

async function generateQR() {
    invalidateQR();
    const revision = qrRevision;

    try {
        const type = getValue('type');
        let data = '';

        if (type === 'url') {
            const url = new URL(getValue('mainInput'));

            if (
                !['http:', 'https:'].includes(url.protocol) ||
                url.username ||
                url.password
            ) {
                throw Error('Enter a public HTTP(S) URL.');
            }

            data = url.href;

        } else if (type === 'text') {
            data = getValue('mainInput');

        } else if (type === 'wifi') {
            const name = getValue('wifiName');
            const password = getValue('wifiPass');
            const security = getValue('wifiSecurity');

            if (!name.trim()) {
                throw Error('Enter the WiFi network name.');
            }

            if (/[\u0000-\u001f\u007f]/u.test(name)) {
                throw Error('WiFi name contains unsupported characters.');
            }

            if (new TextEncoder().encode(name).length > 32) {
                throw Error('WiFi network name exceeds 32 UTF-8 bytes.');
            }

            if (!['WPA', 'WEP', 'nopass'].includes(security)) {
                throw Error('Choose a valid WiFi security type.');
            }

            if (security === 'WPA') {
                const bytes = new TextEncoder().encode(password).length;

                if (
                    !/^[a-f0-9]{64}$/i.test(password) &&
                    (bytes < 8 || bytes > 63)
                ) {
                    throw Error('WPA password must contain 8–63 bytes or 64 hexadecimal characters.');
                }
            }

            if (security === 'WEP') {
                if (!/^(?:[\x20-\x7e]{5}|[\x20-\x7e]{13}|[a-f0-9]{10}|[a-f0-9]{26})$/i.test(password)) {
                    throw Error('Enter a valid WEP key.');
                }
            }

            if (/[\r\n\u0000-\u001f\u007f]/u.test(password)) {
                throw Error('WiFi password contains unsupported characters.');
            }

            data =
                'WIFI:T:' + security +
                ';S:' + escapeWiFi(name) +
                ';P:' + escapeWiFi(security === 'nopass' ? '' : password) +
                ';;';

        } else if (type === 'email') {
            const email = getValue('email').trim();
            const subject = getValue('subject');

            if (!validEmail(email)) {
                throw Error('Enter a valid email address.');
            }

            data = 'mailto:' + email;

            if (subject) {
                data += '?subject=' + encodeURIComponent(subject);
            }

        } else if (type === 'phone') {
            data = 'tel:' + validatePhone(getValue('phone'));

        } else if (type === 'vcard') {
            const name = getValue('name').trim();
            const phone = getValue('vphone').trim();
            const email = getValue('vemail').trim();

            if (!name) {
                throw Error('Enter a contact name.');
            }

            const lines = [
                'BEGIN:VCARD',
                'VERSION:3.0',
                'FN:' + escapeVCard(name)
            ];

            if (phone) {
                lines.push('TEL;TYPE=CELL:' + escapeVCard(validatePhone(phone)));
            }

            if (email) {
                if (!validEmail(email)) {
                    throw Error('Enter a valid contact email.');
                }

                lines.push('EMAIL:' + escapeVCard(email));
            }

            lines.push('END:VCARD');

            data = lines.join('\r\n');

        } else {
            throw Error('Choose a valid QR content type.');
        }

        if (!data.trim()) {
            throw Error('Enter QR content first.');
        }

        const size = Number(getValue('size'));

        if (![300, 500, 800].includes(size)) {
            throw Error('Choose a supported QR size.');
        }

        const color = getValue('qrColor');
        const background = getValue('bgColor');

        const foregroundLum = luminance(color);
        const backgroundLum = luminance(background);

        if (foregroundLum >= backgroundLum) {
            throw Error('Use a darker QR color and a lighter background.');
        }

        const contrast = (backgroundLum + 0.05) /
            (foregroundLum + 0.05);

        if (contrast < 4.5) {
            throw Error('Increase the contrast between QR and background colors.');
        }

        const logoInput = document.getElementById('logoInput');
        const logo = logoInput.files?.[0];

        if (logo) {
            if (!['image/png', 'image/jpeg', 'image/webp'].includes(logo.type)) {
                throw Error('Choose a PNG, JPEG or WebP logo.');
            }

            if (logo.size > 2 * 1024 * 1024) {
                throw Error('Logo must be 2 MB or smaller.');
            }
        }

        const correction = getValue('correction');

        if (!['L', 'M', 'Q', 'H'].includes(correction)) {
            throw Error('Choose a valid error correction level.');
        }

        if (typeof qrcode !== 'function') {
            throw Error('QR library could not load. Reload the page.');
        }

        if (typeof TextEncoder !== 'function') {
            throw Error('UTF-8 encoding is unavailable in this browser.');
        }

        qrcode.stringToBytes = text =>
            Array.from(new TextEncoder().encode(text));

        const qr = qrcode(0, logo ? 'H' : correction);

        qr.addData(data, 'Byte');
        qr.make();

        const count = qr.getModuleCount();
        const moduleSize = Math.floor(size / (count + 8));

        if (moduleSize < 2) {
            throw Error('Too much content. Use shorter text or a larger QR.');
        }

        const canvas = document.createElement('canvas');

        canvas.width = size;
        canvas.height = size;

        const context = canvas.getContext('2d');

        if (!context) {
            throw Error('Canvas is unavailable in this browser.');
        }

        context.imageSmoothingEnabled = false;
        context.fillStyle = background;
        context.fillRect(0, 0, size, size);

        context.fillStyle = color;

        const offset = Math.floor((size - count * moduleSize) / 2);

        for (let y = 0; y < count; y++) {
            for (let x = 0; x < count; x++) {
                if (qr.isDark(y, x)) {
                    context.fillRect(
                        offset + x * moduleSize,
                        offset + y * moduleSize,
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }

        if (logo) {
            const image = await window.FTOSafety.loadImage(logo);

            if (revision !== qrRevision) {
                return;
            }

            const logoSize = Math.floor(count * moduleSize * 0.13);

            const factor = logoSize / Math.max(
                image.naturalWidth || image.width,
                image.naturalHeight || image.height
            );

            const width = image.width * factor;
            const height = image.height * factor;

            const padding = Math.max(4, moduleSize * 2);
            const plateSize = logoSize + padding * 2;

            context.fillStyle = background;

            context.fillRect(
                (size - plateSize) / 2,
                (size - plateSize) / 2,
                plateSize,
                plateSize
            );

            context.drawImage(
                image,
                (size - width) / 2,
                (size - height) / 2,
                width,
                height
            );
        }

        finalQRData = canvas.toDataURL('image/png');

        if (!finalQRData.startsWith('data:image/png')) {
            throw Error('Could not export the QR image.');
        }

        qrPayload = data;

        const preview = document.getElementById('qrImage');

        preview.src = finalQRData;
        preview.alt = 'Generated QR code containing ' + type + ' data.';
        preview.style.display = 'inline-block';

        showMessage('QR generated locally. Scan-test before sharing.');

    } catch (error) {
        if (revision !== qrRevision) {
            return;
        }

        invalidateQR();

        showMessage(
            'Cannot generate QR: ' +
            (error.message || 'Unknown error.')
        );
    }
}

function downloadQR() {
    if (!finalQRData) {
        showMessage('Generate the current QR first.');
        return;
    }

    try {
        const link = document.createElement('a');

        link.href = finalQRData;
        link.download = 'qr-code.png';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        link.remove();

        showMessage('QR PNG download started.');

    } catch (error) {
        showMessage('Download failed. Try again.');
    }
}

async function copyQR() {
    if (!finalQRData) {
        showMessage('Generate the current QR first.');
        return;
    }

    try {
        const ClipboardItemClass =
            window.ClipboardItem ||
            (typeof ClipboardItem !== 'undefined' ? ClipboardItem : null);

        if (
            navigator.clipboard &&
            typeof navigator.clipboard.write === 'function' &&
            ClipboardItemClass
        ) {
            const response = await fetch(finalQRData);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItemClass({'image/png': blob})
            ]);

            showMessage('QR image copied successfully.');

        } else {
            await window.FTOSafety.copyText(qrPayload);

            showMessage('QR content copied as text. Image copying is unavailable.');
        }

    } catch (error) {
        showMessage('Copy failed. Download the PNG instead.');
    }
}

function clearQR() {
    document.getElementById('type').value = 'url';

    changeType();

    document.getElementById('size').value = '300';
    document.getElementById('qrColor').value = '#000000';
    document.getElementById('bgColor').value = '#ffffff';
    document.getElementById('correction').value = 'M';
    document.getElementById('logoInput').value = '';

    invalidateQR();

    showMessage('QR form and result cleared.');
}

function invalidateOnEdit(event) {
    const target = event.target;

    if (
        target &&
        typeof target.matches === 'function' &&
        target.matches(
            '#fields input, #fields textarea, #fields select, #size, #qrColor, #bgColor, #correction, #logoInput'
        )
    ) {
        invalidateQR();
    }
}

document.addEventListener('input', invalidateOnEdit);
document.addEventListener('change', invalidateOnEdit);

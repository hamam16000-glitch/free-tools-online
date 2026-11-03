function escapeMetaHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function normalizeMetaURL(value, label) {
    if (!value) return "";

    let url;

    try {
        url = new URL(value);
    } catch {
        throw new Error("Enter a valid " + label + " URL.");
    }

    if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
    ) {
        throw new Error(label + " must be a public HTTP(S) URL.");
    }

    return url.href;
}

function resetMetaResults() {
    ["output", "preview", "googlePreview", "seoScore"].forEach(id => {
        const element = document.getElementById(id);
        element.textContent = "";
        element.style.display = "none";
    });
}

function addMetaText(parent, tag, value) {
    const element = document.createElement(tag);
    element.textContent = value;
    parent.appendChild(element);
    return element;
}

function generateMeta() {

    resetMetaResults();

    const title = document.getElementById("title").value
        .replace(/\s+/g, " ").trim();

    const description = document.getElementById("description").value
        .replace(/\s+/g, " ").trim();

    const keywords = document.getElementById("keywords").value.trim();
    const author = document.getElementById("author").value.trim();

    const rawURL = document.getElementById("url").value.trim();
    const rawOGImage = document.getElementById("ogImage").value.trim();
    const rawTwitterImage = document.getElementById("twitterImage").value.trim();

    const rawLanguage =
        document.getElementById("language").value.trim() || "en";

    const themeColor =
        document.getElementById("themeColor").value.trim() || "#2563eb";

    const robots = document.getElementById("robots").value;

    try {

        if (!title || !description) {
            throw new Error("Enter both page title and meta description.");
        }

        const canonical = normalizeMetaURL(rawURL, "Canonical");
        const ogImage = normalizeMetaURL(rawOGImage, "Open Graph image");
        const twitterImage = normalizeMetaURL(
            rawTwitterImage,
            "Twitter image"
        );

        let language;

        try {
            const locales = Intl.getCanonicalLocales(rawLanguage);

            if (locales.length !== 1) throw new Error();

            language = locales[0];

        } catch {
            throw new Error("Enter a valid language code, such as en or en-US.");
        }

        if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(themeColor)) {
            throw new Error("Theme color must be a valid hexadecimal color.");
        }

        if (!["index, follow", "noindex, nofollow"].includes(robots)) {
            throw new Error("Select a valid robots directive.");
        }

        const e = escapeMetaHTML;

        const lines = [
            "<!-- Basic SEO Metadata -->",
            "<title>" + e(title) + "</title>",
            '<meta name="description" content="' + e(description) + '">'
        ];

        if (keywords) {
            lines.push(
                '<meta name="keywords" content="' + e(keywords) + '">'
            );
        }

        if (author) {
            lines.push(
                '<meta name="author" content="' + e(author) + '">'
            );
        }

        lines.push(
            '<meta name="robots" content="' + robots + '">',
            '<meta name="language" content="' + e(language) + '">',
            '<meta name="theme-color" content="' + themeColor + '">'
        );

        if (canonical) {
            lines.push(
                '<link rel="canonical" href="' + e(canonical) + '">'
            );
        }

        lines.push(
            "",
            "<!-- Open Graph Metadata -->",
            '<meta property="og:title" content="' + e(title) + '">',
            '<meta property="og:description" content="' + e(description) + '">',
            '<meta property="og:type" content="website">'
        );

        if (canonical) {
            lines.push(
                '<meta property="og:url" content="' + e(canonical) + '">'
            );
        }

        if (ogImage) {
            lines.push(
                '<meta property="og:image" content="' + e(ogImage) + '">'
            );
        }

        const socialImage = twitterImage || ogImage;

        lines.push(
            "",
            "<!-- Twitter Card Metadata -->",
            '<meta name="twitter:card" content="' +
                (socialImage ? "summary_large_image" : "summary") + '">',
            '<meta name="twitter:title" content="' + e(title) + '">',
            '<meta name="twitter:description" content="' + e(description) + '">'
        );

        if (socialImage) {
            lines.push(
                '<meta name="twitter:image" content="' + e(socialImage) + '">'
            );
        }

        const html = lines.join("\n") + "\n";

        const output = document.getElementById("output");
        output.textContent = html;
        output.style.display = "block";

        // Safe search preview: user input is inserted as text.
        const preview = document.getElementById("preview");

        addMetaText(preview, "h3", title);
        addMetaText(preview, "p", description);
        addMetaText(
            preview,
            "small",
            canonical || "Canonical URL not provided"
        );

        preview.style.display = "block";

        // Google-style illustrative preview.
        const google = document.getElementById("googlePreview");

        const googleTitle = addMetaText(google, "h3", title);
        googleTitle.style.color = "#1a0dab";

        const googleURL = addMetaText(
            google,
            "p",
            canonical || "Add a canonical URL"
        );
        googleURL.style.color = "#008000";

        addMetaText(google, "p", description);

        google.style.display = "block";

        // Length guidance.
        const titleLength = Array.from(title).length;
        const descriptionLength = Array.from(description).length;

        const score = document.getElementById("seoScore");

        addMetaText(score, "h3", "Length Guidelines");

        addMetaText(
            score,
            "p",
            "Title: " + titleLength + "/60 characters — " +
            (titleLength <= 60 ? "Within guideline." : "Exceeds guideline.")
        );

        addMetaText(
            score,
            "p",
            "Description: " + descriptionLength + "/160 characters — " +
            (descriptionLength <= 160 ? "Within guideline." : "Exceeds guideline.")
        );

        addMetaText(
            score,
            "p",
            "These are approximate display guidelines, not ranking guarantees."
        );

        score.style.display = "block";

        showMessage("Meta tags generated successfully.");

    } catch (error) {

        resetMetaResults();
        showMessage(error.message || "Unable to generate metadata.");
    }
}

async function copyMeta() {

    const text = document.getElementById("output").textContent;

    if (!text.trim()) {
        showMessage("Generate Meta Tags before copying.");
        return;
    }

    try {
        await window.FTOSafety.copyText(text);
        showMessage("Meta HTML copied successfully.");

    } catch (error) {
        showMessage(error.message || "Copy failed.");
    }
}

function downloadMeta() {

    const text = document.getElementById("output").textContent;

    if (!text.trim()) {
        showMessage("Generate Meta Tags before downloading.");
        return;
    }

    let objectURL = "";

    try {

        const blob = new Blob(
            [text],
            {type: "text/html;charset=utf-8"}
        );

        objectURL = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = objectURL;
        link.download = "meta-tags.html";
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(objectURL), 1000);

        showMessage("meta-tags.html download started.");

    } catch (error) {

        if (objectURL) URL.revokeObjectURL(objectURL);

        showMessage(error.message || "Download failed.");
    }
}

function clearMeta() {

    document.querySelectorAll("input, textarea").forEach(element => {
        element.value = "";
    });

    document.getElementById("robots").value = "index, follow";

    resetMetaResults();

    showMessage("All fields and results cleared.");
}

function showMessage(text) {

    const box = document.getElementById("success");

    box.textContent = text;
    box.style.display = "block";

    clearTimeout(window.metaMessageTimer);

    window.metaMessageTimer = setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}

const SITEMAP_MAX_URLS = 50000;
const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
const SITEMAP_MAX_LOC_LENGTH = 2048;

const SITEMAP_FREQUENCIES = [
    "always",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
    "never"
];

function xmlEscape(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function resetSitemapOutput() {
    const output = document.getElementById("output");
    const count = document.getElementById("pageCount");

    output.textContent = "";
    output.style.display = "none";
    count.textContent = "0 Pages";
}

function generateSitemap() {

    const baseText =
        document.getElementById("siteUrl").value.trim();

    const pagesText =
        document.getElementById("pages").value.trim();

    const frequency =
        document.getElementById("frequency").value;

    resetSitemapOutput();

    if (!baseText || !pagesText) {
        showMessage("Enter your website URL and at least one page.");
        return;
    }

    try {

        const base = new URL(baseText);

        if (
            !["http:", "https:"].includes(base.protocol) ||
            base.username ||
            base.password
        ) {
            throw new Error(
                "Use a valid public HTTP or HTTPS website URL."
            );
        }

        if (base.search || base.hash) {
            throw new Error(
                "The website base URL must not contain a query or fragment."
            );
        }

        if (!SITEMAP_FREQUENCIES.includes(frequency)) {
            throw new Error("Select a valid change frequency.");
        }

        if (!base.pathname.endsWith("/")) {
            base.pathname += "/";
        }

        const lines = pagesText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        if (!lines.length) {
            throw new Error("Enter at least one page URL.");
        }

        const unique = new Set();
        const urls = [];

        for (const page of lines) {

            if (page.startsWith("//") || page.startsWith("#")) {
                throw new Error(
                    "Enter a valid page path or complete URL."
                );
            }

            const url = new URL(page, base.href);

            if (
                !["http:", "https:"].includes(url.protocol) ||
                url.username ||
                url.password
            ) {
                throw new Error("Invalid or unsafe page URL.");
            }

            if (url.origin !== base.origin) {
                throw new Error(
                    "Every page must belong to the same website and protocol."
                );
            }

            url.hash = "";

            const address = url.href;

            if (address.length > SITEMAP_MAX_LOC_LENGTH) {
                throw new Error(
                    "A page URL exceeds the 2048-character sitemap limit."
                );
            }

            if (!unique.has(address)) {

                unique.add(address);
                urls.push(address);

                if (urls.length > SITEMAP_MAX_URLS) {
                    throw new Error(
                        "Maximum 50,000 unique URLs per sitemap."
                    );
                }
            }
        }

        const entries = urls.map(url =>
            "  <url>\n" +
            "    <loc>" + xmlEscape(url) + "</loc>\n" +
            "    <changefreq>" + frequency + "</changefreq>\n" +
            "  </url>"
        ).join("\n");

        const xml =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
            entries + "\n" +
            "</urlset>\n";

        const blob = new Blob(
            [xml],
            {type: "application/xml;charset=utf-8"}
        );

        if (blob.size > SITEMAP_MAX_BYTES) {
            throw new Error(
                "The sitemap exceeds the 50 MB uncompressed limit."
            );
        }

        const output = document.getElementById("output");

        output.textContent = xml;
        output.style.display = "block";

        document.getElementById("pageCount").textContent =
            urls.length + " Pages";

        showMessage(
            "Sitemap generated successfully. Review the URLs before publishing."
        );

    } catch (error) {

        resetSitemapOutput();

        showMessage(
            error.message || "Unable to generate sitemap."
        );
    }
}

async function copySitemap() {

    const text =
        document.getElementById("output").textContent;

    if (!text.trim()) {
        showMessage("Generate a sitemap before copying.");
        return;
    }

    try {
        await FTOSafety.copyText(text);
        showMessage("Sitemap copied successfully.");
    } catch (error) {
        showMessage(error.message || "Copy failed.");
    }
}

function downloadSitemap() {

    const text =
        document.getElementById("output").textContent;

    if (!text.trim()) {
        showMessage("Generate a sitemap before downloading.");
        return;
    }

    let objectUrl = "";

    try {

        const blob = new Blob(
            [text],
            {type: "application/xml;charset=utf-8"}
        );

        objectUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = "sitemap.xml";
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 1000);

        showMessage("sitemap.xml download started.");

    } catch (error) {

        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }

        showMessage(error.message || "Download failed.");
    }
}

function clearSitemap() {

    document.getElementById("siteUrl").value = "";
    document.getElementById("pages").value = "";
    document.getElementById("frequency").value = "weekly";

    resetSitemapOutput();

    showMessage("Sitemap form cleared.");
}

function showMessage(text) {

    const box = document.getElementById("success");

    box.textContent = text;
    box.style.display = "block";

    clearTimeout(window.sitemapMessageTimer);

    window.sitemapMessageTimer = setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}

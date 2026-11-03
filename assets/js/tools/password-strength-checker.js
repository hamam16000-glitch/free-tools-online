"use strict";

function checkPassword() {

    const input = document.getElementById("password");
    const s = input.value;

    const checks = [
        Array.from(s).length >= 12,
        /\p{Lu}/u.test(s),
        /\p{Ll}/u.test(s),
        /\p{N}/u.test(s),
        /[^\p{L}\p{N}\s]/u.test(s)
    ];

    const ids = ["length", "upper", "lower", "number", "symbol"];

    const labels = [
        "At least 12 characters",
        "Uppercase letter",
        "Lowercase letter",
        "Number",
        "Symbol"
    ];

    ids.forEach((id, index) => {
        const el = document.getElementById(id);
        el.textContent =
            (checks[index] ? "✓ " : "○ ") + labels[index];
        el.className = checks[index] ? "good" : "bad";
    });

    const score = checks.filter(Boolean).length;

    const bar = document.getElementById("bar");

    bar.style.width = (score * 20) + "%";

    bar.style.backgroundColor =
        score === 0 ? "#94a3b8" :
        score <= 2 ? "#dc2626" :
        score <= 4 ? "#f59e0b" : "#16a34a";

    document.getElementById("strengthBar")
        .setAttribute("aria-valuenow", String(score));

    document.getElementById("result").textContent =
        score + " of 5 character checks completed";

    const common =
        /^(password|qwerty|123456|letmein)/i.test(s) ||
        /^(.)\1{3,}$/u.test(s);

    const time = document.getElementById("time");

    if (!s) {
        time.textContent =
            "Enter a sample password to begin.";
    } else if (common) {
        time.textContent =
            "An obvious common or repeated pattern was detected. This is not a cracking-time estimate.";
    } else {
        time.textContent =
            "No pattern from this limited check was detected. This does not prove password security or check data breaches.";
    }
}

function togglePassword() {

    const input = document.getElementById("password");
    const button = document.getElementById("togglePasswordButton");

    const showing = input.type === "password";

    input.type = showing ? "text" : "password";

    button.textContent =
        showing ? "Hide password" : "Show password";

    button.setAttribute("aria-pressed", String(showing));
}

async function copyPassword() {

    const input = document.getElementById("password");
    const message = document.getElementById("copyMessage");

    if (!input.value) {
        message.textContent =
            "Enter or generate a password before copying.";
        message.style.display = "block";
        return;
    }

    try {

        await window.FTOSafety.copyText(input.value);

        message.textContent =
            "Password copied successfully. Remember that other apps may access clipboard contents.";

    } catch (error) {

        message.textContent =
            error.message || "Copy failed. Select and copy manually.";

    }

    message.style.display = "block";
}

function generateStrongPassword() {

    const input = document.getElementById("password");
    const result = document.getElementById("result");
    const message = document.getElementById("copyMessage");

    try {

        input.value = window.FTOSafety.password(
            16,
            [
                "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                "abcdefghijklmnopqrstuvwxyz",
                "0123456789",
                "!@#$%^&*"
            ]
        );

        checkPassword();

        message.style.display = "none";
        message.textContent = "";

    } catch (error) {

        input.value = "";
        checkPassword();

        result.textContent =
            error.message || "Secure password generation failed.";

    }
}

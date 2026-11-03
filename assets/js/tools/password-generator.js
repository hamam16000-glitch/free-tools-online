"use strict";

function generatePassword() {

    const output = document.getElementById("password");
    const strength = document.getElementById("strength");
    const copyBox = document.getElementById("copySuccess");

    output.value = "";
    strength.textContent = "";

    if (copyBox) {
        copyBox.style.display = "none";
        clearTimeout(window.passwordCopyTimer);
    }

    try {

        const rawLength =
            document.getElementById("length").value.trim();

        if (!/^\d+$/.test(rawLength)) {
            throw new Error("Enter a whole-number password length.");
        }

        const length = Number(rawLength);

        if (!Number.isSafeInteger(length) || length < 4 || length > 128) {
            throw new Error("Password length must be between 4 and 128.");
        }

        const definitions = [
            ["upper", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
            ["lower", "abcdefghijklmnopqrstuvwxyz"],
            ["numbers", "0123456789"],
            ["symbols", "!@#$%^&*()_+"]
        ];

        const groups = definitions
            .filter(([id]) => document.getElementById(id).checked)
            .map(([, characters]) => characters);

        if (!groups.length) {
            throw new Error("Select at least one character group.");
        }

        if (
            !window.FTOSafety ||
            typeof window.FTOSafety.password !== "function"
        ) {
            throw new Error("Secure password engine is unavailable.");
        }

        const password =
            window.FTOSafety.password(length, groups);

        if (password.length !== length) {
            throw new Error("Unexpected password length.");
        }

        output.value = password;

        checkStrength(password);

    } catch (error) {

        output.value = "";

        strength.textContent =
            error.message || "Unable to generate a secure password.";
    }
}

function checkStrength(password) {

    document.getElementById("strength").textContent =
        "Generated securely in your browser. " +
        password.length +
        " characters. Every selected character group is included.";
}

async function copyPassword() {

    const password =
        document.getElementById("password").value;

    const box =
        document.getElementById("copySuccess");

    if (!password) {
        document.getElementById("strength").textContent =
            "Generate a password before copying.";
        return;
    }

    try {

        await window.FTOSafety.copyText(password);

        box.textContent = "Password copied successfully.";
        box.style.display = "block";

        clearTimeout(window.passwordCopyTimer);

        window.passwordCopyTimer = setTimeout(() => {
            box.style.display = "none";
        }, 3000);

    } catch (error) {

        box.style.display = "none";

        document.getElementById("strength").textContent =
            error.message || "Unable to copy password.";
    }
}

function clearPassword() {

    document.getElementById("password").value = "";
    document.getElementById("strength").textContent = "";

    const box = document.getElementById("copySuccess");

    if (box) {
        box.style.display = "none";
        clearTimeout(window.passwordCopyTimer);
    }
}


// FTO PASSWORD CONFIG INVALIDATION
function invalidateGeneratedPassword() {
    const output = document.getElementById("password");
    const status = document.getElementById("strength");
    const copyBox = document.getElementById("copySuccess");

    const hadPassword = Boolean(output.value);

    output.value = "";

    status.textContent = hadPassword
        ? "Settings changed. Generate a new password."
        : "";

    if (copyBox) {
        copyBox.style.display = "none";
        copyBox.textContent = "";
    }

    clearTimeout(window.passwordCopyTimer);
    window.passwordCopyTimer = null;
}

["length", "upper", "lower", "numbers", "symbols"]
    .forEach(id => {
        const control = document.getElementById(id);

        if (control) {
            control.addEventListener(
                id === "length" ? "input" : "change",
                invalidateGeneratedPassword
            );
        }
    });

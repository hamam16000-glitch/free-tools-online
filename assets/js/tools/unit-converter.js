


const units={

length:["Meter","Kilometer","Centimeter","Mile"],

weight:["Kilogram","Gram","Pound"],

temperature:["Celsius","Fahrenheit"]

};




function invalidateConversion() {
    window.unitConversionRevision =
        (window.unitConversionRevision || 0) + 1;

    const result =
        document.getElementById('result');

    const feedback =
        document.getElementById('copySuccess');

    if (result) {
        result.textContent = '';
    }

    if (feedback) {
        feedback.style.display = 'none';
    }

    clearTimeout(window.unitCopyTimer);
}

function updateUnits(){

let category=document.getElementById("category").value;

let from=document.getElementById("fromUnit");

let to=document.getElementById("toUnit");


from.innerHTML="";

to.innerHTML="";


units[category].forEach(function(unit){

from.innerHTML += `<option>${unit}</option>`;

to.innerHTML += `<option>${unit}</option>`;

});
invalidateConversion();

}


updateUnits();




function convertUnit() {
    invalidateConversion();

    const category =
        document.getElementById('category').value;

    const raw =
        document.getElementById('value').value.trim();

    const value = Number(raw);

    const from =
        document.getElementById('fromUnit').value;

    const to =
        document.getElementById('toUnit').value;

    const output =
        document.getElementById('result');

    if (
        !raw ||
        !Number.isFinite(value) ||
        !units[category]?.includes(from) ||
        !units[category]?.includes(to)
    ) {
        output.textContent =
            'Enter a valid value and units';

        return;
    }

    const factors = {
        Meter: 1,
        Kilometer: 1000,
        Centimeter: 0.01,
        Mile: 1609.344,
        Kilogram: 1,
        Gram: 0.001,
        Pound: 0.45359237
    };

    const converted =
        category === 'temperature'
            ? (
                from === to
                    ? value
                    : from === 'Celsius'
                        ? value * 9 / 5 + 32
                        : (value - 32) * 5 / 9
            )
            : value * factors[from] / factors[to];

    output.textContent =
        Number.isFinite(converted)
            ? 'Result: ' +
              Number(converted.toPrecision(12))
            : 'Result outside numeric range';
}


async function copyResult() {
    const output =
        document.getElementById('result');

    const feedback =
        document.getElementById('copySuccess');

    const text = output.textContent.trim();

    const revision =
        window.unitConversionRevision;

    clearTimeout(window.unitCopyTimer);

    function showFeedback(message, failed) {
        if (!feedback) return;

        feedback.textContent = message;
        feedback.style.display = 'block';

        feedback.style.color =
            failed ? '#b91c1c' : '';

        feedback.style.backgroundColor =
            failed ? '#fef2f2' : '';
    }

    const match = /^Result:\s+(.+)$/.exec(text);

    if (
        !match ||
        !Number.isFinite(Number(match[1]))
    ) {
        showFeedback(
            'Convert a valid value before copying.',
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

        await window.FTOSafety.copyText(text);

        if (
            revision !== window.unitConversionRevision ||
            output.textContent.trim() !== text
        ) {
            return;
        }

        showFeedback(
            'Result copied successfully.',
            false
        );

        window.unitCopyTimer = setTimeout(() => {
            if (
                feedback &&
                revision === window.unitConversionRevision
            ) {
                feedback.style.display = 'none';
            }
        }, 3000);

    } catch (error) {
        if (
            revision !== window.unitConversionRevision ||
            output.textContent.trim() !== text
        ) {
            return;
        }

        showFeedback(
            'Copy failed. Select and copy the result manually.',
            true
        );
    }
}


function clearConverter() {
    document.getElementById('value').value = '';
    invalidateConversion();
}

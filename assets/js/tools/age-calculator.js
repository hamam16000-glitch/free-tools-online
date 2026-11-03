'use strict';

const daySelect = document.getElementById('birthDay');
const monthSelect = document.getElementById('birthMonth');
const yearSelect = document.getElementById('birthYear');
const resultBox = document.getElementById('result');

const MINIMUM_YEAR = 1900;
const currentYear = new Date().getFullYear();

for (let day = 1; day <= 31; day++) {
    const option = document.createElement('option');
    option.value = String(day);
    option.textContent = String(day);
    daySelect.appendChild(option);
}

for (let year = currentYear; year >= MINIMUM_YEAR; year--) {
    const option = document.createElement('option');
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
}

function setAgeStatus(message, type) {
    resultBox.textContent = String(message);
    resultBox.className = type ? 'status-' + type : '';
}

function getMonthAnniversary(birthDate, monthsAfterBirth) {
    const targetMonth = new Date(
        birthDate.getFullYear(),
        birthDate.getMonth() + monthsAfterBirth,
        1
    );

    const lastDay = new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth() + 1,
        0
    ).getDate();

    return new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        Math.min(birthDate.getDate(), lastDay)
    );
}

function getAgeParts(birthDate, today) {
    const birth = new Date(
        birthDate.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
    );

    const current = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    if (
        Number.isNaN(birth.getTime()) ||
        Number.isNaN(current.getTime())
    ) {
        throw new Error('Invalid date.');
    }

    if (birth > current) {
        throw new Error('Birth date cannot be in the future.');
    }

    let completedMonths =
        (current.getFullYear() - birth.getFullYear()) * 12 +
        current.getMonth() - birth.getMonth();

    if (getMonthAnniversary(birth, completedMonths) > current) {
        completedMonths--;
    }

    const years = Math.floor(completedMonths / 12);
    const months = completedMonths % 12;

    const anchor = getMonthAnniversary(birth, completedMonths);

    const remainingDays = Math.round(
        (
            Date.UTC(
                current.getFullYear(),
                current.getMonth(),
                current.getDate()
            ) -
            Date.UTC(
                anchor.getFullYear(),
                anchor.getMonth(),
                anchor.getDate()
            )
        ) / 86400000
    );

    return {
        years,
        months,
        days: remainingDays
    };
}

function formatAgeUnit(value, singular, plural) {
    return value + ' ' + (value === 1 ? singular : plural);
}

function calculateAge() {
    setAgeStatus('', '');

    const day = Number(daySelect.value);
    const month = Number(monthSelect.value);
    const year = Number(yearSelect.value);

    if (
        !Number.isInteger(day) ||
        !Number.isInteger(month) ||
        !Number.isInteger(year) ||
        day < 1 ||
        day > 31 ||
        month < 1 ||
        month > 12 ||
        year < MINIMUM_YEAR ||
        year > currentYear
    ) {
        setAgeStatus(
            'Please select your complete birth date.',
            'error'
        );
        return;
    }

    const birthDate = new Date(year, month - 1, day);

    if (
        birthDate.getFullYear() !== year ||
        birthDate.getMonth() !== month - 1 ||
        birthDate.getDate() !== day
    ) {
        setAgeStatus(
            'Please select a valid calendar date.',
            'error'
        );
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
        setAgeStatus(
            'Birth date cannot be in the future.',
            'error'
        );
        return;
    }

    try {
        const age = getAgeParts(birthDate, today);

        const message = [
            formatAgeUnit(age.years, 'Year', 'Years'),
            formatAgeUnit(age.months, 'Month', 'Months'),
            formatAgeUnit(age.days, 'Day', 'Days')
        ].join(', ');

        setAgeStatus('Your Age: ' + message, 'success');

    } catch (error) {
        setAgeStatus(
            error.message || 'Unable to calculate age.',
            'error'
        );
    }
}

function clearAge() {
    daySelect.value = '';
    monthSelect.value = '';
    yearSelect.value = '';

    setAgeStatus('Date and result cleared.', 'info');
}

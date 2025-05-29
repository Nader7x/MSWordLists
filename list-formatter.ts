// Helper for Roman numerals (simple version)
const ROMAN_NUMERALS_UPPER = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];
const ROMAN_NUMERALS_LOWER = ROMAN_NUMERALS_UPPER.map(n => n.toLowerCase());

// Regex to remove existing common list prefixes
// Explanation:
// ^(\s*[-*+]\s+)                                - Matches common bullet points like -, *, + with surrounding spaces
// | (^\s*\d+\.\s+)                              - Matches numbered lists like 1., 2. with surrounding spaces
// | (^\s*[a-zA-Z][.)]\s+)                       - Matches alphabetical lists like a., a), B., B) with surrounding spaces
// | (^\s*[ivxlcdmIVXLCDM]+\.\s+)                - Matches Roman numeral lists like i., I. with surrounding spaces
// The (.*)$ part is to capture the rest of the line after the prefix.
const PREFIX_REGEX = /^(\s*[-*+]\s+|^\s*\d+\.\s+|^\s*[a-zA-Z][.)]\s+|^\s*[ivxlcdmIVXLCDM]+\.\s+)(.*)$/;

function processLine(line: string, newPrefix: string): string {
    if (line.trim() === '') {
        return line; // Preserve empty or whitespace-only lines
    }

    const leadingWhitespaceMatch = line.match(/^(\s*)/);
    const indentation = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : '';
    const content = line.substring(indentation.length);

    const prefixMatch = content.match(PREFIX_REGEX);
    if (prefixMatch) {
        // If an existing list prefix is found, replace it with the new one
        // prefixMatch[1] is the old prefix, prefixMatch[2] is the actual content after old prefix
        return `${indentation}${newPrefix}${prefixMatch[2]}`;
    } else {
        // Otherwise, just prepend the new prefix to the (trimmed) content
        return `${indentation}${newPrefix}${content}`;
    }
}

export function formatBulletList(text: string): string {
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
        if (line.trim() === '') return line;
        return processLine(line, '- ');
    });
    return processedLines.join('\n');
}

export function formatNumberedList(text: string): string {
    const lines = text.split('\n');
    let counter = 1;
    const processedLines = lines.map(line => {
        if (line.trim() === '') return line;
        const prefix = `${counter}. `;
        counter++;
        return processLine(line, prefix);
    });
    return processedLines.join('\n');
}

export function formatAlphabeticalList(text: string, lower: boolean = true): string {
    const lines = text.split('\n');
    let charCode = lower ? 'a'.charCodeAt(0) : 'A'.charCodeAt(0);
    const processedLines = lines.map(line => {
        if (line.trim() === '') return line;
        const prefix = `${String.fromCharCode(charCode)}. `;
        charCode++;
        // Basic handling for running out of letters (cycles back to 'a'/'A')
        if (lower && charCode > 'z'.charCodeAt(0)) charCode = 'a'.charCodeAt(0);
        if (!lower && charCode > 'Z'.charCodeAt(0)) charCode = 'A'.charCodeAt(0);
        return processLine(line, prefix);
    });
    return processedLines.join('\n');
}

export function formatRomanList(text: string, lower: boolean = true): string {
    const lines = text.split('\n');
    let counter = 0;
    const numerals = lower ? ROMAN_NUMERALS_LOWER : ROMAN_NUMERALS_UPPER;
    const processedLines = lines.map(line => {
        if (line.trim() === '') return line;
        // Use modulo to cycle through numerals if more items than defined
        const numeral = numerals[counter % numerals.length];
        const prefix = `${numeral}. `;
        counter++;
        return processLine(line, prefix);
    });
    return processedLines.join('\n');
}

export function formatCheckboxList(text: string): string {
    const lines = text.split('\n');
    const processedLines = lines.map(line => {
        if (line.trim() === '') return line;
        return processLine(line, '- [ ] ');
    });
    return processedLines.join('\n');
}

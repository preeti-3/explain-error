#!/usr/bin/env node

/**
 * A CLI tool that converts JavaScript error messages into beginner-friendly explanations
 * Usage: node explain-error.js "error message here"
 */

// ─────────────────────────────────────────────────────────────
// ANSI Color Codes
// ─────────────────────────────────────────────────────────────
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgYellow: '\x1b[43m',
};

const c = {
    error: (text) => `${colors.red}${colors.bold}${text}${colors.reset}`,
    type: (text) => `${colors.magenta}${colors.bold}${text}${colors.reset}`,
    explain: (text) => `${colors.cyan}${text}${colors.reset}`,
    tip: (text) => `${colors.green}${text}${colors.reset}`,
    dim: (text) => `${colors.dim}${text}${colors.reset}`,
    highlight: (text) => `${colors.yellow}${colors.bold}${text}${colors.reset}`,
    header: (text) => `${colors.blue}${colors.bold}${text}${colors.reset}`,
    cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
    green: (text) => `${colors.green}${text}${colors.reset}`,
};

// ─────────────────────────────────────────────────────────────
// Error Patterns (Grouped by Type)
// ─────────────────────────────────────────────────────────────

const errorPatterns = {
    // ───── ReferenceError ─────
    ReferenceError: [
        {
            pattern: /ReferenceError: (\w+) is not defined/i,
            explain: (match) => `You're trying to use "${match[1]}" but it doesn't exist yet.`,
            tip: () => `Declare the variable first using let, const, or var before using it.`
        },
        {
            pattern: /ReferenceError: Cannot access .* before initialization/i,
            explain: () => `You're using a variable before it's been assigned a value.`,
            tip: () => `Move your variable declaration above where you're trying to use it.`
        },
    ],

    // ───── TypeError ─────
    TypeError: [
        {
            pattern: /TypeError: Cannot read propert(y|ies) ['"]?(\w+)['"]? of undefined/i,
            explain: (match) => `You're trying to access "${match[2] || 'a property'}" on something that is undefined.`,
            tip: () => `Check that the object exists before accessing its properties. Use optional chaining: obj?.property`
        },
        {
            pattern: /TypeError: Cannot read propert(y|ies) .* of null/i,
            explain: () => `You're trying to access a property on null.`,
            tip: () => `Verify the variable isn't null before using it. Use: if (variable !== null)`
        },
        {
            pattern: /TypeError: (\w+) is not a function/i,
            explain: (match) => `You're calling "${match[1]}" as a function, but it's not one.`,
            tip: () => `Check the spelling and make sure it's actually a function. Maybe it's a property?`
        },
        {
            pattern: /TypeError: Assignment to constant variable/i,
            explain: () => `You're trying to reassign a const variable.`,
            tip: () => `Use "let" instead of "const" if you need to change the value later.`
        },
        {
            pattern: /TypeError: Cannot set propert(y|ies) .* of undefined/i,
            explain: () => `You're trying to set a property on something that doesn't exist.`,
            tip: () => `Initialize the object first: const obj = {} before setting obj.property = value`
        },
        {
            pattern: /TypeError: .* is not iterable/i,
            explain: () => `You're trying to loop over something that can't be looped.`,
            tip: () => `Make sure you're iterating over an array, string, or other iterable object.`
        },
    ],

    // ───── SyntaxError ─────
    SyntaxError: [
        {
            pattern: /SyntaxError: Unexpected token/i,
            explain: () => `There's an unexpected character in your code.`,
            tip: () => `Check for missing/extra brackets, commas, or quotes near the error line.`
        },
        {
            pattern: /SyntaxError: Unexpected end of input/i,
            explain: () => `Your code ended unexpectedly - something is incomplete.`,
            tip: () => `You're likely missing a closing } bracket, ) parenthesis, or quote.`
        },
        {
            pattern: /SyntaxError: Identifier .* has already been declared/i,
            explain: () => `You declared the same variable name twice in the same scope.`,
            tip: () => `Rename one of the variables or remove the duplicate declaration.`
        },
        {
            pattern: /SyntaxError: missing \) after argument list/i,
            explain: () => `A function call is missing its closing parenthesis.`,
            tip: () => `Count your opening and closing parentheses - they should match.`
        },
        {
            pattern: /SyntaxError: Unexpected identifier/i,
            explain: () => `JavaScript found a word where it wasn't expected.`,
            tip: () => `Check for missing operators, commas, or semicolons before this line.`
        },
    ],

    // ───── RangeError ─────
    RangeError: [
        {
            pattern: /RangeError: Maximum call stack size exceeded/i,
            explain: () => `Your function is calling itself infinitely (infinite recursion).`,
            tip: () => `Add a base case/exit condition to stop the recursion.`
        },
        {
            pattern: /RangeError: Invalid array length/i,
            explain: () => `You're trying to create an array with an invalid size.`,
            tip: () => `Array length must be a positive integer less than 2^32.`
        },
    ],

    // ───── URIError ─────
    URIError: [
        {
            pattern: /URIError/i,
            explain: () => `There's an invalid character in a URI/URL.`,
            tip: () => `Use encodeURIComponent() to encode special characters in URLs.`
        },
    ],

    // ───── JSON Errors ─────
    JSON: [
        {
            pattern: /JSON\.parse|SyntaxError:.*JSON/i,
            explain: () => `Your JSON data has invalid syntax.`,
            tip: () => `Validate your JSON at jsonlint.com. Check for missing quotes, commas, or brackets.`
        },
    ],
};

// ─────────────────────────────────────────────────────────────
// Error Type Detection
// ─────────────────────────────────────────────────────────────

function detectErrorType(errorMessage) {
    const typePatterns = [
        { type: 'ReferenceError', pattern: /ReferenceError/i },
        { type: 'TypeError', pattern: /TypeError/i },
        { type: 'SyntaxError', pattern: /SyntaxError/i },
        { type: 'RangeError', pattern: /RangeError/i },
        { type: 'URIError', pattern: /URIError/i },
        { type: 'JSON', pattern: /JSON/i },
    ];

    for (const { type, pattern } of typePatterns) {
        if (pattern.test(errorMessage)) {
            return type;
        }
    }
    return 'Unknown';
}

// ─────────────────────────────────────────────────────────────
// Main Explain Function
// ─────────────────────────────────────────────────────────────

function explainError(errorMessage) {
    if (!errorMessage) {
        return null;
    }

    const errorType = detectErrorType(errorMessage);
    const patterns = errorPatterns[errorType] || [];

    for (const { pattern, explain, tip } of patterns) {
        const match = errorMessage.match(pattern);
        if (match) {
            return {
                type: errorType,
                explanation: explain(match),
                tip: tip(match),
            };
        }
    }

    // Fallback for unmatched errors
    return {
        type: errorType !== 'Unknown' ? errorType : 'Error',
        explanation: 'Something went wrong in your code.',
        tip: 'Read the error message carefully and check the line number for clues.',
    };
}

// ─────────────────────────────────────────────────────────────
// CLI Output Formatting
// ─────────────────────────────────────────────────────────────

function printResult(errorMessage, result) {
    const divider = '─'.repeat(50);

    console.log();
    console.log(c.header('┌' + '─'.repeat(48) + '┐'));
    console.log(c.header('│') + '  📚 ' + c.highlight('Error Explained') + ' '.repeat(28) + c.header('│'));
    console.log(c.header('└' + '─'.repeat(48) + '┘'));
    console.log();

    // Original error
    console.log(c.dim('  Original Error:'));
    console.log(c.error('  ' + errorMessage));
    console.log();

    // Error type badge
    console.log(c.dim('  Type:       ') + c.type(`[ ${result.type} ]`));
    console.log();

    // Explanation
    console.log(c.dim('  What it means:'));
    console.log(c.explain('  → ' + result.explanation));
    console.log();

    // Solution tip
    console.log(c.dim('  How to fix:'));
    console.log(c.tip('  ✓ ' + result.tip));
    console.log();

    console.log(c.dim(divider));
    console.log();
}

function printHelp() {
    console.log();
    console.log(c.header('┌' + '─'.repeat(48) + '┐'));
    console.log(c.header('│') + '  📚 ' + c.highlight('JS Error Explainer') + ' - Help' + ' '.repeat(14) + c.header('│'));
    console.log(c.header('└' + '─'.repeat(48) + '┘'));
    console.log();
    console.log(c.dim('  USAGE:'));
    console.log('    node explain-error.js ' + c.cyan('"<error message>"'));
    console.log();
    console.log(c.dim('  EXAMPLES:'));
    console.log(c.green('    node explain-error.js "ReferenceError: x is not defined"'));
    console.log(c.green('    node explain-error.js "TypeError: Cannot read property of undefined"'));
    console.log(c.green('    node explain-error.js "SyntaxError: Unexpected token }"'));
    console.log();
    console.log(c.dim('  SUPPORTED ERROR TYPES:'));
    console.log('    • ' + c.type('ReferenceError') + ' - Using undefined variables');
    console.log('    • ' + c.type('TypeError') + '      - Wrong type operations');
    console.log('    • ' + c.type('SyntaxError') + '    - Code syntax mistakes');
    console.log('    • ' + c.type('RangeError') + '     - Value out of range');
    console.log('    • ' + c.type('URIError') + '       - Invalid URI encoding');
    console.log();
    console.log(c.dim('  OPTIONS:'));
    console.log('    --help, -h    Show this help message');
    console.log();
}

// ─────────────────────────────────────────────────────────────
// CLI Entry Point
// ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

// Handle help flag
if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
}

const errorMessage = args.join(' ');
const result = explainError(errorMessage);

if (result) {
    printResult(errorMessage, result);
} else {
    console.log(c.error('Please provide an error message to explain.'));
    process.exit(1);
}

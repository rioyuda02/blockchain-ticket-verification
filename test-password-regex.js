const testPasswords = [
    // Valid passwords - these should all pass
    'QWEqwe!@#123',     // mix of everything
    'Password123!',     // typical valid password
    'Str0ng#Pass',      // minimal requirements met
    'C0mpl3x!Pass',     // typical user password
    'Ab1!defghijklmn',  // longer password
    'T3st@User2024',    // with year
    'P@ssw0rdStrong',   // typical pattern

    // Invalid passwords - Missing requirements
    'weakpassword',      // Should fail (no uppercase, no special char, no number)
    'NoSpecialChar123',  // Should fail (no special char)
    'No@Numbers',        // Should fail (no numbers)
    'no@upper123',       // Should fail (no uppercase)
    'NOUPPER@123',       // Should fail (no lowercase)
    'Short@1',           // Should fail (less than 8 chars)

    // Edge cases
    'Pass 123!',         // Should fail (contains space)
    'Pass\t123!',        // Should fail (contains tab)
    'Pass\n123!',        // Should fail (contains newline)
    'OnlySpecial@#$',    // Should fail (no numbers)
    'Only12345678',      // Should fail (no special chars, no uppercase)
    'ONLY@UPPERCASE1',   // Should fail (no lowercase)
    'only@lowercase1',   // Should fail (no uppercase)

    // Common patterns people might try
    'Password123',       // Should fail (no special char)
    'password123!',      // Should fail (no uppercase)
    'PASSWORD123!',      // Should fail (no lowercase)
    'Pass!Pass!',        // Should fail (no numbers)
    'P@ssw0rd',          // Should fail (too short)

    // Complex but invalid
    'P@$$w0rd',          // Should fail ($ not in allowed special chars)
    'P@ssw0rd!!',        // multiple special chars
    'Ab1!Ab1!Ab1!',      // repeating pattern
    'TestTest1!',        // repeating words

    // Boundary testing
    '1aA!aaaa',          // exactly 8 chars
    '1aA!aaaaa',         // 9 chars
    '1aA!aaa',           // 7 chars
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1!a', // very long password

    // Special character variations
    'Password1@',        // with @
    'Password1#',        // with #
    'Password1$',        // with $
    'Password1!',        // with !
    'Password1%',        // with %
    'Password1*',        // with *
    'Password1?',        // with ?
    'Password1&',        // with &
];

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

let totalTests = 0;
let passedTests = 0;

console.log('Password Validation Test Results:');
console.log('=================================');

testPasswords.forEach(password => {
    totalTests++;
    const isValid = passwordRegex.test(password);
    const shouldPass = password.includes('Should pass');

    if ((shouldPass && isValid) || (!shouldPass && !isValid)) {
        passedTests++;
    }

    console.log(`Password: ${password}`);
    console.log(`Valid: ${isValid}`);
    console.log(`Expected: ${shouldPass ? 'Valid' : 'Invalid'}`);
    console.log(`Result: ${(shouldPass === isValid) ? '✓ CORRECT' : '✗ INCORRECT'}`);
    console.log('-------------------------');
});

// Summary statistics
const successRate = (passedTests / totalTests) * 100;
console.log('\nTest Summary:');
console.log('=================================');
console.log(`Total tests: ${totalTests}`);
console.log(`Passed tests: ${passedTests}`);
console.log(`Success rate: ${successRate.toFixed(2)}%`);

// Test a custom password
function testCustomPassword(password) {
    const isValid = passwordRegex.test(password);
    console.log('\nTesting Custom Password:');
    console.log('=================================');
    console.log(`Password: ${password}`);
    console.log(`Valid: ${isValid}`);

    // Detailed validation
    console.log('\nDetailed checks:');
    console.log('Has lowercase:', /[a-z]/.test(password));
    console.log('Has uppercase:', /[A-Z]/.test(password));
    console.log('Has number:', /\d/.test(password));
    console.log('Has special char:', /[@$!%*?&]/.test(password));
    console.log('Is 8+ chars:', password.length >= 8);
}

// Test your specific password
testCustomPassword('QWEqwe!@#123'); 
// Declaring strings with different methods
var string1 = 'Hello, world!';      // Single quotes
var string2 = "Hello, JavaScript!"; // Double quotes
var string3 = `Hello, ${string1}`;  // Template literals

// Log the initial strings
console.log(string1); // 'Hello, world!'
console.log(string2); // 'Hello, JavaScript!'
console.log(string3); // 'Hello, Hello, world!'

// Using string methods
var string1Length = string1.length;
console.log(string1Length);         // 13

var string2UpperCase = string2.toUpperCase();
console.log(string2UpperCase);      // 'HELLO, JAVASCRIPT!'

var string1Slice = string1.slice(0, 5);
console.log(string1Slice);          // 'Hello'

var string2Substring = string2.substring(0, 5);
console.log(string2Substring);     // 'Hello'

// String concatenation
var concatenatedString = string1 + ' ' + string2;
console.log(concatenatedString);     // 'Hello, world! Hello, JavaScript!'

// Using template literals for concatenation
var templateConcatenatedString = `${string1} ${string2}`;
console.log(templateConcatenatedString); // 'Hello, world! Hello, JavaScript!'

// Using replace() to change a substring
var newString = string1.replace('world', 'JavaScript');
console.log(newString); // 'Hello, JavaScript!'

// Using trim() to remove extra spaces
var stringWithSpaces = '   Hello, world!   ';
var trimmedString = stringWithSpaces.trim();
console.log(trimmedString); // 'Hello, world!'

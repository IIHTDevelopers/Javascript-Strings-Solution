const esprima = require('esprima');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xmlBuilder = require('xmlbuilder');

// Define TestCaseResultDto
class TestCaseResultDto {
    constructor(methodName, methodType, actualScore, earnedScore, status, isMandatory, errorMessage) {
        this.methodName = methodName;
        this.methodType = methodType;
        this.actualScore = actualScore;
        this.earnedScore = earnedScore;
        this.status = status;
        this.isMandatory = isMandatory;
        this.errorMessage = errorMessage;
    }
}

// Define TestResults
class TestResults {
    constructor() {
        this.testCaseResults = {};
        this.customData = '';  // Include custom data from the file
    }
}

// Function to read the custom.ih file
function readCustomFile() {
    let customData = '';
    try {
        customData = fs.readFileSync('../custom.ih', 'utf8');
    } catch (err) {
        console.error('Error reading custom.ih file:', err);
    }
    return customData;
}

// Function to send test case result to the server
async function sendResultToServer(testResults) {
    try {
        const response = await axios.post('https://compiler.techademy.com/v1/mfa-results/push', testResults, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Server Response:', response.data);
    } catch (error) {
        console.error('Error sending data to server:', error);
    }
}

// Function to generate the XML report
function generateXmlReport(result) {
    const xml = xmlBuilder.create('test-cases')
        .ele('case')
        .ele('test-case-type', result.status)
        .up()
        .ele('name', result.methodName)
        .up()
        .ele('status', result.status)
        .up()
        .end({ pretty: true });
    return xml;
}

// Function to write to output files
function writeOutputFiles(result, fileType) {
    const outputFiles = {
        functional: "./output_revised.txt",
        boundary: "./output_boundary_revised.txt",
        exception: "./output_exception_revised.txt",
        xml: "./yaksha-test-cases.xml"
    };

    let resultStatus = result.status === 'Pass' ? 'PASS' : 'FAIL';
    let output = `${result.methodName}=${resultStatus}\n`;

    let outputFilePath = outputFiles[fileType];
    if (outputFilePath) {
        fs.appendFileSync(outputFilePath, output);
    }
}

// Function to check if strings are declared correctly
function checkStringDeclaration(ast) {
    let result = 'Pass';
    let feedback = [];
    let stringDeclared = false;

    ast.body.forEach((node) => {
        if (node.type === 'VariableDeclaration') {
            node.declarations.forEach((declarator) => {
                if (declarator.init && (declarator.init.type === 'Literal' || declarator.init.type === 'TemplateLiteral')) {
                    stringDeclared = true;
                }
            });
        }
    });

    if (!stringDeclared) {
        result = 'Fail';
        feedback.push("You must declare strings using single quotes, double quotes, or template literals.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking string declaration\x1b[0m`);

    return new TestCaseResultDto(
        'StringDeclaration',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if string methods are used correctly by reading index.js file line by line
function checkStringMethods() {
    const result = 'Pass';
    let feedback = [];
    let stringMethodsUsed = { 
        length: false, 
        slice: false, 
        substring: false, 
        toUpperCase: false, 
        replace: false, 
    };

    // Read the index.js file line by line
    const filePath = path.join(__dirname, '../', 'index.js');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Check each line for method usage
    lines.forEach((line, index) => {
        // Check for method calls or property accesses in each line
        if (line.includes('string1') || line.includes('string2')) {
            // Check for specific string methods
            if (line.includes('.length')) {
                stringMethodsUsed.length = true;
            }
            if (line.includes('.slice(')) {
                stringMethodsUsed.slice = true;
            }
            if (line.includes('.substring(')) {
                stringMethodsUsed.substring = true;
            }
            if (line.includes('.toUpperCase(')) {
                stringMethodsUsed.toUpperCase = true;
            }
            if (line.includes('.replace(')) {
                stringMethodsUsed.replace = true;
            }
        }
    });

    // Check if each string method has been used
    for (let method in stringMethodsUsed) {
        if (!stringMethodsUsed[method]) {
            feedback.push(`You must use the ${method} method on strings.`);
        }
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking string method usage\x1b[0m`);

    // Return the result
    return new TestCaseResultDto(
        'StringMethodsUsage',
        'functional',
        1,
        feedback.length === 0 ? 1 : 0, // Pass if no feedback, Fail otherwise
        feedback.length === 0 ? 'Pass' : 'Fail',
        true,
        feedback.join(', ')
    );
}

// Function to check if string concatenation is done correctly by reading index.js file line by line
function checkStringConcatenation() {
    let result = 'Pass';
    let feedback = [];
    let concatenationUsed = false;

    // Read the index.js file line by line
    const filePath = path.join(__dirname, '../', 'index.js');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Check each line for string concatenation
    lines.forEach((line, index) => {
        // Look for string concatenation with the '+' operator
        if (line.includes('+')) {
            if (line.includes('string1') || line.includes('string2')) {
                concatenationUsed = true;
            }
        }

        // Look for string concatenation using template literals (e.g., `${string1} ${string2}`)
        if (line.includes('`') && line.includes('${')) {
            if (line.includes('string1') || line.includes('string2')) {
                concatenationUsed = true;
            }
        }

        // Check for concatenation inside console.log() or other expressions
        if (line.includes('console.log')) {
            if (line.includes('+')) {
                concatenationUsed = true;
                console.log('Detected string concatenation inside console.log using "+"');
            }
            if (line.includes('`') && line.includes('${')) {
                concatenationUsed = true;
                console.log('Detected string concatenation inside console.log using template literals');
            }
        }
    });

    // If no concatenation was found, mark as fail
    if (!concatenationUsed) {
        result = 'Fail';
        feedback.push("You must use string concatenation with either '+' or template literals.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking string concatenation\x1b[0m`);

    // Return the result
    return new TestCaseResultDto(
        'StringConcatenation',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if string interpolation is done correctly by reading index.js file line by line
function checkStringInterpolation() {
    let result = 'Pass';
    let feedback = [];
    let interpolationUsed = false;

    // Read the index.js file line by line
    const filePath = path.join(__dirname, '../', 'index.js');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    console.log('Starting checkStringInterpolation'); // Debugging statement

    // Check each line for string interpolation
    lines.forEach((line, index) => {
        console.log(`Processing line ${index + 1}: ${line}`); // Log each line for debugging

        // Look for string interpolation using template literals (e.g., `${string1} ${string2}`)
        if (line.includes('`') && line.includes('${')) {
            if (line.includes('string1') || line.includes('string2')) {
                interpolationUsed = true;
                console.log('Detected string interpolation using template literals');
            }
        }

        // Check for interpolation inside console.log() or other expressions
        if (line.includes('console.log')) {
            if (line.includes('`') && line.includes('${')) {
                interpolationUsed = true;
                console.log('Detected string interpolation inside console.log using template literals');
            }
        }
    });

    // If no interpolation is found, mark as fail
    if (!interpolationUsed) {
        result = 'Fail';
        feedback.push("You must use string interpolation with template literals.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking string interpolation\x1b[0m`);

    // Return the result
    return new TestCaseResultDto(
        'StringInterpolation',
        'functional',
        1,
        result === 'Pass' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to grade the student's code
function gradeAssignment() {
    const studentFilePath = path.join(__dirname, '..', 'index.js');
    let studentCode;

    try {
        studentCode = fs.readFileSync(studentFilePath, 'utf-8');
    } catch (err) {
        console.error("Error reading student's file:", err);
        return;
    }

    const ast = esprima.parseScript(studentCode);

    // Execute checks and prepare testResults
    const testResults = new TestResults();
    const GUID = "d805050e-a0d8-49b0-afbd-46a486105170";  // Example GUID for each test case

    // Assign the results of each test case
    testResults.testCaseResults[GUID] = checkStringDeclaration(ast);
    testResults.testCaseResults[GUID + '-string-methods-usage'] = checkStringMethods(ast);
    testResults.testCaseResults[GUID + '-string-concatenation'] = checkStringConcatenation(ast);
    testResults.testCaseResults[GUID + '-string-interpolation'] = checkStringInterpolation(ast);

    // Read custom data from the custom.ih file
    testResults.customData = readCustomFile();

    // Send the results of each test case to the server
    Object.values(testResults.testCaseResults).forEach(testCaseResult => {
        const resultsToSend = {
            testCaseResults: {
                [GUID]: testCaseResult
            },
            customData: testResults.customData
        };

        console.log("Sending below data to server");
        console.log(resultsToSend);

        // Log the test result in yellow for pass and red for fail using ANSI codes
        if (testCaseResult.status === 'Pass') {
            console.log(`\x1b[33m${testCaseResult.methodName}: Pass\x1b[0m`); // Yellow for pass
        } else {
            console.log(`\x1b[31m${testCaseResult.methodName}: Fail\x1b[0m`); // Red for fail
        }

        // Send each result to the server
        sendResultToServer(resultsToSend);
    });

    // Generate XML report for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        const xml = generateXmlReport(result);
        fs.appendFileSync('./test-report.xml', xml);
    });

    // Write to output files for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        writeOutputFiles(result, 'functional');
    });
}

// Function to delete output files
function deleteOutputFiles() {
    const outputFiles = [
        "./output_revised.txt",
        "./output_boundary_revised.txt",
        "./output_exception_revised.txt",
        "./yaksha-test-cases.xml"
    ];

    outputFiles.forEach(file => {
        // Check if the file exists
        if (fs.existsSync(file)) {
            // Delete the file if it exists
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
        }
    });
}

// Function to delete output files and run the grading function
function executeGrader() {
    // Delete all output files first
    deleteOutputFiles();

    // Run the grading function
    gradeAssignment();
}

// Execute the custom grader function
executeGrader();

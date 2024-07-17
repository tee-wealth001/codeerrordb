import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface ErrorRecord {
    id: number;
    dateTime: string;
    projectName: string;
    fileName: string;
    errorMessage: string;
    errorFix?: string;
    status: 'Not provided' | 'Fixed';
}

let errorDatabase: ErrorRecord[] = [];
let lastErrorId: number = 0;

export function activate(context: vscode.ExtensionContext) {
    const diagnosticCollection = vscode.languages.createDiagnosticCollection();

    // Load existing errors from the file
    const errorFilePath = path.join(context.globalStoragePath, 'errors.json');
    if (fs.existsSync(errorFilePath)) {
        const fileData = fs.readFileSync(errorFilePath, 'utf8');
        errorDatabase = JSON.parse(fileData) as ErrorRecord[];
        lastErrorId = errorDatabase.length > 0 ? errorDatabase[errorDatabase.length - 1].id : 0;
    }

    // Create a status bar item to show error count
    let showErrorCountButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    showErrorCountButton.text = `$(error) Errors: ${errorDatabase.length}`;
    showErrorCountButton.command = 'extension.showErrorCount';
    showErrorCountButton.tooltip = 'Show error count';
    showErrorCountButton.show();

    // Create a status bar item to show the error database
    let showErrorDatabaseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    showErrorDatabaseButton.text = '$(database) Show Error Database';
    showErrorDatabaseButton.command = 'extension.showErrorDatabase';
    showErrorDatabaseButton.tooltip = 'Show error database';
    showErrorDatabaseButton.show();

    // Create a status bar item to clear errors
    let clearErrorsButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    clearErrorsButton.text = '$(circle-slash) Clear Errors';
    clearErrorsButton.command = 'extension.clearErrors';
    clearErrorsButton.tooltip = 'Clear all recorded errors';
    clearErrorsButton.show();

    // Register a command to show the error count
    let showErrorCountDisposable = vscode.commands.registerCommand('extension.showErrorCount', () => {
        vscode.window.showInformationMessage(`You have encountered ${errorDatabase.length} errors.`);
    });

    // Register a command to show the error database
    let showErrorDatabaseDisposable = vscode.commands.registerCommand('extension.showErrorDatabase', () => {
        const panel = vscode.window.createWebviewPanel(
            'errorDatabase',
            'Error Database',
            vscode.ViewColumn.One,
            {}
        );

        let errorHtml = '<h1>Error Database</h1><ul>';
        for (const error of errorDatabase) {
            const formattedDateTime = formatDateTime(error.dateTime);
            errorHtml += `<li data-error-id="${error.id}"><b>Date/Time:</b> ${formattedDateTime}<br><b>Project:</b> ${error.projectName}<br><b>File:</b> ${error.fileName}<br><b>Error:</b> ${error.errorMessage}<br><b>Fix:</b> ${error.errorFix || 'Not provided'}<br><b>Status:</b> ${error.status}</li><br>`;
        }
        errorHtml += '</ul>';

        panel.webview.html = errorHtml;

        // Handle clicking on an error in the webview to select for fix entry
        panel.webview.onDidReceiveMessage(async message => {
            const selectedErrorId = parseInt(message, 10);
            const selectedError = errorDatabase.find(error => error.id === selectedErrorId);
            if (selectedError && selectedError.status === 'Not provided') {
                await promptForFix(selectedError);
            }
        });
    });

    // Register a command to clear all errors
    let clearErrorsDisposable = vscode.commands.registerCommand('extension.clearErrors', () => {
        vscode.window.showWarningMessage('Are you sure you want to clear all recorded errors?', 'Yes', 'No')
            .then(selection => {
                if (selection === 'Yes') {
                    errorDatabase = [];
                    fs.writeFileSync(errorFilePath, JSON.stringify(errorDatabase, null, 2), 'utf8');
                    showErrorCountButton.text = `$(error) Errors: 0`;
                    vscode.window.showInformationMessage('All recorded errors have been cleared.');
                }
            });
    });

    // Register a command to fix an error
    let fixErrorDisposable = vscode.commands.registerCommand('extension.fixError', () => {
        // Iterate through errors with 'Not provided' status and prompt to fix
        const errorsToFix = errorDatabase.filter(error => error.status === 'Not provided');
        if (errorsToFix.length > 0) {
            vscode.window.showQuickPick(errorsToFix.map(err => ({
                label: err.errorMessage,
                description: `${err.fileName}`
            })), { canPickMany: true, placeHolder: 'Select errors to fix' })
                .then(selection => {
                    if (selection) {
                        const selectedErrors = errorsToFix.filter(err => selection.some(s => s.label === err.errorMessage));
                        selectedErrors.forEach(err => {
                            promptForFix(err);
                            err.status = 'Fixed';
                        });
                        fs.writeFileSync(errorFilePath, JSON.stringify(errorDatabase, null, 2), 'utf8');
                        showErrorCountButton.text = `$(error) Errors: ${errorDatabase.length}`;
                    }
                });
        } else {
            vscode.window.showInformationMessage('No errors with "Not provided" status found.');
        }
    });

    context.subscriptions.push(showErrorCountButton);
    context.subscriptions.push(showErrorDatabaseButton);
    context.subscriptions.push(clearErrorsButton);
    context.subscriptions.push(showErrorCountDisposable);
    context.subscriptions.push(showErrorDatabaseDisposable);
    context.subscriptions.push(clearErrorsDisposable);
    context.subscriptions.push(fixErrorDisposable);

    // Listen for document save events
    vscode.workspace.onDidSaveTextDocument(document => {
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const filePath = document.uri.fsPath;

        const newErrors: ErrorRecord[] = [];

        diagnostics.forEach(diagnostic => {
            if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                const errorRecord: ErrorRecord = {
                    id: ++lastErrorId,
                    dateTime: new Date().toISOString(),
                    projectName: vscode.workspace.name || 'Unknown',
                    fileName: filePath,
                    errorMessage: diagnostic.message,
                    status: 'Not provided'
                };

                newErrors.push(errorRecord);
            }
        });

        if (newErrors.length > 0) {
            // Prompt the user to select errors for the error database
            vscode.window.showQuickPick(newErrors.map(err => ({
                label: err.errorMessage,
                description: `${err.fileName}`
            })), { canPickMany: true, placeHolder: 'Select errors to add to the error database' })
                .then(selection => {
                    if (selection) {
                        const selectedErrors = newErrors.filter(err => selection.some(s => s.label === err.errorMessage));
                        errorDatabase.push(...selectedErrors);
                        fs.writeFileSync(errorFilePath, JSON.stringify(errorDatabase, null, 2), 'utf8');
                        showErrorCountButton.text = `$(error) Errors: ${errorDatabase.length}`;
                    }
                });
        }
    });

    // Ensure the global storage path exists
    if (!fs.existsSync(context.globalStoragePath)) {
        fs.mkdirSync(context.globalStoragePath, { recursive: true });
    }
}

export function deactivate() {}

function promptForFix(errorRecord: ErrorRecord) {
    vscode.window.showInputBox({ prompt: `Enter fix for error: ${errorRecord.errorMessage}` })
        .then(fix => {
            if (fix) {
                errorRecord.errorFix = fix;
                errorRecord.status = 'Fixed'; // Update status to 'Fixed'
                const errorFilePath = path.join(vscode.workspace.rootPath || '', 'errors.json');
                fs.writeFileSync(errorFilePath, JSON.stringify(errorDatabase, null, 2), 'utf8');
                vscode.window.showInformationMessage('Fix added to error database.');
            }
        });
}

function formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString);
    
    // Format the date part
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'long',
        year: 'numeric',
        day: 'numeric'
    });
    const formattedDate = dateFormatter.format(date);

    // Format the time part
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)

    const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;

    return `${formattedDate} ${formattedTime}`;
}
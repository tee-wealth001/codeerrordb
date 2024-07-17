# Code Error DB

Code Error DB is a Visual Studio Code extension that tracks and records errors encountered while coding, along with optional fixes. This extension helps developers keep track of their common errors and solutions over time.

## Features

- Automatically records errors when you run your code.
- Prompts to add fixes for recorded errors after resolving them.
- View error count and error database directly in VS Code.
- Clear all recorded errors with a single command.

## Commands

- `Show Error Count`: Displays the total number of errors encountered.
- `Show Error Database`: Shows the error database with all recorded errors.
- `Clear Error Database`: Clears all recorded errors.
- `Fix Error Command`: Updates the error records with their respective fixes.

## Usage

1. Install the extension from the VS Code Marketplace.
after enabling the extension, you will see some buttons and text at the base of your VS code
![Buttons](https://github.com/tee-wealth001/codeerrordb/blob/main/raw/main/images/buttonsontab.png)
2. Use the commands from the Command Palette (Ctrl+Shift+P or Cmd+Shift+P) to interact with the error database.
![Prompt](https://github.com/tee-wealth001/codeerrordb/blob/main/raw/main/images/commandPrompt.png)
3. After fixing an error, look for a prompt to add the fix description.

## Installation

1. Open VS Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window.
3. Search for "CodeErrorDB" and click Install.

## Extension Settings

This extension contributes the following settings:

- `codeerrordb.enablePromptForFix`: Enable/disable the prompt for adding fixes after resolving errors.
- `codeerrordb.autoClear`: Automatically clear errors after a specified period.

## Release Notes

### 0.0.1

- Initial release of Code Error DB
- Basic error tracking and logging
- Command to show error count
- Command to display error database
- Command to clear error database
- Prompt to update error records

## Versioning

For transparency into our release cycle and in striving to maintain backward compatibility, Code Error DB will be maintained under the Semantic Versioning guidelines as much as possible. For detailed information on Semantic Versioning, please visit [SemVer](https://semver.org/).

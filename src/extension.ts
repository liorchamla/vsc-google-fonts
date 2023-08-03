'use strict';

import * as vscode from 'vscode';
import GoogleFontFamily from './font';
import GoogleApi from './google.api';

// Holds the pick options for the user :
const pickOptions = {
	matchOnDescription: true,
	matchOnDetail: true,
	placeHolder: 'Type Google Font name',
};

/**
 * Allows to insert any text inside the editor
 * @param text The text you want to insert in the editor at the position where the cursor is
 */
function insertText(text) {
	var editor = vscode.window.activeTextEditor;
	editor
		.edit(function (editBuilder) {
			editBuilder.delete(editor.selection);
		})
		.then(function () {
			editor.edit(function (editBuilder) {
				editBuilder.insert(editor.selection.start, text);
			});
		});
}

/**
 * Manage the possibility to insert a <link href=".." /> inside the editor
 */
async function insertFontLink() {
	const font = await getGoogleFontFamilyItem();
	// Creating the <link> markup
	const snippet = `<link href="${GoogleApi.generateUrl(
		font,
	)}&display=swap" rel="stylesheet" />`;

	// Inserting the link markup inside the editor
	insertText(snippet);
}

/**
 * Manages the possibility to insert a @import url(..) inside the editor
 */
async function insertFontCssImport() {
	// Holds the details of the font (name, subsets, variants, etc)
	const font = await getGoogleFontFamilyItem();

	// Creating the @import url(...) snippet
	const snippet = `@import url(${GoogleApi.generateUrl(font)}&display=swap);`;

	// Inserting the @import inside the editor
	insertText(snippet);
}

async function getGoogleFontFamilyItem(): Promise<GoogleFontFamily> {
	const fontsOptions = await GoogleApi.getGoogleFonts();

	// Let the user choose and return this choice !
	return vscode.window
		.showQuickPick(
			fontsOptions.map((item: GoogleFontFamily) => item.family),
			pickOptions,
		)
		.then(function (family) {
			// Holds the details of the font (name, subsets, variants, etc)
			return fontsOptions.find(
				(item: GoogleFontFamily) => item.family == family,
			);
		});
}

export async function activate(context: vscode.ExtensionContext) {
	// The insertLink Command to insert a <link href="..">
	let insertLink = vscode.commands.registerCommand(
		'extension.insertLink',
		() => {
			var editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage(
					"You can't use this extension if your are not in a HTML file context !",
				);
				return; // No open text editor
			}

			insertFontLink();
		},
	);

	// The insertImport Command to insert a @import url(...)
	let insertImport = vscode.commands.registerCommand(
		'extension.insertImport',
		() => {
			var editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage(
					"You can't use this extension if your are not in a HTML file context !",
				);
				return; // No open text editor
			}

			insertFontCssImport();
		},
	);
	const fontsOptions = await GoogleApi.getGoogleFonts();

	let browserFonts = vscode.commands.registerCommand(
		'extension.browseFonts',
		() => {
			const panel = vscode.window.createWebviewPanel(
				'browseFonts',
				'Browse Fonts',
				vscode.ViewColumn.Two,
				{ enableScripts: true },
			);

			panel.webview.html = getBrowseFontHtml();

			loadVisibleItems(panel, fontsOptions);

			panel.webview.onDidReceiveMessage(message => {
				if (message.command === 'scroll') {
					loadVisibleItems(panel, fontsOptions);
				} else if (message.command === 'copyImport') {
					vscode.env.clipboard.writeText(
						`@import url(${GoogleApi.generateUrl(
							fontsOptions.find(
								(item: GoogleFontFamily) => item.family == message.font,
							),
						)}&display=swap);`,
					);

					vscode.window.showInformationMessage(
						'@import code of the ' + message.font + ' font has been copied !',
					);
				} else if (message.command === 'copyLink') {
					vscode.env.clipboard.writeText(
						`<link href="${GoogleApi.generateUrl(
							fontsOptions.find(
								(item: GoogleFontFamily) => item.family == message.font,
							),
						)}&display=swap" rel="stylesheet" />`,
					);

					vscode.window.showInformationMessage(
						'<link> code of the ' + message.font + ' font has been copied !',
					);
				} else if (message.command === 'searchFont') {
					if (message.query != '') {
						const fonts = fontsOptions.filter((item: GoogleFontFamily) =>
							item.family.toLowerCase().startsWith(message.query.toLowerCase()),
						);

						let bodyContent = '';
						let cssContent = '';

						fonts.forEach(font => {
							bodyContent += GenerateFontDiv(font);
							cssContent += `@import url(${GoogleApi.generateUrl(
								font,
							)}&display=swap);\n`;
						});

						panel.webview.postMessage({
							command: 'searchResult',
							bodyContent,
							cssContent,
						});
					}
				}
			});
		},
	);

	// Adding our commands to the context
	context.subscriptions.push(insertLink);
	context.subscriptions.push(insertImport);
	context.subscriptions.push(browserFonts);
}

let loadedItems = 0;
const chunkSize = 50;

/**
 * Generate a new list of items
 * @param panel The WebView
 * @param fontsOptions Fonts List
 */
function loadVisibleItems(panel, fontsOptions) {
	const visibleFonts = fontsOptions.slice(loadedItems, loadedItems + chunkSize);
	loadedItems += chunkSize;

	let bodyContent = '';
	let cssContent = '';

	visibleFonts.forEach(font => {
		bodyContent += GenerateFontDiv(font);
		cssContent += `@import url(${GoogleApi.generateUrl(font)}&display=swap);\n`;
	});

	panel.webview.postMessage({ command: 'addContent', cssContent, bodyContent });
}

/**
 * Generate a div that contains a font
 * @param font The font
 */
function GenerateFontDiv(font) {
	const divStyle =
		'padding : 5px; color: white; background-color: #25262b; margin: 10px; border-radius: 5px; display: flex; justify-content: space-between; width: 95%; align-items: center;';
	const titleStyle = `font-family:'${font.family}';`;
	const buttonsStyle = `display: flex; margin: 0 10px; align-items: center;`;
	const buttonStyle = `cursor: pointer; margin: 0 5px;`;

	const importOnClick = `vscode.postMessage({ command: 'copyImport', font:'${font.family}'})`;
	const linkOnClick = `vscode.postMessage({ command: 'copyLink', font:'${font.family}' })`;

	return `<div style="${divStyle}">
    <p style="${titleStyle}">${font.family}</p>
    <div style="${buttonsStyle}">
      <p style="${buttonStyle}" onClick="${importOnClick}">@import</p>
      <p style="${buttonStyle}" class="link-text" onClick="${linkOnClick}"></p>
    </div>
  </div>\n`;
}

function getBrowseFontHtml() {
	return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Browse Fonts</title>
        <style>
          .vscode-input {
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            padding: 3px;
            display: inline-block;
          }

          .vscode-input input {
            border: none;
            background: transparent;
            color: var(--vscode-input-foreground);
            font-size: 13px;
            outline: none;
            width: 100%;
          }
        </style>
    </head>
    <body>
      <div id="search" style="display: none; padding: 10px;">
        <div style="display:flex; align-items: center;">
          <p>Search Font : </p>
          <div class="vscode-input" style="margin: 0 5px; height: 20px">
            <input data-vscode-context='{"webviewSection": "editor"}' type="text" id="search-input" placeholder="Search font here..."/>
          </div>
        </div>
        <div id="search-result"></div>
      </div>
    </body>
    <script>
      const vscode = acquireVsCodeApi();
      const style = document.createElement("style")
      style.type = 'text/css';

      const fontsDiv = document.createElement("div")
      document.body.appendChild(fontsDiv)

      const searchDiv = document.getElementById("search")
      const searchInput = document.getElementById("search-input")
      const searchResult = document.getElementById("search-result")

      let cssContent = ''

      document.addEventListener('scroll', function() {
        const isScrollAtBottom = (window.innerHeight + window.scrollY) >= document.body.scrollHeight;
        if (isScrollAtBottom) {
         vscode.postMessage({ command: 'scroll' });
        }
      });

      window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
          case 'addContent':
            style.textContent += message.cssContent
            fontsDiv.innerHTML += message.bodyContent
            UpdateLinkText()
            break;
          case 'searchResult':
            style.textContent = message.cssContent
            searchResult.innerHTML = message.bodyContent
            UpdateLinkText()
            break;
        }
      });

      function UpdateLinkText(){
        Array.from(document.getElementsByClassName("link-text")).forEach(e => e.innerText = "<link>")
      }

      console.log(searchInput)
      searchInput.onkeydown = function(e){
        if(e.key == "Enter"){
          style.textCotent = ""
          searchResult.innerHTML = "Loading..."
          vscode.postMessage({ command: 'searchFont', query: e.target.value });
        }
      }

      window.onkeydown = function(e){
        if(e.keyCode == 70 && e.ctrlKey){
          searchDiv.style.display = 'block'
          fontsDiv.style.display = 'none'
          cssContent = style.textContent
        }else if(e.key == "Escape"){
          searchDiv.style.display = 'none'
          fontsDiv.style.display = 'block'
          style.textContent = cssContent
        }
      }

      document.head.appendChild(style)
    </script>
    </html>`;
}

export function deactivate() {}

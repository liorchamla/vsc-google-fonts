'use strict';

import * as vscode from 'vscode';
import fetch from 'node-fetch';

// Holds the pick options for the user :
const pickOptions = {
    matchOnDescription: true,
    matchOnDetail: true,
    placeHolder: "Type Google Font name"
}

/**
 * Allows to insert any text inside the editor
 * @param text The text you want to insert in the editor at the position where the cursor is
 */
function insertText(text) {
    var editor = vscode.window.activeTextEditor;
    editor.edit(function (editBuilder) {
        editBuilder.delete(editor.selection);
    }).then(function () {
        editor.edit(function (editBuilder) {
            editBuilder.insert(editor.selection.start, text);
        });
    });
}

/**
 * Creates a final URL to reach a Google Fonts stylesheet
 * @param font The Google Font API item
 */
function createGoogleFontURL(font) {
    // Will hold the url to reach the picked font
    const fontUrl = [];

    // Base URL
    fontUrl.push('https://fonts.googleapis.com/css?family=');
    // Adding the font name
    fontUrl.push(font.family.replace(/ /g, '+'));
    // Adding font variants
    if(font.variants){
        fontUrl.push(':');
        fontUrl.push(font.variants.join(','));
    }
    // Creating the final URL
    return fontUrl.join('');
}


/**
 * Manage the possibility to insert a <link href=".." /> inside the editor
 */
function insertFontLink() {
    /**
     * Fetch Google Fonts API to find fonts, sorted by trending, then returns an array of displayable options in the vscode.window.showQuickPick
     * Items are also holding the details from the font in order to use them later, after the user picked a font
     */
    fetch('https://www.googleapis.com/webfonts/v1/webfonts?sort=trending&key=AIzaSyBVwVbN-QhwcaSToxnk1zCEpLuoNXBtFdo')
    .then(response => response.json())
    .then(json => {

        const fontsOptions = json.items;
    
        // Let the user choose !
        vscode.window.showQuickPick(fontsOptions.map(item => item.family), pickOptions).then(function (family) {
            
            // Holds the details of the font (name, subsets, variants, etc)
            const font = fontsOptions.find(item => item.family == family);
    
            // Creating the <link> markup
            const snippet = `<link href="${createGoogleFontURL(font)}" rel="stylesheet" />`;
    
            // Inserting the link markup inside the editor
            insertText(snippet);
        });
    });
}

/**
 * Manages the possibility to insert a @import url(..) inside the editor
 */
function insertFontCssImport() {
    /**
     * Fetch Google Fonts API to find fonts, sorted by trending, then returns an array of displayable options in the vscode.window.showQuickPick
     * Items are also holding the details from the font in order to use them later, after the user picked a font
     */
    fetch('https://www.googleapis.com/webfonts/v1/webfonts?sort=trending&key=AIzaSyBVwVbN-QhwcaSToxnk1zCEpLuoNXBtFdo')
    .then(response => response.json())
    .then(json => {
        
        const fontsOptions = json.items;
        // Let the user choose !
        vscode.window.showQuickPick(fontsOptions.map(item => item.family), pickOptions).then(function (family) {
            
            // Holds the details of the font (name, subsets, variants, etc)
            const font = fontsOptions.find(item => item.family == family);
    
            // Creating the @import url(...) snippet
            const snippet = `@import url(${createGoogleFontURL(font)});`;
    
            // Inserting the @import inside the editor
            insertText(snippet);
        });
    });
}

export function activate(context: vscode.ExtensionContext) {
    // The insertLink Command to insert a <link href="..">
    let insertLink = vscode.commands.registerCommand('extension.insertLink', () => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('You can\'t use this extension if your are not in a HTML file context !')
            return; // No open text editor
        }

        insertFontLink();
    });

    // The insertImport Command to insert a @import url(...)
    let insertImport = vscode.commands.registerCommand('extension.insertImport', () => {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('You can\'t use this extension if your are not in a HTML file context !')
            return; // No open text editor
        }

        insertFontCssImport();
    });

    // Adding our commands to the context 
    context.subscriptions.push(insertLink);
    context.subscriptions.push(insertImport);
}

export function deactivate() {}
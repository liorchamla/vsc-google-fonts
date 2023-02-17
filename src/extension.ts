'use strict';

import * as vscode from 'vscode';
import GoogleFontFamily from './font';
import GoogleApi from './google.api';

// Holds the pick options for the user :
const pickOptions = {
  matchOnDescription: true,
  matchOnDetail: true,
  placeHolder: 'Type Google Font name'
};

/**
 * Allows to insert any text inside the editor
 * @param text The text you want to insert in the editor at the position where the cursor is
 */
function insertText(text) {
  var editor = vscode.window.activeTextEditor;
  editor
    .edit(function(editBuilder) {
      editBuilder.delete(editor.selection);
    })
    .then(function() {
      editor.edit(function(editBuilder) {
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
    font
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
      pickOptions
    )
    .then(function(family) {
      // Holds the details of the font (name, subsets, variants, etc)
      return fontsOptions.find(
        (item: GoogleFontFamily) => item.family == family
      );
    });
}

export function activate(context: vscode.ExtensionContext) {
  // The insertLink Command to insert a <link href="..">
  let insertLink = vscode.commands.registerCommand(
    'extension.insertLink',
    () => {
      var editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage(
          "You can't use this extension if your are not in a HTML file context !"
        );
        return; // No open text editor
      }

      insertFontLink();
    }
  );

  // The insertImport Command to insert a @import url(...)
  let insertImport = vscode.commands.registerCommand(
    'extension.insertImport',
    () => {
      var editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage(
          "You can't use this extension if your are not in a HTML file context !"
        );
        return; // No open text editor
      }

      insertFontCssImport();
    }
  );

  // Adding our commands to the context
  context.subscriptions.push(insertLink);
  context.subscriptions.push(insertImport);
}

export function deactivate() {}

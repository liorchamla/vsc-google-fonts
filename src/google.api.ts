import fetch from 'node-fetch';
import GoogleFontFamily from './font';

export default class GoogleApi {
  static getGoogleFonts() {
    return fetch(
      'https://www.googleapis.com/webfonts/v1/webfonts?sort=trending&key=AIzaSyBVwVbN-QhwcaSToxnk1zCEpLuoNXBtFdo'
    )
      .then(response => response.json())
      .then(json => json.items);
  }

  /**
   * Creates a final URL to reach a Google Fonts stylesheet
   * @param font The Google Font API item
   */
  static generateUrl(font: GoogleFontFamily) {
    // Will hold the url to reach the picked font
    const fontUrl = [];

    // Base URL
    fontUrl.push('https://fonts.googleapis.com/css?family=');
    // Adding the font name
    fontUrl.push(font.family.replace(/ /g, '+'));
    // Adding font variants
    if (font.variants) {
      fontUrl.push(':');
      fontUrl.push(font.variants.join(','));
    }
    // Creating the final URL
    return fontUrl.join('');
  }
}

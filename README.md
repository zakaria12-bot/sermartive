# Wordly Dictionary

A single-page English dictionary built with HTML, CSS, and vanilla JavaScript. It uses the [Free Dictionary API](https://dictionaryapi.dev/) and does not require an API key.

## Run locally

Serve this directory with a local static web server, then open its URL in a browser. For example:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. Serving the page over HTTP avoids browser restrictions that can affect API requests from a `file:` URL.

## Features

- Search for a word without reloading the page.
- View pronunciation, meanings by part of speech, definitions, examples, synonyms, and available source links.
- Play pronunciation audio when the API provides an audio file.
- Save and remove favorite words; favorites persist in browser `localStorage` and can be searched again from the list.
- Receive feedback for empty or invalid input, missing words, network/API errors, and unavailable audio.

## API response model

The API endpoint is `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`. It returns an array of entries. The page normalizes the optional API fields into this view model:

```js
{
  word: "serendipity",
  phonetic: "/ˌser.ənˈdɪp.ə.ti/",
  audioUrl: "https://...",
  meanings: [
    {
      partOfSpeech: "noun",
      definitions: [
        { text: "The occurrence of events by chance in a happy way.", example: "" }
      ],
      synonyms: []
    }
  ],
  sourceUrls: ["https://..."]
}
```

Pronunciation, audio, examples, synonyms, and source URLs may be absent in API responses; the UI handles each as optional.

## Manual checks

1. Search for a known word such as `serendipity`; confirm the available definitions and pronunciation appear without a page reload.
2. Use the audio button when one is available.
3. Check a result that has no audio or synonyms; the pronunciation fallback should appear and no empty synonym section should be shown.
4. Search for a made-up word to confirm the not-found message.
5. Submit whitespace or invalid characters to confirm input validation.
6. Save a word, refresh the page, and confirm it remains in the saved list; remove it and confirm it disappears.
# sermartive

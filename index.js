const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const FAVORITES_KEY = "wordly-favorites";

const form = document.querySelector("#search-form");
const wordInput = document.querySelector("#word-input");
const statusMessage = document.querySelector("#status-message");
const resultsSection = document.querySelector("#results-section");
const resultCard = document.querySelector("#result-card");
const favoritesList = document.querySelector("#favorites-list");
const emptyFavorites = document.querySelector("#empty-favorites");
const savedCount = document.querySelector("#saved-count");

let requestController;
let currentWord = "";
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((word) => typeof word === "string")
      : [];
  } catch (error) {
    console.error("Unable to load saved words.", error);
    setStatus("Saved words are unavailable in this browser.", "error");
    return [];
  }
}

function setStatus(message, state = "") {
  statusMessage.textContent = message;
  if (state) {
    statusMessage.dataset.state = state;
  } else {
    delete statusMessage.dataset.state;
  }
}

function normalizeEntry(entries) {
  const firstEntry = entries[0];
  const phonetics = entries.flatMap((entry) => entry.phonetics || []);
  const pronunciation = phonetics.find((item) => item.text);
  const audio = phonetics.find((item) => item.audio);
  const meanings = [];

  entries.forEach((entry) => {
    (entry.meanings || []).forEach((meaning) => {
      meanings.push({
        partOfSpeech: meaning.partOfSpeech || "Meaning",
        definitions: (meaning.definitions || [])
          .filter((definition) => definition.definition)
          .map((definition) => ({
            text: definition.definition,
            example: definition.example || "",
          })),
        synonyms: meaning.synonyms || [],
      });
    });
  });

  return {
    word: firstEntry.word || currentWord,
    phonetic: pronunciation?.text || firstEntry.phonetic || "",
    audioUrl: audio?.audio || "",
    meanings,
    sourceUrls: [...new Set(entries.flatMap((entry) => entry.sourceUrls || []))],
  };
}

function appendTextElement(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderResult(entry) {
  resultCard.replaceChildren();

  const heading = document.createElement("div");
  heading.className = "word-heading";

  const wordDetails = document.createElement("div");
  appendTextElement(wordDetails, "h2", "word-title", entry.word);

  const phoneticRow = document.createElement("div");
  phoneticRow.className = "phonetic-row";
  appendTextElement(
    phoneticRow,
    "span",
    "phonetic",
    entry.phonetic || "Pronunciation not available",
  );

  if (entry.audioUrl) {
    const audioButton = document.createElement("button");
    audioButton.className = "audio-button";
    audioButton.type = "button";
    audioButton.setAttribute("aria-label", `Play pronunciation of ${entry.word}`);
    audioButton.title = "Play pronunciation";
    audioButton.innerHTML =
      '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 8v4h3l4 3V5.5l-4 2.5h-3ZM13 7.2a4 4 0 0 1 0 5.6M14.8 5a7 7 0 0 1 0 10"></path></svg>';
    audioButton.addEventListener("click", () => playAudio(entry.audioUrl));
    phoneticRow.append(audioButton);
  }

  wordDetails.append(phoneticRow);
  heading.append(wordDetails);

  const isSaved = favorites.some(
    (word) => word.toLocaleLowerCase() === entry.word.toLocaleLowerCase(),
  );
  const favoriteButton = document.createElement("button");
  favoriteButton.className = `favorite-button${isSaved ? " is-saved" : ""}`;
  favoriteButton.type = "button";
  favoriteButton.setAttribute("aria-pressed", String(isSaved));
  favoriteButton.innerHTML =
    '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16.2 3.8 10a3.7 3.7 0 0 1 5.2-5.2L10 5.8l1-1a3.7 3.7 0 0 1 5.2 5.2L10 16.2Z"></path></svg>';
  appendTextElement(
    favoriteButton,
    "span",
    "",
    isSaved ? "Saved" : "Save word",
  );
  favoriteButton.addEventListener("click", () => toggleFavorite(entry.word));
  heading.append(favoriteButton);
  resultCard.append(heading);

  const divider = document.createElement("hr");
  divider.className = "result-divider";
  resultCard.append(divider);

  if (entry.meanings.length) {
    entry.meanings.forEach((meaning) => {
      const meaningSection = document.createElement("section");
      meaningSection.className = "meaning";
      appendTextElement(
        meaningSection,
        "h3",
        "part-of-speech",
        meaning.partOfSpeech,
      );

      if (meaning.definitions.length) {
        const definitionList = document.createElement("ol");
        definitionList.className = "definition-list";
        meaning.definitions.forEach((definition) => {
          const item = document.createElement("li");
          item.className = "definition-item";
          const content = document.createElement("div");
          appendTextElement(content, "p", "definition-text", definition.text);
          if (definition.example) {
            appendTextElement(content, "p", "example", definition.example);
          }
          item.append(content);
          definitionList.append(item);
        });
        meaningSection.append(definitionList);
      }

      const synonyms = [...new Set(meaning.synonyms)].filter(Boolean);
      if (synonyms.length) {
        const synonymsSection = document.createElement("div");
        synonymsSection.className = "synonyms-block";
        appendTextElement(synonymsSection, "span", "detail-label", "Synonyms");
        const synonymList = document.createElement("ul");
        synonymList.className = "synonym-list";
        synonyms.forEach((synonym) => {
          appendTextElement(synonymList, "li", "synonym-chip", synonym);
        });
        synonymsSection.append(synonymList);
        meaningSection.append(synonymsSection);
      }

      resultCard.append(meaningSection);
    });
  } else {
    appendTextElement(
      resultCard,
      "p",
      "definition-text",
      "Definitions are not available for this entry.",
    );
  }

  if (entry.sourceUrls.length) {
    const sourceContainer = document.createElement("div");
    sourceContainer.className = "source-links";
    appendTextElement(sourceContainer, "span", "", "Sources:");
    entry.sourceUrls.forEach((sourceUrl, index) => {
      try {
        const url = new URL(sourceUrl);
        if (url.protocol !== "https:") return;
        const link = document.createElement("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `Source ${index + 1}`;
        link.setAttribute("aria-label", `Open source ${index + 1} in a new tab`);
        sourceContainer.append(link);
      } catch {
        return;
      }
    });
    if (sourceContainer.querySelector("a")) resultCard.append(sourceContainer);
  }

  resultsSection.hidden = false;
}

async function playAudio(audioUrl) {
  try {
    const audio = new Audio(audioUrl);
    await audio.play();
    setStatus("");
  } catch (error) {
    console.error("Unable to play pronunciation audio.", error);
    setStatus("Audio playback is unavailable. Please try again.", "error");
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error("Unable to save favorite words.", error);
    setStatus("Your browser could not save this word.", "error");
    return false;
  }
}

function toggleFavorite(word) {
  const existingIndex = favorites.findIndex(
    (favorite) => favorite.toLocaleLowerCase() === word.toLocaleLowerCase(),
  );

  if (existingIndex === -1) {
    favorites = [...favorites, word];
  } else {
    favorites = favorites.filter((_, index) => index !== existingIndex);
  }

  saveFavorites();
  renderFavorites();
  if (resultsSection.contains(resultCard)) {
    const button = resultCard.querySelector(".favorite-button");
    const isSaved = favorites.some(
      (favorite) => favorite.toLocaleLowerCase() === word.toLocaleLowerCase(),
    );
    if (button) {
      button.classList.toggle("is-saved", isSaved);
      button.setAttribute("aria-pressed", String(isSaved));
      button.querySelector("span").textContent = isSaved ? "Saved" : "Save word";
    }
  }
}

function renderFavorites() {
  favoritesList.replaceChildren();
  favorites.forEach((word) => {
    const item = document.createElement("li");
    item.className = "favorite-item";

    const searchButton = document.createElement("button");
    searchButton.className = "favorite-word";
    searchButton.type = "button";
    searchButton.textContent = word;
    searchButton.setAttribute("aria-label", `Search for ${word}`);
    searchButton.addEventListener("click", () => searchWord(word));

    const removeButton = document.createElement("button");
    removeButton.className = "remove-favorite";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Remove ${word} from saved words`);
    removeButton.addEventListener("click", () => toggleFavorite(word));

    item.append(searchButton, removeButton);
    favoritesList.append(item);
  });

  savedCount.textContent = String(favorites.length);
  emptyFavorites.hidden = favorites.length > 0;
}

async function searchWord(rawWord) {
  const word = rawWord.trim();
  if (!word) {
    setStatus("Enter a word to search.", "error");
    wordInput.focus();
    return;
  }
  if (word.length > 80 || !/^[\p{L}][\p{L}'’ -]*$/u.test(word)) {
    setStatus("Enter a word using letters, spaces, apostrophes, or hyphens.", "error");
    wordInput.focus();
    return;
  }

  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  currentWord = word;
  resultsSection.hidden = true;
  resultCard.replaceChildren();
  setStatus(`Looking up “${word}”…`, "loading");
  form.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(`${API_URL}${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 404) {
        setStatus(`No definition found for “${word}”. Check the spelling and try again.`, "error");
        return;
      }
      throw new Error(`Dictionary API returned ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      setStatus(`No definition found for “${word}”. Check the spelling and try again.`, "error");
      return;
    }

    renderResult(normalizeEntry(data));
    setStatus("");
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Dictionary lookup failed.", error);
    setStatus("We couldn’t reach the dictionary. Check your connection and try again.", "error");
  } finally {
    if (requestController === controller) {
      form.removeAttribute("aria-busy");
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchWord(wordInput.value);
});

renderFavorites();

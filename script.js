const textArea = document.querySelector(".textArea");

let openAIKey = "";

// Fetches your OpenAI API key
async function fetchOpenAIKey() {
  try {
    const response = await fetch(
      "https://oh3uau67qoyk7juqhwo75ivyta0hhhcy.lambda-url.eu-west-2.on.aws/",
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      const responseData = await response.json();
      openAIKey = responseData.key;
    }
  } catch (error) {
    console.error("Error fetching OpenAI key:", error);
  }
}

// Sends text to OpenAI, receives a response, and appends it as grey text
function sendToOpenAI(textToParse) {
  const startTime = performance.now();
  const prompt =
    "Continue the provided text, do not output the provided text, just continue writing based on the context you have.";

  const data = {
    model: "gpt-3.5-turbo-0125",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: textToParse },
    ],
    max_tokens: 32,
  };

  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIKey}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      const endTime = performance.now();
      console.warn(`Response received in ${endTime - startTime} milliseconds.`);

      const responseMessage = data.choices[0].message.content.trim();
      let currentText = textArea.innerHTML.trimEnd();
      if (!currentText.endsWith(" ")) {
        currentText += " "; // Ensure one space before appending the response
      }
      const responseSpan = `<span class="generated-content">${responseMessage}</span>`;
      textArea.innerHTML = currentText + responseSpan;
    })
    .catch((error) => console.error("OpenAI Error:", error));
}

// Monitors user input and triggers OpenAI generation (after typing stops)
let typingTimer;
const doneTypingInterval = 1000; // 1 second

function doneTyping() {
  const textToParse = textArea.innerText;
  if (textToParse.trim() !== "" && textToParse.split(" ").length >= 2) {
    sendToOpenAI(textToParse);
  }
}

// Clears generated text if the user takes actions other than Tab
function clearGeneratedText() {
  const generatedSpans = document.querySelectorAll(".generated-content");
  generatedSpans.forEach((span) => span.remove());
}

// Event Listeners
fetchOpenAIKey(); // Initialize by fetching the OpenAI Key

function placeCursorAtEnd(element) {
  element.focus();
  if (
    typeof window.getSelection != "undefined" &&
    typeof document.createRange != "undefined"
  ) {
    let range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    let selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
    let textRange = document.body.createTextRange();
    textRange.moveToElementText(element);
    textRange.collapse(false);
    textRange.select();
  }
}

textArea.addEventListener("input", () => {
  clearTimeout(typingTimer);
  if (document.hasFocus()) {
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.metaKey && event.key === "g") {
    // Command+G
    event.preventDefault();
    sendToOpenAI(textArea.innerText);
  } else if (event.key === "Tab") {
    // Accept generated text
    event.preventDefault();
    const generatedSpans = document.querySelectorAll(".generated-content");
    let generatedText = "";
    generatedSpans.forEach((span) => {
      generatedText += span.textContent + " "; // Ensure one space after each span's text
      span.classList.remove("generated-content"); // Turn text black
      span.remove(); // Remove the span elements
    });
    textArea.innerHTML = textArea.innerHTML.trimEnd() + generatedText.trimEnd(); // Ensure no trailing space
    placeCursorAtEnd(textArea);
  } else {
    clearGeneratedText();
  }
});

textArea.addEventListener("click", clearGeneratedText);
textArea.addEventListener("focus", clearGeneratedText);

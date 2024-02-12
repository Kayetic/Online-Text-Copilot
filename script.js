const textArea = document.querySelector(".textArea");

let openAIKey = "";

async function fetchOpenAIKey() {
  try {
    const response = await fetch(
      `https://oh3uau67qoyk7juqhwo75ivyta0hhhcy.lambda-url.eu-west-2.on.aws/`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      const responseData = await response.json();
      console.log("Received OpenAI API key:", responseData);
      openAIKey = responseData.key;
    }
  } catch (error) {
    console.error("Error fetching OpenAI key:", error);
  }
}

fetchOpenAIKey();

const sendToOpenAI = function (textToParse) {
  const startTime = performance.now();
  const prompt = `Continue the provided text, do not output the provided text, just continue writing based on the context you have.`;
  console.log(prompt);
  const data = {
    model: "gpt-3.5-turbo-0125",
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: textToParse,
      },
    ],
    max_tokens: 8,
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
      const timeTaken = endTime - startTime;
      console.warn(
        `Response received in ${timeTaken.toFixed(2)} milliseconds.`
      );
      console.log("Successfully fetched OpenAI response:", data);
      const responseMessage = data.choices[0].message.content;

      // Append the response to the contenteditable div
      let currentText = textAreaDiv.innerHTML;
      if (!currentText.endsWith(" ")) {
        currentText += " ";
      }
      textArea.innerHTML = currentText + responseMessage + " ";
    })
    .catch((error) => {
      console.error("OpenAI Error:", error);
    });
};

document
  .getElementById("textArea")
  .addEventListener("keydown", function (event) {
    if (event.metaKey && event.key === "g") {
      event.preventDefault(); // Prevents the default action of the keypress
      console.log("Command + G was pressed");
      const textToParse = textArea.innerText;
      sendToOpenAI(textToParse);
      //   sendToMixtral(textToParse);
    }
  });

const sendToMixtral = function (textToParse) {
  const startTime = performance.now();
  const prompt = `Continue the provided text, do not output the provided text, just continue writing based on the context you have.

  Text to continue: 

  "${textToParse}"`;
  console.log(prompt);
  const data = {
    model: "accounts/fireworks/models/mixtral-8x7b-instruct",
    stream: false,
    n: 1,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    stop: ["<|im_start|>", "<|im_end|>", "<|endoftext|>"],
    top_p: 0.9,
    top_k: 20,
    presence_penalty: 0.6,
    frequency_penalty: 0.2,
    context_length_exceeded_behavior: "truncate",
    temperature: 0.6,
    max_tokens: 32,
  };

  fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer 1kl9aNR9Qn98OGW9wEdLGDk5GawQqFdZwqXliGS4Hdqnfq72`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      console.warn(
        `Response received in ${timeTaken.toFixed(2)} milliseconds.`
      );
      console.log("Successfully fetched Mixtral response:", data);
      const responseMessage = data.choices[0].message.content; // The JSON string from OpenAI

      // Append the response to the text area
      // check if the last character is a space, if it is then leave, else add a space
      const lastChar = textArea.innerText.slice(-1);
      if (lastChar !== " ") {
        textArea.innerText += " ";
        const responseSpan = `<span class="temp-tokens">${responseMessage} </span>`;
        textArea.innerHTML += responseSpan;
      }
      const responseSpan = `<span class="temp-tokens">${responseMessage} </span>`;
      textArea.innerHTML += responseSpan + " ";
    })
    .catch((error) => {
      console.error("Mixtral Error:", error);
    });
};

// monitor when the user stops typing for more than 1 second then send the text to OpenAI
let typingTimer;
let doneTypingInterval = 1000; // 1.5 secons

textArea.addEventListener("input", function () {
  clearTimeout(typingTimer);
  if (document.hasFocus()) {
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
  }
});

function doneTyping() {
  const textToParse = textArea.innerText;
  if (textToParse.trim() !== "" && textToParse.split(" ").length >= 2) {
    console.log("User stopped typing, sending to OpenAI");
    // sendToOpenAI(textToParse);
    sendToMixtral(textToParse);
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Tab") {
    event.preventDefault(); // Prevent the default tab action

    // Find all temp-tokens spans in the textArea and change their class to accepted-tokens
    const tempTokens = document.querySelectorAll(".textArea .temp-tokens");
    tempTokens.forEach((token) => {
      token.classList.remove("temp-tokens");
      token.classList.add("accepted-tokens");
    });

    // Move cursor to the end of the textArea
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(textArea);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    textArea.focus();
  }
});

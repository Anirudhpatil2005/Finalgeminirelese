// Getting Elements from the html

const typingForm = document.querySelector(".typing-form");
const chat = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleTheme = document.querySelector("#theme-toogle-button");
const deleteChat = document.querySelector("#delete-chat-button");

// Default state for API handling.
let userMessage = null;
let apiResponse = false;

// API Configuration
const API_KEY = "AIzaSyDc7ZMIjDFafihIUMSPQyNZYGuL4-rx3wQ";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

// Saving the theme in the local storage
const loadData = () => {
  const savedChats = localStorage.getItem("savedchats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  document.body.classList.toggle("light_mode", isLightMode);
  toggleTheme.innerText = isLightMode ? "dark_mode" : "light_mode";
  
  // Clear the chat when clicking delete || restoring the chats
  chat.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats);
  chat.scrollTo(0, chat.scrollHeight);
};

// Dark mode/light mode toggle theme
toggleTheme.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleTheme.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Creating a div element for messages
const createMessage = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Creating the typing effect for displaying words one by one
const typingEffect = (text, textElement, messageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    messageDiv.querySelector(".icon").classList.add("hide");
    
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      apiResponse = false;
      messageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedchats", chat.innerHTML);
    }
    chat.scrollTo(0, chat.scrollHeight);
  }, 100);
};

// Fetching the data from the API based on the user prompt
const generateResponse = async (messageDiv) => {
  const textElement = messageDiv.querySelector(".text");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const apiData = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1");
    typingEffect(apiData, textElement, messageDiv);
  } catch (error) {
    apiResponse = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    messageDiv.classList.remove("loading");
  }
};

// Creating a loading animation while waiting for the response from the API
const loadingAnimation = () => {
  const tag = `<div class="message-content">
                     <img class="avatar" src="images/gemini.svg" alt="Gemini logo">
                     <p class="text"></p>
                     <div class="loading-indicator">
                     <div class="loading-bar"></div>
                     <div class="loading-bar"></div>
                     <div class="loading-bar"></div>
                     </div>
                     </div>
                     <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const messageDiv = createMessage(tag, "incoming", "loading");
  chat.appendChild(messageDiv);
  chat.scrollTo(0, chat.scrollHeight);
  generateResponse(messageDiv);
};

// Copy the responses
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => (copyButton.innerText = "content_copy"), 1000);
};

// Handling the message from the prompt to API and adding loading effect when the response comes
const sendMessage = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || apiResponse) return;
  apiResponse = true;
  const tag = `<div class="message-content">
                     <img class="avatar" src="images/user.jpg" alt="user profile photo">
                     <p class="text"></p>
                     </div>`;
  const sendMessageDiv = createMessage(tag, "outgoing");
  sendMessageDiv.querySelector(".text").innerText = userMessage;
  chat.appendChild(sendMessageDiv);
  
  typingForm.reset();
  document.body.classList.add("hide-header");
  chat.scrollTo(0, chat.scrollHeight);
  setTimeout(loadingAnimation, 500);
};

// Generating the API response while clicking the suggestions
suggestions.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    sendMessage();
  });
});

// Delete button to delete all the chats
deleteChat.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("savedchats");
    loadData();
  }
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

loadData();

let aiSession = null; // Hold the AI session globally

chrome.runtime.onStartup.addListener(async function() {
  try {
    await ensureAISession();
  } catch (error) {
    console.error("Failed to process URL change due to AI session issues:", error);
  }
})


// Function to initialize the AI session (only if it hasn't been initialized)
async function ensureAISession() {
  if (!aiSession) {
    console.log("Initializing AI session...");
    try {
      aiSession = await ai.languageModel.create({
        systemPrompt:
          "You must determine if a website URL given to you is productive or not. League of Legends is Unproductive. Urls relating to Anime, Video Games, and YouTube are Unproductive. Search engines, coding, software dev, AI are productive.",
      });
      console.log("AI session initialized successfully.");
    } catch (error) {
      console.error("Error initializing AI session:", error);
      throw error; // Re-throw the error to handle it appropriately
    }
  }
}

// Handle URL changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    console.log(`URL changed to: ${changeInfo.url}`);
    try {
      // Ensure AI session is initialized before processing the URL
      await ensureAISession();
      await evaluateURL(tabId, changeInfo.url);
    } catch (error) {
      console.error("Failed to process URL change due to AI session issues:", error);
    }
  }
});

// Function to evaluate URLs using the AI session
async function evaluateURL(tabId, url) {
  try {
    // Use the AI session for evaluating the URL
    const response = await aiSession.prompt(
      `For the following url tell me on whether this website is productive or unproductive, if it unproductive give me a one word reason why not (maximum output 2 words): ${url}`
    );

    console.log(`AI Response for URL ${url}: ${response}`);

    if (response.trim().toLowerCase().includes("unproductive")) {
      console.log(`Blocking unproductive website: ${url}`);

      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (blockedUrl) => {
          document.body.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f2f2f2; font-family: Arial, sans-serif;">
            <p style="color:red; text-align:center; font-size: 24px; margin: 0;">
              <strong>This website is blocked</strong><br>
              as it is deemed unproductive.<br><br>
              URL: ${blockedUrl}
            </p>
          </div>
        `;
          document.title = "Blocked";
        },
        args: [url],
      });
    }
    // // Inject a script to alert the user about the evaluation
    // await chrome.scripting.executeScript({
    //   target: { tabId: tabId },
    //   func: (url, response) =>
    //     alert(`The website "${url}" is deemed: ${response}`),
    //   args: [url, response],
    // });
    //
  } catch (error) {
    // console.error("Error evaluating URL:", error);
  }
}

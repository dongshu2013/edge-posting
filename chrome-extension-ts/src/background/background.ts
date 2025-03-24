import { summarizeProfile } from "../services/ai";
import { extractTwitterPosts } from "../twitter/timeline";
import { convertTwitterPostToMarkdown } from "../twitter/common";
import { Settings, DEFAULT_SETTINGS } from "../types";

// Initialize extension settings if not already set
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Extension installed/updated");
  const settings = await new Promise<Settings>((resolve) => {
    chrome.storage.sync.get(["settings"], (result) => {
      resolve(result.settings);
    });
  });

  if (!settings) {
    console.log("Initializing default settings");
    await new Promise<void>((resolve) => {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS }, resolve);
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === "ANALYZE_PROFILE") {
    handleProfileAnalysis(message.html);
    return true; // Will respond asynchronously
  }

  if (message.type === "PROFILE_TRAIT") {
    console.log("Handling profile trait update");
    // Save the profile data
    chrome.storage.sync.get(["profile"], (result) => {
      console.log("Retrieved profile:", result.profile);
      const profile = message.data.text;
      chrome.storage.sync.set({ profile }, () => {
        console.log("Profile saved, forwarding to popup");
        // Forward the text data to the popup
        chrome.runtime.sendMessage({
          type: "PAGE_ANALYSIS",
          data: {
            text: profile,
          },
        });
      });
    });
  }

  if (message.type === "GET_PROFILE_CONTENT") {
    console.log("Getting profile content");
    // Retrieve existing profile content
    chrome.storage.sync.get(["profile"], (result) => {
      console.log("Retrieved profile:", result);
      sendResponse({ content: result.profile || "" });
    });
    return true; // Required for async response
  }
});

async function handleProfileAnalysis(html: string) {
  try {
    // Get settings
    const settings = await new Promise<Settings>((resolve) => {
      chrome.storage.sync.get(["settings"], (result) => {
        resolve(result.settings || DEFAULT_SETTINGS);
      });
    });

    // Extract posts
    const posts = await extractTwitterPosts(html, settings);

    if (posts.length === 0) {
      throw new Error("No posts found on this profile");
    }

    // Get existing profile content
    const existingContent = await getExistingProfile("");

    // Generate summary
    const postsMarkdown = convertTwitterPostToMarkdown(posts).split("\n");
    const updatedProfile = await summarizeProfile(
      postsMarkdown,
      existingContent,
      settings
    );

    // Save and broadcast the result
    chrome.storage.sync.set({ profile: updatedProfile }, () => {
      chrome.runtime.sendMessage({
        type: "PAGE_ANALYSIS",
        data: {
          text: updatedProfile,
        },
      });
    });
  } catch (error: unknown) {
    console.error("Error in profile analysis:", error);
    chrome.runtime.sendMessage({
      type: "PROFILE_ERROR",
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}

// Helper function to get existing profile content
async function getExistingProfile(url: string) {
  console.log("Getting existing profile content", url);
  return await new Promise<string>((resolve) => {
    chrome.storage.sync.get(["profile"], (result) => {
      resolve(result.profile || "");
    });
  });
}

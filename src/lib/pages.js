export function pageAllowsScripting(url = "") {
  return /^(https?:|file:)/i.test(url);
}

export const SCRIPT_BLOCKED_MESSAGE = "Felt Tip marks http, https, and file pages. This tab needs a normal web page.";

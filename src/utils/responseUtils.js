/**
 * responseUtils.js
 *
 * This utility provides a robust function to extract and process text content
 * from complex, nested, or unpredictable API responses. It's designed to
 * handle various data structures (strings, objects, arrays) and find the
 * meaningful text within them.
 */

/**
 * Simple function to extract text from the API response
 */
export const extractTextFromResponse = (response) => {
	if (!response) return "";

	// If response is a string, return it directly
	if (typeof response === "string") return response;

	// If response has an output property
	if (response.output) {
		// If output is a string, return it
		if (typeof response.output === "string") {
			return response.output;
		}
		// If output is an object, stringify it
		return JSON.stringify(response.output);
	}

	// If nothing else works, stringify the entire response
	return JSON.stringify(response);
};

/**
 * Simple function to check if text contains markdown
 */
export const containsMarkdown = (text) => {
	if (!text || typeof text !== "string") return false;
	return /[*_`#>-]/.test(text);
};

/**
 * Splits a processed response text into logical message parts, assigning a type to each for styling.
 * Also cleans up common formatting issues like duplicate names before the signature.
 *
 * @param {string} text The full, processed text from the response.
 * @returns {Array<{type: string, text: string}>} An array of typed text parts.
 */
export const splitResponseIntoParts = (text) => {
	if (!text || typeof text !== "string") {
		return [];
	}

	let mainText = text;
	let signature = null;

	// Find, extract, and clean the signature from the main text.
	const sigRegex = /(Annie\s*–\s*HR\s*Business\s*Coach\s*)$/i;
	const match = text.match(sigRegex);
	if (match) {
		signature = match[0].trim();
		// Get the text before the signature
		mainText = text.substring(0, match.index);
	}

	// Clean up any trailing "Annie" that might be left before the signature
	mainText = mainText.replace(/Annie\s*$/, "").trim();

	// Split the main content into parts based on known section headers.
	const parts = mainText.split(/(?=How it applies:|Next steps:|Next step:)/g);

	const result = parts
		.map((part) => {
			const trimmedPart = part.trim();
			if (!trimmedPart) return null;

			// Assign a type to each part for styling purposes.
			let type = "answer"; // Default type
			if (trimmedPart.startsWith("How it applies:")) type = "application";
			if (
				trimmedPart.startsWith("Next steps:") ||
				trimmedPart.startsWith("Next step:")
			)
				type = "next-step";

			return { type, text: trimmedPart };
		})
		.filter(Boolean);

	// Add the signature back as a separate, typed part if it exists.
	if (signature) {
		result.push({ type: "signature", text: signature });
	}

	// Final safeguard to remove any bubble that is just the word "Annie".
	return result.filter((p) => p.text.trim().toLowerCase() !== "annie");
};

import { marked } from "marked";

// Configure marked.js for better formatting
marked.setOptions({
	breaks: true, // Convert line breaks to <br>
	gfm: true, // GitHub Flavored Markdown
	headerIds: false, // Don't add IDs to headers
	mangle: false, // Don't mangle email addresses
	sanitize: false, // Allow HTML (we'll sanitize differently)
	smartLists: true, // Use smarter list behavior
	smartypants: true, // Use smart typographic punctuation
});

// Custom renderer for better styling
const renderer = new marked.Renderer();

// Customize heading rendering
renderer.heading = (text, level) => {
	const escapedText = text.toLowerCase().replace(/[^\w]+/g, "-");
	return `<h${level} class="markdown-heading markdown-h${level}">${text}</h${level}>`;
};

// Customize paragraph rendering
renderer.paragraph = (text) => {
	return `<p class="markdown-paragraph">${text}</p>`;
};

// Customize list rendering
renderer.list = (body, ordered) => {
	const type = ordered ? "ol" : "ul";
	const className = ordered
		? "markdown-ordered-list"
		: "markdown-unordered-list";
	return `<${type} class="${className}">${body}</${type}>`;
};

// Customize list item rendering
renderer.listitem = (text) => {
	return `<li class="markdown-list-item">${text}</li>`;
};

// Customize strong/bold rendering
renderer.strong = (text) => {
	return `<strong class="markdown-strong">${text}</strong>`;
};

// Customize emphasis/italic rendering
renderer.em = (text) => {
	return `<em class="markdown-emphasis">${text}</em>`;
};

// Customize code rendering
renderer.code = (code, language) => {
	const langClass = language ? `language-${language}` : "";
	return `<code class="markdown-code ${langClass}">${code}</code>`;
};

// Customize blockquote rendering
renderer.blockquote = (quote) => {
	return `<blockquote class="markdown-blockquote">${quote}</blockquote>`;
};
// Customize link rendering
renderer.link = (href, title, text) => {
	const titleAttr = title ? ` title="${title}"` : "";
	return `<a href="${href}" class="markdown-link" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
};

// Set the custom renderer
marked.use({ renderer });

// Function to parse markdown to HTML
export const parseMarkdown = (markdownText) => {
	try {
		if (!markdownText || typeof markdownText !== "string") {
			return markdownText;
		}

		// Pre-process text to handle special characters and formatting
		let processedText = markdownText;

		// Remove any surrounding quotes
		processedText = processedText.replace(/^["']|["']$/g, "");

		// Normalize newlines
		processedText = processedText.replace(/\\n/g, "\n");
		processedText = processedText.replace(/\n{3,}/g, "\n\n");

		// Convert quotes to proper markdown blockquotes
		processedText = processedText.replace(
			/"([^"]+)"\s*\((.*?)\)/g,
			"> $1\n> — $2"
		);

		// Handle citations and references
		processedText = processedText.replace(
			/\((.*?Code Sections.*?)\)/g,
			"\n\n*Reference: $1*"
		);

		// Convert "**Answer:**" to a special div class
		processedText = processedText.replace(
			/\*\*Answer:\*\*\s*/g,
			'<div class="markdown-answer">'
		);

		// Convert "**How it applies:**" to a special div class
		processedText = processedText.replace(
			/\*\*How it applies:\*\*\s*/g,
			'</div><div class="markdown-application">'
		);

		// Convert "**Next step:**" to a special div class
		processedText = processedText.replace(
			/\*\*Next step:\*\*\s*/g,
			'</div><div class="markdown-next-step">'
		);

		// Handle source citations
		processedText = processedText.replace(
			/\*\(source: ([^,]+), loc: ([^)]+)\)\*/g,
			'<div class="markdown-source">Source: $1, Location: $2</div>'
		);

		// Handle signature
		processedText = processedText.replace(
			/(Annie – HR Business Coach)$/g,
			'\n\n<div class="markdown-signature">$1</div>'
		);

		// Close any open divs at the end
		if (
			processedText.includes("markdown-answer") ||
			processedText.includes("markdown-application") ||
			processedText.includes("markdown-next-step")
		) {
			processedText += "</div>";
		}

		// Parse markdown to HTML
		const html = marked(processedText);
		return html;
	} catch (error) {
		console.error("Error parsing markdown:", error);
		// Return original text if parsing fails
		return markdownText;
	}
};

// Function to detect if text contains markdown
export const containsMarkdown = (text) => {
	if (!text || typeof text !== "string") {
		return false;
	}

	// Common markdown patterns
	const markdownPatterns = [
		/\*\*(.*?)\*\*/, // Bold
		/\*(.*?)\*/, // Italic
		/^#{1,6}\s/, // Headers
		/^[-*+]\s/, // Unordered lists
		/^\d+\.\s/, // Ordered lists
		/`(.*?)`/, // Inline code
		/```[\s\S]*?```/, // Code blocks
		/^>\s/, // Blockquotes
		/\[(.*?)\]\((.*?)\)/, // Links
		// RAG-specific patterns
		/\*\*Answer:\*\*/, // Answer section
		/\*\*How it applies:\*\*/, // How it applies section
		/\*\*Next step:\*\*/, // Next step section
		/\*\(source:.*?\)\*/, // Source citations
		/Annie – HR Business Coach/, // Signature
	];

	return markdownPatterns.some((pattern) => pattern.test(text));
};

// Function to safely render HTML content
export const createMarkup = (htmlContent) => {
	return { __html: htmlContent };
};

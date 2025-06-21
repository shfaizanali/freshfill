import React from "react";
import {
	parseMarkdown,
	containsMarkdown,
	createMarkup,
} from "../utils/markdownUtils";
import "../components/MarkdownStyles.css";

/**
 * A component that renders a string as markdown.
 * It expects a clean string as the `text` prop.
 */
const MarkdownMessage = ({ text, className = "" }) => {
	// Ensure the input is a string. If not, display an error message.
	const messageText =
		typeof text === "string" || typeof text === "number"
			? String(text)
			: "Error: Invalid content";

	// Check if the text contains markdown syntax.
	const hasMarkdown = containsMarkdown(messageText);

	// If it doesn't contain markdown, render it as plain text
	// preserving whitespace and line breaks.
	if (!hasMarkdown) {
		return (
			<span className={className} style={{ whiteSpace: "pre-wrap" }}>
				{messageText}
			</span>
		);
	}

	// If it has markdown, parse it to HTML and render it.
	const htmlContent = parseMarkdown(messageText);

	return (
		<div
			className={`markdown-content ${className}`}
			dangerouslySetInnerHTML={createMarkup(htmlContent)}
		/>
	);
};

export default MarkdownMessage;

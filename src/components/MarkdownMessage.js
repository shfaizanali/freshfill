import React from "react";
import { marked } from "marked";
import "../components/MarkdownStyles.css";

/**
 * A component that renders a string as markdown.
 * It expects a clean string as the `content` prop.
 */
const MarkdownMessage = ({ content }) => {
	// Convert content to string if it isn't already
	const text = typeof content === "string" ? content : String(content || "");

	// Convert markdown to HTML
	const html = marked(text);

	return (
		<div
			className="markdown-content"
			dangerouslySetInnerHTML={{ __html: html }}
		/>
	);
};

export default MarkdownMessage;

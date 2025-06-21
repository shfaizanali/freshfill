import * as pdfjsLib from "pdfjs-dist";

// Set up PDF.js worker for version 3.x
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
const ALLOWED_FILE_TYPES = [
	"application/pdf",
	"text/plain",
	"text/markdown",
	"text/csv",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
	"application/msword", // .doc
];

export const validateFile = (file) => {
	const errors = [];

	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		errors.push(
			`File size (${(file.size / 1024 / 1024).toFixed(
				2
			)}MB) exceeds the maximum allowed size of 20MB`
		);
	}

	// Check file type
	if (!ALLOWED_FILE_TYPES.includes(file.type)) {
		errors.push(
			`File type "${file.type}" is not supported. Please upload PDF or text documents.`
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

export const extractTextFromFile = async (file) => {
	try {
		if (file.type === "application/pdf") {
			return await extractTextFromPDF(file);
		} else {
			return await extractTextFromTextFile(file);
		}
	} catch (error) {
		console.error("Error extracting text from file:", error);
		throw new Error(
			`Failed to extract text from ${file.name}: ${error.message}`
		);
	}
};

const extractTextFromPDF = async (file) => {
	const timeout = 30000; // 30 seconds timeout

	const extractionPromise = async () => {
		try {
			const arrayBuffer = await file.arrayBuffer();
			const pdf = await pdfjsLib.getDocument({
				data: arrayBuffer,
				verbosity: 0, // Reduce console output
			}).promise;

			let fullText = "";

			for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
				try {
					const page = await pdf.getPage(pageNum);
					const textContent = await page.getTextContent();
					const pageText = textContent.items.map((item) => item.str).join(" ");
					fullText += pageText + "\n";
				} catch (pageError) {
					console.warn(
						`Error extracting text from page ${pageNum}:`,
						pageError
					);
					// Continue with other pages
				}
			}

			if (!fullText.trim()) {
				throw new Error("No text content found in PDF");
			}

			return fullText.trim();
		} catch (error) {
			console.error("PDF extraction error:", error);
			if (error.message.includes("Invalid PDF")) {
				throw new Error("Invalid or corrupted PDF file");
			} else if (error.message.includes("No text content")) {
				throw new Error(
					"PDF contains no extractable text (may be image-based)"
				);
			} else {
				throw new Error(`Failed to extract text from PDF: ${error.message}`);
			}
		}
	};

	// Add timeout to prevent hanging
	const timeoutPromise = new Promise((_, reject) => {
		setTimeout(() => reject(new Error("PDF processing timeout")), timeout);
	});

	try {
		return await Promise.race([extractionPromise(), timeoutPromise]);
	} catch (error) {
		if (error.message.includes("timeout")) {
			throw new Error(
				"PDF processing took too long. Please try a smaller file."
			);
		}
		throw error;
	}
};

const extractTextFromTextFile = async (file) => {
	try {
		const text = await file.text();
		return text;
	} catch (error) {
		console.error("Text file extraction error:", error);
		throw new Error("Failed to read text file");
	}
};

export const formatFileSize = (bytes) => {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (fileType) => {
	if (fileType === "application/pdf") return "📄";
	if (fileType.startsWith("text/")) return "📝";
	if (fileType.includes("word")) return "📄";
	return "📎";
};

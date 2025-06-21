# File Upload Feature for HR Chatbot

## Overview

The HR chatbot now supports file uploads, allowing users to attach PDF and text documents to their questions. The extracted text from these documents is included in the context sent to the AI model.

## Features

### Supported File Types

- **PDF files** (.pdf) - Text extraction using PDF.js
- **Text files** (.txt, .md, .csv) - Direct text reading
- **Word documents** (.doc, .docx) - Basic support

### File Size Limits

- Maximum file size: **20MB**
- Multiple files can be uploaded simultaneously

### File Processing

- Automatic text extraction from PDFs using PDF.js library
- Direct text reading from text files
- File validation (size and type checking)
- Error handling for corrupted or unsupported files

## How It Works

### Frontend Implementation

1. **File Upload**: Users can click the paperclip icon to select files
2. **Validation**: Files are validated for size and type before processing
3. **Text Extraction**: PDF files are processed using PDF.js to extract text content
4. **Context Integration**: Extracted text is included in the chat payload as `fileContext`
5. **UI Feedback**: Visual indicators show processing status and attached files

### Backend Integration

The chat payload now includes:

```json
{
	"chatInput": "User's question",
	"fileContext": "Extracted text from all attached documents",
	"attachedFiles": [
		{
			"name": "document.pdf",
			"size": 1024000,
			"type": "application/pdf"
		}
	]
}
```

## Technical Details

### Dependencies

- `pdfjs-dist`: For PDF text extraction
- React Bootstrap: For UI components
- FontAwesome: For icons

### Key Components

- `fileUtils.js`: Utility functions for file handling
- `ChatPage.js`: Main chat interface with file upload
- `FileUpload.css`: Custom styles for file upload components

### File Processing Flow

1. User selects files via file input
2. Files are validated for size and type
3. Text extraction is performed asynchronously
4. Extracted text is stored in component state
5. When sending a message, file context is included in the payload
6. Files are cleared after successful message sending

## Error Handling

- File size validation (20MB limit)
- File type validation (supported formats only)
- PDF processing errors (corrupted files, etc.)
- Network errors during file processing

## UI Features

- File attachment button with loading indicator
- Visual file badges showing file name, size, and type
- Remove file functionality
- Error messages for invalid files
- Processing status indicators

## Security Considerations

- Client-side file validation
- No file storage on server (text extraction only)
- File content is sent as text in the chat payload
- Maximum file size limits prevent abuse

## Future Enhancements

- Support for more document types (Excel, PowerPoint)
- File preview functionality
- Drag and drop file upload
- File compression for large documents
- Better error recovery for corrupted files

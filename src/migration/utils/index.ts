import { ATTACHMENT_UNIFIED_ID_REGEX } from 'src/migration/constants';

export const extractAttachmentsFromString = (text: string): [string, string[]] => {
	if (!text.includes('attachments')) {
		return [text, []];
	}

	const attachments: string[] = [];

	const cleanedText = text.replace(ATTACHMENT_UNIFIED_ID_REGEX, (fullMatch, htmlId, markdownId) => {
		attachments.push(htmlId || markdownId);
		return '[attachment]'; // Remove the matched tag/link
	}).replace(/\s{2,}/g, ' ').trim() ?? '';

	return [cleanedText, attachments];
};

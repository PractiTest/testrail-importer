import { PTCustomFieldFormat, PTTestCustomFieldsList } from 'src/practi-test/types/custom-field.dto';

export const REQUIRED_FIELDS = [
	{ systemName: PTTestCustomFieldsList.TESTRAIL_CASE_ID, type: PTCustomFieldFormat.NUMBER },
	{ systemName: PTTestCustomFieldsList.TESTRAIL_RUN_ID, type: PTCustomFieldFormat.NUMBER },
	{ systemName: PTTestCustomFieldsList.TESTRAIL_TEST_ID, type: PTCustomFieldFormat.NUMBER },
	{ systemName: PTTestCustomFieldsList.TESTRAIL_RESULT_ID, type: PTCustomFieldFormat.NUMBER },
	{ systemName: PTTestCustomFieldsList.TESTRAIL_SECTION, type: PTCustomFieldFormat.TEXT },
	{ systemName: PTTestCustomFieldsList.TESTRAIL_RUN_CONFIG, type: PTCustomFieldFormat.TEXT },
];

export const EXCLUDED_FIELDS: string[] = ['custom_steps', 'custom_expected', 'custom_steps_separated'];

export const EMAIL_REGEX =
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const ATTACHMENT_UNIFIED_ID_REGEX = /<img\s+[^>]*src="index\.php\?\/attachments\/get\/(\d+)"[^>]*>|\!\[\]\(index\.php\?\/attachments\/get\/(\d+)\)/g;

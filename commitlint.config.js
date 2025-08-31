module.exports = {
	plugins: ['commitlint-plugin-jira-rules'],
	extends: ['jira'],
	rules: {
		'jira-task-id-empty': [2, 'always'],
		'jira-task-id-max-length': [2, 'always', 7],
		'jira-task-id-min-length': [2, 'always', 1],
		'jira-task-id-case': [2, 'always', 'uppercase'],
		'jira-task-id-project-key': [2, 'always', 'PTM'],
		'jira-commit-message-separator': [2, 'always', ':'],
		'header-max-length': [2, 'always', 100],
	},
};

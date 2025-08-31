# Migration preparation

## TestRail
1. Enable TestRail API.
Check "Enable API" and "Enable session authentication for API" at `Administration -> Site Settings -> API`
2. Generate User API Key at `My Settings -> API Keys` and press "Save Settings" button.
3. Put your API key in .env file as `TESTRAIL_API_KEY` and user email as `TESTRAIL_USERNAME`

## PractiTest
1. Enable API token for your PractiTest admin user ([Details](https://www.practitest.com/help/automation-integration/api/#:~:text=To%20get%20a%20personal%20API,described%20on%20the%20Personal%20Settings.)).
2. PUT your API token in .env file as `PRACTITEST_API_KEY` and user email as `PRACTITEST_USERNAME`
3. Create required custom fields in PractiTest

| Field name        | Type   |
|-------------------|--------|
| TestRailCaseID    | number |
| TestRailRunID     | number |
| TestRailTestID    | number |
| TestRailSection   | text   |
| TestRailRunConfig | text   |


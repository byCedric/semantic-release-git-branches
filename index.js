const {defaultTo, castArray} = require('lodash');
const verifyGit = require('./lib/verify');
const prepareGit = require('./lib/prepare');

let verified;

async function verifyConditions(pluginConfig, context) {
	const {options} = context;

	// If the Git prepare plugin is used and has `assets` or `message` configured, validate them now in order to prevent any release if the configuration is wrong
	if (options.prepare) {
		const preparePlugin =
			castArray(options.prepare).find(config => config.path && config.path === 'semantic-release-git-branches') || {};

		['message', 'assets', 'branchName', 'branchPush', 'branchMerges'].forEach(configKey => {
			pluginConfig[configKey] = defaultTo(pluginConfig[configKey], preparePlugin[configKey]);
		});
	}

	await verifyGit(pluginConfig, context);
	verified = true;
}

async function prepare(pluginConfig, context) {
	if (!verified) {
		await verifyGit(pluginConfig, context);
		verified = true;
	}

	await prepareGit(pluginConfig, context);
}

module.exports = {verifyConditions, prepare};

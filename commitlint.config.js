module.exports = {
	extends: ['@peakfijn/config-commitlint'],
	ignores: [
		// Fix ignore dependency updates by greenkeeper
		commit => commit.startsWith('chore(package):'),
		// Fix ignore dependency updates by dependabot
		commit => commit.startsWith('chore(deps):'),
		commit => commit.startsWith('chore(deps-dev):'),
	],
};

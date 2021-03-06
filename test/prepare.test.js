import test from 'ava';
import {outputFile} from 'fs-extra';
import {stub} from 'sinon';
import prepare from '../lib/prepare';
import {gitRepo, gitGetCommits, gitCommitedFiles} from './helpers/_git-utils';

// Save the current process.env
const envBackup = {...process.env};

test.beforeEach(async t => {
	// Delete env variables in case they are on the machine running the tests
	delete process.env.GH_TOKEN;
	delete process.env.GITHUB_TOKEN;
	delete process.env.GIT_CREDENTIALS;
	delete process.env.GIT_AUTHOR_NAME;
	delete process.env.GIT_AUTHOR_EMAIL;
	delete process.env.GIT_COMMITTER_NAME;
	delete process.env.GIT_COMMITTER_EMAIL;
	// Stub the logger functions
	t.context.log = stub();
	t.context.logger = {log: t.context.log};
	// Create a git repository with a remote, set the current working directory at the root of the repo
	t.context.repositoryUrl = await gitRepo(true);
	t.context.branch = 'master';
	t.context.options = {repositoryUrl: t.context.repositoryUrl, branch: t.context.branch};
});

test.afterEach.always(() => {
	// Restore process.env
	process.env = envBackup;
});

test.serial(
	'Commit CHANGELOG.md, package.json, package-lock.json, and npm-shrinkwrap.json if they exists and have been changed',
	async t => {
		const pluginConfig = {};
		const lastRelease = {};
		const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0', notes: 'Test release note'};
		const branchRelease = `release/${nextRelease.version}`;

		await outputFile('CHANGELOG.md', 'Initial CHANGELOG');
		await outputFile('package.json', "{name: 'test-package'}");
		await outputFile('package-lock.json', "{name: 'test-package'}");
		await outputFile('npm-shrinkwrap.json', "{name: 'test-package'}");

		await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

		// Verify the remote repo has a the version referencing the same commit sha at the local head
		const [commit] = await gitGetCommits();
		// Verify the files that have been commited
		t.deepEqual(await gitCommitedFiles(), ['CHANGELOG.md', 'npm-shrinkwrap.json', 'package-lock.json', 'package.json']);

		t.is(commit.subject, `chore: create new release ${nextRelease.version} [skip ci]`);
		t.is(commit.body, `${nextRelease.notes}\n`);
		t.is(commit.gitTags, `(HEAD -> ${branchRelease})`);

		t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
		t.deepEqual(t.context.log.args[1], ['Add %s to the release commit', 'CHANGELOG.md']);
		t.deepEqual(t.context.log.args[2], ['Add %s to the release commit', 'package.json']);
		t.deepEqual(t.context.log.args[3], ['Add %s to the release commit', 'package-lock.json']);
		t.deepEqual(t.context.log.args[4], ['Add %s to the release commit', 'npm-shrinkwrap.json']);
		t.deepEqual(t.context.log.args[5], ['Found %d file(s) to commit', 4]);
		t.deepEqual(t.context.log.args[6], ['Creating tag %s', nextRelease.gitTag]);
		t.deepEqual(t.context.log.args[7], ['Pulling branch %s', t.context.branch]);
		t.deepEqual(t.context.log.args[8], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
		t.deepEqual(t.context.log.args[9], ['Pushing updated branch %s', t.context.branch]);
		t.deepEqual(t.context.log.args[10], ['Cleaning up for next branch...']);
		t.deepEqual(t.context.log.args[11], ['Prepared Git release: %s', nextRelease.gitTag]);
	}
);

test.serial(
	'Exclude CHANGELOG.md, package.json, package-lock.json, and npm-shrinkwrap.json if "assets" is defined without it',
	async t => {
		const pluginConfig = {assets: []};
		const lastRelease = {};
		const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
		const branchRelease = `release/${nextRelease.version}`;

		await outputFile('CHANGELOG.md', 'Initial CHANGELOG');
		await outputFile('package.json', "{name: 'test-package'}");
		await outputFile('package-lock.json', "{name: 'test-package'}");
		await outputFile('npm-shrinkwrap.json', "{name: 'test-package'}");

		await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

		// Verify no files have been commited
		t.deepEqual(await gitCommitedFiles(), []);

		t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
		t.deepEqual(t.context.log.args[1], ['Creating tag %s', nextRelease.gitTag]);
		t.deepEqual(t.context.log.args[2], ['Pulling branch %s', t.context.branch]);
		t.deepEqual(t.context.log.args[3], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
		t.deepEqual(t.context.log.args[4], ['Pushing updated branch %s', t.context.branch]);
		t.deepEqual(t.context.log.args[5], ['Cleaning up for next branch...']);
		t.deepEqual(t.context.log.args[6], ['Prepared Git release: %s', nextRelease.gitTag]);
	}
);

test.serial('Allow to customize the commit message', async t => {
	const pluginConfig = {
		message: `Release version \${nextRelease.version} from branch \${branch}

Last release: \${lastRelease.version}
\${nextRelease.notes}`,
	};
	const lastRelease = {version: 'v1.0.0'};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0', notes: 'Test release note'};
	await outputFile('CHANGELOG.md', 'Initial CHANGELOG');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	// Verify the files that have been commited
	t.deepEqual(await gitCommitedFiles(), ['CHANGELOG.md']);
	// Verify the commit message contains on the new release notes
	const [commit] = await gitGetCommits();
	t.is(commit.subject, `Release version ${nextRelease.version} from branch ${t.context.branch}`);
	t.is(commit.body, `Last release: ${lastRelease.version}\n${nextRelease.notes}\n`);
});

test.serial('Commit files matching the patterns in "assets"', async t => {
	const pluginConfig = {
		assets: ['file1.js', '*1.js', ['dir/*.js', '!dir/*.css'], 'file5.js', 'dir2', ['**/*.js', '!**/*.js']],
	};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
	const branchRelease = `release/${nextRelease.version}`;

	// Create .gitignore to ignore file5.js
	await outputFile('.gitignore', 'file5.js');
	await outputFile('file1.js', 'Test content');
	await outputFile('dir/file2.js', 'Test content');
	await outputFile('dir/file3.css', 'Test content');
	await outputFile('file4.js', 'Test content');
	await outputFile('file5.js', 'Test content');
	await outputFile('dir2/file6.js', 'Test content');
	await outputFile('dir2/file7.css', 'Test content');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	// Verify file2 and file1 have been commited
	// file4.js is excluded as no glob matching
	// file3.css is ignored due to the negative glob '!dir/*.css'
	// file5.js is ignore because it's in the .gitignore
	// file6.js and file7.css are included because dir2 is expanded
	t.deepEqual(await gitCommitedFiles(), ['dir/file2.js', 'dir2/file6.js', 'dir2/file7.css', 'file1.js']);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Add %s to the release commit', 'file1.js']);
	t.deepEqual(t.context.log.args[2], ['Add %s to the release commit', 'dir/file2.js']);
	t.deepEqual(t.context.log.args[3], ['Add %s to the release commit', 'dir2/file6.js']);
	t.deepEqual(t.context.log.args[4], ['Add %s to the release commit', 'dir2/file7.css']);
	t.deepEqual(t.context.log.args[5], ['Found %d file(s) to commit', 4]);
	t.deepEqual(t.context.log.args[6], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[7], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[8], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[9], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[10], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[11], ['Prepared Git release: %s', nextRelease.gitTag]);
});

test.serial('Commit files matching the patterns in "assets" as Objects', async t => {
	const pluginConfig = {
		assets: ['file1.js', {path: ['dir/*.js', '!dir/*.css']}, {path: 'file5.js'}, 'dir2'],
	};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
	const branchRelease = `release/${nextRelease.version}`;

	// Create .gitignore to ignore file5.js
	await outputFile('.gitignore', 'file5.js');

	await outputFile('file1.js', 'Test content');
	await outputFile('dir/file2.js', 'Test content');
	await outputFile('dir/file3.css', 'Test content');
	await outputFile('file4.js', 'Test content');
	await outputFile('file5.js', 'Test content');
	await outputFile('dir2/file6.js', 'Test content');
	await outputFile('dir2/file7.css', 'Test content');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	// Verify file2 and file1 have been commited
	// file4.js is excluded as no glob matching
	// file3.css is ignored due to the negative glob '!dir/*.css'
	// file5.js is ignore because it's in the .gitignore
	// file6.js and file7.css are included because dir2 is expanded
	t.deepEqual(await gitCommitedFiles(), ['dir/file2.js', 'dir2/file6.js', 'dir2/file7.css', 'file1.js']);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Add %s to the release commit', 'file1.js']);
	t.deepEqual(t.context.log.args[2], ['Add %s to the release commit', 'dir/file2.js']);
	t.deepEqual(t.context.log.args[3], ['Add %s to the release commit', 'dir2/file6.js']);
	t.deepEqual(t.context.log.args[4], ['Add %s to the release commit', 'dir2/file7.css']);
	t.deepEqual(t.context.log.args[5], ['Found %d file(s) to commit', 4]);
	t.deepEqual(t.context.log.args[6], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[7], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[8], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[9], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[10], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[11], ['Prepared Git release: %s', nextRelease.gitTag]);
});

test.serial('Commit files matching the patterns in "assets" as single glob', async t => {
	const pluginConfig = {assets: 'dist/**/*.js'};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
	const branchRelease = `release/${nextRelease.version}`;

	await outputFile('dist/file1.js', 'Test content');
	await outputFile('dist/file2.css', 'Test content');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	t.deepEqual(await gitCommitedFiles(), ['dist/file1.js']);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Add %s to the release commit', 'dist/file1.js']);
	t.deepEqual(t.context.log.args[2], ['Found %d file(s) to commit', 1]);
	t.deepEqual(t.context.log.args[3], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[4], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[5], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[6], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[7], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[8], ['Prepared Git release: %s', nextRelease.gitTag]);
});

test.serial('Commit files matching the patterns in "assets", including dot files', async t => {
	const pluginConfig = {assets: 'dist'};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
	const branchRelease = `release/${nextRelease.version}`;

	await outputFile('dist/.dotfile', 'Test content');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	t.deepEqual(await gitCommitedFiles(), ['dist/.dotfile']);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Add %s to the release commit', 'dist/.dotfile']);
	t.deepEqual(t.context.log.args[2], ['Found %d file(s) to commit', 1]);
	t.deepEqual(t.context.log.args[3], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[4], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[5], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[6], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[7], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[8], ['Prepared Git release: %s', nextRelease.gitTag]);
});

test.serial('Set the commit author and committer name/email based on environment variables', async t => {
	process.env.GIT_AUTHOR_NAME = 'author name';
	process.env.GIT_AUTHOR_EMAIL = 'author email';
	process.env.GIT_COMMITTER_NAME = 'committer name';
	process.env.GIT_COMMITTER_EMAIL = 'committer email';
	const lastRelease = {version: 'v1.0.0'};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0', notes: 'Test release note'};
	await outputFile('CHANGELOG.md', 'Initial CHANGELOG');

	await prepare({}, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	// Verify the files that have been commited
	t.deepEqual(await gitCommitedFiles(), ['CHANGELOG.md']);
	// Verify the commit message contains on the new release notes
	const [commit] = await gitGetCommits();
	t.is(commit.author.name, 'author name');
	t.is(commit.author.email, 'author email');
	t.is(commit.committer.name, 'committer name');
	t.is(commit.committer.email, 'committer email');
});

test.serial('Skip negated pattern if its alone in its group', async t => {
	const pluginConfig = {assets: ['!**/*', 'file.js']};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
	const branchRelease = `release/${nextRelease.version}`;

	await outputFile('file.js', 'Test content');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	t.deepEqual(await gitCommitedFiles(), ['file.js']);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Add %s to the release commit', 'file.js']);
	t.deepEqual(t.context.log.args[2], ['Found %d file(s) to commit', 1]);
	t.deepEqual(t.context.log.args[3], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[4], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[5], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[6], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[7], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[8], ['Prepared Git release: %s', nextRelease.gitTag]);
});

test.serial('Skip commit if there is no files to commit', async t => {
	const pluginConfig = {};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0', notes: 'Test release note'};
	const branchRelease = `release/${nextRelease.version}`;

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	// Verify the files that have been commited
	t.deepEqual(await gitCommitedFiles(), []);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[2], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[3], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[4], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[5], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[6], ['Prepared Git release: %s', nextRelease.gitTag]);
});

test.serial('Skip commit if all the modified files are in .gitignore', async t => {
	const pluginConfig = {assets: 'dist'};
	const lastRelease = {};
	const nextRelease = {version: '2.0.0', gitTag: 'v2.0.0'};
	const branchRelease = `release/${nextRelease.version}`;

	await outputFile('dist/files1.js', 'Test content');
	await outputFile('.gitignore', 'dist/**/*');

	await prepare(pluginConfig, {options: t.context.options, lastRelease, nextRelease, logger: t.context.logger});

	// Verify the files that have been commited
	t.deepEqual(await gitCommitedFiles(), []);

	t.deepEqual(t.context.log.args[0], ['Creating new release branch %s', branchRelease]);
	t.deepEqual(t.context.log.args[1], ['Creating tag %s', nextRelease.gitTag]);
	t.deepEqual(t.context.log.args[2], ['Pulling branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[3], ['Merging release branch %s into %s', branchRelease, t.context.branch]);
	t.deepEqual(t.context.log.args[4], ['Pushing updated branch %s', t.context.branch]);
	t.deepEqual(t.context.log.args[5], ['Cleaning up for next branch...']);
	t.deepEqual(t.context.log.args[6], ['Prepared Git release: %s', nextRelease.gitTag]);
});

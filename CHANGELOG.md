<a name="1.1.0"></a>
# [1.1.0](https://github.com/bycedric/semantic-release-git-branches/compare/1.0.0...1.1.0) (2018-06-18)


### Bug Fixes

* add original creator in license ([93f709f](https://github.com/bycedric/semantic-release-git-branches/commit/93f709f))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/bycedric/semantic-release-git-branches/compare/0.2.0...1.0.0) (2018-06-17)



<a name="0.2.0"></a>
# [0.2.0](https://github.com/bycedric/semantic-release-git-branches/compare/0.1.0...0.2.0) (2018-05-27)


### Bug Fixes

* properly copy all settings from prepare ([276c791](https://github.com/bycedric/semantic-release-git-branches/commit/276c791))
* remove unused variable from verify ([b157132](https://github.com/bycedric/semantic-release-git-branches/commit/b157132))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/bycedric/semantic-release-git-branches/compare/8ba9c68...0.1.0) (2018-05-27)


### Bug Fixes

* **package:** add semantic-release as a peerDependency ([c401954](https://github.com/bycedric/semantic-release-git-branches/commit/c401954))
* **package:** update execa to version 0.10.0 ([0a23110](https://github.com/bycedric/semantic-release-git-branches/commit/0a23110))
* **package:** update execa to version 0.9.0 ([b399e7f](https://github.com/bycedric/semantic-release-git-branches/commit/b399e7f))
* **package:** update fs-extra to version 5.0.0 ([7ec2723](https://github.com/bycedric/semantic-release-git-branches/commit/7ec2723))
* add package.json/npm-shrinkwrap.json only if they exists ([79cc028](https://github.com/bycedric/semantic-release-git-branches/commit/79cc028))
* add verify merge branch errors properly ([5e90ec7](https://github.com/bycedric/semantic-release-git-branches/commit/5e90ec7))
* **package:** update fs-extra to version 6.0.0 ([5ed087b](https://github.com/bycedric/semantic-release-git-branches/commit/5ed087b))
* **package:** update git-url-parse to version 8.0.0 ([358e782](https://github.com/bycedric/semantic-release-git-branches/commit/358e782))
* **package:** update node requirement to 8.3 ([db60bbd](https://github.com/bycedric/semantic-release-git-branches/commit/db60bbd))
* **package:** update semantic-release peerDependency ([c64a64c](https://github.com/bycedric/semantic-release-git-branches/commit/c64a64c))
* check prepare props only in verify ones are undefined ([a4c24ec](https://github.com/bycedric/semantic-release-git-branches/commit/a4c24ec))
* lint with tabs instead of spaces ([4d11f50](https://github.com/bycedric/semantic-release-git-branches/commit/4d11f50))
* skip commit if all modified files are in gitignore ([05ab305](https://github.com/bycedric/semantic-release-git-branches/commit/05ab305))
* support older git versions ([ddaf44c](https://github.com/bycedric/semantic-release-git-branches/commit/ddaf44c))


### Features

* add `details` to error messages ([86a2e90](https://github.com/bycedric/semantic-release-git-branches/commit/86a2e90))
* add package-lock.json to list of automatically detected files ([651c192](https://github.com/bycedric/semantic-release-git-branches/commit/651c192))
* change `publish` hook to `prepare` ([0efaae8](https://github.com/bycedric/semantic-release-git-branches/commit/0efaae8))
* create changelog file with dedicated plugin ([a86ff5d](https://github.com/bycedric/semantic-release-git-branches/commit/a86ff5d))
* Initial release ([#1](https://github.com/bycedric/semantic-release-git-branches/issues/1)) ([8ba9c68](https://github.com/bycedric/semantic-release-git-branches/commit/8ba9c68))
* log all git command errors ([72153f8](https://github.com/bycedric/semantic-release-git-branches/commit/72153f8))
* remove `getLastRelease` and do not create Git tag anymore ([c8119da](https://github.com/bycedric/semantic-release-git-branches/commit/c8119da))
* return all errors ([147d2f8](https://github.com/bycedric/semantic-release-git-branches/commit/147d2f8))
* set name/email of commit author and committer via Git env var ([a58c357](https://github.com/bycedric/semantic-release-git-branches/commit/a58c357))


### BREAKING CHANGES

* the `GIT_USERNAME` and `GIT_EMAIL` environment variables are replaced by the [Git environment variables](https://git-scm.com/book/en/v2/Git-Internals-Environment-Variables#_committing) `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL`.

Co-authored-by: Sergey Bekrin <sergey@bekrin.me>
* The plugin require sementic-release >=15.0.0 and has to be used in the `prepare` step rather than in `publish`.
* The Git tag is not created anymore

The Git tag must be created by `semantic-release`. The plugin is compatible only with `semantic-release@13.0.0` and above.
* The `getLastRelease` hook is removed

The plugin is compatible only with `semantic-release@13.0.0` and above.
* The `changelog` options has been removed. The `CHANGELOG.md` is not created or updated anymore.
Use https://github.com/semantic-release/changelog to create/update the `CHANGELOG.md`.
By default if a `CHANGELOG.md` file exists and has been modified it will be included in the release commit.




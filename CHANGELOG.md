# Change Log

## [v2.3.0](https://github.com/trivago/parallel-webpack/tree/v2.3.0) (2018-02-26)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v2.2.0...v2.3.0)


**Merged pull requests:**

- Bump webpack peer dependency [\#78](https://github.com/trivago/parallel-webpack/pull/78) ([efegurkan](https://github.com/efegurkan))
- injected Stats.presetToOptions to parse { stats: String } into Object [\#73](https://github.com/trivago/parallel-webpack/pull/73) ([oleg-andreyev](https://github.com/oleg-andreyev))
- update lodash.endswith require [\#72](https://github.com/trivago/parallel-webpack/pull/72) ([oleg-andreyev](https://github.com/oleg-andreyev))
- Add issue\_template [\#69](https://github.com/trivago/parallel-webpack/pull/69) ([efegurkan](https://github.com/efegurkan))
- docs\(README\): add npm version badge [\#64](https://github.com/trivago/parallel-webpack/pull/64) ([alan-agius4](https://github.com/alan-agius4))
- Fix pull request links in CHANGELOG.md [\#62](https://github.com/trivago/parallel-webpack/pull/62) ([valscion](https://github.com/valscion))
- Incomplete replacement fix [\#61](https://github.com/trivago/parallel-webpack/pull/61) ([Luixo](https://github.com/Luixo))

## [v2.2.0](https://github.com/trivago/parallel-webpack/tree/v2.2.0) (2017-09-19)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v2.1.0...v2.2.0)

**Implemented enhancements:**

- On complete hook [\#39](https://github.com/trivago/parallel-webpack/issues/39)
- Webpack 2 config export as function [\#34](https://github.com/trivago/parallel-webpack/issues/34)
- watch mode done callback [\#55](https://github.com/trivago/parallel-webpack/pull/55) ([natedanner](https://github.com/natedanner))

**Merged pull requests:**

- Update package.json to support webpack 3.1.0 [\#59](https://github.com/trivago/parallel-webpack/pull/59) ([clowNay](https://github.com/clowNay))
- Remove coveralls from circle-ci, disable colors [\#53](https://github.com/trivago/parallel-webpack/pull/53) ([efegurkan](https://github.com/efegurkan))
- Add coverage support [\#50](https://github.com/trivago/parallel-webpack/pull/50) ([efegurkan](https://github.com/efegurkan))

## [v2.1.0](https://github.com/trivago/parallel-webpack/tree/v2.1.0) (2017-07-28)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v2.0.0...v2.1.0)

**Merged pull requests:**

- travis and circle-ci integrations [\#49](https://github.com/trivago/parallel-webpack/pull/49) ([efegurkan](https://github.com/efegurkan))
- support config as export function v2 [\#48](https://github.com/trivago/parallel-webpack/pull/48) ([Robbilie](https://github.com/Robbilie))
- Adjust basic example [\#47](https://github.com/trivago/parallel-webpack/pull/47) ([Robbilie](https://github.com/Robbilie))
- Pass watch options to the compiler [\#46](https://github.com/trivago/parallel-webpack/pull/46) ([BenoitZugmeyer](https://github.com/BenoitZugmeyer))
- Implement tests [\#44](https://github.com/trivago/parallel-webpack/pull/44) ([efegurkan](https://github.com/efegurkan))

## [v2.0.0](https://github.com/trivago/parallel-webpack/tree/v2.0.0) (2017-06-28)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.6.1...v2.0.0)

**Closed issues:**

- freezed on parallel-webpack run on circleci [\#41](https://github.com/trivago/parallel-webpack/issues/41)
- \[Webpack 2\] Using --optimize-minimize argument with parallel-webpack [\#40](https://github.com/trivago/parallel-webpack/issues/40)
- some childprocesses don't get killed when quitting [\#33](https://github.com/trivago/parallel-webpack/issues/33)

**Merged pull requests:**

- Moved webpack to peerDependencies [\#42](https://github.com/trivago/parallel-webpack/pull/42) ([gandazgul](https://github.com/gandazgul))
- make parallel-webpack work with webpack@^2.2.0 [\#32](https://github.com/trivago/parallel-webpack/pull/32) ([anilanar](https://github.com/anilanar))

## [v1.6.1](https://github.com/trivago/parallel-webpack/tree/v1.6.1) (2017-01-20)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.6.0...v1.6.1)

**Fixed bugs:**

- After ctrl+c build/watch restarts [\#29](https://github.com/trivago/parallel-webpack/issues/29)

## [v1.6.0](https://github.com/trivago/parallel-webpack/tree/v1.6.0) (2016-12-16)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.5.0...v1.6.0)

**Implemented enhancements:**

- Don't have options propagation to worker-farm expect: 'maxConcurrentWorkers' and 'maxRetries' [\#25](https://github.com/trivago/parallel-webpack/issues/25)
- EventEmitter memory leak warnings [\#22](https://github.com/trivago/parallel-webpack/issues/22)
- Please use a changelog [\#15](https://github.com/trivago/parallel-webpack/issues/15)
- \[name\] logging [\#14](https://github.com/trivago/parallel-webpack/issues/14)

**Fixed bugs:**

- Don't forget call process.removeListener. [\#24](https://github.com/trivago/parallel-webpack/issues/24)

**Closed issues:**

- Pass config directly to Node API [\#21](https://github.com/trivago/parallel-webpack/issues/21)
- \[Question\] Does it work with webpack dev server or middleware ? [\#18](https://github.com/trivago/parallel-webpack/issues/18)

**Merged pull requests:**

- Implement options propagation to worker-farm. Add schema json validation. [\#28](https://github.com/trivago/parallel-webpack/pull/28) ([wKich](https://github.com/wKich))
- Add calls process.removeListener [\#27](https://github.com/trivago/parallel-webpack/pull/27) ([wKich](https://github.com/wKich))

## [v1.5.0](https://github.com/trivago/parallel-webpack/tree/v1.5.0) (2016-06-14)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.4.0...v1.5.0)

**Merged pull requests:**

- Fix typo from statics to statistics [\#16](https://github.com/trivago/parallel-webpack/pull/16) ([nickpresta](https://github.com/nickpresta))

## [v1.4.0](https://github.com/trivago/parallel-webpack/tree/v1.4.0) (2016-05-10)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.3.1...v1.4.0)

**Implemented enhancements:**

- Add timestamp for continously rebuilds with the watcher in the console output [\#12](https://github.com/trivago/parallel-webpack/issues/12)
- Add documentation for configurable configurations [\#6](https://github.com/trivago/parallel-webpack/issues/6)
- various fixes for programmatic output \(mostly\) [\#10](https://github.com/trivago/parallel-webpack/pull/10) ([boneskull](https://github.com/boneskull))

**Closed issues:**

- Add config extension interpretation for ".babel.js", ".coffee", etc [\#13](https://github.com/trivago/parallel-webpack/issues/13)

## [v1.3.1](https://github.com/trivago/parallel-webpack/tree/v1.3.1) (2016-02-16)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.3.0...v1.3.1)

**Closed issues:**

- Watcher for 'npm start' gives wrong statistics about build time [\#7](https://github.com/trivago/parallel-webpack/issues/7)

**Merged pull requests:**

- Use timing stats directly from Webpack [\#9](https://github.com/trivago/parallel-webpack/pull/9) ([lime](https://github.com/lime))
- Use global parseInt instead of Number.parseInt [\#8](https://github.com/trivago/parallel-webpack/pull/8) ([lime](https://github.com/lime))

## [v1.3.0](https://github.com/trivago/parallel-webpack/tree/v1.3.0) (2016-01-26)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.2.0...v1.3.0)

## [v1.2.0](https://github.com/trivago/parallel-webpack/tree/v1.2.0) (2016-01-11)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.1.0...v1.2.0)

**Implemented enhancements:**

- Can you support --bail and --json flags? [\#2](https://github.com/trivago/parallel-webpack/issues/2)

## [v1.1.0](https://github.com/trivago/parallel-webpack/tree/v1.1.0) (2016-01-01)
[Full Changelog](https://github.com/trivago/parallel-webpack/compare/v1.0.0...v1.1.0)

**Fixed bugs:**

- Adjust documentation regarding createVariants baseOptions parameter [\#4](https://github.com/trivago/parallel-webpack/issues/4)

**Closed issues:**

- using babel-loader [\#3](https://github.com/trivago/parallel-webpack/issues/3)

## [v1.0.0](https://github.com/trivago/parallel-webpack/tree/v1.0.0) (2015-12-15)


\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*

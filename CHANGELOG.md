### Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

#### [4.1.0](https://github.com/doesdev/bock/compare/4.0.1...4.1.0)

> 22 September 2021

- Add `transform` option to all log methods
- Update `mvt`

#### [4.0.1](https://github.com/doesdev/bock/compare/4.0.0...4.0.1)

> 12 November 2020

- Pass empty execArgv to fork to prevent passing unwanted args down

#### [4.0.0](https://github.com/doesdev/bock/compare/3.0.4...4.0.0)

> 16 May 2020

- Use streams for writing instead of appendFileSync
- Update Node Engine to >= 8.0.0

#### [3.0.4](https://github.com/doesdev/bock/compare/3.0.3...3.0.4)

> 3 February 2020

- Store logLevel as text rather than int

#### [3.0.3](https://github.com/doesdev/bock/compare/3.0.2...3.0.3)

> 2 February 2020

- Add `track` option, allowing for awaiting log writing (for tests mainly)

#### [3.0.2](https://github.com/doesdev/bock/compare/3.0.1...3.0.2)

> 1 February 2020

- Retain functionality but don't use OO style
- Fixes inability to use destructured
- Make `cached` more intelligent

#### [3.0.1](https://github.com/doesdev/bock/compare/3.0.0...3.0.1)

> 1 February 2020

- Only cache an instance created with `cached`

#### [3.0.0](https://github.com/doesdev/bock/compare/2.2.0...3.0.0)

> 1 February 2020

- Rewrite OO-esque for no good reason and bunch of other pointless garbage
- Allow functions as message
- Add cached getter

#### [2.2.0](https://github.com/doesdev/bock/compare/2.1.4...2.2.0)

> 30 December 2019

- On `.close` disconnect child rather than kill, fixes #9
- Update `app-root-path` dep
- Fix standard style issues

#### [2.1.4](https://github.com/doesdev/bock/compare/2.1.3...2.1.4)

> 14 July 2019

- Simplify devDependencies
- Fix standard issues
- Add Travis config
- Fix a couple `close` issues

#### [2.1.3](https://github.com/doesdev/bock/compare/2.1.2...2.1.3)

> 1 June 2019

- Update dependencies

#### [2.1.2](https://github.com/doesdev/bock/compare/2.1.1...2.1.2)

> 10 August 2018

- Add close option (fixes #7), changelog, update dep [`#7`](https://github.com/doesdev/bock/issues/7)

#### [2.1.1](https://github.com/doesdev/bock/compare/2.1.0...2.1.1)

> 10 May 2018

- Add setLogLevel, 2.1.1 [`e2ea3d9`](https://github.com/doesdev/bock/commit/e2ea3d96f7c3ad821e8214fea880db5e454019b0)

#### [2.1.0](https://github.com/doesdev/bock/compare/2.0.0...2.1.0)

> 30 November 2017

- Fix #8, console logging in debug [`#8`](https://github.com/doesdev/bock/issues/8)

#### 2.0.0

> 29 October 2017

- Breaking 2.0.0, fixes #4 and #5, newline delimited [`#4`](https://github.com/doesdev/bock/issues/4)
- Whitelist message, fixes #2, v1.0.5 [`#2`](https://github.com/doesdev/bock/issues/2)
- Fix #1, use app-root-path for default logBase [`#1`](https://github.com/doesdev/bock/issues/1)
- Add deps badge [`f5437fa`](https://github.com/doesdev/bock/commit/f5437fa4390162dff012d477bdbc8993d368826f)
- Fix that last thing [`f0bc6b0`](https://github.com/doesdev/bock/commit/f0bc6b0c8249008bc67ed60040e2e59803241472)
- Revert naming convention to original [`ddd66a4`](https://github.com/doesdev/bock/commit/ddd66a44384fda25eba751a4740d2a046935bad0)
- Use hoy for cached today [`62d4cbf`](https://github.com/doesdev/bock/commit/62d4cbfa3e9ba800cc8450a99b91a8f4310de4a7)
- Fix bad commit [`095c9de`](https://github.com/doesdev/bock/commit/095c9dee08e67a72ba7ef4a012f2264b9f7bb0d1)
- Bump to v1.0.1 [`bbe74fd`](https://github.com/doesdev/bock/commit/bbe74fde95c49ba855196eae3181f7d51b853f92)
- Initial commit [`5c1e3c4`](https://github.com/doesdev/bock/commit/5c1e3c46d8defcd3c1cc6a300087d8f07726273b)

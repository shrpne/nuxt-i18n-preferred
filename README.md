# nuxt-i18n-preferred

[![NPM Package](https://img.shields.io/npm/v/nuxt-i18n-preferred.svg?style=flat-square)](https://www.npmjs.org/package/nuxt-i18n-preferred)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://github.com/shrpne/nuxt-i18n-preferred/blob/master/LICENSE)

Preferred locale for nuxt-i18n.
Add middleware, that save preferred locale between sessions, when user comes back, it will check if preferred locale is set and redirect to it. Redirect works only on root page for now.
Add enhanced `preferredPath` method instead of `localePath`.

[ci-img]:  https://travis-ci.org/shrpne/nuxt-i18n-preferred.svg
[ci]:      https://travis-ci.org/shrpne/nuxt-i18n-preferred


## Install

### NPM

```bash
npm install nuxt-i18n-preferred
```

Register Nuxt module
```js
// nuxt-config.js
module.exports = {
    modules: [
        ['nuxt-i18n', {
            // options
        }],
        ['nuxt-i18n-preferred', {
            routesNameSeparator: '___',
            languageCookieKey: 'nuxt_i18n_preferred_locale',
            detectBrowserLanguage: false,        
        }]
    ],
};
```

## Usage

### .preferredPath()
First check preferred locale, than check current locale, than check default locale.
In comparison with nuxt-i18n's `localePath`, which check only current locale.

```html
<nuxt-link :to="preferredPath('index')">{{ $t('home') }}</nuxt-link>
``` 


## License

MIT License

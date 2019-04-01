const { resolve, join } = require('path');

const MODULE_DIR = 'nuxt-i18n-preferred';

export default function i18nPreferred(userOptions) {
    const templatesOptions = Object.assign({
        languageCookieKey: 'nuxt_i18n_preferred_locale',
        detectBrowserLanguage: false,
    }, userOptions);

    this.addTemplate({
        src: resolve(__dirname, 'variables.ejs'),
        fileName: join(MODULE_DIR, 'variables.js'),
        options: templatesOptions,
    });
    this.addTemplate({
        src: resolve(__dirname, 'middleware.js'),
        fileName: join(MODULE_DIR, 'middleware.js'),
        options: templatesOptions,
    });
    this.addPlugin({
        src: resolve(__dirname, 'plugin.js'),
        fileName: join(MODULE_DIR, 'plugin.js'),
        options: templatesOptions,
    });

    this.options.router.middleware.push('i18n-preferred');
}


module.exports.meta = require('../package.json');

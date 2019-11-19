/* eslint-disable import/no-unresolved */

import Vue from 'vue';
import { setPreferredLocale, VueInstanceProxy, NuxtContextProxy } from './middleware';

import { I18N_ROUTE_NAME_SEPARATOR } from './variables';

Vue.mixin({
    methods: {
        $i18nGetPreferredPath: VueInstanceProxy(getPreferredPath),
        $i18nHasLocalizedRoute: VueInstanceProxy(hasLocalizedRoute),
        $i18nSetPreferredLocale: VueInstanceProxy(setPreferredLocale),
    },
});

export default ({ app, req, res, route, store, redirect } /* inject */) => {
    /* eslint-disable no-param-reassign */
    // Set `i18n` instance on `app`
    // This way we can use it in middleware and pages `asyncData`/`fetch`
    app.i18nGetPreferredPath = NuxtContextProxy({ app, store }, getPreferredPath);
    app.i18nHasLocalizedRoute = NuxtContextProxy({ app }, hasLocalizedRoute);
    app.i18nSetPreferredLocale = NuxtContextProxy({ app, req, res, route, store, redirect }, setPreferredLocale);

    // Register Vuex module
    if (store) {
        store.registerModule(['i18n', 'preferred'], {
            namespaced: true,
            state: () => ({
                locale: '',
            }),
            mutations: {
                SET_LOCALE(state, locale) {
                    state.locale = locale;
                },
            },
        }, { preserveState: false });
    }
};


/**
 * Enhanced .localePath()
 * Check preferredLocale first, returns initial route if no localized route found
 * @param route
 * @return {*}
 */
function getPreferredPath(route) {
    const { store, i18n, i18nHasLocalizedRoute } = this;

    // Abort if no route
    if (!route) {
        return false;
    }
    // collect locales to check in the routes
    const localesToCheck = [];
    if (store.state.i18n.preferred.locale) {
        localesToCheck.push(store.state.i18n.preferred.locale);
    }
    if (i18n.locale && localesToCheck.indexOf(i18n.locale) === -1) {
        localesToCheck.push(i18n.locale);
    }
    if (i18n.defaultLocale && localesToCheck.indexOf(i18n.defaultLocale) === -1) {
        localesToCheck.push(i18n.defaultLocale);
    }

    // If route parameters is a string, use it as the route's name
    if (typeof route === 'string') {
        route = { name: route };
    }

    const locale = localesToCheck.find((item) => i18nHasLocalizedRoute(route, item));

    if (locale) {
        return this.localePath(route, locale);
    }
    return route;
}

/**
 * Check existence of localized route
 * @param route
 * @param locale
 * @return {boolean}
 */
function hasLocalizedRoute(route, locale) {
    const { router } = this;

    const name = route.name + I18N_ROUTE_NAME_SEPARATOR + locale;
    return router.options.routes.some((item) => item.name === name);
}

/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import cookie from 'cookie';
import Cookies from 'js-cookie';
import { LANGUAGE_COOKIE_KEY, DETECT_BROWSER } from './variables';
import middleware from '../middleware.js'; // Nuxt's middleware


let isExecuted = false;

middleware['i18n-preferred'] = function i18nPreferredMiddleware({ app, req, res, route, store, redirect, isHMR }) {
    if (isHMR) {
        return false;
    }

    // execute only on first load
    if (process.client && isExecuted) {
        return false;
    }
    isExecuted = true;

    const setLocale = NuxtContextProxy({ app, req, res, route, store, redirect }, setPreferredLocale);

    // Helpers
    const preferredLocale = getCookie({ req });
    const isRootPath = route.path === '/';

    // @TODO redirect on any page
    // redirect only on root page, on other pages just set current locale as preferred
    if (isRootPath && preferredLocale && app.i18n.localeCodes.indexOf(preferredLocale) !== -1) {
        return setLocale(preferredLocale);
    } else if (isRootPath && DETECT_BROWSER) {
        const browserLocale = getBrowserLocale({ req });
        if (browserLocale && app.i18n.localeCodes.indexOf(browserLocale) !== -1) {
            return setLocale(browserLocale);
        }
    } else if (!isRootPath) {
        return setLocale(app.i18n.locale);
    }

    return false;
};


export function VueInstanceProxy(targetFunction) {
    return function vueInstanceWrapped() {
        const proxy = {
            req: process.server ? this.$ssrContext.req : null,
            res: process.server ? this.$ssrContext.res : null,
            route: this.$route,
            router: this.$router,
            redirect: this.$router.push,
            store: this.$store,
            i18n: this.$i18n,
            getRouteBaseName: this.getRouteBaseName,
            localePath: this.localePath,
            i18nHasLocalizedRoute: this.$i18nHasLocalizedRoute,
        };

        return targetFunction.apply(proxy, arguments);
    };
}

export function NuxtContextProxy(context, targetFunction) {
    return function nuxtContextWrapped() {
        const { app = {}, req, res, route, store, redirect } = context;

        const proxy = {
            req: process.server ? req : null,
            res: process.server ? res : null,
            route,
            router: app.router,
            redirect,
            store,
            i18n: app.i18n,
            getRouteBaseName: app.getRouteBaseName,
            localePath: app.localePath,
            i18nHasLocalizedRoute: app.i18nHasLocalizedRoute,
        };

        return targetFunction.apply(proxy, arguments);
    };
}


// redirect to saved locale
export function setPreferredLocale(newLocale) {
    const { req, res, route, store, redirect, i18n, getRouteBaseName, localePath, i18nHasLocalizedRoute } = this;

    setCookie(newLocale, { res, req });
    store.commit('i18n/preferred/SET_LOCALE', newLocale);

    const baseRoute = route && route.name && { name: getRouteBaseName(route) };
    if (newLocale !== i18n.locale && baseRoute && i18nHasLocalizedRoute(baseRoute, newLocale)) {
        return redirect(localePath({ ...route, ...baseRoute }, newLocale));
    }

    return false;
}

// Get browser language either from navigator if running in mode SPA, or from the headers
function getBrowserLocale({ req }) {
    let browserLocale = null;
    if (process.client && typeof navigator !== 'undefined' && navigator.language) {
        browserLocale = navigator.language.toLocaleLowerCase().substring(0, 2);
    } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
        browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2);
    }
    return browserLocale;
}

function getCookie({ req }) {
    if (process.client) {
        return Cookies.get(LANGUAGE_COOKIE_KEY);
    } else if (req && typeof req.headers.cookie !== 'undefined') {
        const cookies = req.headers && req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
        return cookies[LANGUAGE_COOKIE_KEY];
    }
    return null;
}

function setCookie(value, { res, req }) {
    const date = new Date();
    if (process.client) {
        Cookies.set(LANGUAGE_COOKIE_KEY, value, {
            expires: new Date(date.setDate(date.getDate() + 365)),
            domain: window.location.host.split('.').slice(-2).join('.').replace(/:\d+$/, ''),
        });
    } else if (res && req) {
        const redirectCookie = cookie.serialize(LANGUAGE_COOKIE_KEY, value, {
            expires: new Date(date.setDate(date.getDate() + 365)),
            domain: req.headers.host.split('.').slice(-2).join('.').replace(/:\d+$/, ''),
        });
        addResCookie(res, redirectCookie);
    }
}

function addResCookie(res, serializedCookie) {
    if (!res) {
        return;
    }

    let cookieHeader = res.getHeader('Set-Cookie') || [];
    // cookie header to array
    if (!Array.isArray(cookieHeader)) {
        cookieHeader = [cookieHeader];
    }

    cookieHeader.push(serializedCookie);
    res.setHeader('Set-Cookie', cookieHeader);
}

/* eslint-disable import/no-unresolved */
import Vue from 'vue';
import cookie from 'cookie';
import Cookies from 'js-cookie';
import { getLocaleCodes } from 'nuxt-i18n/src/helpers/utils';
import { LANGUAGE_COOKIE_KEY, DETECT_BROWSER } from './variables';
import middleware from '../middleware'; // Nuxt's middleware


let isExecuted = false;

middleware['i18n-preferred'] = function i18nPreferredMiddleware({
    app, req, res, route, store, redirect, isHMR,
}) {
    if (isHMR) {
        return false;
    }

    // execute only on first load
    if (process.client && isExecuted) {
        return false;
    }
    isExecuted = true;

    // Helpers
    const locales = getLocaleCodes(app.i18n.locales);
    const preferredLocale = getCookie();
    const isRootPath = route.path === '/';

    // @TODO redirect on any page
    // redirect only on root page, on other pages just set current locale as preferred
    if (isRootPath && preferredLocale && locales.indexOf(preferredLocale) !== -1) {
        return setLocale(preferredLocale);
    } else if (isRootPath && DETECT_BROWSER) {
        const browserLocale = getBrowserLocale();
        if (browserLocale && locales.indexOf(browserLocale) !== -1) {
            return setLocale(browserLocale);
        }
    } else if (!isRootPath) {
        return setLocale(app.i18n.locale);
    }


    // expose API
    Vue.prototype.$i18nSetPreferredLocale = setLocale;
    app.i18nSetPreferredLocale = setLocale;

    return false;

    // redirect to saved locale
    function setLocale(newLocale) {
        setCookie(newLocale);
        store.commit('i18n/preferred/SET_LOCALE', newLocale);

        const baseRoute = route && route.name && { name: app.getRouteBaseName(route) };
        if (newLocale !== app.i18n.locale && baseRoute && app.hasLocalizedRoute(baseRoute, newLocale)) {
            return redirect(app.localePath(Object.assign({}, route, baseRoute), newLocale));
        }

        return false;
    }

    // Get browser language either from navigator if running in mode SPA, or from the headers
    function getBrowserLocale() {
        let browserLocale = null;
        if (process.client && typeof navigator !== 'undefined' && navigator.language) {
            browserLocale = navigator.language.toLocaleLowerCase().substring(0, 2);
        } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
            browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2);
        }
        return browserLocale;
    }

    function getCookie() {
        if (process.client) {
            return Cookies.get(LANGUAGE_COOKIE_KEY);
        } else if (req && typeof req.headers.cookie !== 'undefined') {
            const cookies = req.headers && req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
            return cookies[LANGUAGE_COOKIE_KEY];
        }
        return null;
    }

    function setCookie(value) {
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
};

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

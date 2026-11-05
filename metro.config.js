// Expo's Metro config, plus debug ids in each bundle so Sentry can match a
// crash to its source map. https://docs.expo.dev/guides/using-sentry/
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);

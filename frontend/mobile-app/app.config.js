const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo || {};
  const android = expo.android || {};
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || android.googleServicesFile;

  return {
    expo: {
      ...expo,
      android: {
        ...android,
        ...(googleServicesFile ? { googleServicesFile } : {}),
      },
    },
  };
};

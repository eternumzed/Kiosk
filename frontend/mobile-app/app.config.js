const appJson = require('./app.json');
const fs = require('fs');
const path = require('path');

module.exports = () => {
  const expo = appJson.expo || {};
  const android = expo.android || {};
  const googleServicesFile = process.env.GOOGLE_SERVICES_JSON || android.googleServicesFile;
  const googleServicesPath = googleServicesFile
    ? path.resolve(__dirname, googleServicesFile)
    : null;
  const hasGoogleServicesFile = googleServicesPath
    ? fs.existsSync(googleServicesPath)
    : false;

  return {
    expo: {
      ...expo,
      android: {
        ...android,
        ...(hasGoogleServicesFile ? { googleServicesFile } : {}),
      },
    },
  };
};

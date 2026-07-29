const appVersionConfig    = require('../config/appVersion');
const { successResponse } = require('../utils/response');

async function checkVersion(req, res, next) {
  try {
    const platform = req.query.platform === 'ios' ? 'ios' : 'android';
    const currentVersionCode = parseInt(req.query.versionCode, 10) || 0;

    const config = appVersionConfig[platform];
    const updateAvailable = currentVersionCode < config.latestVersionCode;

    successResponse(res, {
      updateAvailable,
      forceUpdate: updateAvailable && config.forceUpdate,
      latestVersion: config.latestVersion,
      latestVersionCode: config.latestVersionCode,
      updateUrl: config.updateUrl,
      releaseNotes: config.releaseNotes,
    });
  } catch (e) { next(e); }
}

module.exports = { checkVersion };

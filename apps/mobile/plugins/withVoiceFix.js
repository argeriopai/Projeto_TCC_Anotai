const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withVoiceFix(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('com.android.support:support-compat')) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      /android \{/,
      `android {
    configurations.all {
        exclude group: 'com.android.support', module: 'support-compat'
        exclude group: 'com.android.support', module: 'versionedparcelable'
    }`
    );
    return config;
  });
};

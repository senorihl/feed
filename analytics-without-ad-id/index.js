const plugins = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");
const fs = require("fs");

module.exports = function withAdId(config, enabled) {
  return plugins.withPodfile(config, (config) => {
    const {path, contents} = config.modResults;

    const withoutFirebase = mergeContents({
      tag: 'firebase_without_ad_id',
      src: contents,
      newSrc: !enabled ? '$RNFirebaseAnalyticsWithoutAdIdSupport = true' : '',
      anchor: /^(.*)$/,
      offset: 0,
      comment: "#",
    })

    if (!withoutFirebase.didMerge) {
      console.log(
        "ERROR: Cannot disable Firebase Analytics Ad Id in the project's ios/Podfile because it's malformed."
      );
      return config;
    }

    config.modResults.contents = withoutFirebase.contents;

    return config;

  })
};

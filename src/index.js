// 多言語の格納に対応したシームレスなユーティリティ
// （あるいは今週のびっくりどっきりメカ）

const {
  setToMixedObj,
  getToMixedObj,
  localizeMixedObject,
  SYSTEM_LANGUAGE,
  DEFAULT_DICT_KEY
} = require('./base')

const I18nObject = require('./i18n-object')

module.exports = {
  I18nObject,
  setToMixedObj,
  getToMixedObj,
  localizeMixedObject,
  SYSTEM_LANGUAGE,
  DEFAULT_DICT_KEY,
}

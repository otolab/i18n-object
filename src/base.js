// dictに格納しないデフォルトlocale
const SYSTEM_LANGUAGE = 'ja'

// mixed型に使う辞書データのkey
const DEFAULT_DICT_KEY = '__localize_dict'

// 内部情報の保持のためのSymbol
const internalDataKey = Symbol()


/*
obj = {
  title: 'たいとる',
  description: 'jaの説明',
  __localize_dict: {
    en: {
      title: 'title',
      description: 'en description'
    }
  }
}
 */


/**
  * 指定言語のkeyに対する値を取得する
  * @param {Object} obj - 対象となるオブジェクト
  * @param {Object} dict - 辞書データのオブジェクト
  * @param {string} key - 取得したい値のkey、入れ子には対応していない
  * @param {string} lang - 対象言語
  */
function get(obj, dict, key, lang=SYSTEM_LANGUAGE) {
  if (lang===SYSTEM_LANGUAGE) {
    return obj[key]
  }
  if (!dict[lang]) {
    return undefined
  }
  return dict[lang][key]
}

/**
  * 指定言語でkeyに対する値を格納する
  * @param {Object} obj - 対象となるオブジェクト
  * @param {Object} dict - 辞書データのオブジェクト
  * @param {string} key - 取得したい値のkey、入れ子には対応していない
  * @param {string} value - 書き込む値
  * @param {string} lang - 対象言語
  */
function set(obj, dict, key, value, lang=SYSTEM_LANGUAGE) {
  // console.log('[set]', obj, dict, key, value, lang)

  // system languageであれば辞書を無視する
  if (lang===SYSTEM_LANGUAGE) {
    return obj[key] = value
  }

  if (!dict[lang]) {
    dict[lang] = {}
  }
  dict[lang][key] = value

  // system languageの値が空の場合、localeを無視してsetする
  // if (!(key in obj)) {
  //   obj[key] = value
  // }

  return value
}

/**
  * 指定言語のkeyに対する値が設定されているか調べる
  * @param {Object} obj - 対象となるオブジェクト
  * @param {Object} dict - 辞書データのオブジェクト
  * @param {string} key - checkしたい値のkey、入れ子には対応していない
  * @param {string} lang - 対象言語
  */
function has(obj, dict, key, lang=SYSTEM_LANGUAGE) {
  // console.log('[has]', obj, dict, key, lang)
  if (lang===SYSTEM_LANGUAGE) {
    return key in obj
  }
  if (!dict[lang]) {
    return false
  }
  return key in dict[lang]
}

/**
  * 複数の指定言語を指定し、keyに対する値を取得する
  * @param {Object} obj - 対象となるオブジェクト
  * @param {Object} dict - 辞書データのオブジェクト
  * @param {string} key - checkしたい値のkey、入れ子には対応していない
  * @param {string|Array} languages - 対象言語
  */
function getByLanguages(obj, dict, key, languages=[SYSTEM_LANGUAGE]) {
  for (let lang of languages) {
    const value = get(obj, dict, key, lang)

    if (value != null) {
      return value
    }
  }
  return undefined
}

/**
  * 複数の指定言語を指定し、いずれかがkeyに対する値を持っているときtrueを返す
  * @param {Object} obj - 対象となるオブジェクト
  * @param {Object} dict - 辞書データのオブジェクト
  * @param {string} key - checkしたい値のkey、入れ子には対応していない
  * @param {string|Array} languages - 対象言語
  */
function hasByLanguages(obj, dict, key, languages=[SYSTEM_LANGUAGE]) {
  const results = languages.map((lang) => has(obj, dict, key, lang))
  return results.some((tf) => tf)
}

/**
  * 指定言語sのkeyに対する値を取得する
  * 辞書はobj[dictKey]に格納されているとする
  * @param {Object} obj - 対象となるオブジェクト
  * @param {string} key - checkしたい値のkey、入れ子には対応していない
  * @param {string|Array} languages - 対象言語
  * @param {string} dictKey - obj[dictKey]を辞書とみなす
  */
function getFromMixedObj(obj, key, lang=SYSTEM_LANGUAGE, dictKey=DEFAULT_DICT_KEY) {
  const dict = obj[dictKey] || {}

  if (lang instanceof Array) {
    return getByLanguages(obj, dict, key, lang)
  }
  else {
    return get(obj, dict, key, lang)
  }
}

/**
  * 指定言語でkeyに対する値を格納する
  * 複数の言語が指定されている場合は最優先の言語にのみ書き込む
  * 辞書はobj[dictKey]に格納されているとする
  * @param {Object} obj - 対象となるオブジェクト
  * @param {string} key - 取得したい値のkey、入れ子には対応していない
  * @param {string} value - 書き込む値
  * @param {string|Array} languages - 対象言語。idx:0の言語が対象となる
  * @param {string} dictKey - obj[dictKey]を辞書とみなす
  */
function setToMixedObj(obj, key, value, lang=SYSTEM_LANGUAGE, dictKey=DEFAULT_DICT_KEY) {
  let dict = obj[dictKey]

  if (lang instanceof Array) {
    lang = lang[0] || SYSTEM_LANGUAGE
  }

  if (lang !== SYSTEM_LANGUAGE && !dict) {
    dict = {}
    obj[dictKey] = dict
  }

  return set(obj, dict, key, value, lang)
}


/**
  * 複数の指定言語を指定し、いずれかがkeyに対する値を持っているときtrueを返す
  * 辞書はobj[dictKey]に格納されているとする
  * @param {Object} obj - 対象となるオブジェクト
  * @param {string} key - checkしたい値のkey、入れ子には対応していない
  * @param {string|Array} languages - 対象言語。複数である場合someをとる
  * @param {string} dictKey - obj[dictKey]を辞書とみなす
  */
function hasFromMixedObj(obj, key, lang=SYSTEM_LANGUAGE, dictKey=DEFAULT_DICT_KEY) {
  const dict = obj[dictKey] || {}

  if (lang instanceof Array) {
    return hasByLanguages(obj, dict, key, lang)
  }
  else {
    return has(obj, dict, key, lang)
  }
}


/**
  * 指定言語の値が保存されたオブエクトを返す
  * 辞書はobj[dictKey]に格納されているとする
  * @param {Object} obj - 対象となるオブジェクト
  * @param {string} lang - 対象言語
  * @param {string} dictKey - obj[dictKey]を辞書とみなす
  */
function getOwnFromMixedObj(obj, lang=SYSTEM_LANGUAGE, dictKey=DEFAULT_DICT_KEY) {
  if (lang instanceof Array) {
    lang = lang[0] || SYSTEM_LANGUAGE
  }

  if (lang === SYSTEM_LANGUAGE) {
    return obj
  }

  const dict = obj[dictKey] || {}
  return dict[lang] || {}
}


function localizeMixedObject(obj, props, languages, dictKey=DEFAULT_DICT_KEY) {
  // for mongoose
  if (obj.toObject) obj = obj.toObject();

  const o = Object.assign({}, obj)
  const dict = (o[DEFAULT_DICT_KEY] || {})[languages[0]] || {}

  for (let p of props) {
    if (p in dict) {
      o[p] = dict[p]
    }
  }
  if (o[DEFAULT_DICT_KEY]) delete o[DEFAULT_DICT_KEY];
  return o
}


module.exports = {
  SYSTEM_LANGUAGE,
  DEFAULT_DICT_KEY,
  internalDataKey,
  getFromMixedObj,
  setToMixedObj,
  hasFromMixedObj,
  getOwnFromMixedObj,
  localizeMixedObject
}
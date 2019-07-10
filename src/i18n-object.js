const {
  SYSTEM_LANGUAGE,
  DEFAULT_DICT_KEY,
  internalDataKey,
  getFromMixedObj,
  setToMixedObj,
  hasFromMixedObj,
  getOwnFromMixedObj
} = require('./base')


// cloneDeepは真似しづらいので使う
const {cloneDeepWith: cloneDeepWithLodash, pick: pickLodash} = require('lodash')


function generateProxyHandlers(oldInternalData, props, languages, dictKey) {
  let self = null
  let customGetters = {}
  let customSetters = {}

  if (oldInternalData) {
    ({self, customGetters, customSetters} = oldInternalData)
    if (!props) props = oldInternalData.props;
    if (!languages || !languages.length) languages = oldInternalData.languages;
    if (!dictKey) dictKey = oldInternalData.dictKey;
  }
  else {
    if (!languages || !languages.length) languages = [SYSTEM_LANGUAGE];
    if (!dictKey) dictKey = DEFAULT_DICT_KEY;
  }

  const propertyKey = (prop) => `${languages[0]}.${prop}`

  function getGetter(self, target, prop) {
    const k = propertyKey(prop)
    if (!customGetters[k]) {
      customGetters[k] = () => getFromMixedObj(target, prop, languages, dictKey)
    }
    return customGetters[k]
  }

  function getSetter(self, target, prop) {
    const k = propertyKey(prop)
    if (!customSetters[k]) {
      customSetters[k] = (value) => {
        setToMixedObj(target, prop, value, languages, dictKey)
        return true
      }
    }
    return customSetters[k]
  }

  return {
    get(target, prop) {
      if (prop === internalDataKey) {
        return {props, languages, dictKey, self: self || this, customGetters, customSetters}
      }
      if (prop === 'unwrap' || prop === 'toObject') {
        return () => target
      }
      if (prop === dictKey) {
        throw new Error('')
      }
      if (!props.includes(prop)) {
        return target[prop]
      }
      const getter = getGetter(self || this, target, prop)
      return getter.call(target)
    },
    set(target, prop, value) {
      if (!props.includes(prop)) {
        target[prop] = value
        return true
      }
      if (prop === dictKey) {
        throw new Error('')
      }
      const setter = getSetter(self || this, target, prop)
      setter.call(target, value)
      return true
    },
    has(target, prop) {
      if (prop === dictKey) {
        return false
      }
      if (!props.includes(prop)) {
        return prop in target
      }
      return hasFromMixedObj(target, prop, languages, dictKey)
    },
    ownKeys(target) {
      const obj = getOwnFromMixedObj(target, languages, dictKey)
      if (obj === target) {
        return Object.getOwnPropertyNames(obj)
          .filter((prop) => prop !== dictKey)
      }
      else {
        return Object.getOwnPropertyNames(target)
          .filter((prop) => !props.includes(prop))
          .concat(Object.getOwnPropertyNames(obj)
            .filter((prop) => props.includes(prop)))
          .filter((prop) => prop !== dictKey)
      }
    },
    getOwnPropertyDescriptor(target, prop) {
      if (!props.includes(prop)) {
        return Object.getOwnPropertyDescriptor(target, prop)
      }
      // 架空のgetter/setterを返す
      // 値は直接存在しているが、computedであることを明治することで、
      // Vueなどのシステムに考慮を求めることができる
      return {
        get: getGetter(self || this, target, prop),
        set: getSetter(self || this, target, prop),
        configurable: true,
        enumerable: true,
      }
    },
    defineProperty(target, prop, desc) {
      if (!props.includes(prop)) {
        return Object.defineProperty(target, prop, desc)
      }
      if (['get', 'set', '$lang'].includes(prop)) {
        throw new Error('')
      }
      // Vueなどのgetter/setterを設定してくるシステムへの対応
      // ここでのthisはProxyのインスタンスではなく、内部的なオブジェクト
      const k = propertyKey(prop)
      if (desc.get) {
        customGetters[k] = desc.get
      }
      if (desc.set) {
        customSetters[k] = desc.set
      }
      return true
    }
  }
}

/**
  * 
  * @param {Object} obj - 対象となるオブジェクト
  * @param {Array} props - 多言語化対応するprops
  * @param {string} lang - 対象言語
  * @param {string} dictKey - obj[dictKey]を辞書とみなす
  */
function wrap(obj, props, languages, dictKey) {
  if (!obj) return (obj, _props, _languages, _dictKey) => wrap(obj, _props || props, _languages || languages, _dictKey || dictKey);

  const internalData = obj[internalDataKey] || null

  // objがすでにi18n Objectであった場合に状態を引き継ぐ
  if (internalData) {
    obj = obj.unwrap()
  }
  else if ('toObject' in obj) {
    // for mongoose
    obj = obj.toObject()
  }

  const handlers = generateProxyHandlers(internalData, props, languages, dictKey)

  return new Proxy(obj, handlers)
}


function create(data, props, languages, dictKey) {
  if (!data) return (obj, _props, _languages, _dictKey) => create(obj, _props || props, _languages || languages, _dictKey || dictKey);

  return assign(wrap({}, props, languages, dictKey), data)
}


function pick(obj, keys) {
  // 仮: pick(null, keys)はカリー化された関数を返す
  if (!obj) return (obj, _keys) => pick(obj, _keys || keys);

  if (!isI18nObject(obj)) return pickLodash(obj, keys);

  // umm. for Vue computed field
  for (let k of keys) obj[k];

  const {props, languages, dictKey} = obj[internalDataKey]
  const o = obj.unwrap()
  const ret = {}
  Object.getOwnPropertyNames(o).forEach((k) => {
    if (k === dictKey) {
      const dict = o[k]
      const retDict = {}
      for (let lang in dict) {
        retDict[lang] = {}
        for (let l of props) {
          if (keys.includes(l) && l in dict[lang]) {
            retDict[lang][l] = dict[lang][l]
          }
        }
      }
      ret[dictKey] = retDict
    }
    else {
      if (keys.includes(k)) {
        ret[k] = o[k]
      }
    }
  })

  return wrap(ret, props, languages, dictKey)
}

function unwrap(obj) {
  if (!isI18nObject(obj)) return obj;
  return obj.unwrap()
}

function isI18nObject(obj) {
  return obj && !!obj[internalDataKey]
}

function cloneDeepCustomizer(obj) {
  if (isI18nObject(obj)) {
    return cloneDeep(obj)
  }
}

function cloneDeep(obj) {
  if (!obj) return cloneDeep;

  const {props, languages, dictKey} = obj[internalDataKey]
  const cloned = cloneDeepWithLodash(obj.unwrap(), cloneDeepCustomizer)
  return wrap(cloned, props, languages, dictKey)
}

function _getDict(o) {
  return o.unwrap()[o[internalDataKey].dictKey]
}

function _assignI18nObj(a, b) {
  const {props, languages, dictKey} = a[internalDataKey]

  // system languageのassign
  const _a = wrap(a, null, [SYSTEM_LANGUAGE])
  const _b = wrap(b, null, [SYSTEM_LANGUAGE])
  Object.assign(_a, _b)

  // 各辞書のassign
  const objA = a.unwrap()
  const dictA = _getDict(a) || {}
  const dictB = _getDict(b) || {}
  if (!objA[dictKey]) objA[dictKey] = {};
  for (let lang of Object.keys(dictB)) {
    objA[dictKey][lang] = Object.assign(dictA[lang] || {}, dictB[lang])
  }

  return a
}


function assign(...objs) {
  if (!objs[0]) return (..._objs) => assign(..._objs, ...objs);

  return objs.reduce((o, obj) => {
    if (!o) return o;
    if (isI18nObject(obj)) {
      // 辞書の状態も保ってassignする
      _assignI18nObj(o, obj)
    }
    else {
      // objはlocalizedな状態とみなす
      Object.assign(o, obj)
    }
    return o
  })
}


function compose(...f) {
  return function(obj) {
    for (let g of f) {
      obj = g(obj)
    }
    return obj
  }
}


function toLocalizedObject(obj) {
  if (!obj) return toLocalizedObject;

  const {props, languages, dictKey} = obj[internalDataKey]
  const o = Object.assign({}, obj)
  for (let p of props) {
    if (p in obj) {
      o[p] = obj[p]
    }
  }
  return o
}



module.exports = {
  wrap,
  create,
  unwrap,
  compose,
  pick,
  cloneDeep,
  cloneDeepCustomizer,
  assign,
  isI18nObject,
  isI18nObj: isI18nObject,
  toLocalizedObject
}
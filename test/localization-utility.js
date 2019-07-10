require('../../src/karte/settings/import')
// require('../_setup')

const chai = require('chai')

chai.should()
const {expect} = chai

const {I18nObject} = require('common/localization-utility')
const {wrap, create, pick, cloneDeep, assign, toLocalizedObject, isI18nObj, unwrap, compose} = I18nObject


describe('localization-utility', function() {

  describe('空の状態からの追加', function() {

    before(function() {
    })

    it('write ja', function() {
      const orig = {}
      const obj = wrap(orig, ['a'], ['ja', 'en'])

      expect('a' in obj).to.be.false
      expect(obj.a).to.be.undefined

      obj.a = 'あ'

      expect('a' in obj).to.be.true
      expect(obj.a).to.be.equals('あ')

      expect(orig.a).to.be.equals('あ')
      expect(orig.__localize_dict).to.be.undefined
    })

    it('write ja => en', function() {
      const orig = {}
      const obj = wrap(orig, ['a'], ['ja', 'en'])
      const enObj = wrap(obj, ['a', 'b'], ['en', 'ja'])

      expect('a' in obj).to.be.false
      expect(obj.a).to.be.undefined

      obj.a = 'あ'

      expect('a' in enObj).to.be.true
      expect(enObj).to.have.property('a')
      expect(enObj.a).to.be.equals('あ')

      // own
      // expect(enObj).to.not.have.own.property('a')

      enObj.a = 'A'

      expect('a' in enObj).to.be.true
      expect(enObj).to.have.property('a')
      // expect(enObj).to.have.own.property('a')

      expect(obj.a).to.be.equals('あ')
      expect(enObj.a).to.be.equals('A')

      expect(orig.a).to.be.equals('あ')
      expect(orig.__localize_dict.ja).to.be.undefined
      expect(orig.__localize_dict.en.a).to.be.equals('A')

      enObj.b = 'B'

      expect(orig.b).to.be.undefined
      expect(obj.b).to.be.undefined
      expect(enObj.b).to.equals('B')
      expect(orig.__localize_dict.en.b).to.be.equals('B')
    })

    it('Object.assign({}, en)によるlocalizeされた状態の固定', function() {
      const en = wrap({name: 'なまえ', desc: '説明'}, ['name', 'desc'], ['en', 'ja'])
      en.name = 'NAME'
      const o = Object.assign({}, en)
      expect(o.desc).to.be.undefined // fallbackが起きない
      expect(o.name).to.equals('NAME')
    })

    it('toLocalizedObject(en)によるlocalizeされた状態の固定', function() {
      const en = wrap({name: 'なまえ', desc: '説明'}, ['name', 'desc'], ['en', 'ja'])
      en.name = 'NAME'

      const o = toLocalizedObject(en)

      expect(en.toObject().name).to.equals('なまえ')
      expect(o.desc).to.equals('説明')
      expect(o.name).to.equals('NAME')
    })

    describe('getOwnPropertyNames', function() {
      const obj = {a: 'A', b: 'B', c: 'C'}
      const en = wrap(obj, ['a', 'b'], ['en', 'ja'])

      before(function() {
        en.a = 'A'
      })

      it('propに含まれないkeysは元のobjectの状態による', function() {
        const keys = Object.getOwnPropertyNames(en)
        expect(keys.includes('a')).to.be.true
        expect(keys.includes('c')).to.be.true
      })

      it('対象のlangの要素がなければownとみなさない', function() {
        const keys = Object.getOwnPropertyNames(en)
        expect(keys.includes('b')).to.be.false
      })
    })

  })

  describe('utils', function() {

    describe('wrap', function() {
      const obj = {a: 'A', b: 'B', c: 'C'}
      const ja = wrap(obj, ['a', 'b'], ['ja', 'en'])
      const en = wrap(ja, null, ['en'])

      before(function() {
        ja.a = 'あ'
        ja.b = 'びー'
        ja.c = 'しー'

        expect(ja.a).to.equals('あ')
        expect(ja.b).to.equals('びー')
        expect(ja.c).to.equals('しー')

        en.a = 'aa'
        en.c = 'C'
      })

      it('ja.aとen.aは独立している', function() {
        expect(ja.a).to.equals('あ')
        expect(en.a).to.equals('aa')
      })

      it('languages=["en"]かつen.bは未定義なのでundefined', function() {
        expect(ja.b).to.equals('びー')
        expect(en.b).to.equals(undefined)
      })

      it('多言語化対象外のpropなので最後の代入が返る', function() {
        expect(ja.c).to.equals('C')
        expect(en.c).to.equals('C')
      })

      it('curry化')
    })

    describe('pick', function() {
      const obj = {a: 'あ', b: 'い', c: 'う'}
      const en = wrap(obj, ['a', 'b'], ['en', 'ja'])

      before(function() {
        en.a = 'A'
      })

      it('a, cをpick', function() {
        const o = pick(en, ['a', 'c'])

        expect(o.a).to.equals('A')
        expect(o.b).to.be.undefined
        expect(o.c).to.equals('う')
      })

      it('b, cをpick', function() {
        const o = pick(en, ['b', 'c'])

        expect(o.a).to.be.undefined
        expect(o.b).to.equals('い')
        expect(o.c).to.equals('う')
      })

      it('pickされると元のObjと切り離される', function() {
        const o = pick(en, ['a'])

        o.b = 'B'

        expect(o.b).to.equals('B')
        expect(en.b).to.equals('い')
        expect(obj.b).to.equals('い')
      })

    })

    describe('create', function() {
    })

    describe('cloneDeep', function() {
      const obj = {a: 'あ', b: 'い', c: [1, 2, 3]}
      const en = wrap(obj, ['a', 'b'], ['en', 'ja'])

      before(function() {
        en.a = 'A'
      })

      it('cloneしたものもi18nObjである', function() {
        const o = cloneDeep(en)

        o.a = 'aa'
        
        expect(o.a).to.equals('aa')
        expect(o.toObject().a).to.equals('あ')
      })

      it('cloneできる', function() {
        const o = cloneDeep(en)

        expect(o.a).to.equals('A')
        expect(o.b).to.equals('い')
        expect(o.c).to.deep.equals([1, 2, 3])
      })

      it('深い階層にたいしてもcloneが効いている', function() {
        const o = cloneDeep(en)

        o.c.push(4)

        expect(obj.c).to.deep.equals([1, 2, 3])
        expect(en.c).to.deep.equals([1, 2, 3])
        expect(o.c).to.deep.equals([1, 2, 3, 4])
      })

    })

    describe('assign', function() {
      const obj = {a: 'あ', b: 'い', c: [1, 2, 3]}
      const ja = wrap(obj, ['a', 'b'], ['ja'])
      const en = wrap({}, ['a'], ['en', 'ja'])

      context('2つのi18nObjのマージ', function() {
        const obj = {a: 'あ', b: 'い', c: [1, 2, 3]}
        const en = wrap(obj, ['a'], ['en', 'ja'])
        const ja = wrap({}, ['a', 'b'], ['ja'])

        before(function() {
          en.a = 'A'
          assign(ja, en)
          obj.c.push(4)
        })

        it('最初の元オブジェクトに対しても変更が入る', function() {
          expect(obj.__localize_dict['en'].a).to.equals('A')
        }) 

        it('cloneDeepではないので、入れ子の値は共有される', function() {
          expect(obj.c).to.deep.equals([1, 2, 3, 4])
          expect(ja.c).to.deep.equals([1, 2, 3, 4])
          expect(en.c).to.deep.equals([1, 2, 3, 4])
        })

      })

      context('3つのi18nObjのマージ', function() {
        const obj = {}
        const en = wrap(obj, ['a', 'b', 'c'], ['en'])
        const ja = wrap({}, ['a', 'b'], ['ja'])
        const io = wrap({}, ['b', 'c', 'd'], ['io'])

        before(function() {
          en.a = 'A'
          ja.b = 'い'
          io.c = 'CC'
          io.d = 'DD'
          assign(en, ja, io)
        })

        it('言語を考慮してマージされるので上書きされない', function() {
          expect(en).to.deep.equals({a: 'A'})
          expect(ja).to.deep.equals({b: 'い'})
          expect(io).to.deep.equals({c: 'CC', d: 'DD'})
        })

        it('enには辞書内に保管されている', function() {
          expect(wrap(en, null, ['ja']).b).to.equals('い')
          expect(wrap(en, null, ['io']).c).to.equals('CC')
        })

        it('複数言語を指定すればまとめて取り出せる', function() {
          // enはdをpropsとして持たないので、検索の対象にならない
          expect(wrap(en, null, ['en', 'ja', 'io']).d).to.be.undefined

          // この方法でとれるのはownの値だけ(primaryLanguageのみ)である
          expect(wrap(en, null, ['en', 'ja', 'io'])).to
            .deep.equals({a: 'A'})

          expect(toLocalizedObject(wrap(en, null, ['en', 'ja', 'io']))).to
            .deep.equals({a: 'A', b: 'い', c: 'CC'})

          expect(toLocalizedObject(wrap(en, null, ['en', 'io']))).to
            .deep.equals({a: 'A', c: 'CC'})
          expect(toLocalizedObject(wrap(en, null, ['ja', 'io']))).to
            .deep.equals({b: 'い', c: 'CC'})
        })


        it('jaの辞書には書き込まれない', function() {
          expect(wrap(ja, null, ['io']).c).to.be.undefined
        })

        it('もともと対象に含めていなかった値も保持している', function() {
          expect(wrap(en, ['d'], ['io']).d).to.equals('DD')
          expect(obj.__localize_dict['io'].d).to.equals('DD')
        })
      })

      it('最初のオブジェクトはi18nObjでなければならない', function() {
        let _err
        try {
          assign({}, ja)
        }
        catch (err) {
          _err = err
        }
        expect(_err instanceof Error).to.be.true
      })

      it('curry化')
    })

  })

  describe('monad則', function() {


// 対象: localizedObject(+dict, props, languages) = {...}
// 射: wrap, assign(Object), cloneDeep, pick(keys)
// ドメイン, コドメイン: localizedObject(+dict, props, languages)
// 恒等射: wrap
// 合成: compose
// 結合律: 満足
// 単位律: 満足

    // 圏にタイプを含む
    const _wrapA = wrap(null, ['name'], ['en', 'ja'])

    describe('domain', function() {

      const data = {name: 'NAME', a: 'あ', b: 'B', __localize_dict: {en: {a: 'A'}}}

      it('domain => codomain', function() {
        const obj = data
        const o = _wrapA(obj)
        expect(isI18nObj(o)).to.be.true
      })

      it('codomain => domain', function() {
        const obj = data
        const o = _wrapA(obj)
        expect(unwrap(o)).to.equals(obj)
        expect(unwrap(o) === obj).to.be.true
      })

      it('domain => codomain => domain', function() {
        const obj = data
        const o = _wrapA(obj)
        const obj2 = unwrap(o)
        const o2 = _wrapA(obj2)
        expect(o2).to.deep.equals(o)
      })

    })

    describe('恒等射', function() {

      it('wrap', function() {
        const obj = {}
        const o = _wrapA(_wrapA(_wrapA(_wrapA(obj))))
        expect(o).to.deep.equals(_wrapA(obj))
      })

    })

    describe('合成', function() {

      describe('結合律', function() {
        const data = {name: 'なまえ', a: 'あ', b: 'B', __localize_dict: {en: {name: 'NAME', a: 'A'}}}

        const funcs = {
          wrap: wrap(null, ['name', 'a'], ['en', 'ja']),
          assign: assign(null, {name: 'test', b: 'B!'}),
          pickA: pick(null, ['a']),
          pickName: pick(null, ['name', 'b']),
          cloneDeep
        }

        const obj = wrap(data, ['name', 'a'], ['en', 'ja'])

        function _test(obj, a, b, c) {
          const f1 = compose(compose(a, b), c)
          const f2 = compose(a, compose(b, c))

          expect(f1(obj)).to.deep.equals(f2(obj))
        }

        const keys = Object.keys(funcs)
        for (let i=0; i < keys.length; i++) {
          it(`${keys[i]} * a * b`, function() {
            for (let j=0; j < keys.length; j++) {
              for (let k=0; k < keys.length; k++) {
                _test(obj, funcs[keys[i]], funcs[keys[j]], funcs[keys[k]])
              }
            }
          })
        }
      })

      describe('単位律', function() {

        const data = {name: 'なまえ', a: 'あ', b: 'B', __localize_dict: {en: {name: 'NAME', a: 'A'}}}

        it('wrap', function() {
          const obj = _wrapA({name: 'NAME', a: 'A', b: 'B'})
          const f = compose(_wrapA, pick(null, ['name', 'a']))
          const g = compose(pick(null, ['name', 'a']), _wrapA)
          expect(f(obj)).to.deep.equals(g(obj))

          // nameはfallbackされた値になるので、比較の際には現れない
          expect(f(obj)).to.deep.equals({
            a: 'A'
          })

        })

      })

    })


  })

})

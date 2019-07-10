const {promisify} = require('util')
const {expect} = require('chai')
const td = require('testdouble')
const {isA, anything} = td.matchers

const wait = (t=50) => promisify(setTimeout)(t)

const Vue = require('vue')

// const {assignI18nObj, wrapI18nObj} = require('../src/i18n')
const {I18nObject, SYSTEM_LANGUAGE} = require('../../../../karte/common/localization-utility')
const {wrap, pick, cloneDeep, cloneDeepCustomizer, assign} = I18nObject


describe('i18n Object w/ Vue', function(){

  describe('', function() {

    context('watch i18n Object', function() {
      after(function() {
        td.reset()
      })

      before(function() {
        const obj = assign(wrap({name: '日本語名', description: 'fallback'}, ['name', 'description'], ['en', 'ja']), {name: 'NAME', other: ''})
        const watchComputedProperty = td.func('watch computed property')
        // const watchComputedProperty = td.func((...args) => console.log('???', args))

        const app = new Vue({
          data: {
            obj,
          },
          computed: {
            objName() {
              return this.obj.name + this.obj.other
            },
            objDescription() {
              return this.obj.description
            }
          },
          watch: {
            objName: watchComputedProperty,
            objDescription: watchComputedProperty
          }
        })

        this.app = app
        this.obj = obj
        this.watchComputedProperty = watchComputedProperty
      })

      it('primary languageが取得できる', function() {
        const {app} = this
        expect(app.objName).to.equals('NAME')
      })

      it('fallbackが機能する', function() {
        const {app} = this
        expect(app.objDescription).to.equals('fallback')
      })

      it('appを直接書き換える', async function() {
        const {app, watchComputedProperty} = this
        app.obj.name = 'name!'
        await wait()
        td.verify(watchComputedProperty('name!', anything()))
      })

      it('objを書き換える', async function() {
        const {obj, watchComputedProperty} = this
        obj.name = 'name!!'
        await wait()
        td.verify(watchComputedProperty('name!!', anything()))
      })

      it('一時的に他言語でwrapしてもotherの変更ならwatchできる', async function() {
        const {obj, app, watchComputedProperty} = this
        wrap(obj, null, ['ja']).name = 'なまえ!!!'
        wrap(obj, null, ['ja']).other = 'あざー'
        await wait()
        td.verify(watchComputedProperty('name!!あざー', anything()))
      })

    })

    context('同一だが異なる言語設定のi18n Objectを持つ2つのVueインスタンス', function() {
      after(function() {
        td.reset()
      })

      before(function() {
        const objA = wrap({name: '日本語'}, ['name'], ['en'])
        const objTmp = wrap(objA, ['name'], ['ja'])
        const objB = wrap(objTmp, ['name'], ['en'])
        const watchComputedPropertyA = td.func('watch computed property A')
        const watchComputedPropertyB = td.func('watch computed property B')

        objA.name = 'english'

        const appA = new Vue({
          data: {
            objA,
          },
          computed: {
            objName() {
              return this.objA.name
            },
          },
          watch: {
            objName: watchComputedPropertyA,
          }
        })

        const appB = new Vue({
          data: {
            objB,
          },
          computed: {
            objName() {
              return this.objB.name
            },
          },
          watch: {
            objName: watchComputedPropertyB,
          }
        })

        this.appA = appA
        this.appB = appB
        this.objA = objA
        this.watchComputedPropertyA = watchComputedPropertyA
        this.watchComputedPropertyB = watchComputedPropertyB
      })

      it('appA => appBはつながっている', async function() {
        const {appA, watchComputedPropertyB} = this
        appA.objA.name = 'english2'
        await wait()
        td.verify(watchComputedPropertyB('english2', anything()))
      })

      it('appB => appAはつながっている', async function() {
        const {appB, watchComputedPropertyA} = this
        appB.objB.name = 'english3'
        await wait()
        td.verify(watchComputedPropertyA('english3', anything()))
      })

      it('objA => appBまでつながっている', async function() {
        const {objA, appB, watchComputedPropertyA, watchComputedPropertyB} = this
        objA.name = 'english4'
        await wait()
        td.verify(watchComputedPropertyA('english4', anything()))
        td.verify(watchComputedPropertyB('english4', anything()))
      })


      it('言語設定の変更を繰り返しても問題ない', async function() {
        const {objA, appB, watchComputedPropertyA, watchComputedPropertyB} = this

        // 書き込みは正しく行われるが、watch対象ではない
        const tmp = wrap(objA, null, ['ja'])
        tmp.name = '日本語'
        expect(tmp.name).to.equals('日本語')
        expect(wrap(objA, null, ['ja']).name).to.equals('日本語')
        expect(objA.toObject().name).to.equals('日本語')

        // もう一度enのオブジェクトを作って書き込む
        wrap(tmp, null, ['en', 'ja']).name = 'english5'
        await wait()
        td.verify(watchComputedPropertyA('english5', anything()))
        td.verify(watchComputedPropertyB('english5', anything()))
      })

    })

  })


});

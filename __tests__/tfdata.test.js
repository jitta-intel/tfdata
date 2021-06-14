const TFdata = require('../tfdata')
const util = require('../util')

function ck(str) {
  return util.scopeKeyToDate(str)
}

const sampleTimeless = () => ({
  _type: 'timeless',
  value: 'Test'
})

const sampleSeries = (type = 'quarterly') => ({
  _type: type,
  _values: []
})

describe('TFdata', () => {
  test('auto convert string Date to Date Object', () => {
    const data = [
      { seen: ck('2000').toISOString(), v: 1 },
      { seen: ck('2001').toISOString(), v: 2 }
    ]
    const result = new TFdata('annually', data)
    result.data.forEach((datum) => {
      expect(datum.seen instanceof Date).toBe(true)
    })
    expect(result.data.map(v => v.seen)).toEqual(
      [ck('2000'), ck('2001')]
    )
  })

  describe('TFdata.initFromRaw()', () => {
    describe('timeless', () => {
      it('return an instance of tfdata', () => {
        const sample = sampleTimeless()
        const result = TFdata.initFromRaw(sample)
        expect(result instanceof TFdata).toEqual(true)
      })
    })

    describe('series', () => {
      it('return an instance of tfdata', () => {
        const sample = sampleTimeless()
        const result = TFdata.initFromRaw(sample)
        expect(result instanceof TFdata).toEqual(true)
      })
    })

    describe('with formula', () => {
      it('set ttm if formula as ttm tag', () => {
        const formula = {
          tags: ['ttm']
        }

        const data = TFdata.initFromRaw(sampleSeries(), formula)
        expect(data.isTTM).toEqual(true)
      })
      it('does not set ttm if formula does not have ttm tag', () => {
        const formula = {
          tags: []
        }
        const data = TFdata.initFromRaw(sampleSeries(), formula)
        expect(data.isTTM).toEqual(false)
      })
    })
  })

  describe('TFdata.trendCountStrict()', () => {
    test('count trend of end of array', () => {
      expect(TFdata.trendCountStrict([1, 2, 3, 2])).toBe(-1)
    })

    test('increasing', () => {
      expect(TFdata.trendCountStrict([1, 2, 3])).toBe(2)
    })

    test('no trend2', () => {
      expect(TFdata.trendCountStrict([1, 1, 1])).toBe(0)
    })

    test('empty array has no trend', () => {
      expect(TFdata.trendCountStrict([])).toBe(0)
    })

    test('single value array', () => {
      expect(TFdata.trendCountStrict([1])).toBe(0)
    })

    test('do not count unchange value as trend', () => {
      expect(TFdata.trendCountStrict([1, 2, 3, 4, 5, 5, 6, 7])).toBe(2)
    })

    test('decreasing', () => {
      expect(TFdata.trendCountStrict([7, 6, 5, 4, 3, 2, 1])).toBe(-6)
    })

    test('start after last null value', () => {
      expect(TFdata.trendCountStrict([1, 2, 3, null, null, 1, 2, 3])).toBe(2)
    })

    test('return 0 if last value is null', () => {
      expect(TFdata.trendCountStrict([1, 2, 3, null])).toBe(0)
    })
  })

  describe('TFdata.trendCount()', () => {
    test('count trend of end of array', () => {
      expect(TFdata.trendCount([1, 2, 3, 2])).toBe(-1)
    })

    test('increasing', () => {
      expect(TFdata.trendCount([1, 2, 3])).toBe(2)
    })

    test('no trend2', () => {
      expect(TFdata.trendCount([1, 1, 1])).toBe(0)
    })

    test('empty array has no trend', () => {
      expect(TFdata.trendCount([])).toBe(0)
    })

    test('single value array', () => {
      expect(TFdata.trendCount([1])).toBe(0)
    })

    test('do not count unchange value as trend', () => {
      expect(TFdata.trendCount([1, 2, 3, 4, 5, 5, 6, 7])).toBe(7)
    })

    test('decreasing', () => {
      expect(TFdata.trendCount([7, 6, 5, 4, 3, 2, 1])).toBe(-6)
    })

    test('start after last null value', () => {
      expect(TFdata.trendCount([1, 2, 3, null, null, 1, 2, 3])).toBe(2)
    })

    test('return 0 if last value is null', () => {
      expect(TFdata.trendCount([1, 2, 3, null])).toBe(0)
    })

    test('allow unchange values within trend', () => {
      expect(TFdata.trendCount([2, 1, 2, 3, 3, 3, 4, 5])).toBe(6)
    })
    test('allow unchane value at the end of trend', () => {
      expect(TFdata.trendCount([2, 1, 2, 3, 3, 3])).toBe(4)
    })
  })

  describe('isEmpty()', () => {
    describe('timeless', () => {
      it('returns false', () => {
        const sample = sampleTimeless()
        const data = TFdata.initFromRaw(sample)
        expect(data.isEmpty()).toEqual(false)
      })
    })

    describe('series', () => {
      it('returns true', () => {
        const sample = sampleSeries()
        const data = TFdata.initFromRaw(sample)
        expect(data.isEmpty()).toEqual(true)
      })
    })
  })

  describe('isTimeless()', () => {
    describe('timeless', () => {
      it('returns true', () => {
        const sample = sampleTimeless()
        const data = TFdata.initFromRaw(sample)
        expect(data.isTimeless()).toEqual(true)
      })
    })

    describe('series', () => {
      it('returns false', () => {
        const sample = sampleSeries()
        const data = TFdata.initFromRaw(sample)
        expect(data.isTimeless()).toEqual(false)
      })
    })
  })

  describe('getValue()', () => {
    describe('timeless', () => {
      it('returns a single value', () => {
        const sample = sampleTimeless()
        const data = TFdata.initFromRaw(sample)
        expect(data.getValue()).toEqual('Test')
      })
    })

    describe('series', () => {
      it('returns a single value', () => {
        const sample = sampleSeries()
        sample._values.push({
          v: 1,
          seen: ck('2016-01-01')
        })
        const data = TFdata.initFromRaw(sample)
        expect(data.getValue()).toEqual(1)
      })

      it('returns the latest value', () => {
        const sample = sampleSeries()
        sample._values.push({
          v: 1,
          seen: new Date('2016-01-01')
        })
        sample._values.push({
          v: 2,
          seen: new Date('2016-01-03')
        })
        const data = TFdata.initFromRaw(sample)
        expect(data.getValue()).toEqual(2)
      })
    })
  })

  describe('getValueForCalendarKey()', () => {
    test('returns an object', () => {
      const expectedResult = {
        v: 3,
        ck: '2015Q4',
        seen: ck('2015Q4')
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3') },
          { v: 2, seen: new Date('2015-11-30') },
          expectedResult,
          { v: 4, seen: new Date('2016-01-30') }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)

      const result = tfdata.getValueForCalendarKey('2015Q4')
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getFirstValueForFiscalKey()', () => {
    test('return the first value when multiple exists', () => {
      const expectedResult = {
        v: 3,
        seen: ck('2015Q4'),
        fk: '2015Q4'
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          expectedResult,
          { v: 3.5, seen: ck('2015Q4'), fk: '2015Q4' },
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getFirstValueForFiscalKey('2015Q4')
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getValueForFiscalKey()', () => {
    test('returns an object', () => {
      const expectedResult = {
        v: 3,
        seen: ck('2015Q4'),
        fk: '2015Q4'
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          expectedResult,
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getValueForFiscalKey('2015Q4')
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getValuesForFiscalKey()', () => {
    test('returns an object', () => {
      const expectedResult = {
        v: 3,
        seen: ck('2015Q4'),
        fk: '2015Q4'
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          expectedResult,
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getValueForFiscalKey('2015Q4')
      expect(result).toEqual(expectedResult)
    })
  })

  describe('getValueForDate()', () => {
    test('default', () => {
      const expectedResult = {
        v: 3,
        seen: ck('2015Q4'),
        fk: '2015Q4'
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          expectedResult,
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getValueForDate(ck('2015Q4'))
      expect(result).toEqual(expectedResult)
    })

    test('use latest data', () => {
      const expectedResult = {
        v: 3,
        seen: ck('2015Q4'),
        fk: '2015Q4'
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          expectedResult,
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getValueForDate(new Date('2016-01-01'))
      expect(result).toEqual(expectedResult)
    })

    test('should check date and return value if latest data is in beforeDate', () => {
      const expectedResult = {
        v: 1,
        seen: ck('2015Q3'),
        fk: '2015Q3'
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getValueForDate(new Date('2016-01-01'), { beforeDate: new Date('2015-09-30') })
      expect(result).toEqual(expectedResult)
    })

    test('should check date and return null if latest data is outdated', () => {
      const expectedResult = {
        v: null,
        seen: new Date('2016-01-01'),
      }
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q3'), fk: '2015Q3' },
          { v: 4, seen: ck('2016Q1'), fk: '2016Q1' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.getValueForDate(new Date('2016-01-01'), { beforeDate: new Date('2015-10-31') })
      expect(result).toEqual(expectedResult)
    })
  })

  describe('toKeyValue()', () => {
    test('returns an object', () => {
      const data = {
        _type: 'monthly',
        _values: [
          { v: 1, seen: new Date('2015-10-30') },
          { v: 2, seen: new Date('2015-11-30') },
          { v: 3, seen: new Date('2015-12-30') }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue()
      expect(obj).toEqual({
        '2015-12': 3,
        '2015-11': 2,
        '2015-10': 1
      })
    })

    test('fiscal mode', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1'), fk: '2015Q1' },
          { v: 2, seen: ck('2015Q2'), fk: '2015Q2' },
          { v: 3, seen: ck('2015Q3'), fk: '2015Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue('quarterly', 'fiscal')
      expect(obj).toEqual({
        '2015Q3': 3,
        '2015Q2': 2,
        '2015Q1': 1
      })
    })

    test('use latest non null values', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1'), fk: '2015Q1' },
          { v: 2, seen: ck('2015Q2'), fk: '2015Q2' },
          { v: 3, seen: ck('2015Q3'), fk: '2015Q3' },
          { v: null, seen: ck('2015Q4'), fk: '2015Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue('quarterly', 'fiscal')
      expect(obj).toEqual({
        '2015Q3': 3,
        '2015Q2': 2,
        '2015Q1': 1
      })
    })

    test('fiscal mode with no fiscal key', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1') },
          { v: 2, seen: ck('2015Q2') },
          { v: 3, seen: ck('2015Q3') }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)

      const obj = tfdata.toKeyValue('quarterly', 'fiscal')
      expect(obj).toEqual({})
    })

    test('fiscal mode with missing fiscal key', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1') },
          { v: 2, seen: ck('2015Q2'), fk: '2015Q3' },
          { v: 3, seen: ck('2015Q3') }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)

      const obj = tfdata.toKeyValue('quarterly', 'fiscal')
      expect(obj).toEqual({
        '2015Q3': 2
      })
    })

    test('preferFirst options is true', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1'), fk: '2015Q1' },
          { v: 2, seen: ck('2015Q2'), fk: '2015Q1' },
          { v: 3, seen: ck('2015Q3'), fk: '2015Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)

      const obj = tfdata.toKeyValue('quarterly', 'fiscal', {
        preferFirst: true
      })
      expect(obj).toEqual({
        '2015Q3': 3,
        '2015Q2': null,
        '2015Q1': 1
      })
    })
    test('preferFirst options is false', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1'), fk: '2015Q1' },
          { v: 2, seen: ck('2015Q2'), fk: '2015Q1' },
          { v: 3, seen: ck('2015Q3'), fk: '2015Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue('quarterly', 'fiscal', false)
      expect(obj).toEqual({
        '2015Q3': 3,
        '2015Q2': null,
        '2015Q1': 2
      })
    })

    test('fill missing datapoint', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          {
            v: 1,
            seen: ck('2015Q1'),
          }, {
            v: 2,
            seen: ck('2015Q2'),
          }, {
            v: 3,
            seen: ck('2015Q4'),
          }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue('quarterly', 'calendar')
      expect(obj).toEqual({
        '2015Q1': 1,
        '2015Q2': 2,
        '2015Q3': null,
        '2015Q4': 3
      })
    })

    test('monthly frequency', () => {
      const data = {
        _type: 'monthly',
        _values: [
          { v: 1, seen: ck('2015-01') },
          { v: 2, seen: ck('2015-02') },
          { v: 3, seen: ck('2015-03') }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue('monthly', 'calendar')
      expect(obj).toEqual({
        '2015-01': 1,
        '2015-02': 2,
        '2015-03': 3,
      })
    })

    test('options.forwardFill', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1'), fk: '2015Q1' },
          { v: 3, seen: ck('2015Q3'), fk: '2015Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const obj = tfdata.toKeyValue('quarterly', 'fiscal', {
        forwardFill: true
      })
      expect(obj).toEqual({
        '2015Q3': 3,
        '2015Q2': 1,
        '2015Q1': 1
      })
    })
  })

  describe('lastQGrowth()', () => {
    describe('qoq', () => {
      test.skip('performance', () => {
        const data = {
          _type: 'quarterly',
          _values: [
            {
                "v" : null,
                "seen" : new Date("1999-02-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("1999-08-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("1999-11-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("2000-02-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("2000-05-15T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("2000-08-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("2000-11-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("2001-02-14T00:00:00.000Z"),
                "fk" : null,
                "ed" : null
            },
            {
                "v" : null,
                "seen" : new Date("2001-05-15T00:00:00.000Z"),
                "fk" : "2001Q1",
                "ed" : new Date("2001-03-31T00:00:00.000Z")
            },
            {
                "v" : null,
                "seen" : new Date("2001-08-14T00:00:00.000Z"),
                "fk" : "2001Q2",
                "ed" : new Date("2001-06-30T00:00:00.000Z")
            },
            {
                "v" : null,
                "seen" : new Date("2001-11-14T00:00:00.000Z"),
                "fk" : "2001Q3",
                "ed" : new Date("2001-09-30T00:00:00.000Z")
            },
            {
                "v" : null,
                "seen" : new Date("2002-02-14T00:00:00.000Z"),
                "fk" : "2001Q4",
                "ed" : new Date("2001-12-31T00:00:00.000Z")
            },
            {
                "v" : null,
                "seen" : new Date("2002-05-15T00:00:00.000Z"),
                "fk" : "2002Q1",
                "ed" : new Date("2002-03-31T00:00:00.000Z")
            },
            {
                "v" : null,
                "seen" : new Date("2002-08-14T00:00:00.000Z"),
                "fk" : "2002Q2",
                "ed" : new Date("2002-06-30T00:00:00.000Z")
            },
            {
                "v" : null,
                "seen" : new Date("2002-11-14T00:00:00.000Z"),
                "fk" : "2002Q3",
                "ed" : new Date("2002-09-30T00:00:00.000Z")
            },
            {
                "v" : 3.24238095238095,
                "seen" : new Date("2003-02-14T00:00:00.000Z"),
                "fk" : "2002Q4",
                "ed" : new Date("2002-12-31T00:00:00.000Z")
            },
            {
                "v" : 3.50904761904762,
                "seen" : new Date("2003-05-15T00:00:00.000Z"),
                "fk" : "2003Q1",
                "ed" : new Date("2003-03-31T00:00:00.000Z")
            },
            {
                "v" : 3.56619047619048,
                "seen" : new Date("2003-08-14T00:00:00.000Z"),
                "fk" : "2003Q2",
                "ed" : new Date("2003-06-30T00:00:00.000Z")
            },
            {
                "v" : 3.47253968253968,
                "seen" : new Date("2003-11-14T00:00:00.000Z"),
                "fk" : "2003Q3",
                "ed" : new Date("2003-09-30T00:00:00.000Z")
            },
            {
                "v" : 4.89333333333333,
                "seen" : new Date("2004-02-14T00:00:00.000Z"),
                "fk" : "2003Q4",
                "ed" : new Date("2003-12-31T00:00:00.000Z")
            },
            {
                "v" : 4.97746031746032,
                "seen" : new Date("2004-05-15T00:00:00.000Z"),
                "fk" : "2004Q1",
                "ed" : new Date("2004-03-31T00:00:00.000Z")
            },
            {
                "v" : 4.89333333333333,
                "seen" : new Date("2004-08-14T00:00:00.000Z"),
                "fk" : "2004Q2",
                "ed" : new Date("2004-06-30T00:00:00.000Z")
            },
            {
                "v" : 4.89333333333333,
                "seen" : new Date("2004-11-14T00:00:00.000Z"),
                "fk" : "2004Q3",
                "ed" : new Date("2004-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.18772486772487,
                "seen" : new Date("2005-02-14T00:00:00.000Z"),
                "fk" : "2004Q4",
                "ed" : new Date("2004-12-31T00:00:00.000Z")
            },
            {
                "v" : 6.03058201058201,
                "seen" : new Date("2005-05-15T00:00:00.000Z"),
                "fk" : "2005Q1",
                "ed" : new Date("2005-03-31T00:00:00.000Z")
            },
            {
                "v" : 6.01153439153439,
                "seen" : new Date("2005-08-14T00:00:00.000Z"),
                "fk" : "2005Q2",
                "ed" : new Date("2005-06-30T00:00:00.000Z")
            },
            {
                "v" : 5.83375661375661,
                "seen" : new Date("2005-11-14T00:00:00.000Z"),
                "fk" : "2005Q3",
                "ed" : new Date("2005-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.52560846560847,
                "seen" : new Date("2006-02-14T00:00:00.000Z"),
                "fk" : "2005Q4",
                "ed" : new Date("2005-12-31T00:00:00.000Z")
            },
            {
                "v" : 6.50656084656085,
                "seen" : new Date("2006-05-15T00:00:00.000Z"),
                "fk" : "2006Q1",
                "ed" : new Date("2006-03-31T00:00:00.000Z")
            },
            {
                "v" : 6.50656084656085,
                "seen" : new Date("2006-08-14T00:00:00.000Z"),
                "fk" : "2006Q2",
                "ed" : new Date("2006-06-30T00:00:00.000Z")
            },
            {
                "v" : 6.50656084656085,
                "seen" : new Date("2006-11-14T00:00:00.000Z"),
                "fk" : "2006Q3",
                "ed" : new Date("2006-09-30T00:00:00.000Z")
            },
            {
                "v" : 5.63523809523809,
                "seen" : new Date("2007-02-14T00:00:00.000Z"),
                "fk" : "2006Q4",
                "ed" : new Date("2006-12-31T00:00:00.000Z")
            },
            {
                "v" : 5.63365079365079,
                "seen" : new Date("2007-05-15T00:00:00.000Z"),
                "fk" : "2007Q1",
                "ed" : new Date("2007-03-31T00:00:00.000Z")
            },
            {
                "v" : 5.55746031746032,
                "seen" : new Date("2007-08-14T00:00:00.000Z"),
                "fk" : "2007Q2",
                "ed" : new Date("2007-06-30T00:00:00.000Z")
            },
            {
                "v" : 5.64730158730159,
                "seen" : new Date("2007-11-14T00:00:00.000Z"),
                "fk" : "2007Q3",
                "ed" : new Date("2007-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.75994708994709,
                "seen" : new Date("2008-02-14T00:00:00.000Z"),
                "fk" : "2007Q4",
                "ed" : new Date("2007-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.03613756613757,
                "seen" : new Date("2008-05-15T00:00:00.000Z"),
                "fk" : "2008Q1",
                "ed" : new Date("2008-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.04248677248677,
                "seen" : new Date("2008-08-14T00:00:00.000Z"),
                "fk" : "2008Q2",
                "ed" : new Date("2008-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.04089947089947,
                "seen" : new Date("2008-11-14T00:00:00.000Z"),
                "fk" : "2008Q3",
                "ed" : new Date("2008-09-30T00:00:00.000Z")
            },
            {
                "v" : 7.09544973544974,
                "seen" : new Date("2009-02-14T00:00:00.000Z"),
                "fk" : "2008Q4",
                "ed" : new Date("2008-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.07640211640212,
                "seen" : new Date("2009-05-15T00:00:00.000Z"),
                "fk" : "2009Q1",
                "ed" : new Date("2009-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.06687830687831,
                "seen" : new Date("2009-08-14T00:00:00.000Z"),
                "fk" : "2009Q2",
                "ed" : new Date("2009-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.03830687830688,
                "seen" : new Date("2009-11-14T00:00:00.000Z"),
                "fk" : "2009Q3",
                "ed" : new Date("2009-09-30T00:00:00.000Z")
            },
            {
                "v" : 7.53285714285714,
                "seen" : new Date("2010-02-14T00:00:00.000Z"),
                "fk" : "2009Q4",
                "ed" : new Date("2009-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.56142857142857,
                "seen" : new Date("2010-05-15T00:00:00.000Z"),
                "fk" : "2010Q1",
                "ed" : new Date("2010-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.54079365079365,
                "seen" : new Date("2010-08-14T00:00:00.000Z"),
                "fk" : "2010Q2",
                "ed" : new Date("2010-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.54238095238095,
                "seen" : new Date("2010-11-14T00:00:00.000Z"),
                "fk" : "2010Q3",
                "ed" : new Date("2010-09-30T00:00:00.000Z")
            },
            {
                "v" : 7.74391534391534,
                "seen" : new Date("2011-02-14T00:00:00.000Z"),
                "fk" : "2010Q4",
                "ed" : new Date("2010-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.74550264550265,
                "seen" : new Date("2011-05-15T00:00:00.000Z"),
                "fk" : "2011Q1",
                "ed" : new Date("2011-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.61375661375661,
                "seen" : new Date("2011-08-14T00:00:00.000Z"),
                "fk" : "2011Q2",
                "ed" : new Date("2011-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.63439153439153,
                "seen" : new Date("2011-11-14T00:00:00.000Z"),
                "fk" : "2011Q3",
                "ed" : new Date("2011-09-30T00:00:00.000Z")
            },
            {
                "v" : 8.47380952380952,
                "seen" : new Date("2012-02-14T00:00:00.000Z"),
                "fk" : "2011Q4",
                "ed" : new Date("2011-12-31T00:00:00.000Z")
            },
            {
                "v" : 8.50238095238095,
                "seen" : new Date("2012-05-15T00:00:00.000Z"),
                "fk" : "2012Q1",
                "ed" : new Date("2012-03-31T00:00:00.000Z")
            },
            {
                "v" : 8.21666666666667,
                "seen" : new Date("2012-08-14T00:00:00.000Z"),
                "fk" : "2012Q2",
                "ed" : new Date("2012-06-30T00:00:00.000Z")
            },
            {
                "v" : 8.21349206349206,
                "seen" : new Date("2012-11-14T00:00:00.000Z"),
                "fk" : "2012Q3",
                "ed" : new Date("2012-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.94984126984127,
                "seen" : new Date("2013-02-14T00:00:00.000Z"),
                "fk" : "2012Q4",
                "ed" : new Date("2012-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.04825396825397,
                "seen" : new Date("2013-05-15T00:00:00.000Z"),
                "fk" : "2013Q1",
                "ed" : new Date("2013-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.24920634920635,
                "seen" : new Date("2013-08-14T00:00:00.000Z"),
                "fk" : "2013Q2",
                "ed" : new Date("2013-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.26031746031746,
                "seen" : new Date("2013-11-14T00:00:00.000Z"),
                "fk" : "2013Q3",
                "ed" : new Date("2013-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.99603174603175,
                "seen" : new Date("2014-02-14T00:00:00.000Z"),
                "fk" : "2013Q4",
                "ed" : new Date("2013-12-31T00:00:00.000Z")
            },
            {
                "v" : 6.98650793650794,
                "seen" : new Date("2014-05-15T00:00:00.000Z"),
                "fk" : "2014Q1",
                "ed" : new Date("2014-03-31T00:00:00.000Z")
            },
            {
                "v" : 6.5531746031746,
                "seen" : new Date("2014-08-14T00:00:00.000Z"),
                "fk" : "2014Q2",
                "ed" : new Date("2014-06-30T00:00:00.000Z")
            },
            {
                "v" : 6.55126984126984,
                "seen" : new Date("2014-11-14T00:00:00.000Z"),
                "fk" : "2014Q3",
                "ed" : new Date("2014-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.21375661375661,
                "seen" : new Date("2015-02-14T00:00:00.000Z"),
                "fk" : "2014Q4",
                "ed" : new Date("2014-12-31T00:00:00.000Z")
            },
            {
                "v" : 6.58835978835979,
                "seen" : new Date("2015-05-15T00:00:00.000Z"),
                "fk" : "2015Q1",
                "ed" : new Date("2015-03-31T00:00:00.000Z")
            },
            {
                "v" : 6.61693121693122,
                "seen" : new Date("2015-08-14T00:00:00.000Z"),
                "fk" : "2015Q2",
                "ed" : new Date("2015-06-30T00:00:00.000Z")
            },
            {
                "v" : 6.5962962962963,
                "seen" : new Date("2015-11-14T00:00:00.000Z"),
                "fk" : "2015Q3",
                "ed" : new Date("2015-09-30T00:00:00.000Z")
            },
            {
                "v" : 6.43687830687831,
                "seen" : new Date("2016-02-14T00:00:00.000Z"),
                "fk" : "2015Q4",
                "ed" : new Date("2015-12-31T00:00:00.000Z")
            },
            {
                "v" : 6.64164021164021,
                "seen" : new Date("2016-05-15T00:00:00.000Z"),
                "fk" : "2016Q1",
                "ed" : new Date("2016-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.13687830687831,
                "seen" : new Date("2016-08-14T00:00:00.000Z"),
                "fk" : "2016Q2",
                "ed" : new Date("2016-06-30T00:00:00.000Z")
            },
            {
                "v" : 6.82164021164021,
                "seen" : new Date("2016-11-14T00:00:00.000Z"),
                "fk" : "2016Q3",
                "ed" : new Date("2016-09-30T00:00:00.000Z")
            },
            {
                "v" : 7.02428571428571,
                "seen" : new Date("2017-02-14T00:00:00.000Z"),
                "fk" : "2016Q4",
                "ed" : new Date("2016-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.19571428571429,
                "seen" : new Date("2017-05-15T00:00:00.000Z"),
                "fk" : "2017Q1",
                "ed" : new Date("2017-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.03444444444444,
                "seen" : new Date("2017-08-14T00:00:00.000Z"),
                "fk" : "2017Q2",
                "ed" : new Date("2017-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.19571428571429,
                "seen" : new Date("2017-11-14T00:00:00.000Z"),
                "fk" : "2017Q3",
                "ed" : new Date("2017-09-30T00:00:00.000Z")
            },
            {
                "v" : 7.72005291005291,
                "seen" : new Date("2018-02-14T00:00:00.000Z"),
                "fk" : "2017Q4",
                "ed" : new Date("2017-12-31T00:00:00.000Z")
            },
            {
                "v" : 7.58671957671958,
                "seen" : new Date("2018-05-15T00:00:00.000Z"),
                "fk" : "2018Q1",
                "ed" : new Date("2018-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.62640211640212,
                "seen" : new Date("2018-08-14T00:00:00.000Z"),
                "fk" : "2018Q2",
                "ed" : new Date("2018-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.61687830687831,
                "seen" : new Date("2018-11-14T00:00:00.000Z"),
                "fk" : "2018Q3",
                "ed" : new Date("2018-09-30T00:00:00.000Z")
            },
            {
                "v" : 7.88825396825397,
                "seen" : new Date("2019-02-14T00:00:00.000Z"),
                "fk" : "2018Q4",
                "ed" : new Date("2018-12-31T00:00:00.000Z")
            },
            {
                "v" : 8.0215873015873,
                "seen" : new Date("2019-05-15T00:00:00.000Z"),
                "fk" : "2019Q1",
                "ed" : new Date("2019-03-31T00:00:00.000Z")
            },
            {
                "v" : 7.70253968253968,
                "seen" : new Date("2019-08-14T00:00:00.000Z"),
                "fk" : "2019Q2",
                "ed" : new Date("2019-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.70253968253968,
                "seen" : new Date("2019-11-14T00:00:00.000Z"),
                "fk" : "2019Q2",
                "ed" : new Date("2019-06-30T00:00:00.000Z")
            },
            {
                "v" : 7.70253968253968,
                "seen" : new Date("2020-02-14T00:00:00.000Z"),
                "fk" : "2019Q2",
                "ed" : new Date("2019-06-30T00:00:00.000Z")
            }
        ]}
        const tfdata = new TFdata(data._type, data._values)
        const result = tfdata.lastQGrowth('qoq')
        const expectation = {
          '2014Q2': null,
          '2016Q4': null,
          '2017Q1': 2,
          '2017Q2': 0.6666
        }
        Object.keys(expectation).forEach((key) => {
          const value = expectation[key]
          if (value == null) {
            expect(result[key]).toEqual(value)
          } else {
            expect(result[key]).toBeCloseTo(expectation[key], 0.001)
          }
        })
      })
      test('calculation', () => {
        const data = {
          _type: 'quarterly',
          _values: [
            { v: 2, seen: ck('2014Q2'), fk: '2013Q4' },
            { v: 2, seen: ck('2016Q4'), fk: '2016Q2' },
            { v: 6, seen: ck('2017Q1'), fk: '2016Q3' },
            { v: 10, seen: ck('2017Q2'), fk: '2016Q4' },
          ]
        }

        const tfdata = new TFdata(data._type, data._values)
        const result = tfdata.lastQGrowth('qoq')
        const expectation = {
          '2014Q2': null,
          '2016Q4': null,
          '2017Q1': 2,
          '2017Q2': 0.6666
        }
        Object.keys(expectation).forEach((key) => {
          const value = expectation[key]
          if (value == null) {
            expect(result[key]).toEqual(value)
          } else {
            expect(result[key]).toBeCloseTo(expectation[key], 0.001)
          }
        })
      })
    })

    describe('yoy', () => {
      test('calculation', () => {
        const data = {
          _type: 'quarterly',
          _values: [
            { v: 2, seen: ck('2014Q2'), fk: '2013Q4' },
            { v: 2, seen: ck('2015Q2'), fk: '2014Q4' },
            { v: 6, seen: ck('2016Q2'), fk: '2015Q4' },
            { v: 10, seen: ck('2017Q2'), fk: '2016Q4' },
          ]
        }

        const tfdata = new TFdata(data._type, data._values)
        const result = tfdata.lastQGrowth('yoy')
        const expectation = {
          '2014Q2': null,
          '2015Q2': 0,
          '2016Q2': 2,
          '2017Q2': 0.6666
        }
        Object.keys(expectation).forEach((key) => {
          const value = expectation[key]
          if (value == null) {
            expect(result[key]).toEqual(value)
          } else {
            expect(result[key]).toBeCloseTo(expectation[key], 0.001)
          }
        })
      })
    })
  })

  describe('yearlyTrendingPeriods()', () => {
    test('call with quarterly should throw', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 2, seen: ck('2015Q2'), fk: '2014Q4' },
          { v: 6, seen: ck('2016Q2'), fk: '2015Q4' },
          { v: 10, seen: ck('2017Q2'), fk: '2016Q4' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      expect(() => {
        tfdata.yearlyTrendingPeriods(3)
      }).toThrow()
    })

    test('increasing', () => {
      const data = {
        _type: 'annually',
        _values: [
          { v: 2, seen: ck('2015Q2'), fk: '2014' },
          { v: 6, seen: ck('2016Q2'), fk: '2015' },
          { v: 10, seen: ck('2017Q2'), fk: '2016' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.yearlyTrendingPeriods()
      expect(result).toEqual({
        '2015Q2': 0,
        '2015Q3': 0,
        '2015Q4': 0,
        '2016Q1': 0,
        '2016Q2': 1,
        '2016Q3': 1,
        '2016Q4': 1,
        '2017Q1': 1,
        '2017Q2': 2,
        '2017Q3': 2, // forward fill
        '2017Q4': 2,
        '2018Q1': 2
      })
    })

    test('decreasing', () => {
      const data = {
        _type: 'annually',
        _values: [
          { v: 12, seen: ck('2015Q2'), fk: '2014' },
          { v: 8, seen: ck('2016Q2'), fk: '2015' },
          { v: 4, seen: ck('2017Q2'), fk: '2016' },
          { v: 1, seen: ck('2018Q2'), fk: '2017' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.yearlyTrendingPeriods()
      expect(result).toEqual({
        '2015Q2': 0,
        '2015Q3': 0,
        '2015Q4': 0,
        '2016Q1': 0,
        '2016Q2': -1,
        '2016Q3': -1,
        '2016Q4': -1,
        '2017Q1': -1,
        '2017Q2': -2,
        '2017Q3': -2,
        '2017Q4': -2,
        '2018Q1': -2,
        '2018Q2': -3,
        '2018Q3': -3, // forward fill
        '2018Q4': -3,
        '2019Q1': -3
      })
    })
  })

  describe('yoyTrendingPeriods()', () => {
    test('increasing', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 1, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 2, seen: ck('2015Q2'), fk: '2014Q4' },
          { v: 3, seen: ck('2015Q3'), fk: '2015Q1' },
          { v: 4, seen: ck('2015Q4'), fk: '2015Q2' },
          { v: 5, seen: ck('2016Q1'), fk: '2015Q3' },
          { v: 6, seen: ck('2016Q2'), fk: '2015Q4' },
          { v: 7, seen: ck('2016Q3'), fk: '2016Q1' },
          { v: 8, seen: ck('2016Q4'), fk: '2016Q2' },
          { v: 9, seen: ck('2017Q1'), fk: '2016Q3' },
          { v: 10, seen: ck('2017Q2'), fk: '2016Q4' },
          { v: 11, seen: ck('2017Q3'), fk: '2017Q1' },
          { v: 12, seen: ck('2017Q4'), fk: '2017Q2' },
          { v: 13, seen: ck('2018Q1'), fk: '2017Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.yoyTrendingPeriods()
      expect(result).toEqual({
        '2015Q1': 0,
        '2015Q2': 0,
        '2015Q3': 0,
        '2015Q4': 0,
        '2016Q1': 1,
        '2016Q2': 1,
        '2016Q3': 1,
        '2016Q4': 1,
        '2017Q1': 2,
        '2017Q2': 2,
        '2017Q3': 2,
        '2017Q4': 2,
        '2018Q1': 3
      })
    })

    test('decreasing', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 13, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 12, seen: ck('2015Q2'), fk: '2014Q4' },
          { v: 11, seen: ck('2015Q3'), fk: '2015Q1' },
          { v: 10, seen: ck('2015Q4'), fk: '2015Q2' },
          { v: 9, seen: ck('2016Q1'), fk: '2015Q3' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.yoyTrendingPeriods()
      expect(result).toEqual({
        '2015Q1': 0,
        '2015Q2': 0,
        '2015Q3': 0,
        '2015Q4': 0,
        '2016Q1': -1,
      })
    })

    test('mutliple types', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 13, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 14, seen: ck('2015Q2'), fk: '2014Q4' },
          { v: 10, seen: ck('2016Q1'), fk: '2015Q3' },
          { v: 13, seen: ck('2016Q2'), fk: '2015Q4' },
          { v: 0, seen: ck('2017Q1'), fk: '2016Q3' },
          { v: 8, seen: ck('2017Q2'), fk: '2016Q4' },
          { v: 1, seen: ck('2018Q1'), fk: '2017Q3' },
          { v: 1, seen: ck('2018Q2'), fk: '2017Q4' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.yoyTrendingPeriods()
      expect(result).toEqual({
        '2015Q1': 0,
        '2015Q2': 0,
        '2016Q1': -1,
        '2016Q2': -1,
        '2017Q1': -2,
        '2017Q2': -2,
        '2018Q1': 1,
        '2018Q2': -3
      })
    })
  })

  describe('qoqTrendingPeriods()', () => {
    test('increasing', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 10, seen: ck('2017Q2'), fk: '2016Q4' },
          { v: 11, seen: ck('2017Q3'), fk: '2017Q1' },
          { v: 12, seen: ck('2017Q4'), fk: '2017Q2' },
          { v: 13, seen: ck('2018Q1'), fk: '2017Q3' }
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.qoqTrendingPeriods()
      expect(result).toEqual({
        '2017Q2': 0,
        '2017Q3': 1,
        '2017Q4': 2,
        '2018Q1': 3
      })
    })

    test('decreasing', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 13, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 12, seen: ck('2015Q2'), fk: '2014Q4' },
          { v: 11, seen: ck('2015Q3'), fk: '2015Q1' },
          { v: 10, seen: ck('2015Q4'), fk: '2015Q2' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.qoqTrendingPeriods()
      expect(result).toEqual({
        '2015Q1': 0,
        '2015Q2': -1,
        '2015Q3': -2,
        '2015Q4': -3
      })
    })

    test('no trend', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 14, seen: ck('2014Q4'), fk: '2014Q2' },
          { v: 14, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 14, seen: ck('2015Q2'), fk: '2014Q4' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.qoqTrendingPeriods()
      expect(result).toEqual({
        '2014Q4': 0,
        '2015Q1': 0,
        '2015Q2': 0
      })
    })
  })

  describe('ttm()', () => {
    test('ideal case', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 13, seen: ck('2014Q4'), fk: '2014Q2' },
          { v: 14, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 15, seen: ck('2015Q2'), fk: '2014Q4' },
          { v: 16, seen: ck('2015Q3'), fk: '2015Q1' },
        ]
      }

      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.ttm()
      expect(result).toEqual(58)
    })
    test('not enough data, consider missing 0', () => {
      const data = {
        _type: 'quarterly',
        _values: [
          { v: 13, seen: ck('2014Q4'), fk: '2014Q2' },
          { v: 14, seen: ck('2015Q1'), fk: '2014Q3' },
          { v: 15, seen: ck('2015Q2'), fk: '2014Q4' },
        ]
      }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.ttm()
      expect(result).toEqual(42)
    })

    test('no data', () => {
      const data = { _type: 'quarterly', _values: [] }
      const tfdata = new TFdata(data._type, data._values)
      const result = tfdata.ttm()
      expect(result).toEqual(null)
    })
  })

  describe('toFiscalYear()', () => {
    test('throw error if not quarterly', () => {
      const data = TFdata.initFromRaw({
        _type: 'daily',
        _values: []
      })
      expect(() => {
        data.toFiscalYear()
      }).toThrowError()
    })

    test('convert correctly', () => {
      const data = TFdata.initFromRaw({
        _type: 'quarterly',
        _values: [
          { fk: '2016Q1', seen: ck('2016Q1'), v: 1 },
          { fk: '2016Q2', seen: ck('2016Q2'), v: 2 },
          { fk: '2016Q3', seen: ck('2016Q3'), v: 3 },
          { fk: '2016Q4', seen: ck('2016Q4'), v: 4 },
          { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
          { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
          { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
          { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
          { fk: '2018Q1', seen: ck('2016Q1'), v: 9 }
        ]
      })

      const fdata = data.toFiscalYear()
      expect(fdata.scopeType).toEqual('annually')
      expect(fdata.getValues().length).toEqual(2)
      expect(fdata.getValues()).toEqual([
        { fk: '2016', seen: ck('2016Q4'), v: 4 },
        { fk: '2017', seen: ck('2017Q4'), v: 8 }
      ])
    })
  })


  describe('getValuesForCalendarKey', () => {
    test('should return empty array if no values matched', () => {
      const data = new TFdata('quarterly', [
        { fk: '2016Q1', seen: ck('2016Q1'), v: 1 },
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2 },
        { fk: '2016Q3', seen: ck('2016Q3'), v: 3 },
        { fk: '2016Q4', seen: ck('2016Q4'), v: 4 },
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
        { fk: '2018Q1', seen: ck('2018Q1'), v: 9 }
      ])
      const selectedCalendarKey = '2015Q1'



      expect(data.getValuesForCalendarKey(selectedCalendarKey)).toEqual([])
    })

    test('should return matched values as array', () => {
      const data = new TFdata('quarterly', [
        { fk: '2016Q1', seen: ck('2016Q1'), v: 1 },
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2 },
        { fk: '2016Q3', seen: ck('2016Q3'), v: 3 },
        { fk: '2016Q4', seen: ck('2016Q4'), v: 4 },
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
        { fk: '2018Q1', seen: ck('2018Q1'), v: 9 }
      ])
      const selectedCalendarKey = '2016Q2'


      expect(data.getValuesForCalendarKey(selectedCalendarKey)).toEqual([
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2, ck: '2016Q2' }
      ])
    })


    test('should return matched values as array', () => {
      const data = new TFdata('annually', [
        { fk: '2016', seen: ck('2016Q1'), v: 1 },
        { fk: '2016', seen: ck('2016Q2'), v: 2 },
        { fk: '2016', seen: ck('2016Q3'), v: 3 },
        { fk: '2016', seen: ck('2016Q4'), v: 4 },
        { fk: '2017', seen: ck('2017Q1'), v: 5 },
        { fk: '2017', seen: ck('2017Q2'), v: 6 },
        { fk: '2017', seen: ck('2017Q3'), v: 7 },
        { fk: '2017', seen: ck('2017Q4'), v: 8 },
      ])
      const selectedCalendarKey = '2016'

      expect(data.getValuesForCalendarKey(selectedCalendarKey)).toEqual([
        { fk: '2016', seen: ck('2016Q1'), v: 1, ck: '2016' },
        { fk: '2016', seen: ck('2016Q2'), v: 2, ck: '2016' },
        { fk: '2016', seen: ck('2016Q3'), v: 3, ck: '2016' },
        { fk: '2016', seen: ck('2016Q4'), v: 4, ck: '2016' },
      ])
    })
  })


  describe('getValuesUntilCalendarKey', () => {
    test('should return all values if selected calendary key is later date from data ', () => {
      const data = new TFdata('quarterly', [
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
        { fk: '2018Q1', seen: ck('2018Q1'), v: 9 }
      ])
      const selectedCalendarKey = '2019Q1'


      expect(data.getValuesUntilCalendarKey(selectedCalendarKey)).toEqual([
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5, ck: '2017Q1' },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6, ck: '2017Q2' },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7, ck: '2017Q3' },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8, ck: '2017Q4' },
        { fk: '2018Q1', seen: ck('2018Q1'), v: 9, ck: '2018Q1' }
      ])
    })

    test('should return all values before and equal selected calendarKey', () => {
      const data = new TFdata('quarterly', [
        { fk: '2016Q1', seen: ck('2016Q1'), v: 1 },
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2 },
        { fk: '2016Q3', seen: ck('2016Q3'), v: 3 },
        { fk: '2016Q4', seen: ck('2016Q4'), v: 4 },
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
        { fk: '2018Q1', seen: ck('2018Q1'), v: 9 }
      ])
      const selectedCalendarKey = '2017Q1'

      expect(data.getValuesUntilCalendarKey(selectedCalendarKey)).toEqual([
        { fk: '2016Q1', seen: ck('2016Q1'), v: 1, ck: '2016Q1' },
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2, ck: '2016Q2' },
        { fk: '2016Q3', seen: ck('2016Q3'), v: 3, ck: '2016Q3' },
        { fk: '2016Q4', seen: ck('2016Q4'), v: 4, ck: '2016Q4' },
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5, ck: '2017Q1' },
      ])
    })
  })


  describe('quarterlyCagr()', () => {
    test('calculation', () => {
      const data = new TFdata('annually', [
        { fk: '2016Q1', seen: ck('2016Q1'), v: 1 },
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2 },
        { fk: '2016Q3', seen: ck('2016Q3'), v: 3 },
        { fk: '2016Q4', seen: ck('2016Q4'), v: 4 },
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
      ], { isTTM: true })

      const result = data.quarterlyCagr(1)
      expect(result).toEqual({
        '2017Q4': (8 / 4) - 1,
        '2017Q3': (7 / 4) - 1,
        '2017Q2': (6 / 4) - 1,
        '2017Q1': (5 / 4) - 1,
        '2016Q4': null,
        '2016Q3': null,
        '2016Q2': null,
        '2016Q1': null
      })
    })
  })

  describe('ttmCagr()', () => {
    test('calculation', () => {
      const data = new TFdata('quarterly', [
        { fk: '2016Q1', seen: ck('2016Q1'), v: 1 },
        { fk: '2016Q2', seen: ck('2016Q2'), v: 2 },
        { fk: '2016Q3', seen: ck('2016Q3'), v: 3 },
        { fk: '2016Q4', seen: ck('2016Q4'), v: 4 },
        { fk: '2017Q1', seen: ck('2017Q1'), v: 5 },
        { fk: '2017Q2', seen: ck('2017Q2'), v: 6 },
        { fk: '2017Q3', seen: ck('2017Q3'), v: 7 },
        { fk: '2017Q4', seen: ck('2017Q4'), v: 8 },
      ], { isTTM: true })

      const result = data.ttmCagr(1)
      expect(result).toEqual({
        '2017Q4': (8 / 4) - 1,
        '2017Q3': (7 / 3) - 1,
        '2017Q2': (6 / 2) - 1,
        '2017Q1': (5 / 1) - 1,
        '2016Q4': null,
        '2016Q3': null,
        '2016Q2': null,
        '2016Q1': null
      })
    })
  })

  describe('daysTrailingValues()', () => {
    test('available less than days', () => {
      const d = new TFdata('quarterly', [
        { v: 1, seen: new Date('2018-01-01') },
        { v: 2, seen: new Date('2018-03-01') }
      ])
      const values = d.daysTrailingValues(100)
      expect(values).toEqual(d.data)
    })
    test('available equal to days', () => {
      const d = new TFdata('quarterly', [
        { v: 1, seen: new Date('2018-01-01') },
        { v: 2, seen: new Date('2018-03-01') },
        { v: 2, seen: new Date('2018-04-11') }
      ])
      const values = d.daysTrailingValues(100)
      expect(values).toEqual(d.data)
    })
    test('available more than days', () => {
      const d = new TFdata('quarterly', [
        { v: 1, seen: new Date('2018-01-01') },
        { v: 2, seen: new Date('2018-03-01') },
        { v: 3, seen: new Date('2018-04-12')}
      ])
      const values = d.daysTrailingValues(100)
      expect(values).toEqual([
        { v: 2, seen: new Date('2018-03-01') },
        { v: 3, seen: new Date('2018-04-12')}
      ])
    })
  })
})

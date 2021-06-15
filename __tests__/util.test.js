const util = require('../util')

describe('Sandbox Utilities', () => {
  describe.skip('methods.setValue', () => {
    it('correctly set value for annually', () => {
      let key,
      obj,
      result,
      seen,
      value;
      key = '2016';
      value = 100;
      obj = {};
      seen = new Date('2016-12-31');
      util.setValue(obj, key, 'annually', seen, value);
      result = obj._values.find((obj) => {
        obj.fk === key;
      });
      expect(result.v).toEqual(value);
    });
    // it('set calendarKey to null if seen is not defined', function() {
    //   var key, obj, result, value;
    //   key = '2016-12';
    //   value = 100;
    //   obj = {};
    //   util.setValue(obj, key, 'monthly', null, value);
    //   result = obj._values.find(function(obj) {
    //     obj.fk === key;
    //   });
    //   expect(result.ck).to.be["null"];
    // });
    it('set value to timeless if key is null', () => {
      let key,
      obj,
      value;
      key = null;
      value = 100;
      obj = {};
      util.setValue(obj, key, 'timeless', null, value);
      expect(obj.value).toEqual(100);
      expect(obj._type).toEqual('timeless');
    });
  });
  describe('methods.getFiscalValue()', () => {
    it('null when key doesn\'t exist', () => {})
    it('correctly get value for annually', () => {
      let fiscalKey,
      result,
      source;
      source = {
        test: {
          _type: 'annually',
          _values: [
            {
              fk: '2016',
              ck: '2017',
              v: 10
            }
          ]
        }
      };
      fiscalKey = '2016';
      result = util.getFiscalValue(source, 'test', fiscalKey);
      expect(result).toEqual(10);
    });
    it('correctly get value for quarterly', () => {
      let fiscalKey,
      result,
      source;
      source = {
        test: {
          _type: 'quarterly',
          _values: [
            {
              fk: '2015Q4',
              ck: '2015Q3',
              v: 10
            }
          ]
        }
      };
      fiscalKey = '2015Q4';
      result = util.getFiscalValue(source, 'test', fiscalKey);
      expect(result).toEqual(10);
    });
    it('correctly get value for monthly', () => {
      let fiscalKey,
result,
source;
      source = {
        test: {
          _type: 'monthly',
          _values: [
            {
              fk: '2016-12',
              ck: '2017-1',
              v: 10
            }
          ]
        }
      };
      fiscalKey = '2016-12';
      result = util.getFiscalValue(source, 'test', fiscalKey);
      expect(result).toEqual(10);
    });
  });
  describe.skip('methods.getCalendarValue()', () => {
    it('correctly get value for annually', () => {
      let calendarKey,
result,
source;
      source = {
        test: {
          _type: 'annually',
          _values: [
            {
              fk: '2016',
              ck: '2017',
              v: 11
            }
          ]
        }
      };
      calendarKey = '2017';
      result = util.getCalendarValue(source, 'test', calendarKey);
      expect(result).toEqual(11);
    });
    it('correctly get value for quarterly', () => {
      let calendarKey,
result,
source;
      source = {
        test: {
          _type: 'quarterly',
          _values: [
            {
              fk: '2016Q4',
              ck: '2017Q1',
              v: 11
            }
          ]
        }
      };
      calendarKey = '2017Q1';
      result = util.getCalendarValue(source, 'test', calendarKey);
      expect(result).toEqual(11);
    });
    it('correctly get value for monthly', () => {
      let calendarKey,
result,
source;
      source = {
        test: {
          _type: 'monthly',
          _values: [
            {
              fk: '2016-12',
              ck: '2017-1',
              v: 11
            }
          ]
        }
      };
      calendarKey = '2017-1';
      result = util.getCalendarValue(source, 'test', calendarKey);
      expect(result).toEqual(11);
    });
  });
  describe('util.dateToScopeKey(date, scopeKey)', () => {
    describe('date is end period', () => {
      it('converts date to daily key correctly', () => {
        var actual, date, expected;
        expected = '2015-3-15';
        date = new Date(Date.UTC(2015, 2, 15, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'daily');
        expect(expected).toEqual(actual);
      });
      it('converts date to annually key correctly', () => {
        var actual, date, expected;
        expected = '2015';
        date = new Date(Date.UTC(2015, 11, 31, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'annually');
        expect(expected).toEqual(actual);
      });
      it('converts date to quarterly key correctly', () => {
        var actual, date, expected;
        expected = '2015Q3';
        date = new Date(Date.UTC(2015, 8, 30, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'quarterly');
        expect(expected).toEqual(actual);
      });
      it('converts date to monthly key correctly', () => {
        var actual, date, expected;
        expected = '2015-9';
        date = new Date(Date.UTC(2015, 8, 30, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'monthly');
        expect(expected).toEqual(actual);
      });
      it('converts quarter to year correctly', () => {
        var actual, date, expected;
        expected = '2016';
        date = new Date(Date.UTC(2016, 3, 31, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'annually');
        expect(expected).toEqual(actual);
      });
    });
    describe('date is NOT end period', () => {
      it('converts date to daily key correctly', () => {
        var actual, date, expected;
        expected = '2015-3-15';
        date = new Date(Date.UTC(2015, 2, 15, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'daily');
        expect(expected).toEqual(actual);
      });
      it('converts date to annually key correctly', () => {
        var actual, date, expected;
        expected = '2015';
        date = new Date(Date.UTC(2015, 11, 27, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'annually');
        expect(expected).toEqual(actual);
      });
      it('converts date to quarterly key correctly', () => {
        var actual, date, expected;
        expected = '2015Q3';
        date = new Date(Date.UTC(2015, 8, 27, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'quarterly');
        expect(expected).toEqual(actual);
      });
      it('converts date to monthly key correctly', () => {
        var actual, date, expected;
        expected = '2015-9';
        date = new Date(Date.UTC(2015, 8, 27, 0, 0, 0));
        actual = util.dateToScopeKey(date, 'monthly');
        expect(expected).toEqual(actual);
      });
    });
  });
  describe('scopeKeyToDate()', () => {
    it('converts daily to that UTC date', () => {
      let actual,
testKey;
      testKey = '2015-03-15';
      actual = util.scopeKeyToDate(testKey);
      expect(actual.getUTCDate()).toEqual(15);
      expect(actual.getUTCMonth()).toEqual(2);
      expect(actual.getUTCFullYear()).toEqual(2015);
      expect(actual.getUTCHours()).toEqual(0);
      expect(actual.getUTCMinutes()).toEqual(0);
      expect(actual.getUTCMilliseconds()).toEqual(0);
    });
    it('converts annually to last day of year', () => {
      let actual,
testKey;
      testKey = '2015';
      actual = util.scopeKeyToDate(testKey);
      expect(actual.getUTCDate()).toEqual(31);
      expect(actual.getUTCMonth()).toEqual(11);
      expect(actual.getUTCFullYear()).toEqual(2015);
      expect(actual.getUTCHours()).toEqual(0);
      expect(actual.getUTCMinutes()).toEqual(0);
      expect(actual.getUTCMilliseconds()).toEqual(0);
    });
    it('converts quarterly to last day of quarter', () => {
      let actual,
testKey;
      testKey = '2015Q3';
      actual = util.scopeKeyToDate(testKey);
      expect(actual.getUTCDate()).toEqual(30);
      expect(actual.getUTCMonth()).toEqual(8);
      expect(actual.getUTCFullYear()).toEqual(2015);
      expect(actual.getUTCHours()).toEqual(0);
      expect(actual.getUTCMinutes()).toEqual(0);
      expect(actual.getUTCMilliseconds()).toEqual(0);
    });
    it('converts monthly to last day of monthy', () => {
      let actual,
testKey;
      testKey = '2015-5';
      actual = util.scopeKeyToDate(testKey);
      expect(actual.getUTCDate()).toEqual(31);
      expect(actual.getUTCMonth()).toEqual(4);
      expect(actual.getUTCFullYear()).toEqual(2015);
      expect(actual.getUTCHours()).toEqual(0);
      expect(actual.getUTCMinutes()).toEqual(0);
      expect(actual.getUTCMilliseconds()).toEqual(0);
    });
  });
  describe.skip('difference()', () => {
    it('difference larger value with smaller value correctly', () => {
      let result;
      result = util.difference('2015Q4', '2013Q2');
      expect(result).toEqual(10);
    });
    it('difference smaller value with larger value correctly', () => {
      let result;
      result = util.difference('2010Q1', '2013Q2');
      expect(result).toEqual(-13);
    });
    it('difference equal value correctly', () => {
      let result;
      result = util.difference('2015Q4', '2015Q4');
      expect(result).toEqual(0);
    });
  });
  describe('subtractScopeKey()', () => {
    it('subtract defaults to 1', () => {
      let result;
      result = util.subtractScopeKey('2014Q1');
      expect(result).toEqual('2013Q4');
    });
    it('subtract -1', () => {
      let result;
      result = util.subtractScopeKey('2014Q1', -1);
      expect(result).toEqual('2014Q2');
    });
    it('subtract 1', () => {
      let result;
      result = util.subtractScopeKey('2014Q1', 1);
      expect(result).toEqual('2013Q4');
    });
    it('subtract 0', () => {
      let result;
      result = util.subtractScopeKey('2014Q1', 0);
      expect(result).toEqual('2014Q1');
    });
  });
  describe.skip('compare()', () => {
    describe('scope quarterly', () => {
      it('compare larger value with smaller value correctly', () => {
        var result;
        result = util.compare('2015Q4', '2013Q2');
        expect(result).toEqual(1);
      });
      it('compare smaller value with larger value correctly', () => {
        var result;
        result = util.compare('2010Q1', '2013Q2');
        expect(result).toEqual(-1);
      });
      it('compare equal value correctly', () => {
        var result;
        result = util.compare('2015Q4', '2015Q4');
        expect(result).toEqual(0);
      });
    });
  });

  describe('filterAscArray()', () => {
    describe('constant condition', () => {
      describe('works with empty array', () => {
        it('returns an empty array', () => {
          const test = []
          const result = util.filterAscArray(test, 2)
          expect(test !== result).toEqual(true)
          expect(result).toEqual([])
        })
      })

      describe('array of length 1', () => {
        it('correctly filters array', () => {
          const test = [1]
          const result = util.filterAscArray(test, 0)
          expect(test !== result).toEqual(true)
          expect(result).toEqual([])
        })

        it('return a new array', () => {
          const test = [1]
          const result = util.filterAscArray(test, 1)
          expect(test !== result).toEqual(true)
          expect(result).toEqual([1])
        })
      })

      describe('array of length > 1', () => {
        it('correctly filters array', () => {
          const test = [1, 2, 3]
          const result = util.filterAscArray(test, 2)
          expect(test !== result).toEqual(true)
          expect(result).toEqual([1, 2])
        })
      })
    })

    describe('predicate condition', () => {
      const seenLessThanLimit = limit => a => a.seen <= limit

      describe('works with empty array', () => {
        it('returns an empty array', () => {
          const test = []
          const result = util.filterAscArray(test, seenLessThanLimit(1))
          expect(test !== result).toEqual(true)
          expect(result).toEqual([])
        })
      })

      describe('array of length 1', () => {
        it('correctly filters array', () => {
          const test = [{ seen: 1 }]
          const result = util.filterAscArray(test, seenLessThanLimit(0))
          expect(test !== result).toEqual(true)
          expect(result).toEqual([])
        })

        it('return a new array', () => {
          const test = [{ seen: 1 }]
          const result = util.filterAscArray(test, seenLessThanLimit(1))
          expect(test !== result).toEqual(true)
          expect(result).toEqual([{ seen: 1 }])
        })
      })

      describe('array of length > 1', () => {
        it('correctly filters array', () => {
          const test = [{ seen: 1 }, { seen: 2 }, { seen: 3 }]
          const result = util.filterAscArray(test, seenLessThanLimit(2))
          expect(test !== result).toEqual(true)
          expect(result).toEqual([{ seen: 1 }, { seen: 2 }])
        })
      })
    })
  })


  describe('getLargestKeyWithScopeType', () => {
    test('returns correct key', () => {
      const array = ['2015Q4', '2015-1', '2015', '2014Q3']
      const type = 'annually'
      const result = util.getLargestKeyWithScopeType(array, type)
      expect(result).toEqual('2015')
    })
    test('returns correct key', () => {
      const array = ['2015Q4', '2015-1', '2015', '2014Q3']
      const type = 'quarterly'
      const result = util.getLargestKeyWithScopeType(array, type)
      expect(result).toEqual('2015Q4')
    })
    test('all null', () => {
      const array = [null, null, undefined]
      const type = 'quarterly'
      const result = util.getLargestKeyWithScopeType(array, type)
      expect(result == null).toBe(true)
    })
  })

  describe('keysInRange()', () => {
    test('quarterly keys', () => {
      const result = util.keysInRange('2001Q3', '2002Q2')
      expect(result).toEqual(['2001Q3', '2001Q4', '2002Q1', '2002Q2'])
    })

    test('annually keys', () => {
      const result = util.keysInRange('2000', '2002')
      expect(result).toEqual(['2000', '2001', '2002'])
    })


    test('monthly keys', () => {
      const result = util.keysInRange('2016-12', '2017-6')
      expect(result).toEqual(['2016-12', '2017-01', '2017-02', '2017-03', '2017-04', '2017-05', '2017-06'])
    })

    test('no filling needed', () => {
      const result = util.keysInRange('2000', '2001')
      expect(result).toEqual(['2000', '2001'])
    })

    test('end and start is equal', () => {
      const result = util.keysInRange('2000', '2000')
      expect(result).toEqual(['2000'])
    })

    test('start greater than end key', () => {
      const result = util.keysInRange('2001', '2000')
      expect(result).toEqual([])
    })

    test('throw if key mismatch', () => {
      expect(() => {
        util.keysInRange('2001', '2001Q2')
      }).toThrow()
    })
  })

  describe('forwardFill()', () => {
    test('normal case', () => {
      const rawResult = util.forwardFill([
        { seen: new Date('2016-02-10'), v: 1 },
        { seen: new Date('2016-02-15'), v: 2 }
      ])

      const result = rawResult.map(value => ({
        v: value.v,
        seen: value.seen
      }))

      expect(result).toEqual([
        { seen: new Date('2016-02-10'), v: 1 },
        { seen: new Date('2016-02-11'), v: 1 },
        { seen: new Date('2016-02-12'), v: 1 },
        { seen: new Date('2016-02-13'), v: 1 },
        { seen: new Date('2016-02-14'), v: 1 },
        { seen: new Date('2016-02-15'), v: 2 },
      ])
    })
    test('minimum seen use last value before minSeen', () => {
      const options = { minSeen: new Date('2016-02-12') }
      const rawResult = util.forwardFill([
        { seen: new Date('2016-02-10'), v: 1 },
        { seen: new Date('2016-02-15'), v: 2 }
      ], options)

      const result = rawResult.map(value => ({
        v: value.v,
        seen: value.seen
      }))

      expect(result).toEqual([
        { seen: new Date('2016-02-12'), v: 1 },
        { seen: new Date('2016-02-13'), v: 1 },
        { seen: new Date('2016-02-14'), v: 1 },
        { seen: new Date('2016-02-15'), v: 2 },
      ])
    })

    test('options.fillToDate', () => {
      const options = {
        minSeen: new Date('2016-02-12'),
        fillToDate: new Date('2016-02-17')
      }

      const rawResult = util.forwardFill([
        { seen: new Date('2016-02-10'), v: 1 },
        { seen: new Date('2016-02-15'), v: 2 }
      ], options)

      const result = rawResult.map(value => ({
        v: value.v,
        seen: value.seen
      }))

      expect(result).toEqual([
        { seen: new Date('2016-02-12'), v: 1 },
        { seen: new Date('2016-02-13'), v: 1 },
        { seen: new Date('2016-02-14'), v: 1 },
        { seen: new Date('2016-02-15'), v: 2 },
        { seen: new Date('2016-02-16'), v: 2 },
        { seen: new Date('2016-02-17'), v: 2 }
      ])
    })
  })

  describe('convertkey()', () => {
    test('convert null key', () => {
      const result = util.convertKey(null, 'quarterly')
      expect(result).toEqual(null)
    })

    describe('from annually', () => {
      test('convert annually to annually', () => {
        const result = util.convertKey('2018', 'annually')
        expect(result).toEqual('2018')
      })
      test('convert annually to quarterly', () => {
        const result = util.convertKey('2018', 'quarterly')
        expect(result).toEqual('2018Q4')
      })
      test('convert annually to monthly', () => {
        const result = util.convertKey('2018', 'monthly')
        expect(result).toEqual('2018-12')
      })
      test('convert annually to daily', () => {
        const result = util.convertKey('2018', 'daily')
        expect(result).toEqual('2018-12-31')
      })
    })


    describe('from quarterly', () => {
      test('convert quarterly to annually', () => {
        const result = util.convertKey('2018Q1', 'annually')
        expect(result).toEqual('2018')
      })
      test('convert quarterly to quarterly', () => {
        const result = util.convertKey('2018Q1', 'quarterly')
        expect(result).toEqual('2018Q1')
      })
      test('convert quarterly to monthly', () => {
        const result = util.convertKey('2018Q2', 'monthly')
        expect(result).toEqual('2018-6')
      })
      test('convert quarterly to daily', () => {
        const result = util.convertKey('2018Q2', 'daily')
        expect(result).toEqual('2018-6-30')
      })
    })


    describe('from monthly', () => {
      test('convert monthly to annually', () => {
        const result = util.convertKey('2018-3', 'annually')
        expect(result).toEqual('2018')
      })
      test('convert monthly to quarterly', () => {
        const result = util.convertKey('2018-3', 'quarterly')
        expect(result).toEqual('2018Q1')
      })
      test('convert monthly to monthly', () => {
        const result = util.convertKey('2018-3', 'monthly')
        expect(result).toEqual('2018-3')
      })
      test('convert monthly to daily', () => {
        const result = util.convertKey('2018-3', 'daily')
        expect(result).toEqual('2018-3-31')
      })
    })


    describe('from daily', () => {
      test('convert daily to annually', () => {
        const result = util.convertKey('2018-3-15', 'annually')
        expect(result).toEqual('2018')
      })
      test('convert daily to quarterly', () => {
        const result = util.convertKey('2018-3-15', 'quarterly')
        expect(result).toEqual('2018Q1')
      })
      test('convert daily to monthly', () => {
        const result = util.convertKey('2018-3-15', 'monthly')
        expect(result).toEqual('2018-3')
      })
      test('convert daily to daily', () => {
        const result = util.convertKey('2018-3-15', 'daily')
        expect(result).toEqual('2018-3-15')
      })
    })
  })

  describe('forwardFillObject()', () => {
    test('default', () => {
      const toFill = {
        '2017Q1': 1,
        '2017Q2': 2
      }
      const currentDate = new Date('2017-09-30')
      const filledObj = util.forwardFillObject(toFill, currentDate)
      expect(filledObj).toEqual({
        '2017Q1': 1,
        '2017Q2': 2,
        '2017Q3': 2
      })
    })

    describe('options.maxLookbackPeriod', () => {
      test('no limit', () => {
        const toFill = {
          '2017Q1': 1,
          '2017Q2': 2
        }
        const currentDate = new Date('2018-01-01')
        const filledObj = util.forwardFillObject(toFill, currentDate)
        expect(filledObj).toEqual({
          '2017Q1': 1,
          '2017Q2': 2,
          '2017Q3': 2,
          '2017Q4': 2,
          '2018Q1': 2
        })
      })

      test('greater than limit', () => {
        const toFill = {
          '2017Q1': 1,
          '2017Q2': 2
        }
        const currentDate = new Date('2018-01-01')
        const filledObj = util.forwardFillObject(toFill, currentDate, { maxLookbackPeriod: 1 })
        expect(filledObj).toEqual({
          '2017Q1': 1,
          '2017Q2': 2
        })
      })

      test('equal to limit', () => {
        const toFill = {
          '2017Q1': 1,
          '2017Q2': 2
        }
        const currentDate = new Date('2018-01-01')
        const filledObj = util.forwardFillObject(toFill, currentDate, { maxLookbackPeriod: 2 })
        expect(filledObj).toEqual({
          '2017Q1': 1,
          '2017Q2': 2,
          '2017Q3': 2,
          '2017Q4': 2,
          '2018Q1': 2
        })
      })
    })
  })

  describe('differenceMonth', () => {
    test('same date', () => {
      const date = new Date()
      const result = util.differenceMonth(date, date)
      expect(result).toBe(0)
    })
    test('date in same year', () => {
      const a = new Date('2017-01-01')
      const b = new Date('2017-02-01')
      const result = util.differenceMonth(b, a)
      expect(result).toBe(1)
    })

    test('date with different year', () => {
      const a = new Date('2017-01-01')
      const b = new Date('2018-02-01')
      const result = util.differenceMonth(b, a)
      expect(result).toBe(13)
    })

    test('first date smaller', () => {
      const a = new Date('2017-01-01')
      const b = new Date('2018-02-01')
      const result = util.differenceMonth(a, b)
      expect(result).toBe(-13)
    })
  })

  describe('generateDates', () => {
    test('result in end of period dates', () => {
      const scope = 'quarterly'
      const a = new Date('2017-01-01')
      const b = new Date('2018-02-01')
      const result = util.generateDates(a, b, scope)
      expect(result).toEqual([
        new Date('2017-03-31'),
        new Date('2017-06-30'),
        new Date('2017-09-30'),
        new Date('2017-12-31'),
      ])
    })
  })
})

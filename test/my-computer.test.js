import {default as MyComputer} from '../src/my-computer'

describe('MyComputer', () => {

  describe('add()', () => {

    test('compute 1+2', () => {

      const computer = new MyComputer();

      expect(computer.add(1, 2)).toBe(3);
    });

    test('compute -1+1', () => {

      const computer = new MyComputer();

      expect(computer.add(-1, 1)).toBe(0);
    });

  });

  describe('sub()', () => {

    test('compute 1-2', () => {

      const computer = new MyComputer();

      expect(computer.sub(1, 2)).toBe(-1);
    });

    test('compute 1 - -1', () => {

      const computer = new MyComputer();

      expect(computer.sub(1, -1)).toBe(2);
    });

  });

});

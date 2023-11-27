import { Person, Clinic } from "./types";

/* 
  A Clinic resides within a city, and has:
  A name (string)
  Number of Staff (An integer representing the number of working nursing staff). 
  A block number which represents where the clinic resides on the block.
  A Waitlist Queue:
    - This is a queue data structure. In other words, the first person inserted into the queue will be the first person in line to get their COVID shot.
    - A queue at a minimum supports the following:
          enqueue(person) Add a person to the queue
          dequeue(); Remove a person from the queue
          size() Check the number of people in the queue
*/
class DecoratedClinic {
  public name: string;
  public numOfStaff: number;
  public blockNum: number;
  private _waitListQueue: Person[];

  constructor(clinic: Clinic) {
    this.name = clinic.name;
    this.numOfStaff = clinic.staff;
    this.blockNum = clinic.blockNum;
    this._waitListQueue = [];
  }

  public enqueue(person: Person) {
    this._waitListQueue.push(person);
  }

  public dequeue() {
    this._waitListQueue.shift();
  }

  public size() {
    return this._waitListQueue.length;
  }

  public getCurrentWaitTime() {
    return this._waitListQueue.length * 15;
  }

  public getQueue() {
    return this._waitListQueue;
  }
}

export { DecoratedClinic };

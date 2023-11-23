import fs from "fs/promises";

type Person = {
  phn: string;
  fullName: string;
  isVaccinated: boolean;
  age: number;
};

type Household = {
  blockNum: number;
  inhabitants: Person[];
};

type Clinic = {
  name: string;
  staff: number;
  blockNum: number;
};

type City = {
  households: Household[];
  clinics: Clinic[];
};

type Cities = {
  Burnaby: City;
  Vancouver: City;
  Richmond: City;
};

/*
  A unique personal health number (string)
  A full name (string)
  A vaccination status (true means they are already vaccinated, false means they are not). 
  An age (number) 
*/
class PersonClass {
  private _phn: string;
  private _fullName: string;
  private _isVaccinated: boolean;
  private _age: number;

  constructor(
    phn: string,
    fullName: string,
    isVaccinated: boolean,
    age: number
  ) {
    this._phn = phn;
    this._fullName = fullName;
    this._isVaccinated = isVaccinated;
    this._age = age;
  }

  public isVaccinated() {
    return this._isVaccinated;
  }
}

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
class ClinicClass {
  private _name: string;
  private _numOfStaff: number;
  private _blockNum: number;
  private _waitlistQueue: Person[];

  constructor(name: string, numOfStaff: number, blockNum: number) {
    this._name = name;
    this._numOfStaff = numOfStaff;
    this._blockNum = blockNum;
    this._waitlistQueue = [];
  }

  public enqueue(person: Person) {}

  public dequeue() {}

  public size() {
    return this._waitlistQueue.length;
  }

  public getBlockNum() {
    return this._blockNum;
  }
}

class HealthMap {
  private _cities: Cities;
  private _blocksInLargestCity: number;
  private _intakeAgeThreshold: number;

  constructor() {
    this._cities = {} as Cities;
    this._blocksInLargestCity = 0;
    this._intakeAgeThreshold = 0;
  }

  public async initializeHealthMap(filePath: string) {
    return fs
      .readFile(filePath, { encoding: "utf-8" })
      .then((fileData) => JSON.parse(fileData))
      .then((parsedData) => {
        this._cities = parsedData.city;
        this._blocksInLargestCity = Math.max(
          this._cities.Burnaby.households.length +
            this._cities.Burnaby.clinics.length,
          this._cities.Vancouver.households.length +
            this._cities.Vancouver.clinics.length,
          this._cities.Richmond.households.length +
            this._cities.Richmond.clinics.length
        );
      });
  }

  public setIntakeAgeThreshold(age: number) {
    this._intakeAgeThreshold = age;
  }

  /* 
  H,F,F,C,C,C // Burnaby
  H,F,C,x,x,x // Vancouver
  H,C,F,x,x,x // Richmond

  The "H" symbols on the map represent Households that still have some members unvaccinated.
  The "F" symbols on the map represent Households that have all members vaccinated. 
  The "C" symbols on the map represent Clinics.
  */
  public printMap() {
    function printCity(city: City, blocksInLargestCity: number) {
      let printData = "";
      for (let i = 0; i < blocksInLargestCity; i++) {
        let foundHousehold = city.households.find(
          (household) => household.blockNum === i
        );
        if (foundHousehold) {
          let foundUnvaccinatedPerson = foundHousehold.inhabitants.find(
            (person) => person.isVaccinated == false
          );
          if (foundUnvaccinatedPerson) {
            printData += "H";
          } else printData += "F";
        } else {
          let foundClinic = city.clinics.find(
            (clinic) => clinic.blockNum === i
          );
          if (foundClinic) {
            printData += "C";
          } else printData += "x";
        }
        printData += " ";
      }
      console.log(printData);
    }
    printCity(this._cities.Burnaby, this._blocksInLargestCity);
    printCity(this._cities.Vancouver, this._blocksInLargestCity);
    printCity(this._cities.Richmond, this._blocksInLargestCity);
  }

  /*
    Go through each member all Households within each city: 
    - Check if a person isVaccinated already or not. If they are already vaccinated, skip them.
    - If a person is NOT vaccinated, check if their age meets the currentIntake age. If it does not, skip them.
    - If a person is NOT vaccinated and their age meets the currentIntake age, you must do the following:
      -- Add the person to the nearest available clinic (queue).
      -- That person's isVaccinated status is set to true.
  */
  public registerForShots() {}
}

export {
  HealthMap,
  Person,
  PersonClass,
  Clinic,
  Household,
  City,
  Cities,
  ClinicClass,
};

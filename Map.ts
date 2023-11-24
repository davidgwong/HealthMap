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

type BlockInfo = {
  label: "H" | "F" | "C" | "x";
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
class DecoratedClinic {
  public name: string;
  public numOfStaff: number;
  public blockNum: number;
  public waitlistQueue: Person[];

  constructor(clinic: Clinic) {
    this.name = clinic.name;
    this.numOfStaff = clinic.staff;
    this.blockNum = clinic.blockNum;
    this.waitlistQueue = [];
  }

  public enqueue(person: Person) {
    this.waitlistQueue.push(person);
  }

  public dequeue() {
    this.waitlistQueue.shift();
  }

  public size() {
    return this.waitlistQueue.length;
  }

  public getCurrentWaitTime() {
    return this.waitlistQueue.length * 15;
  }
}

class DecoratedHousehold {
  public blockNum: number;
  public inhabitants: Person[];

  constructor(household: Household) {
    this.blockNum = household.blockNum;
    this.inhabitants = household.inhabitants;
  }
}

class HealthMap {
  private _cities: Cities;
  private _blocksInLargestCity: number;
  private _intakeAgeThreshold: number;
  private _highLevelMap: BlockInfo[][];
  public _HouseholdMap: Map<string, DecoratedHousehold>;
  public _ClinicMap: Map<string, DecoratedClinic>;

  constructor() {
    this._cities = {} as Cities;
    this._blocksInLargestCity = 0;
    this._intakeAgeThreshold = 0;
    this._highLevelMap = [];
    this._HouseholdMap = new Map();
    this._ClinicMap = new Map();
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

  public getIntakeAgeThreshold() {
    return this._intakeAgeThreshold;
  }

  public getHighLevelMap() {
    return this._highLevelMap;
  }

  private initializeCityMap(
    city: City,
    cityIndex: number,
    blocksInLargestCity: number
  ) {
    let cityMap: BlockInfo[] = Array(blocksInLargestCity).fill({
      label: "x",
    });
    city.households.forEach((household) => {
      let foundUnvaccinatedPerson = household.inhabitants.find(
        (person) => person.isVaccinated == false
      );
      if (foundUnvaccinatedPerson) {
        cityMap[household.blockNum] = {
          label: "H",
        };
      } else {
        cityMap[household.blockNum] = {
          label: "F",
        };
      }
      this._HouseholdMap.set(
        cityIndex + "-" + household.blockNum,
        new DecoratedHousehold(household)
      );
    });
    city.clinics.forEach((clinic) => {
      cityMap[clinic.blockNum] = {
        label: "C",
      };
      this._ClinicMap.set(
        cityIndex + "-" + clinic.blockNum,
        new DecoratedClinic(clinic)
      );
    });
    return cityMap;
  }

  private initializeHighLevelMap() {
    this._highLevelMap[0] = this.initializeCityMap(
      this._cities.Burnaby,
      0,
      this._blocksInLargestCity
    );
    this._highLevelMap[1] = this.initializeCityMap(
      this._cities.Vancouver,
      1,
      this._blocksInLargestCity
    );
    this._highLevelMap[2] = this.initializeCityMap(
      this._cities.Richmond,
      2,
      this._blocksInLargestCity
    );
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
    this.initializeHighLevelMap();
    this._highLevelMap.forEach((city) => {
      let printout = "";
      city.forEach((block) => {
        printout += block.label + " ";
      });
      console.log(printout);
    });
  }

  /*
    Go through each member all Households within each city: 
    - Check if a person isVaccinated already or not. If they are already vaccinated, skip them.
    - If a person is NOT vaccinated, check if their age meets the currentIntake age. If it does not, skip them.
    - If a person is NOT vaccinated and their age meets the currentIntake age, you must do the following:
      -- Add the person to the nearest available clinic (queue).
      -- That person's isVaccinated status is set to true.
  */
  public registerForShots() {
    function nearestClinicIndex(currBlock: number, city: BlockInfo[]) {
      let left = 0;
      let right = currBlock + 1;
      if (currBlock > 0) left = currBlock - 1;
      if (currBlock > city.length - 1) right = currBlock;
      while (city[left].label !== "C" && city[right].label !== "C") {
        if (left > 0) left -= 1;
        if (right < city.length - 1) right += 1;
      }
      if (city[left].label == "C") return left;
      else return right;
    }

    this._highLevelMap.forEach((city, cityIndex) => {
      city.forEach((block, blockIndex) => {
        if (
          this._HouseholdMap.get(cityIndex + "-" + blockIndex) &&
          block.label == "H"
        ) {
          let currHousehold = this._HouseholdMap.get(
            cityIndex + "-" + blockIndex
          );
          let nearestClinic = nearestClinicIndex(blockIndex, city);
          currHousehold!.inhabitants.forEach((inhabitant, inhabitantIndex) => {
            if (!inhabitant.isVaccinated) {
              if (inhabitant.age > this._intakeAgeThreshold) {
                currHousehold!.inhabitants[inhabitantIndex].isVaccinated = true;
                let updatedClinic = this._ClinicMap.get(
                  cityIndex + "-" + nearestClinic
                );
                updatedClinic!.enqueue(
                  currHousehold!.inhabitants[inhabitantIndex]
                );
                this._ClinicMap.set(
                  cityIndex + "-" + nearestClinic,
                  updatedClinic!
                );
              }
            }
          });
          let foundUnvaccinatedPerson = currHousehold!.inhabitants.find(
            (person) => person.isVaccinated == false
          );
          if (!foundUnvaccinatedPerson)
            this._highLevelMap[cityIndex][blockIndex].label = "F";
          this._HouseholdMap.set(cityIndex + "-" + blockIndex, currHousehold!);
        }
      });
    });
  }
}

class IReport {
  protected _clinics: Map<string, DecoratedClinic>;
  constructor(map: HealthMap) {
    this._clinics = map._ClinicMap;
  }

  public printDetails() {
    this._clinics.forEach((clinic) => {
      let printout = clinic.name + ": ";
      if (clinic.waitlistQueue.length == 0) printout += "(none).";
      else {
        clinic.waitlistQueue.forEach((person, index) => {
          printout += person.fullName;
          if (index == clinic.waitlistQueue.length - 1) printout += ".";
          else printout += ", ";
        });
      }
      console.log(printout);
    });
  }
}

/*
  Simple report should print the following:
    - For each clinic in each region:
      -- Name of clinic
      -- People in line up
*/
class SimpleReport extends IReport {}

/* 
  Complex Report should print the following:
    - For each clinic in each region:
        -- Average wait time
        -- Name of clinic
        -- People in line up
 */
class ComplexReport extends IReport {
  public printDetails() {
    this._clinics.forEach((clinic) => {
      let printout = clinic.name + ": ";
      if (clinic.waitlistQueue.length == 0) printout += "(none).";
      else {
        clinic.waitlistQueue.forEach((person, index) => {
          printout += person.fullName;
          if (index == clinic.waitlistQueue.length - 1) printout += ".";
          else printout += ", ";
        });
      }
      console.log(printout);
      const averageWaitTime = clinic.getCurrentWaitTime() / clinic.numOfStaff;
      if (averageWaitTime == 1)
        console.log("Average wait time: " + averageWaitTime + " minute.");
      else console.log("Average wait time: " + averageWaitTime + " minutes.");
    });
  }
}

class ReportMaker {
  report: IReport;

  constructor(report: IReport) {
    this.report = report;
  }

  printDetails() {
    this.report.printDetails();
  }
}

export {
  HealthMap,
  Person,
  PersonClass,
  Clinic,
  Household,
  City,
  Cities,
  DecoratedClinic,
  DecoratedHousehold,
  SimpleReport,
  ComplexReport,
  ReportMaker,
};

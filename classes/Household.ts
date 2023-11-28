import { Household, Person } from "./types";

class DecoratedHousehold {
  public blockNum: number;
  public inhabitants: Person[];
  public nearestClinicBlockNum: number | null;
  public nearestClinicLeft: number | null;
  public nearestClinicRight: number | null;

  constructor(household: Household) {
    this.blockNum = household.blockNum;
    this.inhabitants = household.inhabitants;
    this.nearestClinicBlockNum = null;
    this.nearestClinicLeft = null;
    this.nearestClinicRight = null;
  }
}

export { DecoratedHousehold };

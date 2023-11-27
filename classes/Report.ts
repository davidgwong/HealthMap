import { HealthMap } from "./Map";
import { DecoratedClinic } from "./Clinic";

class IReport {
  protected _clinics: Map<string, DecoratedClinic>;
  constructor(map: HealthMap) {
    this._clinics = map.getClinicMap();
  }

  protected _printClinicQueue(clinic: DecoratedClinic) {
    let printout = clinic.name + ": ";
    if (clinic.size() == 0) printout += "(none).";
    else {
      clinic.getQueue().forEach((person, index) => {
        printout += person.fullName;
        if (index == clinic.size() - 1) printout += ".";
        else printout += ", ";
      });
    }
    console.log(printout);
  }

  public printDetails() {
    this._clinics.forEach((clinic) => {
      this._printClinicQueue(clinic);
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
  protected _printAverageWaitTime(clinic: DecoratedClinic) {
    const averageWaitTime = clinic.getCurrentWaitTime() / clinic.numOfStaff;
    if (averageWaitTime == 1)
      console.log("Average wait time: " + averageWaitTime + " minute.");
    else console.log("Average wait time: " + averageWaitTime + " minutes.");
  }

  public printDetails() {
    this._clinics.forEach((clinic) => {
      this._printClinicQueue(clinic);
      this._printAverageWaitTime(clinic);
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

export { SimpleReport, ComplexReport, IReport, ReportMaker };

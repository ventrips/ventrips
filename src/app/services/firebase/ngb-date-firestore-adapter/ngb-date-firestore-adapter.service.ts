import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { firestore } from 'firebase/app';
/**
 * NgbDateAdapter implementation that allows using Firebase Firestore TimeStamp as a user date model.
 * https://firebase.google.com/docs/reference/js/firebase.firestore.Timestamp
 */
@Injectable({
  providedIn: 'root'
})
export class NgbDateFirestoreAdapter extends NgbDateAdapter<firestore.Timestamp> {
  
/**
   * Converts Firestore TimeStamp to a NgbDateStruct
  */
  
fromModel(ts: firestore.Timestamp): NgbDateStruct {
    
if (ts instanceof firestore.Timestamp) {
      
return {
        year: ts.toDate().getFullYear(),
        month: ts.toDate().getMonth() + 1,
        day: ts.toDate().getDate()
      };
    } 
else return null;
  }
  
/**
   * Converts a NgbDateStruct to a Firestore TimeStamp
   */
  
toModel(ngbDate: NgbDateStruct): firestore.Timestamp {
    
const jsDate = new Date(
      ngbDate.year ? ngbDate.year : 
new Date().getFullYear(),
      ngbDate.month ? ngbDate.month - 1 : 
new Date().getMonth() - 1,
      ngbDate.day ? ngbDate.day : 
new Date().getDate(),
      12
    );
    
return firestore.Timestamp.fromDate(jsDate);
  }
}
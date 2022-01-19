/*
* src/firestoreAdmin/index.js
*
* Context:
*   From tests
*/
import {dbAdmin, preheat_EXP} from "./dbAdmin.js"

/*
*/
function collection(path) {
  return dbAdmin.collection(path);
}

/*
* Like Firebase Admin SDK's 'doc'.
*
* By restricting the API surface, we keep version updates or incompatibilities from leaking to test code.
* Also, this allows us to fix some known problems.
*/
function doc(docPath) {   // (string) => DocumentReference like
  return dbAdmin.doc(docPath);
}

export {
  collection,
  doc,
  //
  preheat_EXP
}

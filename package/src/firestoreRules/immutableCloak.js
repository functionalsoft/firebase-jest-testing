/*
* src/firestoreRules/immutableCloak.js
*/
import { getUnlimited, setUnlimited, deleteUnlimited } from '../firestoreAdmin/unlimited'
import { claimLock } from './lockMe'

/*
* Run the 'op', but:
*   - only once we know no other op is executed at the same time
*   - restore the effects (if successful) before letting other ops run
*
* docPath:  For operations that change the database contents (set, update, delete), the docPath that should be restored.
*
* Return value resolves to..
*   true: access was granted
*   string: access denied, reason in the string
*/
async function immutableCloak(docPath, op) {   // (string?, () => Promise of true|string) => Promise of true|string

  return withinLock( async _ => {
    const was = docPath && await getUnlimited(docPath);

    const ret = await op();

    if (docPath) {
      if (was) {
        await setUnlimited(docPath,was);
      } else {
        await deleteUnlimited(docPath);
      }
    }

    return ret;
  });
}

async function withinLock(f) {    // (() => Promise of x) => Promise of x

  const release = await claimLock();    // () => ()
  try {
    return await f();
  }
  finally {
    release();    // free running tail
  }
}

export {
  immutableCloak
}
/*
* src/firestoreREST/wipe.js
*
* Clear a whole project's Firestore database.
*
* Based on '@firebase/rules-unit-testing' sources, but re-implemented using 'fetch' API.
*/
import { strict as assert } from 'assert'
import fetch from 'node-fetch'

import { FIRESTORE_HOST } from '../config.js'

/*
*/
async function wipe(projectId) {   // (string) => Promise of ()
  assert(projectId);

  const uri = `http://${FIRESTORE_HOST}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const body = JSON.stringify({
    database: `projects/${projectId}/databases/(default)`
  });

  const res = await fetch(uri, {method: 'DELETE', body})
      .catch( err => {
        const msg = `Failed to send DELETE to Firestore emulator at: ${uri}`;
        console.error(msg, err);
        throw err;
      });

  if (res.status !== 200) {    // '@firebase/rules-unit-tests' only tests for 200 (not 2xx)
    const body = await res.text();
    const msg = `Failed to 'DELETE' a Firestore project's data (status=${res.status}): ${body}`;
    console.error(msg);
    throw new Error(msg);
  }
}

export {
  wipe
}
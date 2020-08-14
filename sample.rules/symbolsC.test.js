/*
* sample.rules/symbolsC.test.js
*/
import { strict as assert } from 'assert'
import { test, expect, describe, beforeAll } from '@jest/globals'

//import { dbAuth } from 'firebase-jest-testing/firestoreTestingReadOnly';
import { dbAuth } from '../src/firestoreTesting/readOnly.js';

//import { FieldValue } from 'firebase-jest-testing/firestoreTesting';
import { FieldValue } from '../src/firestoreTesting/index.js';

const anyDate = new Date();   // a non-server date

// Perform extra tests to see the test data isn't changed by other tests (if it is, our guards didn't work!)
//
async function HYGIENE( title, doc, f ) {
  const o = await doc._dump();
  //console.trace( "HYGIENE: "+ title, o );   // enable for debugging
  f(o);
}

let unauth_symbolsC, auth_symbolsC, abc_symbolsC, def_symbolsC;

beforeAll( async () => {
  try {
    const coll = dbAuth.collection('projects/1/symbols');

    unauth_symbolsC = coll.as(null);
    auth_symbolsC = coll.as({uid:'_'});
    abc_symbolsC = coll.as({uid:'abc'});
    def_symbolsC = coll.as({uid:'def'});
  }
  catch (err) {
    // tbd. How to cancel the tests if we end up here? #help
    console.error( "Failed to initialize the Firebase database: ", err );
    throw err;
  }
});

describe("'/symbols' rules", () => {

  //--- SymbolsC read rules ---

  test('unauthenticated access should fail', async () => {
    await expect( unauth_symbolsC.get() ).toDeny();
  });

  test('user who is not part of the project shouldn\'t be able to read', async () => {
    await expect( auth_symbolsC.get() ).toDeny();
  });

  test('project members may read all symbols', async () => {
    await Promise.all([
      expect( abc_symbolsC.doc("1").get() ).toAllow(),
      expect( def_symbolsC.doc("1").get() ).toAllow(),   // collaborator

      expect( abc_symbolsC.doc("2-claimed").get() ).toAllow(),
      expect( def_symbolsC.doc("2-claimed").get() ).toAllow()   // collaborator
    ]);
  });

  //--- symbolsC create rules ---
  //
  // note: not testing unauthenticated or non-member access

  test('all members may create; creator needs to claim the symbol to themselves', async () => {
    const d = { layer: -6, shape: "star", size: 50, fillColor: "brown", center: { x: 56, y: 78 } };

    const d_claimed = uid => ({ ...d, claimed: { at: FieldValue.serverTimestamp(), by: uid } });
    const d_claimed_otherTime = uid => ({ ...d, claimed: { at: anyDate, by: uid } });

    await Promise.all([
      expect( abc_symbolsC.doc("99").set( d )).toDeny(),          // author, not claimed

      expect( abc_symbolsC.doc("99").set( d_claimed("abc") )).toAllow(),     // author, claimed
      expect( def_symbolsC.doc("99").set( d_claimed("def") )).toAllow(),     // collaborator, claimed

      expect( abc_symbolsC.doc("99").set( d_claimed_otherTime("abc") )).toDeny(),     // author, claimed, not server time

      expect( abc_symbolsC.doc("99").set( d_claimed("def") )).toDeny()     // author, claimed to another user
    ]);
  });

  //--- symbolsC update rules ---

  test('members may claim a non-claimed symbol', async () => {
    const s1_mod_valid = uid => ({ claimed: { by: uid, at: FieldValue.serverTimestamp() } });
    const s1_mod_otherTime = uid => ({ claimed: { by: uid, at: anyDate } });

    await Promise.all([
      expect( abc_symbolsC.doc("1").update( s1_mod_valid("abc") )).toAllow(),     // author
      expect( def_symbolsC.doc("1").update( s1_mod_valid("def") )).toAllow(),     // collaborator
      expect( abc_symbolsC.doc("1").update( s1_mod_otherTime("abc") )).toDeny(),     // bad time
      expect( abc_symbolsC.doc("1").update( s1_mod_valid("def") )).toDeny()      // claiming for another
    ]);
  });

  test('members may do changes to an already claimed (by them) symbol', async () => {
    const s2_mod = { size: 999 };

    await HYGIENE( "Before setting to 999", def_symbolsC.doc("2-claimed"), o => {
      assert( o.size === 50 );
      assert(o.claimed.by === "def");
    });

    await Promise.all([
      expect( def_symbolsC.doc("2-claimed").update( s2_mod )).toAllow(),     // claimed by him
      expect( abc_symbolsC.doc("2-claimed").update( s2_mod )).toDeny()      // not claimed by them
    ]);

    await HYGIENE( "After setting to 999", def_symbolsC.doc("2-claimed"), o => {
      assert( o.size === 50 );
    });
  });

  // BUG: systematically fails #later
  test.skip('members may revoke a claim', async () => {
    const s2_revoke = { claimed: FieldValue.delete() };

    await Promise.all([
      expect( def_symbolsC.doc("2-claimed").update( s2_revoke )).toAllow(),     // claimed by him
      expect( abc_symbolsC.doc("2-claimed").update( s2_revoke )).toDeny()       // not claimed by them
    ]);
  });

  test('claim cannot be changed (e.g. extended)', async () => {
    const s2_extend = { claimed: { by: 'def', at: FieldValue.serverTimestamp() } };

    await expect( def_symbolsC.doc("2-claimed").update( s2_extend )).toDeny();     // claimed by him
  });

  //--- symbolsC delete rules ---

  test('members may delete a symbol claimed to themselves', async () => {

    await HYGIENE( "Before delete", def_symbolsC.doc("2-claimed"), o => {
      console.debug( "Has:", o );
      assert( o.size === 50 );
      assert(o.claimed && o.claimed.by === "def");
    });

    await Promise.all([
      expect( def_symbolsC.doc("2-claimed").delete()).toAllow(),     // claimed by him
      expect( abc_symbolsC.doc("2-claimed").delete()).toDeny()      // not claimed by them
    ]);

    await HYGIENE( "After delete", def_symbolsC.doc("2-claimed"), o => {
      assert( o.size === 50 );
      assert(o.claimed && o.claimed.by === "def");
    });
  });

});
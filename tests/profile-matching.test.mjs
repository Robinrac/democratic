import test from 'node:test';
import assert from 'node:assert/strict';
import { identifyProfileByName, normalizeProfileName } from '../workshop/profile-matching.mjs';
import { roleCards } from '../workshop/roles.mjs';

test('paper names match by first name, surname, reversed order and Nordic spelling variants', () => {
  const inputs = [['Eydis',1],['Jonsdottir',1],['Jógvan',2],['Joensen',2],['Ingrid',3],['Solheim',3],['Elias',4],['Karlsson',4],['Linnea',5],['Sjoberg',5],['Sjöberg',5],['Mikko',6],['Lehtinen',6],['Mats',7],['Berg',7],['  JONSDOTTIR,  EYDIS ',1],['Eýdís Jónsdóttir',1]];
  for (const [input, card] of inputs) assert.equal(identifyProfileByName(input, roleCards).profile?.card,card,input);
  assert.equal(normalizeProfileName('Ö Ø Å Ä Æ Ð Þ Ł'), 'o o a a ae d th l');
});

test('typing a surname retains a recognized first name but never ignores conflicting parts', () => {
  assert.equal(identifyProfileByName('Eydis J',roleCards).profile?.card,1);
  for (const input of ['Ey','E','Eydis Karlsson','Linnea unknown','Nobody','Eydis Eydis','']) assert.equal(identifyProfileByName(input,roleCards).profile,null,input);
});

test('future casts with shared names require a unique match', () => {
  const cast=[{fullName:'Anna Berg'},{fullName:'Anna Solheim'},{fullName:'Erik Berg'},{fullName:'Anna Bergman'}];
  for(const name of ['Anna','Berg','Anna B']) assert.equal(identifyProfileByName(name,cast).status,'ambiguous',name);
  assert.equal(identifyProfileByName('Anna Berg',cast).profile,cast[0]);
  assert.equal(identifyProfileByName('Solheim',cast).profile,cast[1]);
  assert.equal(identifyProfileByName('Erik',cast).profile,cast[2]);
  assert.equal(identifyProfileByName('Anna Berg',[cast[0],{fullName:'Anna Berg'}]).status,'ambiguous');
});

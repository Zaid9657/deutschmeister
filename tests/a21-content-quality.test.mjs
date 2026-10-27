import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRICULUM_A21 as course } from '../src/data/curricula/a21.js';
import RULE_CARD_OVERRIDES from '../scripts/rule-card-overrides.mjs';
import { deferredConstructionHits } from '../src/data/curricula/constructions.js';
import { readFileSync } from 'node:fs';

// A correction may repair form, never silently remove obligation, negation,
// a time anchor or duration. This covers every A2 card, not a list of item IDs.
const meaningMarkers = text => ({
  modals: text.toLowerCase().match(/\b(?:musste\w*|konnte\w*|durfte\w*|wollte\w*|sollte\w*|könnte\w*)\b/g)?.sort() || [],
  negatives: text.toLowerCase().match(/\b(?:nicht|nie|niemals)\b/g)?.sort() || [],
  temporal: text.toLowerCase().match(/\b(?:seit|für|gestern|heute|morgen)\b/g)?.sort() || [],
  numbers: text.match(/\d+/g) || [],
});

// Lexical gender is independent of the running text's inflected article.
const genders = {
  der: 'Vater|Bruder|Sohn|Opa|Garten|Enkel|Umzug|Keller|Schlüssel|Vermieter|Samstag|Computer|Balkon|Aufzug|Tisch|Stuhl|Käse|Salat|Markt|Preis|Geburtstag|Kuchen|Sonntag|Onkel|Termin|Freitag|Dienstag|Abend|Chef|Volleyball|Verein|Trainer|Spieler|Sport|Fußball|Schuh|Unfall|Krankenwagen|Husten|Verband|Arzt|Drucker|Vertrag|Besuch|Kalender|Reisepass|Flughafen|Zug|Fahrplan|Urlaub|Hafen|Eintritt|Stadtplan|Reiseführer|Brunnen|Ausflug|Bus|Abschied|Freund|Gast|Film',
  die: 'Familie|Eltern|Mutter|Schwester|Tochter|Oma|Geschichte|Großeltern|Hilfe|Küche|Möbel|Lampe|Wand|Ecke|Treppe|Pflanze|Tomate|Birne|Flasche|Kasse|Kette|Blume|Karte|Tante|Einladung|Nachricht|Veranstaltung|Zeit|Uhrzeit|Arbeit|Pause|Woche|Mannschaft|Übung|Sportart|Untersuchung|Sprechstunde|Erkältung|Praxis|Tablette|Datei|Abteilung|Erfahrung|Bewerbung|Arbeitszeit|Besprechung|Aufgabe|Firma|Ankunft|Abfahrt|Verspätung|Reise|Fahrkarte|Führung|Ermäßigung|Sehenswürdigkeit|Fußgängerzone|Gasse|Brücke|Stadt|Freude|Hoffnung|Überraschung|Langeweile|Freundin|Musik',
  das: 'Kind|Leben|Buch|Auto|Handy|Sofa|Fenster|Regal|Bild|Öl|Brot|Gemüse|Obst|Kilo|Stück|Geschenk|Fest|Geld|Training|Mitglied|Wasser|Rezept|Wartezimmer|Bein|Passwort|Gehalt|Büro|Gepäck|Flugzeug|Rathaus|Museum|Café|Foto|Land',
};
genders.der += '|Alltag|Schwiegersohn|Hausmeister|Mieter|Mietvertrag|Quadratmeter|Parkplatz|Regenschirm|Bildschirm|Kassenbon|Einkaufswagen|Akku|Feierabend|Anfänger|Hausarzt|Mietwagen|Wegweiser|Zebrastreifen|Strand|Berg|See|Wald';
genders.die += '|Freizeit|Gewohnheit|Leidenschaft|Gitarre|Kaution|Nebenkosten|Wohnungsanzeige|Besichtigung|Lieferung|Heizung|Zahnbürste|Seife|Zahnpasta|Maus|Ware|Tüte|Kreditkarte|Portion|Beilage|Nachspeise|Marke|Getränkekarte|Vorspeise|Speisekarte|Bedienung|Reservierung|E-Mail|Webseite|App|Kondition|Salbe|Krankmeldung|Unterkunft|Rezeption|Fähre|Kreuzung|Ampel|Insel';
genders.das += '|Spiel|Klavier|Instrument|Vertrauen|Handtuch|Sonderangebot|Picknick|Abendessen|Mittagessen|Hauptgericht|Tagesgericht|Trinkgeld|Internet|WLAN|Fitnessstudio|Doppelzimmer|Einzelzimmer|Visum|Meer';
const genderOf = new Map(Object.entries(genders).flatMap(([article, nouns]) => nouns.split('|').map(noun => [noun, article])));
const markedStress = 'GROSS-eltern UN-sere EU-re EIN-gepackt AUF-geräumt AN-gerufen FENS-ter ZIM-mer BIL-der RO-te RO-ten FRI-schen ICH BUCH KÜ-che LEID KOM-men FREI-tag DOCH PAU-se MAL ge-FAL-len NASS AUF-ge-wacht Da-TEI PASS-wort Be-SPRE-chung ZWEI ZEHN DREI STADT-plan SPRE-chen SCHÖN WIE-der UR-laub ge-SPART'.split(' ');
const stressOf = new Map(markedStress.map(mark => [mark.replaceAll('-', '').toLowerCase(), mark]));
const stressErrors = text => [...text.matchAll(/[\p{L}]+(?:-[\p{L}]+)*/gu)].map(m => m[0]).filter(token => /[A-ZÄÖÜ]{2}/.test(token) && stressOf.get(token.replaceAll('-', '').toLowerCase()) !== token);

test('bilingual rules state their scope instead of equating movement with case or auxiliary', () => {
  const notices = course.lektionen.map(l => l.notice);
  const twoWay = notices.find(n => n.ruleSlug === 'two-way-prepositions');
  assert.match(twoWay.bodyDe, /Bei Wechselpräpositionen/);
  assert.match(twoWay.bodyEn, /With two-way prepositions/);
  const perfect = notices.find(n => n.ruleSlug === 'perfect-tense-sein');
  assert.match(perfect.bodyDe, /Ortswechsel\/Zustandswechsel/);
  assert.match(perfect.bodyEn, /changes of place\/state/);
  for (const text of [perfect.bodyDe, perfect.bodyEn]) {
    assert.match(text, /bleiben: ist geblieben/);
    assert.match(text, /haben.*tanzen.*schwimmen/);
  }
  const pronouns = notices.find(n => n.ruleSlug === 'pronouns-accusative-dative');
  assert.match(pronouns.bodyDe, /unbetonten Pronomen normalerweise/);
  assert.match(pronouns.bodyEn, /unstressed pronouns.*normally/);
  assert.match(notices[0].bodyDe, /ohne s-Laut am Ende/);
  assert.match(notices[0].bodyEn, /not ending in an s-sound/);
  assert.match(notices[1].bodyDe, /trennbaren Verben hier/);
  assert.match(notices[1].bodyEn, /separable verbs here/);
  assert.match(notices[3].bodyDe, /Nach ein\/kein\/mein ohne Endung/);
  assert.match(notices[3].bodyEn, /After ein\/kein\/mein without an ending/);
  assert.match(notices[6].bodyDe, /können den Ton/);
  assert.match(notices[6].bodyEn, /can soften/);
  assert.match(notices[9].bodyDe, /ohne genaue Uhrzeiten/);
  assert.match(notices[9].bodyEn, /without exact times/);
  assert.match(notices[11].bodyDe, /Hier Perfekt mit haben/);
  assert.match(notices[11].bodyEn, /Here: Perfekt with haben/);
  const pool = JSON.parse(readFileSync(new URL('../src/data/lessonPools/a21.json', import.meta.url)));
  const overbroad = /Bewegung = Akkusativ|gehen = Bewegung|Bei Bewegung und Zustandswechsel|ohne Bewegung und nimmt haben|Plural.*immer -en|Sie-Form ist immer|egal in welchem Fall|Namen bekommen -s;/;
  for (const item of pool.items) assert.doesNotMatch(item.explanationDe, overbroad, item.id);
  for (const card of course.lektionen.map(l => RULE_CARD_OVERRIDES[l.primarySlug])) assert.doesNotMatch(card.content, overbroad);
  assert.match('gehen = Bewegung. WOHIN? Akkusativ.', overbroad);
});

test('noun headwords carry their lexical gender; stress marks identify the stressed syllable', () => {
  for (const lesson of course.lektionen) {
    for (const entry of lesson.wortfeld.filter(w => w.article)) {
      assert.equal(entry.article, genderOf.get(entry.word), entry.de);
    }
    for (const line of lesson.phonetik.items) assert.deepEqual(stressErrors(line), [], line);
  }
  assert.notEqual(genderOf.get('Volleyball'), 'das');
  assert.deepEqual(stressErrors('Ich bin aufge-WACHT.'), ['aufge-WACHT']);
  assert.deepEqual(stressErrors('wenn sie URLAUB haben.'), ['URLAUB']);
});

test('leave-request models use frei haben, with the same model in both writing registries', () => {
  const model = course.lektionen[9].schreiben;
  const json = JSON.stringify(model);
  assert.doesNotMatch(json, /brauche[^.]*frei/);
  assert.match(json, /Ich möchte drei Tage frei haben\./);
  for (const path of ['../src/data/writingTasks.js', '../netlify/functions/_shared/writingTasks.mjs']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.ok(source.includes('Ich möchte drei Tage frei haben.'));
    assert.ok(!source.includes('Ich brauche für drei Tage frei.'));
  }
});

test('rule-card corrections preserve meaning markers and stay inside the lesson horizon', () => {
  for (const lesson of course.lektionen) {
    const card = RULE_CARD_OVERRIDES[lesson.primarySlug];
    assert.ok(card.commonMistakes.length >= 2);
    for (const mistake of card.commonMistakes) {
      assert.deepEqual(meaningMarkers(mistake.correct), meaningMarkers(mistake.wrong), mistake.wrong);
      assert.deepEqual(deferredConstructionHits(course, lesson.nr, mistake.correct), [], mistake.correct);
    }
  }
  assert.notDeepEqual(meaningMarkers('Ich weiß, dass er musste arbeiten.'), meaningMarkers('Ich weiß, dass er arbeitet.'));
  assert.notDeepEqual(meaningMarkers('Ich bleibe seit drei Tage.'), meaningMarkers('Ich bleibe für drei Tage.'));
});

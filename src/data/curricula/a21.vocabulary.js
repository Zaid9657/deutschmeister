// A2.1 additions: family stories, moving, shopping, invitations and visits.
// Existing word IDs are attested in the named, checked-in guarded SQL UPDATEs.
// These bilingual examples are shown on the word cards BEFORE retrieval.
export const VOCABULARY_A21_ADDITIONS = [
  [
    {
      "de": "der Alltag",
      "word": "Alltag",
      "article": "der",
      "en": "everyday life",
      "plural": "—",
      "exampleDe": "Unser Alltag ist schön.",
      "exampleEn": "Our everyday life is pleasant.",
      "wordId": "c6af615f-1669-4281-acca-4816a7251aa1",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Freizeit",
      "word": "Freizeit",
      "article": "die",
      "en": "free time",
      "plural": "—",
      "exampleDe": "Meine Oma hat viel Freizeit.",
      "exampleEn": "My grandma has a lot of free time.",
      "wordId": "9d224e33-3ad8-4b5b-a067-7c29c15e1731",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Gewohnheit",
      "word": "Gewohnheit",
      "article": "die",
      "en": "habit",
      "plural": "Gewohnheiten",
      "exampleDe": "Das ist eine Gewohnheit von meinem Opa.",
      "exampleEn": "That is a habit of my grandpa’s.",
      "wordId": "a30c05fd-b5bb-42f6-93cb-db4b4c545696",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Leidenschaft",
      "word": "Leidenschaft",
      "article": "die",
      "en": "passion",
      "plural": "Leidenschaften",
      "exampleDe": "Musik ist ihre Leidenschaft.",
      "exampleEn": "Music is her passion.",
      "wordId": "9e271471-0c75-4fb1-90ed-c8d69572c183",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Spiel",
      "word": "Spiel",
      "article": "das",
      "en": "game",
      "plural": "Spiele",
      "exampleDe": "Das Spiel gehört meinem Bruder.",
      "exampleEn": "The game belongs to my brother.",
      "wordId": "79986352-ec2f-47a0-9a97-3dedf12601b4",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Klavier",
      "word": "Klavier",
      "article": "das",
      "en": "piano",
      "plural": "Klaviere",
      "exampleDe": "Das Klavier steht bei unseren Eltern.",
      "exampleEn": "The piano is at our parents’ home.",
      "wordId": "781c193b-9ce8-43e8-97f5-b4bcd8b42b70",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Gitarre",
      "word": "Gitarre",
      "article": "die",
      "en": "guitar",
      "plural": "Gitarren",
      "exampleDe": "Die Gitarre gehört meiner Schwester.",
      "exampleEn": "The guitar belongs to my sister.",
      "wordId": "d3f80e03-427d-4f8e-b0f4-c5751cc46e53",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Instrument",
      "word": "Instrument",
      "article": "das",
      "en": "musical instrument",
      "plural": "Instrumente",
      "exampleDe": "Welches Instrument spielt Ihre Oma?",
      "exampleEn": "Which instrument does your grandma play?",
      "wordId": "8ed2c88a-ac0f-4e2b-a861-bace07238164",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Schwiegersohn",
      "word": "Schwiegersohn",
      "article": "der",
      "en": "son-in-law",
      "plural": "Schwiegersöhne",
      "exampleDe": "Unser Schwiegersohn ist der Mann von unserer Tochter.",
      "exampleEn": "Our son-in-law is our daughter’s husband.",
      "wordId": "85114110-0d07-4e1f-92f9-b65958e1c1db",
      "wordIdSource": "migrations/2026-09-05-a1-2-wortliste.sql"
    },
    {
      "de": "das Vertrauen",
      "word": "Vertrauen",
      "article": "das",
      "en": "trust",
      "plural": "—",
      "exampleDe": "In unserer Familie haben wir Vertrauen.",
      "exampleEn": "There is trust in our family.",
      "wordId": "4c40f97e-d044-4bef-bde8-bbd908007df9",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    }
  ],
  [
    {
      "de": "der Hausmeister",
      "word": "Hausmeister",
      "article": "der",
      "en": "caretaker",
      "plural": "Hausmeister",
      "exampleDe": "Der Hausmeister hat den Schlüssel.",
      "exampleEn": "The caretaker has the key.",
      "wordId": "c1105cbb-372d-41ac-a911-3b0562a858b3",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Mieter",
      "word": "Mieter",
      "article": "der",
      "en": "tenant",
      "plural": "Mieter",
      "exampleDe": "Der Mieter heißt Herr Sommer.",
      "exampleEn": "The tenant’s name is Mr Sommer.",
      "wordId": "e14f9daa-e7e3-4ad6-87ad-a3d11e255e25",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Mietvertrag",
      "word": "Mietvertrag",
      "article": "der",
      "en": "rental contract",
      "plural": "Mietverträge",
      "exampleDe": "Der Mietvertrag ist in meiner Tasche.",
      "exampleEn": "The rental contract is in my bag.",
      "wordId": "51fa7d52-a016-460d-9dce-3270f8d5144a",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Kaution",
      "word": "Kaution",
      "article": "die",
      "en": "deposit",
      "plural": "Kautionen",
      "exampleDe": "Die Kaution kostet 1.000 Euro.",
      "exampleEn": "The deposit costs 1,000 euros.",
      "wordId": "6067069b-06fe-4b58-858b-073be4113ca5",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Nebenkosten",
      "word": "Nebenkosten",
      "article": "die",
      "en": "additional housing costs",
      "plural": "Nebenkosten",
      "exampleDe": "Die Nebenkosten bezahlen wir jeden Monat.",
      "exampleEn": "We pay the additional housing costs every month.",
      "wordId": "c5b48756-6c9e-4e8a-a0fc-8461743f4a76",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Wohnungsanzeige",
      "word": "Wohnungsanzeige",
      "article": "die",
      "en": "apartment advertisement",
      "plural": "Wohnungsanzeigen",
      "exampleDe": "Die Wohnungsanzeige ist von unserem Vermieter.",
      "exampleEn": "The apartment advertisement is from our landlord.",
      "wordId": "0e36aa83-ccfc-4ed6-90f2-3c648be90c3d",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Besichtigung",
      "word": "Besichtigung",
      "article": "die",
      "en": "viewing",
      "plural": "Besichtigungen",
      "exampleDe": "Die Besichtigung ist am Samstag.",
      "exampleEn": "The viewing is on Saturday.",
      "wordId": "9f22798c-03d6-48aa-8c51-e852b5bb9422",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Quadratmeter",
      "word": "Quadratmeter",
      "article": "der",
      "en": "square metre",
      "plural": "Quadratmeter",
      "exampleDe": "Die Wohnung hat 50 Quadratmeter.",
      "exampleEn": "The apartment measures 50 square metres.",
      "wordId": "255330df-3604-4fd3-b087-a1e17f1ba3ba",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Lieferung",
      "word": "Lieferung",
      "article": "die",
      "en": "delivery",
      "plural": "Lieferungen",
      "exampleDe": "Die Lieferung kommt am Samstag.",
      "exampleEn": "The delivery arrives on Saturday.",
      "wordId": "e015e41e-37bf-4b30-9d71-bb557660fbde",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Parkplatz",
      "word": "Parkplatz",
      "article": "der",
      "en": "parking space",
      "plural": "Parkplätze",
      "exampleDe": "Der Parkplatz ist vor dem Haus.",
      "exampleEn": "The parking space is in front of the house.",
      "wordId": "123fc143-8f63-489f-8548-bc4f2ac75df1",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    }
  ],
  [
    {
      "de": "die Heizung",
      "word": "Heizung",
      "article": "die",
      "en": "heating",
      "plural": "Heizungen",
      "exampleDe": "Die Heizung ist unter dem Fenster.",
      "exampleEn": "The heating is below the window.",
      "wordId": "a8a2848f-733a-4512-b8f6-512e3928c439",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "das Handtuch",
      "word": "Handtuch",
      "article": "das",
      "en": "towel",
      "plural": "Handtücher",
      "exampleDe": "Das Handtuch hängt an der Wand.",
      "exampleEn": "The towel hangs on the wall.",
      "wordId": "de6952c4-af66-47f1-9a0e-cc4c24d193aa",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Zahnbürste",
      "word": "Zahnbürste",
      "article": "die",
      "en": "toothbrush",
      "plural": "Zahnbürsten",
      "exampleDe": "Die Zahnbürste ist neben der Seife.",
      "exampleEn": "The toothbrush is beside the soap.",
      "wordId": "7bef06a2-17db-4f2e-8160-5e73cc2c4ef0",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Seife",
      "word": "Seife",
      "article": "die",
      "en": "soap",
      "plural": "Seifen",
      "exampleDe": "Die Seife liegt neben der Zahnbürste.",
      "exampleEn": "The soap is beside the toothbrush.",
      "wordId": "8ba6116b-f33e-409e-ae25-4bc02d4e6dbd",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Zahnpasta",
      "word": "Zahnpasta",
      "article": "die",
      "en": "toothpaste",
      "plural": "—",
      "exampleDe": "Die Zahnpasta ist neben der Zahnbürste.",
      "exampleEn": "The toothpaste is beside the toothbrush.",
      "wordId": "5b1dced9-53a9-420c-b8a9-9f7127d63219",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Regenschirm",
      "word": "Regenschirm",
      "article": "der",
      "en": "umbrella",
      "plural": "Regenschirme",
      "exampleDe": "Der Regenschirm steht in der Ecke.",
      "exampleEn": "The umbrella stands in the corner.",
      "wordId": "93f72bba-cf9f-4ce5-8008-818f8a0e2913",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Bildschirm",
      "word": "Bildschirm",
      "article": "der",
      "en": "screen",
      "plural": "Bildschirme",
      "exampleDe": "Der Bildschirm steht auf dem Tisch.",
      "exampleEn": "The screen stands on the table.",
      "wordId": "c6a5f1e0-8750-4e3d-9f4e-c3bcfa710a83",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Maus",
      "word": "Maus",
      "article": "die",
      "en": "computer mouse",
      "plural": "Mäuse",
      "exampleDe": "Die Maus liegt neben dem Computer.",
      "exampleEn": "The mouse is beside the computer.",
      "wordId": "82596da1-9c69-4951-a452-ba37d4b62efa",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    }
  ],
  [
    {
      "de": "die Ware",
      "word": "Ware",
      "article": "die",
      "en": "goods",
      "plural": "Waren",
      "exampleDe": "Die Ware ist frisch.",
      "exampleEn": "The goods are fresh.",
      "wordId": "13005f2d-6b9b-4153-9ccb-c0f8534a9b85",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Sonderangebot",
      "word": "Sonderangebot",
      "article": "das",
      "en": "special offer",
      "plural": "Sonderangebote",
      "exampleDe": "Das Sonderangebot gilt heute.",
      "exampleEn": "The special offer is valid today.",
      "wordId": "282bc68f-6d1f-44be-bf37-df04a96c0dda",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Kassenbon",
      "word": "Kassenbon",
      "article": "der",
      "en": "receipt",
      "plural": "Kassenbons",
      "exampleDe": "Der Kassenbon liegt neben der Kasse.",
      "exampleEn": "The receipt is beside the checkout.",
      "wordId": "4e50abc6-7cdc-436d-b3b1-ea9856d33182",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Einkaufswagen",
      "word": "Einkaufswagen",
      "article": "der",
      "en": "shopping trolley",
      "plural": "Einkaufswagen",
      "exampleDe": "Der Einkaufswagen steht vor dem Geschäft.",
      "exampleEn": "The shopping trolley is outside the shop.",
      "wordId": "6882ff91-cdf6-4008-b606-8ff78079f1ad",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Tüte",
      "word": "Tüte",
      "article": "die",
      "en": "bag",
      "plural": "Tüten",
      "exampleDe": "Die Tüte kostet einen Euro.",
      "exampleEn": "The bag costs one euro.",
      "wordId": "6c48453c-7f14-4684-bd40-4ed1d2669e75",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Kreditkarte",
      "word": "Kreditkarte",
      "article": "die",
      "en": "credit card",
      "plural": "Kreditkarten",
      "exampleDe": "Die Kreditkarte ist in meiner Tasche.",
      "exampleEn": "The credit card is in my bag.",
      "wordId": "9aca40b2-0d95-4b5d-94a6-2751947b7255",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Portion",
      "word": "Portion",
      "article": "die",
      "en": "portion",
      "plural": "Portionen",
      "exampleDe": "Die Portion Salat kostet drei Euro.",
      "exampleEn": "The portion of salad costs three euros.",
      "wordId": "4c1d02fe-4fc0-496a-b1a6-4eaeb0e77585",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Beilage",
      "word": "Beilage",
      "article": "die",
      "en": "side dish",
      "plural": "Beilagen",
      "exampleDe": "Die Beilage ist Reis.",
      "exampleEn": "The side dish is rice.",
      "wordId": "56ca99d7-106a-4797-bd1b-e8d6ef9663a9",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Nachspeise",
      "word": "Nachspeise",
      "article": "die",
      "en": "dessert",
      "plural": "Nachspeisen",
      "exampleDe": "Obst ist unsere Nachspeise.",
      "exampleEn": "Fruit is our dessert.",
      "wordId": "3537e615-4b0e-4f6d-b6f5-90b6060757ab",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Marke",
      "word": "Marke",
      "article": "die",
      "en": "brand",
      "plural": "Marken",
      "exampleDe": "Welche Marke ist das?",
      "exampleEn": "Which brand is that?",
      "wordId": "b83d9cfd-6857-4445-84b0-c36b435f0378",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    }
  ],
  [
    {
      "de": "das Picknick",
      "word": "Picknick",
      "article": "das",
      "en": "picnic",
      "plural": "Picknicks",
      "exampleDe": "Das Picknick für Omas Geburtstag ist im Garten.",
      "exampleEn": "The picnic for Grandma’s birthday is in the garden.",
      "wordId": "48f83844-ff59-4272-b9bd-da6eca8a5db1",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Abendessen",
      "word": "Abendessen",
      "article": "das",
      "en": "dinner",
      "plural": "—",
      "exampleDe": "Das Abendessen ist um sieben.",
      "exampleEn": "Dinner is at seven.",
      "wordId": "08d7ca06-7fda-4874-ab8c-3bb50b1e1d6f",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Mittagessen",
      "word": "Mittagessen",
      "article": "das",
      "en": "lunch",
      "plural": "—",
      "exampleDe": "Das Mittagessen ist um zwölf.",
      "exampleEn": "Lunch is at twelve.",
      "wordId": "52d116fa-cfff-41cd-9959-ae0a335a8495",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Getränkekarte",
      "word": "Getränkekarte",
      "article": "die",
      "en": "drinks menu",
      "plural": "Getränkekarten",
      "exampleDe": "Die Getränkekarte liegt auf dem Tisch.",
      "exampleEn": "The drinks menu is on the table.",
      "wordId": "5528971d-bb98-4437-b44c-69c337fd9e9a",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Vorspeise",
      "word": "Vorspeise",
      "article": "die",
      "en": "starter",
      "plural": "Vorspeisen",
      "exampleDe": "Die Vorspeise ist ein Salat.",
      "exampleEn": "The starter is a salad.",
      "wordId": "b9f8d6df-f0dc-43f9-8a76-5e15143cefbe",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Hauptgericht",
      "word": "Hauptgericht",
      "article": "das",
      "en": "main course",
      "plural": "Hauptgerichte",
      "exampleDe": "Das Hauptgericht kostet zwölf Euro.",
      "exampleEn": "The main course costs twelve euros.",
      "wordId": "eb2d00e8-8dc4-4174-9671-62b8194a7a38",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Tagesgericht",
      "word": "Tagesgericht",
      "article": "das",
      "en": "dish of the day",
      "plural": "Tagesgerichte",
      "exampleDe": "Das Tagesgericht ist heute Fisch mit Reis.",
      "exampleEn": "Today’s dish of the day is fish with rice.",
      "wordId": "f18ada3b-5d66-45ed-aaf0-ec34bd683301",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Speisekarte",
      "word": "Speisekarte",
      "article": "die",
      "en": "menu",
      "plural": "Speisekarten",
      "exampleDe": "Die Speisekarte liegt neben Omas Geschenk.",
      "exampleEn": "The menu is beside Grandma’s present.",
      "wordId": "a666d1d1-3164-47d6-bd62-0c3afc2b27a7",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Bedienung",
      "word": "Bedienung",
      "article": "die",
      "en": "server",
      "plural": "Bedienungen",
      "exampleDe": "Die Bedienung bringt der Oma einen Kaffee.",
      "exampleEn": "The server brings Grandma a coffee.",
      "wordId": "ac2c91ac-1376-4804-9678-5204c195dfd3",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Trinkgeld",
      "word": "Trinkgeld",
      "article": "das",
      "en": "tip",
      "plural": "Trinkgelder",
      "exampleDe": "Das Trinkgeld ist für die Bedienung.",
      "exampleEn": "The tip is for the server.",
      "wordId": "e9088e55-3408-4571-a9b7-76ed5b9a652d",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    }
  ],
  [
    {
      "de": "die Reservierung",
      "word": "Reservierung",
      "article": "die",
      "en": "reservation",
      "plural": "Reservierungen",
      "exampleDe": "Die Reservierung ist für Freitag um acht.",
      "exampleEn": "The reservation is for Friday at eight.",
      "wordId": "fb31c9f1-88ad-4c53-adf3-209ccac36fbf",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Internet",
      "word": "Internet",
      "article": "das",
      "en": "internet",
      "plural": "—",
      "exampleDe": "Das Internet funktioniert heute nicht.",
      "exampleEn": "The internet is not working today.",
      "wordId": "78b91585-8b7d-4c95-81be-f612e949cc06",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die E-Mail",
      "word": "E-Mail",
      "article": "die",
      "en": "email",
      "plural": "E-Mails",
      "exampleDe": "Die E-Mail ist eine Einladung.",
      "exampleEn": "The email is an invitation.",
      "wordId": "3ffde416-d855-4fe8-950b-af43f02a4ff3",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Webseite",
      "word": "Webseite",
      "article": "die",
      "en": "website",
      "plural": "Webseiten",
      "exampleDe": "Die Webseite zeigt die Uhrzeit der Veranstaltung.",
      "exampleEn": "The website shows the time of the event.",
      "wordId": "7d79b1f2-5788-4489-baae-2058302ab776",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die App",
      "word": "App",
      "article": "die",
      "en": "app",
      "plural": "Apps",
      "exampleDe": "Die App zeigt meine Termine.",
      "exampleEn": "The app shows my appointments.",
      "wordId": "b34f0786-1172-4690-95a2-242b6e60fb6f",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Akku",
      "word": "Akku",
      "article": "der",
      "en": "battery",
      "plural": "Akkus",
      "exampleDe": "Der Akku ist im Handy.",
      "exampleEn": "The battery is in the phone.",
      "wordId": "872670f4-be0a-4712-b683-fb89cd61ddc1",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "das WLAN",
      "word": "WLAN",
      "article": "das",
      "en": "Wi-Fi",
      "plural": "—",
      "exampleDe": "Das WLAN funktioniert wieder.",
      "exampleEn": "The Wi-Fi is working again.",
      "wordId": "66fe52cd-fca2-42b7-bead-37e5b68b8984",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Feierabend",
      "word": "Feierabend",
      "article": "der",
      "en": "end of the working day",
      "plural": "—",
      "exampleDe": "Mein Feierabend ist heute um acht.",
      "exampleEn": "My working day ends at eight today.",
      "wordId": "eb16cba5-bc12-459e-a443-9d93258d3f9f",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    }
  ],
  [
    {
      "de": "der Anfänger",
      "word": "Anfänger",
      "article": "der",
      "en": "beginner",
      "plural": "Anfänger",
      "exampleDe": "Der Anfänger braucht Hilfe beim Training.",
      "exampleEn": "The beginner needs help with training.",
      "wordId": "dace7ca8-f3de-4a0d-8a7a-026425dc9edd",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "das Fitnessstudio",
      "word": "Fitnessstudio",
      "article": "das",
      "en": "gym",
      "plural": "Fitnessstudios",
      "exampleDe": "Das Fitnessstudio ist neben dem Bahnhof.",
      "exampleEn": "The gym is beside the station.",
      "wordId": "b1ac6a51-c29e-4195-b35b-685331d7eb01",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Kondition",
      "word": "Kondition",
      "article": "die",
      "en": "fitness",
      "plural": "—",
      "exampleDe": "Meine Kondition ist gut. Ich laufe jeden Tag.",
      "exampleEn": "My fitness is good. I run every day.",
      "wordId": "32e8097d-659a-4030-820b-e77f5cd2aa6a",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    }
  ],
  [
    {
      "de": "der Hausarzt",
      "word": "Hausarzt",
      "article": "der",
      "en": "family doctor",
      "plural": "Hausärzte",
      "exampleDe": "Der Hausarzt hat heute Sprechstunde.",
      "exampleEn": "The family doctor has consulting hours today.",
      "wordId": "5abc9d95-c94f-492b-ad5d-b55e98de0d9d",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Salbe",
      "word": "Salbe",
      "article": "die",
      "en": "ointment",
      "plural": "Salben",
      "exampleDe": "Die Salbe ist für mein Bein.",
      "exampleEn": "The ointment is for my leg.",
      "wordId": "b6b9f254-5d44-42ae-9ff8-ee12878ea118",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Krankmeldung",
      "word": "Krankmeldung",
      "article": "die",
      "en": "sick note",
      "plural": "Krankmeldungen",
      "exampleDe": "Die Krankmeldung ist für meinen Chef.",
      "exampleEn": "The sick note is for my boss.",
      "wordId": "01cd869a-d02d-4a3e-82fd-efabd34bd7e7",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    }
  ],
  [],
  [
    {
      "de": "die Unterkunft",
      "word": "Unterkunft",
      "article": "die",
      "en": "accommodation",
      "plural": "Unterkünfte",
      "exampleDe": "Unsere Unterkunft ist ein Hotel in Bremen.",
      "exampleEn": "Our accommodation is a hotel in Bremen.",
      "wordId": "29a2ef2a-2f50-4a69-9d98-d95aea47aa78",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "das Doppelzimmer",
      "word": "Doppelzimmer",
      "article": "das",
      "en": "double room",
      "plural": "Doppelzimmer",
      "exampleDe": "Das Doppelzimmer ist für meine Eltern.",
      "exampleEn": "The double room is for my parents.",
      "wordId": "69a1a56b-7753-4814-8da5-c2b055c5f6c5",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "das Einzelzimmer",
      "word": "Einzelzimmer",
      "article": "das",
      "en": "single room",
      "plural": "Einzelzimmer",
      "exampleDe": "Das Einzelzimmer ist für meinen Bruder.",
      "exampleEn": "The single room is for my brother.",
      "wordId": "dab503bb-e1e1-4ce5-844d-a28d904e761b",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Rezeption",
      "word": "Rezeption",
      "article": "die",
      "en": "reception",
      "plural": "Rezeptionen",
      "exampleDe": "Die Rezeption ist ab sieben Uhr geöffnet.",
      "exampleEn": "Reception is open from seven o’clock.",
      "wordId": "3069c9bb-28ec-478c-ab36-87b7ea02798b",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "das Visum",
      "word": "Visum",
      "article": "das",
      "en": "visa",
      "plural": "Visa",
      "exampleDe": "Das Visum ist in meinem Reisepass.",
      "exampleEn": "The visa is in my passport.",
      "wordId": "7629f95f-4613-43dc-bb3f-795dfa38364b",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Mietwagen",
      "word": "Mietwagen",
      "article": "der",
      "en": "rental car",
      "plural": "Mietwagen",
      "exampleDe": "Der Mietwagen steht am Flughafen.",
      "exampleEn": "The rental car is at the airport.",
      "wordId": "f2a2017a-b460-428d-8fac-5784381f26e9",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Fähre",
      "word": "Fähre",
      "article": "die",
      "en": "ferry",
      "plural": "Fähren",
      "exampleDe": "Die Fähre fährt in einer Stunde ab.",
      "exampleEn": "The ferry leaves in an hour.",
      "wordId": "5616deaa-d7c3-4669-83ad-cd379bb1e624",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    }
  ],
  [
    {
      "de": "der Wegweiser",
      "word": "Wegweiser",
      "article": "der",
      "en": "signpost",
      "plural": "Wegweiser",
      "exampleDe": "Der Wegweiser steht neben dem Rathaus.",
      "exampleEn": "The signpost is beside the town hall.",
      "wordId": "2e49c5bb-afbd-4d3b-b4ef-5d8a871a84a2",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "der Zebrastreifen",
      "word": "Zebrastreifen",
      "article": "der",
      "en": "pedestrian crossing",
      "plural": "Zebrastreifen",
      "exampleDe": "Der Zebrastreifen ist vor dem Museum.",
      "exampleEn": "The pedestrian crossing is in front of the museum.",
      "wordId": "b1191336-fad4-4278-9dd7-fc0cb9638058",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Kreuzung",
      "word": "Kreuzung",
      "article": "die",
      "en": "intersection",
      "plural": "Kreuzungen",
      "exampleDe": "Die Kreuzung ist hinter der Brücke.",
      "exampleEn": "The intersection is behind the bridge.",
      "wordId": "75e423f3-739c-45e6-ab7b-a3c2d05724ae",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    },
    {
      "de": "die Ampel",
      "word": "Ampel",
      "article": "die",
      "en": "traffic light",
      "plural": "Ampeln",
      "exampleDe": "Die Ampel ist gegenüber dem Museum.",
      "exampleEn": "The traffic light is opposite the museum.",
      "wordId": "db0c034e-5944-4bd4-9762-4938ba24f3b0",
      "wordIdSource": "migrations/2026-09-06-a2-1-wortliste.sql"
    }
  ],
  [
    {
      "de": "das Meer",
      "word": "Meer",
      "article": "das",
      "en": "sea",
      "plural": "Meere",
      "exampleDe": "Das Meer ist auf dem Foto blau.",
      "exampleEn": "The sea is blue in the photo.",
      "wordId": "da2c5076-3e86-4bdd-8afb-4f568f86c0a3",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Strand",
      "word": "Strand",
      "article": "der",
      "en": "beach",
      "plural": "Strände",
      "exampleDe": "Der Strand auf dem Foto ist in Marokko.",
      "exampleEn": "The beach in the photo is in Morocco.",
      "wordId": "7528a7e6-cfbd-4306-bed1-f8b08a167236",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "die Insel",
      "word": "Insel",
      "article": "die",
      "en": "island",
      "plural": "Inseln",
      "exampleDe": "Die Insel ist klein. Wir haben dort Urlaub gemacht.",
      "exampleEn": "The island is small. We had a holiday there.",
      "wordId": "2d889098-dd9f-48cc-b2cc-3a3d1e12e526",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Berg",
      "word": "Berg",
      "article": "der",
      "en": "mountain",
      "plural": "Berge",
      "exampleDe": "Der Berg ist auf dem Foto von meinem Vater.",
      "exampleEn": "The mountain is in my father’s photo.",
      "wordId": "4e027c75-688b-4a85-8434-ec8ef430bfd4",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der See",
      "word": "See",
      "article": "der",
      "en": "lake",
      "plural": "Seen",
      "exampleDe": "Der See liegt neben dem Wald.",
      "exampleEn": "The lake is beside the forest.",
      "wordId": "7f065336-97e9-41f0-960e-fffc39268673",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    },
    {
      "de": "der Wald",
      "word": "Wald",
      "article": "der",
      "en": "forest",
      "plural": "Wälder",
      "exampleDe": "Der Wald ist auf unseren Fotos.",
      "exampleEn": "The forest is in our photos.",
      "wordId": "7ea2fe75-cf15-4748-ae3f-664ec89a0e64",
      "wordIdSource": "migrations/2026-09-06-a2-2-wortliste.sql"
    }
  ]
];

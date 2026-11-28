// The words a learner may give as their own in a final-check gap (courses session and the independent score,
// 2026-11-20). Languages and countries are closed classes: their German names are listed here. Jobs get a
// generous list plus the shape of a job noun. Cities are open: the big ones are listed, a small town is the
// learner's own and is accepted with a line that the word itself was not checked (`uncheckedWords`).
// Written as German writes them; finalCheck.js folds them.

export const LANGUAGES = `Deutsch Englisch Arabisch Französisch Spanisch Italienisch Portugiesisch Türkisch Kurdisch Kurmandschi Kurmanci
Sorani Persisch Farsi Dari Paschtu Paschto Urdu Hindi Bengalisch Bengali Punjabi Pandschabi Tamil Russisch Ukrainisch Polnisch Rumänisch
Bulgarisch Griechisch Albanisch Serbisch Kroatisch Bosnisch Mazedonisch Slowenisch Montenegrinisch Tschechisch Slowakisch Ungarisch
Niederländisch Holländisch Flämisch Schwedisch Norwegisch Dänisch Finnisch Estnisch Lettisch Litauisch Isländisch Luxemburgisch Chinesisch
Mandarin Kantonesisch Japanisch Koreanisch Vietnamesisch Thailändisch Thai Indonesisch Malaiisch Tagalog Filipino Hebräisch Aramäisch
Assyrisch Armenisch Georgisch Aserbaidschanisch Kasachisch Usbekisch Turkmenisch Tadschikisch Kirgisisch Mongolisch Nepali Nepalesisch
Singhalesisch Tigrinya Tigrinisch Amharisch Oromo Somali Somalisch Swahili Suaheli Hausa Haussa Yoruba Igbo Wolof Lingala Berberisch
Tamazight Kabylisch Belarussisch Weißrussisch Moldauisch Katalanisch Baskisch Galicisch Irisch Walisisch Latein Romani Romanes Jiddisch
Maltesisch Afrikaans Zulu Xhosa Fula Bambara Twi Paschtunisch Belutschisch Turkmenisch Uigurisch Tatarisch Tschetschenisch Darija
Marokkanisch Ägyptisch Syrisch Libanesisch Irakisch`.split(/\s+/);

export const COUNTRIES = `Deutschland Österreich Schweiz Liechtenstein Syrien Irak Iran Afghanistan Türkei Libanon Jordanien Palästina Israel
Ägypten Marokko Algerien Tunesien Libyen Sudan Südsudan Eritrea Äthiopien Somalia Dschibuti Jemen Saudi-Arabien Kuwait Katar Bahrain Oman
Emirate Pakistan Indien Bangladesch Sri Lanka Nepal Bhutan China Taiwan Japan Korea Nordkorea Südkorea Vietnam Laos Kambodscha Thailand Myanmar
Philippinen Indonesien Malaysia Singapur Russland Ukraine Belarus Weißrussland Moldau Moldawien Polen Tschechien Slowakei Ungarn Rumänien
Bulgarien Griechenland Zypern Albanien Kosovo Serbien Kroatien Bosnien Herzegowina Montenegro Nordmazedonien Mazedonien Slowenien Italien
Spanien Portugal Frankreich Belgien Niederlande Holland Luxemburg England Großbritannien Schottland Wales Irland Dänemark Schweden Norwegen
Finnland Island Estland Lettland Litauen Georgien Armenien Aserbaidschan Kasachstan Usbekistan Turkmenistan Tadschikistan Kirgistan Mongolei
USA Amerika Kanada Mexiko Brasilien Argentinien Kolumbien Venezuela Peru Chile Bolivien Ecuador Kuba Nigeria Ghana Senegal Kamerun Kongo
Kenia Tansania Uganda Ruanda Gambia Guinea Mali Niger Tschad Mauretanien Elfenbeinküste Togo Benin Sierra Leone Liberia Angola Mosambik
Simbabwe Sambia Südafrika Madagaskar Australien Neuseeland Kurdistan Tschetschenien Europa Afrika Asien Amerika Arabien`.split(/\s+/);

export const CITIES = `Berlin Hamburg München Köln Frankfurt Stuttgart Düsseldorf Dortmund Essen Leipzig Bremen Dresden Hannover Nürnberg Duisburg
Bochum Wuppertal Bielefeld Bonn Münster Mannheim Karlsruhe Augsburg Wiesbaden Mönchengladbach Gelsenkirchen Aachen Braunschweig Kiel Chemnitz
Halle Magdeburg Freiburg Krefeld Mainz Lübeck Erfurt Oberhausen Rostock Kassel Hagen Potsdam Saarbrücken Hamm Ludwigshafen Oldenburg Mülheim
Osnabrück Leverkusen Heidelberg Darmstadt Solingen Regensburg Herne Paderborn Neuss Ingolstadt Offenbach Fürth Würzburg Ulm Heilbronn
Pforzheim Wolfsburg Göttingen Bottrop Reutlingen Koblenz Bremerhaven Recklinghausen Erlangen Jena Remscheid Trier Salzgitter Moers Siegen
Hildesheim Cottbus Gütersloh Kaiserslautern Witten Hanau Schwerin Gera Iserlohn Ludwigsburg Esslingen Zwickau Düren Ratingen Flensburg
Konstanz Wilhelmshaven Marl Lünen Delmenhorst Worms Velbert Minden Neumünster Norderstedt Dorsten Marburg Gießen Bamberg Bayreuth Passau
Landshut Rosenheim Kempten Lüneburg Celle Wismar Stralsund Greifswald Weimar Dessau Wien Graz Linz Salzburg Innsbruck Klagenfurt Zürich Basel
Bern Genf Lausanne Luzern Damaskus Aleppo Homs Hama Latakia Daraa Idlib Bagdad Mossul Erbil Basra Kirkuk Sulaimaniyya Teheran Maschhad Isfahan
Schiras Täbris Kabul Herat Kandahar Masar Istanbul Ankara Izmir Gaziantep Beirut Amman Kairo Alexandria Casablanca Rabat Marrakesch Fes Tanger
Agadir Oujda Nador Algier Oran Tunis Tripolis Bengasi Khartum Asmara Addis Abeba Mogadischu Sanaa Aden Riad Dschidda Mekka Dubai Doha
Karatschi Lahore Islamabad Delhi Mumbai Dhaka Moskau Kiew Charkiw Odessa Lwiw Minsk Warschau Krakau Breslau Danzig Posen Bukarest Sofia Athen
Tirana Pristina Belgrad Zagreb Sarajevo Skopje Ljubljana Rom Mailand Neapel Turin Madrid Barcelona Valencia Lissabon Porto Paris Marseille
Lyon London Manchester Brüssel Amsterdam Rotterdam Prag Budapest Stockholm Kopenhagen Oslo Helsinki Peking Schanghai Tokio Seoul Bangkok
Hanoi Manila Jakarta Lagos Abuja Accra Dakar Nairobi Kampala Kigali Tiflis Eriwan Baku Taschkent Almaty Duschanbe Bischkek`.split(/\s+/);

export const JOBS = `Lehrer Lehrerin Student Studentin Schüler Schülerin Arzt Ärztin Zahnarzt Zahnärztin Tierarzt Tierärztin Krankenpfleger
Krankenpflegerin Krankenschwester Pflegekraft Pflegefachkraft Altenpfleger Altenpflegerin Pfleger Pflegerin Hebamme Ingenieur Ingenieurin
Informatiker Informatikerin Programmierer Programmiererin Entwickler Entwicklerin Verkäufer Verkäuferin Kellner Kellnerin Koch Köchin Bäcker
Bäckerin Konditor Konditorin Fleischer Fleischerin Metzger Metzgerin Friseur Friseurin Friseuse Fahrer Fahrerin Busfahrer Busfahrerin
Taxifahrer Taxifahrerin Lkw-Fahrer Berufskraftfahrer Mechaniker Mechanikerin Mechatroniker Elektriker Elektrikerin Elektroniker Klempner
Installateur Installateurin Maler Malerin Lackierer Tischler Tischlerin Schreiner Schreinerin Maurer Bauarbeiter Bauarbeiterin Handwerker
Handwerkerin Gärtner Gärtnerin Landwirt Landwirtin Bauer Bäuerin Polizist Polizistin Soldat Soldatin Anwalt Anwältin Rechtsanwalt Richter
Richterin Apotheker Apothekerin Architekt Architektin Journalist Journalistin Künstler Künstlerin Musiker Musikerin Schauspieler
Schauspielerin Sänger Sängerin Sekretär Sekretärin Kaufmann Kauffrau Buchhalter Buchhalterin Manager Managerin Chef Chefin Angestellter
Angestellte Arbeiter Arbeiterin Hausmann Hausfrau Rentner Rentnerin Erzieher Erzieherin Sozialarbeiter Sozialarbeiterin Dolmetscher
Dolmetscherin Übersetzer Übersetzerin Reinigungskraft Putzfrau Putzmann Lagerist Lageristin Lagerarbeiter Kassierer Kassiererin Pilot
Pilotin Physiotherapeut Physiotherapeutin Therapeut Therapeutin Psychologe Psychologin Wissenschaftler Wissenschaftlerin Professor
Professorin Lehrling Azubi Auszubildender Auszubildende Praktikant Praktikantin Unternehmer Unternehmerin Optiker Optikerin Zahntechniker
Chemiker Chemikerin Biologe Biologin Physiker Physikerin Mathematiker Banker Bankkaufmann Bankkauffrau Steuerberater Designer Designerin
Fotograf Fotografin Kosmetikerin Schneider Schneiderin Näherin Postbote Briefträger Briefträgerin Kurier Lieferant Paketbote Wachmann
Hausmeister Hausmeisterin Pförtner Bibliothekar Bibliothekarin Beamter Beamtin Kranführer Schweißer Schlosser Gastronom Imam Pfarrer
Pastor Bürokauffrau Bürokaufmann Arzthelferin Zahnarzthelferin Pflegehelfer Pflegehelferin Erntehelfer Küchenhilfe Verkaufshilfe`.split(/\s+/);

// The shape of a job noun („Tischler“, „Informatikerin“, „Polizist“, „Pflegekraft“): a rare job the list does not hold.
export const JOB_SHAPE = /^\p{Lu}\p{L}*(?:er|erin|ist|istin|ant|antin|ent|entin|eur|eurin|euse|or|orin|mann|frau|kraft|arzt|ärztin|loge|login|ling|helfer|helferin|ker|kerin|eiter|eiterin)$/u;
// The shape of a language („Tigrinisch“): a rare language the list does not hold.
export const LANGUAGE_SHAPE = /^\p{Lu}\p{L}{2,}isch$/u;

// English a German answer never has. The small words are English wherever they stand, a name apart from them is a name
// („Adam Brown“); the place names are the English ones where German has its own („Syria“, „Munich“). The course's own
// English (its translations) is added by finalCheck.js. Left out: a word one letter from a German one (is, it, and, have:
// those are spelling slips) and a word German uses too (Job, Party, cool, sorry).
export const ENGLISH_SMALL = `the my your our their she they you please thank thanks yes would like don't dont know what where when how
why that there with from this these those good goodbye morning afternoon evening hello need speak want very much many am
he it here at born older younger to before after of for no not or but our free color colour every always never only because bonjour merci non oui avec huit hola gracias`.split(/\s+/).filter((w) => w !== 'am');
export const ENGLISH_PLACES = `Albania Armenia Argentina Austria Australia Azerbaijan Belgium Bulgaria Bolivia Brazil Canada Switzerland Cameroon Colombia
Serbia Cuba Cyprus Czechia Germany Djibouti Denmark Algeria Estonia Egypt Spain Ethiopia Finland France Greece Croatia Hungary Indonesia Ireland India Iraq
Iceland Italy Jamaica Jordan Kenya Cambodia Kazakhstan Lebanon Lithuania Luxembourg Latvia Libya Morocco Moldova Madagascar Mongolia Mauritania Mexico
Mozambique Netherlands Norway Philippines Poland Qatar Zimbabwe Romania Russia Rwanda Sweden Singapore Slovenia Slovakia Syria Chad Tajikistan Tunisia
Turkey Tanzania Uzbekistan Yemen Zambia Palestine Europe Africa Asia America Munich Cologne Nuremberg Vienna Geneva Cairo Damascus Baghdad Algiers Rome
Milan Naples Athens Moscow Warsaw Prague Lisbon Brussels Copenhagen Bucharest Belgrade Khartoum Tehran Mecca Riyadh Tokyo Beijing`.split(/\s+/);
export const ALSO_GERMAN = `alarm also altogether anrede apartment boss bring bye cafe caf cup dad date drink email euros familienname festival flat football form
formal free hundert informal job her last lf listen live marokkaner may mineral mobile mom mr mrs ms mum notebook orange past person pick schl see sell
shopping single singular sorry staatsangeh station status still surname value will rigkeit zero name price present place platform play status color cost
paper read meet dance card street team party gold arm hand warm wind so was in an man gut den`.split(/\s+/);

// The article of common nouns no Lektion teaches (independent score, 2026-11-24: „Ich bin ein Ärztin.“ and „Ich brauche
// ein Drucker.“ were praised). A noun with two accepted genders stands in both lists. A compound takes the gender of its
// last part, a job that of its ending, so neither needs its own entry (finalCheck.js `ownReadings`).
export const NOUN_GENDERS = {
  der: `Onkel Opa Großvater Cousin Nachbar Neffe Enkel Ehemann Schwager Freund Chef Drucker Bildschirm Monitor Laptop Fernseher Kopfhörer Lautsprecher Stecker Akku Ordner Kalender Block Zettel Brief Umschlag Pinsel Klebstoff
Radiergummi Spitzer Locher Filzstift Marker Kuli Füller Ausweis Pass Führerschein Vertrag Antrag Schreibtisch Schrank Sessel Spiegel Teppich Vorhang
Herd Ofen Kühlschrank Staubsauger Wasserkocher Toaster Mixer Topf Löffel Teller Becher Krug Kamm Föhn Schwamm Eimer Besen Müll Koffer
Rucksack Beutel Korb Gürtel Schal Hut Handschuh Schuh Stiefel Pullover Pulli Mantel Anzug Rock Bikini Schlafanzug Ring Ohrring Schmuck Regenschirm
Schirm Ball Schläger Roller Helm Kinderwagen Wagen Motor Reifen Wein Saft Sekt Cocktail Schnaps Espresso Cappuccino Kakao Smoothie Eistee Eiskaffee
Milchkaffee Früchtetee Kräutertee Pfefferminztee Apfel Pfirsich Ananas Reis Käse Quark Joghurt Honig Zucker Pfeffer Senf Essig Ketchup Fisch Schinken
Speck Döner Burger Hamburger Keks Kaugummi Lutscher Pudding Nachtisch Salat Kohl Spinat Knoblauch Pilz Toast Krapfen Pfannkuchen Auflauf Eintopf Snack
Film Roman Comic Kurs Sport Tanz Yogakurs Ausflug Urlaub Spaziergang Besuch Garten Balkon Keller Park Platz Markt Supermarkt Laden Flughafen Parkplatz
Arzt Termin Job Beruf Euro Gutschein Geldbeutel Hund Vogel Fisch Blumenstrauß Kaktus Baum Strauß Teddy Computer Server Scanner Beamer Stuhl Tisch Kuchen
Löffelbiskuit Muffin Donut Brokkoli Sellerie Salzstreuer Nagellack Lippenstift Rasierer Kaffee Tee Abend Morgen Tag Monat`,
  die: `Dusche Badewanne Schwägerin Enkelin Ehefrau Tastatur Maus Kamera Lampe Batterie Steckdose Datei Mappe Akte Schere Kreide Brille Sonnenbrille Uhr Armbanduhr Wanduhr Kette Halskette Krawatte
Mütze Jacke Hose Jeans Bluse Weste Unterhose Socke Tasche Handtasche Geldbörse Brieftasche Karte Postkarte Geburtstagskarte Kreditkarte Bankkarte
Fahrkarte Versicherung Rechnung Quittung Unterschrift Kopie Zeitung Zeitschrift Decke Bettdecke Matratze Couch Kommode Vase Blume Pflanze Kerze Pfanne
Schüssel Gabel Tasse Flasche Dose Kanne Kaffeemaschine Waschmaschine Spülmaschine Maschine Mikrowelle Heizung Dusche Badewanne Toilette Seife Creme Zahnbürste
Zahnpasta Bürste Sonnencreme Pizza Suppe Wurst Bratwurst Currywurst Butter Margarine Marmelade Milch Sahne Soße Nudel Kartoffel Tomate Gurke Zwiebel Karotte
Möhre Paprika Bohne Erbse Olive Aubergine Zucchini Banane Orange Zitrone Birne Kirsche Erdbeere Traube Mango Melone Schokolade Torte Praline Waffel
Cola Fanta Limonade Limo Apfelschorle Schorle Latte Wohnung Küche Garage Terrasse Schule Universität Bank Post Apotheke Bäckerei Metzgerei Bibliothek
Kirche Moschee Polizei Feuerwehr Katze Maus Gitarre Geige Trommel Flöte Musik Serie Sendung Reise Party Feier Hochzeit Einladung Überraschung Puppe
Arbeit Stelle Firma Pause Frage Antwort Aufgabe Übung Prüfung Nummer E-Mail Mail App SIM-Karte Ladung Stunde Minute Woche Nacht Cousine Tante Oma
Großmutter Nichte Freundin Nachbarin Kollegin Chefin Person Leiter Schraube Säge Zange Taschenlampe Socke Windel Tablette Medizin Maske Salbe Brücke Straße`,
  das: `Tablet Ladekabel Ladegerät Kabel Headset Mikrofon Papier Notizbuch Wörterbuch Lexikon Lineal Etui Mäppchen Formular Dokument Zeugnis Visum Zertifikat Foto Bild
Poster Regal Bett Sofa Kissen Kopfkissen Bettlaken Laken Möbelstück Zimmer Bad Badezimmer Schlafzimmer Wohnzimmer Haus Fenster Dach Auto Fahrrad Rad Motorrad Moped Taxi
Flugzeug Schiff Boot Ticket Messer Glas Besteck Geschirr Brett Tuch Handtuch Waschmittel Shampoo Parfüm Deo Pflaster Medikament Kleid Hemd T-Shirt Shirt Unterhemd
Sweatshirt Armband Portemonnaie Geld Geschenk Spiel Spielzeug Videospiel Puzzle Lego Instrument Klavier Keyboard Radio Wasser Bier Getränk Essen Frühstück Mittagessen Abendessen
Brot Brötchen Sandwich Käsebrot Croissant Toastbrot Ei Rührei Fleisch Hähnchen Steak Schnitzel Würstchen Gulasch Obst Gemüse Müsli Salz Öl Mehl Eis
Bonbon Stück Dessert Menü Café Restaurant Hotel Kino Theater Museum Krankenhaus Büro Amt Rathaus Geschäft Kaufhaus Schwimmbad Fitnessstudio Studio Stadion
Tier Pferd Kaninchen Baby Mädchen Kind Hobby Training Yoga Schwimmen Joggen Wandern Kochen Backen Lesen Singen Malen Zeichnen Spazierengehen Wochenende Jahr Fest
Werkzeug Buch Heft Bild Handy Telefon Smartphone Telefonbuch Notebook Kopftuch Taschentuch Feuerzeug Besprechungszimmer Thermometer`,
  pl: `Nachbarn Freunde Freundinnen Kollegen Kolleginnen Cousins Cousinen Tanten Verwandte Hausaufgaben Nudeln Pommes Chips Süßigkeiten Möbel Eltern Großeltern Geschwister Leute Ferien Kosten Lebensmittel Kleider Schuhe Socken Handschuhe Blumen Bücher Stifte Batterien Eier Tomaten
Kartoffeln Bananen Äpfel Orangen Erdbeeren Trauben Getränke Brötchen Kekse Kinder Freunde Bilder Fotos Tickets Geschenke`,
};
// More everyday nouns (loop round 3, 2026-11-25): the second reader checks a determiner and its case against them.
NOUN_GENDERS.der += ` Gegenstand Alkohol Empfang Stock Zugang Schlüsselbund Flur Eingang Ausgang Aufzug Raum Boden Himmel Berg Fluss Wald Strand Zoo Spielplatz Bahnhof Weg Hof Gast Besucher Mensch Junge Geburtsort Wohnort Grund Fehler Unfall Schmerz Kopf Bauch
Rücken Arm Finger Zahn Hals Mund Traum Wunsch Plan Preis Rabatt Kauf Einkauf Text Satz Buchstabe Punkt Bleistift Kugelschreiber Feiertag Sommer Winter Herbst Frühling Regen Schnee Wind Braten Teig Grill Unterricht Deutschkurs
Test Abschluss Verein Zug Bus Flug Stern Mond Ort Bereich Bildschirmschoner Schreibblock Notizblock Taschenrechner Adapter USB-Stick Stick Reisepass Personalausweis Wecker Ventilator Heizkörper Wasserhahn Müllsack Briefkasten
Aschenbecher Kleiderschrank Nachttisch Esstisch Couchtisch Bürostuhl Hocker Sonnenschirm Grillabend Filmabend Kinoabend Spieleabend Restaurantbesuch Feierabend Sohn Papagei Hamster Wellensittich Basketball Volleyball Tanzkurs
Sprachkurs Kochkurs Schwimmkurs Computerkurs Führerschein Kindergarten Einband Geschmack Geruch Apparat`;
NOUN_GENDERS.die += ` Hilfe Ahnung Angst Idee Chance Lust Farbe Größe Zahl Uhrzeit Zeit Stadt Adresse Hausnummer Postleitzahl Telefonnummer Handynummer Gegend Natur Welt Fahrt Abfahrt Ankunft Haltestelle Station Bahn S-Bahn U-Bahn
Straßenbahn Autobahn Ampel Ecke Kreuzung Etage Treppe Tür Wand Decke Familie Geburt Kleidung Nase Hand Schulter Haut Stimme Sprache Grammatik Vokabel Note Klasse Gruppe Besprechung Sitzung Kundin Krankheit Erkältung Grippe
Krankenversicherung Arbeitserlaubnis Aufenthaltserlaubnis Anmeldung Bestellung Vorspeise Nachspeise Speisekarte Sonne Wolke Rose Tulpe Kunst Fotografie Nachricht Folge Show Wäsche Eintrittskarte Kinokarte Konzertkarte Schicht
Frühschicht Spätschicht Nachtschicht Wasserflasche Trinkflasche Thermoskanne Lupe Landkarte Einkaufstasche Plastiktüte Tüte Büroklammer Schublade Lautstärke Steuer Miete Küchenmaschine Kopfhörerbox Box Playstation Konsole
Gymnastik Wanderung Radtour Tour Freizeit Kultur Heimat Kindheit Zukunft Haltung Freude Liebe Pflege Erde Luft Nachspeise Suppenschüssel Geburtstagskarte Geburtstagstorte Uhr Brille Soße Sauce`;
NOUN_GENDERS.das += ` Zelt Internet WLAN Passwort Konto Problem Thema Ergebnis Beispiel Wort Gespräch Interview Treffen Lied Konzert Festival Fußballspiel Tor Team Land Dorf Heimatland Geburtsdatum Datum Alter Gesicht Auge Ohr Haar Bein
Knie Herz Blut Fieber Wetter Gewitter Feuer Licht Meer Ufer Tal Gebirge Stockwerk Erdgeschoss Gebäude Treppenhaus Schloss Bürgerbüro Jobcenter Finanzamt Gericht Gewürz Kochbuch Kinderbuch Seminar Praktikum Studium Diplom
Trikot Parfum Ladekabel Netzteil Mousepad Whiteboard Headset Büromaterial Mittagessen Frühstücksei Spiegelei Butterbrot Müsli Schulheft Notizheft Malbuch Spielbrett Skateboard Schlagzeug Saxophon Akkordeon Fitnessstudio
Einkaufszentrum Freibad Hallenbad Reisebüro Bürgeramt Standesamt Krankenzimmer Wartezimmer Kinderzimmer Esszimmer Arbeitszimmer Gästezimmer Besprechungszimmer Teil Ziel Reiseziel Grillfest Gartenfest Sommerfest Geburtstagsfest`;
NOUN_GENDERS.pl += ` Haare Augen Schmerzen Nachrichten Bälle Gäste Töchter Söhne Brüder Mütter Väter Stühle Häuser Gläser Fahrräder Wörter Länder Städte Züge Schränke Töpfe Röcke Hüte Schals Ringe Hefte Uhren Taschen Lampen Regale Filme
Spiele Lieder Pflanzen Kerzen Würstchen Tische Computer Laptops Handys Hobbys Partys Babys Autos Hunde Katzen Vögel Fische Bäume Rosen Tulpen Karten Kinokarten Eintrittskarten Kopfhörer Gummistiefel Turnschuhe Sportschuhe
Fußballschuhe Hausschuhe Krimis Romane Comics Zeitungen Briefe Mails Rätsel Puzzles Hausaufgaben Gardinen Teller Tassen Löffel Gabeln Servietten`;
// Of these, what German names without an article (food, drink, stuff, sports, money).
export const OWN_MASS_NOUNS = `Wein Saft Sekt Schnaps Espresso Cappuccino Kakao Eistee Eiskaffee Milchkaffee Früchtetee Kräutertee Pfefferminztee Reis Käse Quark Joghurt Honig
Zucker Pfeffer Senf Essig Ketchup Fisch Schinken Speck Pudding Spinat Knoblauch Kohl Brokkoli Sellerie Müll Klebstoff Schmuck Urlaub Besuch Sport Kaffee Tee Seife Creme Zahnpasta
Pizza Suppe Wurst Butter Margarine Marmelade Milch Sahne Soße Paprika Schokolade Cola Fanta Limonade Limo Apfelschorle Schorle Latte Musik Medizin Arbeit Sonnencreme
Papier Besteck Geschirr Waschmittel Shampoo Parfüm Deo Geld Spielzeug Wasser Bier Essen Frühstück Mittagessen Abendessen Brot Fleisch Hähnchen Gulasch Obst Gemüse Müsli Salz Öl Mehl Eis
Yoga Schwimmen Joggen Wandern Kochen Backen Lesen Singen Malen Zeichnen Spazierengehen Training Werkzeug Parfum Kuchen Salat Döner`.split(/\s+/);
// Two genders are in use for these.
NOUN_GENDERS.das += ' Joghurt Laptop Keks Gulasch Kaugummi Ketchup E-Mail Cola Radiergummi Bonbon Parfum Virus Teil';
NOUN_GENDERS.der += ' Bonbon Gulasch';

// What one drinks, and what one eats, of the nouns above (a compound has the kind of its last part): „Ich möchte eine Pizza“ is no drink.
export const DRINKS = `Wein Saft Sekt Cocktail Schnaps Espresso Cappuccino Kakao Smoothie Eistee Eiskaffee Milchkaffee Früchtetee Kräutertee Pfefferminztee Cola
Fanta Limonade Limo Apfelschorle Schorle Latte Milch Wasser Bier Getränk Kaffee Tee Mineralwasser Orangensaft Apfelsaft Rotwein Weißwein`.split(/\s+/);
export const FOODS = `Apfel Pfirsich Ananas Reis Käse Quark Joghurt Honig Zucker Pfeffer Senf Essig Ketchup Fisch Schinken Speck Döner Burger Hamburger Keks
Kaugummi Pudding Nachtisch Salat Kohl Spinat Knoblauch Pilz Toast Krapfen Pfannkuchen Auflauf Eintopf Snack Muffin Donut Brokkoli Sellerie Pizza Suppe Wurst
Bratwurst Currywurst Butter Margarine Marmelade Sahne Soße Nudel Nudeln Kartoffel Kartoffeln Tomate Tomaten Gurke Zwiebel Karotte Möhre Paprika Bohne Bohnen
Erbse Olive Oliven Aubergine Zucchini Banane Orange Zitrone Birne Kirsche Erdbeere Traube Mango Melone Schokolade Torte Praline Waffel Mittagessen Abendessen
Brot Brötchen Sandwich Käsebrot Croissant Toastbrot Ei Eier Rührei Fleisch Hähnchen Steak Schnitzel Würstchen Gulasch Obst Gemüse Müsli Eis Bonbon Stück
Dessert Menü Pommes Chips Süßigkeiten Essen Frühstück Kuchen Falafel Hummus Couscous Lasagne Spaghetti Omelett Portion Teller`.split(/\s+/);

// Everyday English nouns a beginner puts in a German sentence („Meine Friends kommen auch.“). None is a German word, one letter
// from one a learner would type, or a name German uses too („Job“, „Party“, „Baby“, „Hobby“ are left out).
export const ENGLISH_NOUNS = `chicken friends friend flowers flower october december january february july monday tuesday wednesday thursday friday saturday
sunday school work homework books book phone water bread milk coffee juice apple apples eggs egg cheese rice meat sugar cake potato potatoes tomato tomatoes
vegetables fruit breakfast lunch dinner house car bike table chair pencil scissors picture pictures clock key keys wallet glasses mother father sister
sisters brother brothers parents uncle aunt grandma grandpa grandmother grandfather husband wife daughter daughters child children family teacher nurse
driver engineer waiter music swimming reading cooking dancing singing running garden gardening painting photography weekend week evening birthday present
presents shoes dress shirt trousers perfume chocolate money printer desk screen password room office kitchen bathroom hungry thirsty tired married happy
yellow white black grey gray purple people neighbour neighbours neighbor neighbors cousins nephew niece guest guests colleague colleagues mirror bicycle cupboard wardrobe shelf carpet curtain fridge oven spoon fork knife plate bottle pillow blanket towel soap brush scarf gloves coat skirt sweater necklace earrings newspaper magazine
letter envelope weather soup football march pencil sharpener eraser ruler grandson granddaughter boss
train plane station ticket-office doctor hospital shop store street city country town language languages name's`.split(/\s+/).filter((w) => !['boss', 'train', 'doctor', 'cousins', 'city'].includes(w));

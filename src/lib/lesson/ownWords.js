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

# 10 — Buyers and demand: who pays for an A1–B2 German course, what forces the purchase, and which buyer to lead with

**Date:** 2026-09-26 (sources read 2026-09-26/27) · **Wave:** course-v2 W1 research

## Method

- **Primary documents**, downloaded and parsed with `pypdf` rather than summarised:
  - [Bundestag Drs. 21/175](https://dserver.bundestag.de/btd/21/001/2100175.pdf) (15.05.2025), on Start Deutsch 1
    for spouses;
  - [Wissenschaft weltoffen kompakt 2026](https://www.wissenschaft-weltoffen.de/content/uploads/2026/05/wiwe_kompakt_2026_bf_DE.pdf);
  - the DAAD study [*Ankommen, studieren, bleiben*](https://static.daad.de/media/daad_de/infos-services-fuer-hochschulen/expertise-zu-themen-laendern-regionen/daad_studie_ankommen_studieren_bleiben.pdf).
- **Other sources:** about 20 pages read with WebFetch and about 35 WebSearch queries (German, English, Turkish).
  The pages include Destatis, Bundestag `hib`, Mediendienst Integration, embassies, state authorities and vendors.
- **Search volumes.** Per the 2026-09-27 override I made **no MCP calls**. Every volume comes from DataForSEO pulls
  made on 2026-09-27:
  - the orchestrator's pull in `inputs/db-snapshot-2026-09-27.md`, for Germany and India;
  - the sibling memos `02`, `03` and `08`, for Germany.

  Egypt, Nigeria, Pakistan and Turkey are unmeasured.
- **Blocked:** `www.goethe.de` (403); `gesetze-im-internet.de` (503 on the day); Reddit.
- **Derived** marks my arithmetic. The exchange rate is ₹109.43 = €1 on 2026-09-26
  ([exchangerates.org.uk](https://www.exchangerates.org.uk/EUR-INR-exchange-rate-history.html), snippet).

## 1. Findings in brief

1. **Every legally required certificate is a deadline.** A1 is required for the spouse visa, B1 for citizenship
   and settlement, and B2 for nursing recognition. **People search for the exam, not the course:**
   - India: "goethe a1 exam" is searched 21× as often as "german a1 course";
   - Germany: "b1 prüfung" is searched 31× as often as "deutschkurs b1 online" (derived, §3).
2. **The biggest failure pools are measurable:**
   - ~13,400 failed Goethe spouse A1 attempts in 2024;
   - ~143,500 DTZ takers in 2025 who did not reach B1.

   These buyers have a score, a gap and a retake date.
3. **India sits near the top of every segment:**
   - #2 in spouse visas in 2024;
   - #1 in Chancenkarte;
   - #1 in international students;
   - #1 among new Blue Card arrivals;
   - top 5 in recognitions.

   It reads English, and it produces the largest measured query: "goethe a1 exam", 27,100/month.
4. **Paid search in Germany cannot pay back at €40–65 per half-level.** CPC is €2.65–4.25; at an assumed 2 %
   conversion, CAC is €132–212 (derived).
5. **Our own funnel has not converted yet.** Source: `weekly_metrics` 2026-09-21, via the db-snapshot.
   - 1,656 users;
   - 2 course sales ever, both €0 orders;
   - AI speaking used 10 times and writing 0 times in 7 days.

   The grading moat is unproven with our own users.

## 2. Segments

| Segment | Size (latest) | Trigger → deadline | Exam / level | Our products | Willingness-to-pay anchor |
|---|---|---|---|---|---|
| **Spouse visa** | 35,720 Goethe SD1 spouse exams in 2024 (62 % passed); 60,724 spouse visas Jan–Nov 2025 | Marriage → visa appointment | Start Deutsch 1 / telc / ÖSD A1; not modular; pass at 60/100 | A1.1 free → A1.2 €40 | Goethe course + exam averages **€494** in the main origin countries |
| **Bleiben** (Einbürgerung, Niederlassung) | 332,500 naturalisations in 2025; 467,400 applications; ~319,000 DTZ takers | 5 years' residence → application | DTZ / telc / Goethe / ÖSD B1 | B1.1 + B1.2 = €120, with A2 as the bridge | Integrationskurs self-pay €1,603; exam €100–239 |
| **Health professions** | 32,000 nurse and 13,900 physician recognitions in 2025 | Job offer → B2 before the licence certificate | General B2; doctors also take the FSP | A2 → B1 → B2 = €130 per band | Often **€0** (Triple Win, employers) |
| **Students** | 402,083 international students; India 58,833 | (a) a German-taught degree; (b) English-track students heading for jobs | (a) DSH / TestDaF; (b) A2–B1, no exam | A1–B1 | University courses |
| **IT / Blue Card / Chancenkarte** | 42,600 Blue Cards in 2024; 11,497 Chancenkarte visas by mid-2025 | Career; B1 cuts permanent residence from 27 to 21 months | A1 or B1 | A1 → B1 | High income, soft deadline |
| **Ausbildung / au-pair** | not found | Contract → visa | B1 or A2 (Ausbildung); A1 (au-pair) | A1–B1 | Low |

### 2.1 Spouse visa (A1): the best-documented pain

**Volumes and pass rates.** The Goethe-Institut alone held Start Deutsch 1 exams "im Rahmen des
Ehegattennachzugs" in these numbers, with **89–90 % external candidates**
([Drs. 21/175](https://dserver.bundestag.de/btd/21/001/2100175.pdf), parsed tables):

| Year | Exams | Passed | Pass rate | Failed attempts (derived) |
|---|---|---|---|---|
| 2023 | 41,869 | 27,294 | 65 % | 14,575 |
| 2024 | 35,720 | 22,278 | 62 % | 13,442 |

telc and ÖSD are not counted, so the true pool is larger.

**A Goethe course made no visible difference.** Candidates registered through one passed at the same rate as
external candidates: 66 % in 2023, 62 % in 2024. Selection effects are possible.

**Other figures from the same document:**

- a Goethe course plus exam averages **€494** in the main origin countries;
- more than 10,000 spouses a year are refused the visa, at first, for failing (13,607 in 2022);
- pass rates were below 40 % in Turkey and Cameroon, and below 50 % in Nigeria, Bangladesh, Sri Lanka and others.

**Who (2024 visas, Anlage 1):**

| Origin | Visas | Origin | Visas |
|---|---|---|---|
| Turkey | 10,223 | Pakistan | 2,874 |
| India | 7,048 | Albania | 2,566 |
| Kosovo | 4,599 | Egypt | 1,399 |
| Iran | 3,539 | Morocco | 1,346 |

In 2025, through November, **44,426** visas went to spouses of foreign residents and **16,298** to spouses of Germans
([t-online, 21.12.2025](https://www.t-online.de/nachrichten/deutschland/innenpolitik/id_101054006/migration-mehr-als-100000-visa-zum-familiennachzug-erteilt.html)).
The top nationalities were Turkey, Syria and India (9,286).

**Exempt from A1** ([scheibler.de, 2021](https://www.scheibler.de/news/ehegattennachzug-sprachnachweis-ausnahmen/)):

- spouses of Blue Card, ICT and skilled-worker holders;
- nationals of privileged countries;
- refugees;
- hardship cases.

So the IT segment's partners do **not** need A1.

**Deadline.**

- In India, Goethe slots open 6–8 weeks ahead and "fill up within hours"
  ([bookgermantest](https://bookgermantest.com/providers/goethe), snippet).
- A1 is not modular, so a fail means paying the full fee again.

**Willingness to pay (India).**

| Item | Price | Source |
|---|---|---|
| External exam fee | ₹9,400 ≈ €86 | [tijusacademy, 24.07.2026](https://tijusacademy.com/blogs/german/goethe-exam-fees-india-2026-costs-explained/) |
| Live online A1 class | from ₹7,500 ≈ €69 | [eecglobal](https://eecglobal.com/blog/german-language-course-online-india-2026), snippet |
| Our A1.2 | €40 ≈ ₹4,380, i.e. 47 % of one exam fee | derived |

**Turkey.** Local schools sell online "Aile Birleşimi" courses, some promising "garantili sonuç"
([example](https://umaydilakademisi.com/courses/online-almanca-a1-ve-aile-birlesimi-kursu/), snippet). We cannot make
that promise.

### 2.2 Bleiben (B1): the largest market inside Germany

**Naturalisation** ([Destatis PD26_186, 03.06.2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_186_125.html)):

- **332,500** people naturalised in 2025, up 14 %;
- **467,400** applications filed;
- 72 % after 5 years' residence;
- the three-year fast track was abolished in October 2025.

B1 is the legal requirement (`02-exams-b1.md` §5).

**DTZ 2025:** about **319,000** takers ([Mediendienst Integration](https://mediendienst-integration.de/bildung/sprache/erfolgsquote-bei-integrationskursen/),
citing BAMF 2026):

- 55 % reached B1;
- 32.2 % reached A2;
- 12.8 % reached neither.

That leaves **≈143,500 people a year without B1** (derived).

**The state channel narrowed:**

- **The 300-UE repeat** is now limited to special course types
  ([Mediendienst](https://mediendienst-integration.de/artikel/wie-geht-es-mit-den-integrationskursen-weiter.html), snippet).
- **9 Feb 2026:** BAMF stopped voluntary admissions, affecting ~130,000 people. Self-payers were still admitted
  ([migrando](https://migrando.de/en/news/integration/integrationskurs-2026-keine-freiwillige-teilnahme/);
  [taz](https://taz.de/Bundesamt-blockiert-Zulassung/!6153153/)).
- **From 1 June 2026:** places reopened within a contingent, but only for Ukrainians and EU citizens
  ([migazin, 12.05.2026](https://www.migazin.de/2026/05/12/weniger-integrationskurse-werden-gestrichen/), snippet).
- **Self-pay** costs €2.29/UE, i.e. €1,603, with 50 % back on passing
  ([amtsdeutschland, 27.08.2026](https://amtsdeutschland.de/bamf/integrationskurs/)).

**Deadline.** The applicant chooses when to apply, so the deadline is softer than a visa. Exam waits are 3–8 weeks
and fees €100–200 ([einbuergerungsservice](https://einbuergerungsservice.de/ratgeber/b1-zertifikat-ohne-pruefung),
snippet). **A failed DTZ is the sharpest trigger**, because the score report names the missing part.

### 2.3 Health professions (B1–B2): forced by law, often subsidised

**Recognitions in 2025** ([Destatis PD26_295, 19.08.2026](https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_295_212.html)):

- 32,000 nurses and 13,900 physicians, out of 86,600 positive decisions;
- by origin: Turkey 9,800, Ukraine 8,300, Syria 6,100, India 5,400, Tunisia 5,400.

**Language requirements:**

- **Nurses** need B2 by the time the certificate is issued. In Bavaria "derzeit ist keine gesonderte
  Fachsprachenprüfung nötig" ([LfP Bayern](https://www.lfp.bayern.de/faq-items/welche-deutschkenntnisse-muss-ich-nachweisen/)).
- **Anerkennungspartnerschaft:** entry with A2 under §16d Abs. 3
  ([Make it in Germany](https://www.make-it-in-germany.com/de/visum-aufenthalt/arten/visum-anerkennungspartnerschaft), snippet).
- **Doctors:** B2, then a Fachsprachprüfung costing €390–600 (Ärztekammer snippets).

**The objection is a price of zero.** Triple Win organises training "up to B1 level in your home country … entirely
free for nurses", and puts zero-to-B2 at 10–14 months
([globalnurseguide, 08.06.2026](https://globalnurseguide.com/nursing-in-germany-2026/)). Doctors' Fachsprache is
already the owner's MedMeister product (CLAUDE.md), so our course should end at general B2 and hand them over.

### 2.4 Students: two different buyers

**(a) German-taught degree.** Admission needs DSH-2 or TestDaF TDN 4; no B2 certificate qualifies
(`03-exams-b2.md` §5). B2 serves only as a bridge to the Studienkolleg.

**(b) English-taught degree: the better fit.** There were 402,083 international students, with India at 58,833
(+20 %) ([WiWe 2026](https://www.wissenschaft-weltoffen.de/content/uploads/2026/05/wiwe_kompakt_2026_bf_DE.pdf)).
The DAAD study (§6.4) adds:

- 80 % of Asia-Pacific students choose English programmes;
- **58 % of English-track students start at A1/A2**, and 44 % are still there when surveyed;
- 61 % of Master's students start at A1/A2.

Only a third feel ready for the German job market
([thepienews, 12.08.2025](https://thepienews.com/career-support-key-as-most-intl-students-plan-to-stay-in-germany/)).
This buyer needs A2→B1 for jobs, not an admission exam.

### 2.5 IT, Blue Card, Chancenkarte, Ausbildung, au-pair, Austria, Switzerland

**Blue Card** ([Mediendienst, 05.03.2026](https://mediendienst-integration.de/arbeitsmarkt/auslaendische-arbeitskraefte/eu-aufenthalt-fuer-hochqualifizierte-die-blaue-karte/)):

- 42,600 issued in 2024; 131,500 holders;
- India ~20 % of new arrivals;
- no German required, but B1 cuts permanent residence to 21 months (`02` §5).

**Chancenkarte.** 11,497 visas were issued by 15.06.2025
([hib, Drs. 21/692](https://www.bundestag.de/presse/hib/kurzmeldungen-1098734)). India leads with 4,600+ cases
([DeZIM via Evangelische Zeitung](https://evangelische-zeitung.de/gut-10-000-visa-im-ersten-jahr-chancenkarte-ziel-lag-bei-30-000)).
The requirement is A1 German or B2 English.

**Ausbildung visa.** B1 for qualified training, A2 for other training
([AA Algier](https://algier.diplo.de/dz-de/service/05-visaeinreise/2431034-2431034), snippet). Trainee visas rose
"by two thirds", with no absolute figure published
([bildungsklick](https://bildungsklick.de/internationales/detail/zahlen-auslaendischer-fachkraefte-studierender-und-auszubildender-steigen)).

**Au-pair.** A1 ([AA Pristina](https://pristina.diplo.de/xk-de/service/visa-einreise/au-pair-2314842), snippet).

**Austria** ([workinaustria](https://www.workinaustria.com/leben-arbeiten/deutschkenntnisse)):

- A1 before entry for family members;
- Modul 1 = A2 and Modul 2 = B1;
- only ÖIF, ÖSD, telc and Goethe certificates count.

**Switzerland.** Naturalisation needs A2 written and B1 oral
([Kanton Bern](https://www.einbuergerung.sid.be.ch/de/start/einbuergerung/ordentliche-einbuergerung/sprachnachweis.html)).

The same ladder serves all three countries; only the exam wrapper differs.

## 3. Search demand (DataForSEO, 12-month average monthly searches, measured 2026-09-27)

**Sources:** S = db-snapshot; 02 / 03 / 08 = sibling memos. DE rows are Germany/German.

| Keyword | Mkt | Vol. | Src | Keyword | Mkt | Vol. | Src |
|---|---|---|---|---|---|---|---|
| goethe a1 exam | IN | **27,100** (Jul 2026 peak 40,500) | S | b1 prüfung | DE | **12,100** | 02 |
| german language course | IN | 27,100 | S | telc b1 prüfung | DE | 12,100 | 02 |
| learn german online | IN | 3,600 | S | telc b2 prüfung | DE | 8,100 | 03 |
| german course online | IN | 3,600 | S | deutsch b2 kurs | DE | 4,400 | 03 |
| goethe b1 exam | IN | 1,900 | S | dtz | DE | 4,400 | 02 |
| goethe b2 exam | IN | 1,600 | S | testdaf | DE | 3,600 | 03 |
| german a1 course | IN | 1,300 | S | dtz prüfung | DE | 2,900 | 02 |
| german b1 course | IN | 390 | S | deutschkurs online | DE | 2,400 (CPC €4.25) | S |
| german a2 / b2 course | IN | 320 / 320 | S | online deutschkurs | DE | 2,400 | S |
| vhs lernportal | DE | 27,100 | 08 | b2 prüfung | DE | 2,400 | 03 |
| deutsch lernen a1 | DE | 1,600 | S | goethe b1 prüfung | DE | 1,900 | 02 |
| deutsch lernen online | DE | 1,300 | S | b1 brief schreiben | DE | 1,900 | 02 |
| deutsch lernen b1 | DE | 1,300 | S | telc b1 modelltest | DE | 1,600 | 02 |
| a1 prüfung | DE | 1,000 | 08 | dsh prüfung | DE | 1,300 | 03 |
| goethe a1 | DE | 720 | 08 | deutschkurs b2 online | DE | 1,000 (Sep peak 2,400) | S |
| b1 prüfung vorbereitung | DE | 590 | 08 | deutsch test für den beruf b2 | DE | 880 | 03 |
| telc b1 übungstest | DE | 590 | 08 | integrationskurs online | DE | 590 | 08 |
| deutschkurs a1 online | DE | 210 | S | deutschkurs b1 online | DE | 390 | S |
| deutschkurs a2 online | DE | 210 | S | goethe a1 vorbereitung | DE | **10** | S |

**How to read it** (ratios derived):

1. **Exam beats course everywhere.** A1 exam demand sits abroad: "goethe a1 vorbereitung" gets 10/month in
   Germany.
2. **Germany's centre of gravity is B1, then B2.** B2 carries the strongest course-worded German queries.
3. **"vhs lernportal" (27,100) out-searches Lingoda (14,800, per 08).** The free public course is a bigger brand
   than most paid ones.
4. **Paid search cannot pay for itself.** At CPC €2.65–4.25 and an assumed 2 % conversion, CAC is €132–212. That
   is above a B1 pair (€120) or a B2 pair (€130). Only organic, exam-worded pages and communities fit these prices.
5. **The trend is unclear.** "b1 prüfung" fell from 14,800 (Sep 2025) to 6,600 (Aug 2026) (08). Seasonality and
   the BAMF stop cannot be separated.

## 4. Objections, with evidence

| Objection | Evidence | What the course must answer |
|---|---|---|
| "Is your certificate accepted?" | Embassies accept only Goethe, telc, ÖSD, TestDaF and ECL ([AA Havanna](https://havanna.diplo.de/cu-de/service/05-VisaEinreise/-/2097582)) | State that ours is not accepted; the course prepares for **their** exam |
| "It's free elsewhere" | vhs-Lernportal, Nicos Weg, Triple Win, university courses | Free options teach, but nobody free scores exam output (`08` §4) |
| "I need someone to correct me" | Spouses rated preparing abroad a "starke oder sehr starke Belastung", worst for those with no course available (BAMF study, cited in Drs. 21/175) | Instant, criteria-named scoring, as an automated tool; never promise human feedback (FernUSG) |
| "A course didn't help" | Goethe-course candidates passed at the same 62 % as external candidates in 2024 | Measure exam readiness, not lesson completion |
| "Subscriptions trap you" | Billing is the top complaint outside teaching (`08` §4.5) | One-time, lifetime, per half-level: already our model |
| "English is hard for me" | The largest spouse origins (Turkey, Kosovo, Albania) are not English-reading markets (inference) | Plain English at ≤B1; explanations stored separately so an L1 layer can be added |

## 5. Where they search and gather

- **Google, by exam name (§3).** Indian results are dominated by coaching-institute fee guides: EEC, Plan Beta,
  Tijus, DeutschExam.
- **Official pages.** Embassy *Merkblätter*, and Make it in Germany, whose Chancenkarte pages were among its five
  most visited in 2025 (government answer, snippet).
- **YouTube** (snippets, [langtrak](https://www.langtrak.com/blog/best-youtube-channels-for-learning-german)):
  Hallo Deutschschule ~1.35M, Anja ~1.28M, lingoni ~857K, Deutsch mit Marija ~352K.
- **Telegram:** small, exam-specific groups:
  - DTZ-B1 group, 2,434 members ([t.me](https://t.me/DeutschTestB1));
  - "DEUTSCH LERNEN", 6,991 ([tgstat](https://tgstat.com/channel/@DEUTCHLERNENA1A2B1)).
- **Intermediaries:** nurse recruiters, university language centres and Integrationskurs providers.

## 6. What still holds from the 2026-09-03 market and pricing memos

**Holds, re-verified at source:**

- the spouse SD1 figures (41,869 at 65 %; 35,720 at 62 %; ~90 % external);
- the €494 anchor;
- the <40 % pass rates in Turkey and Cameroon;
- the ~55 % DTZ B1 rate;
- the ~130,000 people hit by the February stop.

**Two theses hold:**

- **Market memo:** sell "your exam date, your plan, and a score on every attempt", not video hours or loose mocks.
  §3 strengthens this.
- **Pricing memo:** a paid level is credible only with a graded mock. This now applies to the **closing half** of
  each band: A1.2, A2.2, B1.2 and B2.2.

**Changed:**

1. **The price structure changed.** €49 per band plus a €129 bundle became per-half-level prices of
   €40/50/50/60/60/65/65, with A1.1 free (2026-09-08, `pricing.js`). The "€79 A2+B1 pair" is retired, but its
   insight survives: B1 buyers need A2 as well.
2. **Naturalisation hit a record.** There were 332,500 naturalisations in 2025, and the C1 fast track is gone.
3. **The integration-course stop was partly reversed** from 1 June 2026.
4. **Competitor prices moved.** Goethe DOI is now €729 (`08`), and the €149 Goethe DTO promo ran only to
   30.08.2026. Re-check both before quoting.

**Does not hold:** "not German SEO" (market memo). That is right for A1 and wrong for B1/B2. Of the countries that
memo named, only India reads our English UI without friction (inference; `docs/language-strategy.md`).

## 7. Positioning options and the lead segment

| Option | Promise | For | Against |
|---|---|---|---|
| **A. Visa-A1 from abroad** | "Your Start Deutsch 1 date, your plan, every speaking and writing task scored" | Hardest deadline; 35–38 % fail; ~90 % prepare without Goethe; free A1.1 sits right before paid A1.2; India volume | €40 ticket; ₹7,500 live classes; AI mock apps; Turkey (the largest origin) is non-English |
| **B. B1 zum Bleiben** | "telc/DTZ/Goethe B1 for Einbürgerung and Niederlassung, scored like the exam" | Largest German demand; €120; ~143,500 non-B1 DTZ takers a year; state channel narrowed | Free vhs-Lernportal; a German-language market meets our English-first UI; B1 not buyable today |
| **C. B2 für den Beruf** | "General B2 for recognition, heavy on work situations" | Legally forced; €130; grading matters most here | Often subsidised to €0; 10–14-month runway; thinnest B2 content (~250 words per half-level) |
| **D. German for your career** | A1→B1 for English-track students, IT and Chancenkarte | High income; India #1 in all three | No legal deadline, so the weakest trigger to buy now |

**Lead with A:** the spouse-visa A1 candidate, reached first through India's English-language market. It is the
only segment where:

- a free level (A1.1) sits directly before the paid level (A1.2) that completes a required exam;
- the deadline is external and dated;
- the same person later needs A2/B1 in Germany, so the ladder per learner is €40 → €100 → €120 (derived).

India also feeds C and D through the same A1 query.

**The other options:**

- **B** is the revenue core, built second, with **German** landing pages (the existing `/pruefung/` family).
- **C** is a channel, not a lead: seats sold to recruiters and schools, which is an owner decision. Doctors go to
  MedMeister after B2.

**Unifying positioning:** *the course that ends in the certificate your visa, permit or licence requires — and scores
every spoken and written exam task instantly, as an automated tool.*

## Implications for the course blueprint

1. **Every closing half-level names its exam and ships at least one full timed mock**, scored on that exam's pass
   rule:
   - A1.2: Start Deutsch 1 / telc / ÖSD A1;
   - A2.2: Goethe / telc A2 plus the DTZ A2 band;
   - B1.2: telc B1 / DTZ / Goethe-ÖSD B1;
   - B2.2: telc B2 / Goethe B2.

   Opening halves (A2.1, B1.1, B2.1) say honestly that they do not reach the exam alone.
2. **Onboarding asks for purpose and exam date.** Purposes: spouse visa, Einbürgerung/Niederlassung, recognition,
   study, job/Chancenkarte, au-pair/Ausbildung. Store the segment beside `dm_attribution`, so that
   `weekly_truth_metrics()` can report sales by segment.
3. **Free A1.1 ends in an A1 diagnostic.** It is scored on the 60/100 rule and yields a dated plan to the exam date,
   making A1.2 the obvious next step. A1.1 is option A's acquisition product.
4. **A retake path at A1.2 and B1.2.** The learner enters their official per-part score and gets a 4-week plan
   weighted to the weak parts. This serves ~13,400 spouse fails and ~143,500 non-B1 DTZ takers a year.
5. **Themes by segment:**
   - A1: arrival and family life (Anmeldung, Arzt, Termine);
   - A2: work entry and Anerkennungspartnerschaft (Behörden, Wohnung, Arbeitsplatz);
   - B1: civic life and job applications;
   - B2: work communication, including at least two care/health workplace Lektionen at general-language level.

   Never claim Fachsprachprüfung preparation.
6. **Explanations in plain English at no more than B1**, stored apart from the German content, so that a Turkish or
   Arabic layer can be added later without re-authoring.
7. **Mobile-first and low-bandwidth:**
   - compressed audio;
   - no autoplay video;
   - tasks that survive a dropped connection.

   The lead market is India, then Pakistan, Egypt and Nigeria.
8. **Copy anchors against the exam, not against apps.** Use the exam fee (A1 ₹9,400; €155 in Germany per the
   2026-09-03 pricing memo; B1 €100–239) and the €494 Goethe route, all derived in `marketing.js`. Never write:
   - a pass promise (the "garantili sonuç" trap under §5 UWG);
   - "certificate accepted";
   - "human feedback".
9. **An exam-worded landing page for every closing half**, in the exam's search language:
   - English for India A1 ("Goethe A1 exam preparation course");
   - German for B1/B2 ("telc B1 Vorbereitung online").

   Course-worded pages alone miss about 95 % of demand (derived, §3).
10. **Treat AI grading as unproven with our users.** Put a scored speaking task in the **first session** of every
    half-level, and track weekly usage (baseline: 10 speaking, 0 writing uses in 7 days).

## Open questions

1. **Keywords the orchestrator should still measure:**

   | Market | Keywords |
   |---|---|
   | TR/tr | "a1 almanca sınavı", "aile birleşimi almanca", "goethe a1 sınavı" |
   | EG, PK, NG | "goethe a1 exam", "german course online" |
   | DE | "telc b1 übungen", "einbürgerung b1 kurs", "deutsch für pflegekräfte" |
   | IN | "german for nurses" |
2. **What does "goethe a1 exam" cost per click in India?** Break-even at a 2 % conversion is €0.80 (derived). The
   snapshot has no Indian CPC.
3. **Owner:** will there be a Turkish or Arabic explanation layer? Without one, option A cannot reach its largest
   origin.
4. **Owner:** sell B2 seats B2B to nurse recruiters and schools?
5. **Where do our 1,656 users come from?** Answer with attribution since 2026-09-20 plus PostHog geo.
6. **Offer per-band pairs at checkout?** The bundle has been parked since 2026-09-08.

## Unverified

- YouTube counts, Goethe India course prices, and "slots fill within hours": vendor or search snippets only.
- Turkish A1 fees (3,500–5,500 TL): from a page marked "2024 Rehberi".
- The Goethe Istanbul course price: not found.
- The A1 exemption list: from a 2021 law-firm page, because §30 AufenthG returned 503.
- The May 2026 integration-course compromise: from snippets, not the circular itself.
- Absolute counts for Ausbildung visas and au-pairs, and Austrian/Swiss exam volumes: not found.
- The 2 % conversion rate: an assumption.
- That non-English markets struggle with our English UI: an inference.

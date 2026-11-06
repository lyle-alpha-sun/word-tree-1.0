# Third-party notices / 第三方资料声明

Original program code is MIT-licensed. Third-party datasets retain their own licenses; the root LICENSE does not relicense their content.

## ECDICT / wordroot — MIT

Definitions, IPA, morphology and word-root records derive from [skywind3000/ECDICT](https://github.com/skywind3000/ECDICT). See `licenses/ECDICT-MIT.txt` for the upstream copyright and permission notice. Entries have been selected, normalized and partly corrected.

## Open English WordNet / Princeton WordNet

Selected lexical derivation/pertainym relations and noun forms derive from [Open English WordNet 2025](https://github.com/globalwordnet/english-wordnet). Attribution: **The Open English WordNet Team** and **Princeton University WordNet**. OEWN is further developed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); original Princeton WordNet notices continue to apply. See `licenses/OEWN-LICENSE.md` and `licenses/WordNet-NOTICE.txt`.

Selected relations have been converted to connected study pages and display orientations. They are lexical associations, not additional claims of shared historical roots. No endorsement by Princeton University or the OEWN team is implied.

## Wiktionary — CC BY-SA 4.0

Etymological records derive from English Wiktionary entries and their contributors. Each source page follows `https://en.wiktionary.org/wiki/{word}#English`; page histories identify contributors. Source links are retained in the UI. See [Wiktionary copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights).

Chains, glosses and textual fragments have been extracted, structured and partly translated. This adapted etymology dataset remains [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), with attribution, modification notices and share-alike obligations. See `licenses/CC-BY-SA-4.0.txt`.

## Tatoeba — CC BY 2.0 FR

Imported bilingual sentences derive from [Tatoeba](https://tatoeba.org/) and its sentence contributors, under the CC BY 2.0 France terms described in the official Tatoeba documentation. Each record preserves the source URL, English sentence ID and Chinese translation ID. Sentence/contributor pages are available at `https://tatoeba.org/en/sentences/show/{sentenceId}`. Retain these identifiers and links on redistribution.

Some Chinese translations have been revised, with revision flags retained. Self-authored examples are explicitly marked. See `licenses/CC-BY-2.0-FR.txt` and the official https://creativecommons.org/licenses/by/2.0/fr/ license URI.

## NGSL 1.2 and supplement — CC BY-SA 4.0

The New General Service List by **Charles Browne, Brent Culligan and Joseph Phillips** is [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Official source: [New General Service List Project](https://www.newgeneralservicelist.com/new-general-service-list). Original lists are included in `data-sources/ngsl/`, with source hashes in the generated comparison.

The app matches its targets and explicit dictionary lemmas to these lists. The adapted `ielts-frequency.json` comparison is shared under CC BY-SA 4.0. This is general-English frequency guidance, not an official IELTS frequency ranking, affiliation or endorsement.

## Project content and distribution

The illustrative families in `src/data/words.ts`, marked self-authored examples, interface code and topic organization are project contributions. Third-party material is not relabeled as original. This public package excludes AWL lists and matching annotations, old CatVar groups and POS metadata, private development notes, personal progress and credentials.

## Code dependencies

React / React DOM, React Flow, dagre and Vite are MIT; TypeScript is Apache-2.0. Transitive dependencies retain their notices. Built Mac packages include dependency license copies in `Contents/Resources/dependency-licenses/` and dataset license copies in `Contents/Resources/data-licenses/`. Source installations retain dependency notices in `node_modules`.

Tatoeba attribution guidance: https://en.wiki.tatoeba.org/articles/show/faq and https://en.wiki.tatoeba.org/articles/show/terms-of-use-v1 . Authors may be credited through the retained sentence-page URLs. No Tatoeba audio is bundled.

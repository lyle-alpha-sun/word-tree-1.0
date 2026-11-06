# Word Tree 1.0 · 单词树1.0

**Learn connected English vocabulary through interactive word-family trees.**

An open-source English vocabulary learning app for Chinese-speaking learners, with an offline macOS desktop build and a React web interface. Explore word roots, derived words, inflections and etymology without relying on isolated flashcards or paid APIs.

[中文介绍](README.md) · [Download macOS app](../../releases/latest) · [Data and licenses](THIRD_PARTY_NOTICES.md) · [Report an issue](../../issues)

![Word Tree native macOS window](docs/macos-app.jpg)

## Features

- **Interactive vocabulary mind map:** inspect a node, double-click to make it the new center, and expand or collapse branches. Curved edges distinguish derivation, grammatical inflection and other sourced lexical relationships.
- **Word roots and word families:** display available roots on the left and related branches on the right. Forms such as past tense, participles and plurals are connected to the appropriate lemma.
- **Synchronized navigation:** collapsible topic/family directory, English lookup, Chinese glossary filtering, selected-word highlighting and automatic scrolling.
- **18 topics:** find vocabulary about nature, science, society, business, economics, technology, culture and more. Topic lists are navigation aids; unrelated words are not padded into a fake word family.
- **High-frequency-first filter:** compare the included targets with NGSL 1.2 and its official supplement. Public 1.0 has 1,837 prioritized targets. This is general-English frequency guidance within the included IELTS-tagged vocabulary, not an official IELTS test-frequency ranking.
- **Learning context:** Chinese definitions, available IPA/POS, system speech, bilingual examples, collocations, lexical-history cards and source links.
- **Local progress:** favorites, mastery flags and JSON import/export. No account, cloud sync, telemetry SDK or paid API is required.
- **Native macOS window:** Swift + AppKit + system WebKit, its own Dock icon, bundled offline resources, native save/open panels and Command-F search. No Electron or embedded Node runtime.

## Included data

5,030 target words; 15,710 extensions/forms; 20,740 entries in total; 15,527 recorded relationships; 18 topics; 1,913 available etymology records. Each word has a connected local neighborhood. Isolated words receive a focused single-word view.

Data quality varies. A WordNet relation does not establish a shared historical root, and etymology is not available for every word. 1.0 does not yet include spaced repetition, automatic review scheduling, native mobile clients or official exam coverage guarantees.

## Run the web app

```bash
git clone https://github.com/lyle-alpha-sun/word-tree-1.0.git
cd word-tree-1.0
npm ci
npm run dev
```

Use Node.js 24 LTS (minimum 20.19 or 22.12+) and open `http://127.0.0.1:5178/`. The curated dataset is included in `public/data`; there is no API key or private developer directory to configure.

```bash
npm run check:data
npm run build
npm run preview
```

## macOS desktop

Download `WordTree-1.0-macOS-arm64.zip` from [Releases](../../releases/latest), unzip and move `单词树.app` into Applications. The package targets Apple Silicon. Its deployment target is macOS 13, with actual testing on macOS 26.6.2. Other versions have not been tested. This build is locally signed and has not been notarized with an Apple Developer ID; building from source is also available.

```bash
npm ci
npm run build:mac
```

Requires an Apple Silicon Mac, Xcode Command Line Tools and Python 3. Output: `release/单词树.app`. The core app and bundled data work offline; source websites need internet and offline speech needs an installed English system voice.

Browser and desktop progress stores are separate. Export progress in one version and import the JSON into the other to migrate favorites and mastery flags.

## Licensing and contributions

Original application code is MIT-licensed. ECDICT, Open English WordNet/Princeton WordNet, Wiktionary, Tatoeba and NGSL retain their own licenses and attribution requirements. The repository's MIT license does **not** relicense third-party data. AWL lists and matching annotations are not included in this public distribution.

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [data documentation](docs/DATA.md) and [CONTRIBUTING.md](CONTRIBUTING.md). Corrections to definitions, pronunciation, word relationships and topic classification are welcome, especially with verifiable sources.

Search terms: vocabulary learning, word family tree, word roots, derivational morphology, inflection, etymology visualization, vocabulary mind map, IELTS vocabulary, offline English learning, macOS flashcards alternative, React Flow, Chinese-English dictionary.

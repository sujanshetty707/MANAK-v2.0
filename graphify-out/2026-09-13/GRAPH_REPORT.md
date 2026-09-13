# Graph Report - MANAK  (2026-09-13)

## Corpus Check
- 101 files · ~71,927 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 505 nodes · 880 edges · 49 communities (31 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dea0e0f2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Officer Flow
- AppContext.tsx
- types/index.ts
- package.json
- README.md
- What You Must Do When Invoked
- compilerOptions
- graphify reference: extra exports and benchmark
- Ponytail
- Ponytail
- Ponytail Help
- compilerOptions
- MANAK — Project Guidelines & Skills
- graphify reference: query, path, explain
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native AGENTS.md integration
- graphify reference: incremental update and cluster-only
- ponytail-debt/SKILL.md
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- rules/graphify.md
- ponytail.md
- extraction-spec.md
- workflows/graphify.md
- manifest.json
- ExampleInstrumentedTest.java
- api.ts
- gradlew
- MainActivity.java
- dependencies
- scripts
- MANAK — API Keys & Backend Environment Setup Guide
- labelParser.ts
- Product Requirements Document (PRD)
- downloadImage
- fetchImageAsBase64

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 50 edges
2. `react` - 28 edges
3. `lucide-react` - 26 edges
4. `parseLabelText()` - 24 edges
5. `Header()` - 18 edges
6. `compilerOptions` - 16 edges
7. `AppProvider()` - 15 edges
8. `ExtractionResult` - 13 edges
9. `dotenv` - 12 edges
10. `extractLabelFromImage()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `testBackendExtract()` --calls--> `extractLabelFromImage()`  [EXTRACTED]
  scratch/test_backend_extract.mjs → server/services/ocrService.ts
- `testBackendExtract()` --calls--> `extractLabelFromImage()`  [EXTRACTED]
  scratch/test_backend_extract.ts → server/services/ocrService.ts
- `GoogleVisionOcrResult` --references--> `ExtractionResult`  [EXTRACTED]
  server/services/googleVisionOcr.ts → src/types/index.ts
- `Officer Flow` ----> `E-Commerce DOM Adapters`  [EXTRACTED]
  manak-app-flow.md → MANAK-Technical-Architecture.md
- `Officer Flow` ----> `Report & Digital Signature`  [EXTRACTED]
  manak-app-flow.md → MANAK-Technical-Architecture.md

## Import Cycles
- None detected.

## Communities (49 total, 8 thin omitted)

### Community 0 - "Officer Flow"
Cohesion: 0.24
Nodes (12): Consumer Flow, Deterministic Rule Engine, E-Commerce DOM Adapters, OCR & Extraction Pipeline, Inspection & Violation Repository, Packaged Commodities Rules 2011, MANAK Compliance System, Officer Flow (+4 more)

### Community 1 - "AppContext.tsx"
Cohesion: 0.13
Nodes (37): @capacitor/camera, @capacitor/core, lucide-react, react, App(), BottomNav(), DeviceFrame(), Header() (+29 more)

### Community 2 - "types/index.ts"
Cohesion: 0.12
Nodes (23): jspdf, AppContextType, MOCK_CONSUMER_REPORTS, MOCK_HISTORY, REPEAT_VIOLATOR_HEATMAP, SAMPLE_PRODUCTS, COMPLIANCE_RULES, RULE_32_PENALTY_RATE (+15 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (38): config, devDependencies, autoprefixer, concurrently, postcss, tailwindcss, tsx, @types/react (+30 more)

### Community 4 - "README.md"
Cohesion: 0.05
Nodes (36): 1. `server/services/googleVisionOcr.ts`, 1. System Architecture Overview, 2. 4-Step Technical Workflow, 2. `src/services/labelParser.ts`, 3. Module Responsibilities, 3. `src/components/screens/ExtractedTextReviewScreen.tsx`, 4. `src/services/ruleEngine.ts`, 5. `src/services/pdfReportGenerator.ts` (+28 more)

### Community 5 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native AGENTS.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 6 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 7 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 8 - "Ponytail"
Cohesion: 0.22
Nodes (8): Boundaries, Intensity, Output, Persistence, Ponytail, Rules, The ladder, When NOT to be lazy

### Community 9 - "Ponytail"
Cohesion: 0.22
Nodes (8): Boundaries, Intensity, Output, Persistence, Ponytail, Rules, The ladder, When NOT to be lazy

### Community 10 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 11 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

### Community 12 - "MANAK — Project Guidelines & Skills"
Cohesion: 0.33
Nodes (5): Graphify — Codebase Context & Knowledge Graph, Key Rules:, MANAK — Project Guidelines & Skills, Ponytail — Lazy Senior Dev Mode, Rules:

### Community 13 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 14 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Hunt, Output, Tags

### Community 15 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 16 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): Boundaries, Examples, Format, Scoring

### Community 17 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 18 - "graphify reference: commit hook and native AGENTS.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native AGENTS.md integration, graphify reference: commit hook and native AGENTS.md integration

### Community 19 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

### Community 20 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 29 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, categories, description, display, icons, name, orientation, short_name (+2 more)

### Community 30 - "ExampleInstrumentedTest.java"
Cohesion: 0.33
Nodes (5): ExampleInstrumentedTest, ExampleUnitTest, androidx.test.ext.junit.runners.AndroidJUnit4, org.junit.runner.RunWith, org.junit.Test

### Community 31 - "api.ts"
Cohesion: 0.17
Nodes (22): AppProvider(), askComplianceChatApi(), buildLocalScanRecord(), evaluateComplianceApi(), fetchConsumerReportsApi(), fetchHistoryApi(), getLocalChatAnswer(), loginApi() (+14 more)

### Community 32 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 33 - "MainActivity.java"
Cohesion: 0.47
Nodes (4): MainActivity, android.os.Bundle, com.getcapacitor.BridgeActivity, Override

### Community 40 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @capacitor/android, @capacitor/camera, @capacitor/cli, @capacitor/core, clsx, cors, dotenv (+12 more)

### Community 41 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, adb:reverse, build, cap:add, cap:live, cap:open, cap:sync, dev (+3 more)

### Community 42 - "MANAK — API Keys & Backend Environment Setup Guide"
Cohesion: 0.22
Nodes (8): 1. Summary of Required Credentials, 2. Step-by-Step Instructions to Obtain Each Key, 3. Database & Storage Initialization Checklist, 4. Verification, A. Supabase Credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), B. Google Gemini API Key (`GEMINI_API_KEY`), C. Digital Signature Token (`DOCUMENSO_API_KEY`), MANAK — API Keys & Backend Environment Setup Guide

### Community 43 - "labelParser.ts"
Cohesion: 0.08
Nodes (36): cors, dotenv, express, run(), testModel(), testBackendExtract(), testBackendExtract(), downloadImage() (+28 more)

### Community 44 - "Product Requirements Document (PRD)"
Cohesion: 0.18
Nodes (10): 1. Problem Statement, 2. Updated 4-Phase System Pipeline, 3. Core Functional Requirements, 4. Non-Functional Requirements, MANAK — Legal Metrology Compliance Checker App, Phase 1: Product Capture & Scan, Phase 2: Google Vision OCR & Product Categorization, Phase 3: Human Review & Verification Interface (`ExtractedTextReviewScreen`) (+2 more)

## Knowledge Gaps
- **231 isolated node(s):** `config`, `name`, `private`, `version`, `type` (+226 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 267 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `AppContext.tsx` to `package.json`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dotenv` connect `labelParser.ts` to `package.json`, `downloadImage`, `fetchImageAsBase64`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `config`, `name`, `private` to the rest of the system?**
  _231 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1258741258741259 - nodes in this community are weakly interconnected._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12183908045977011 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
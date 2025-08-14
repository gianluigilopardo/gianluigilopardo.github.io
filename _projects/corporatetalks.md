---
layout: page
title: Corporate Talks Dashboard
description: Multi-topic exposure trends from S&P 500 earnings call transcripts.
img: assets/img/corporate_talks.png
importance: 3
category: data
related_publications: false
---

The **Corporate Talks** dashboard tracks thematic discussion intensity (exposure %) across a curated set of topics in S&P 500 earnings call transcripts (2014Q1–present).

- All Topics view: Top 10 topics by average exposure.
- Detailed view: Per-topic trends with sector / industry / firm filtering.
- Optional expansion: Top 10 constituent companies within a selected sector or industry.

**Method:** Zero‑shot topic classification (BART-large-MNLI) applied to 22,000+ transcripts; exposure = topic paragraphs / total paragraphs (length‑normalised); percentages shown.

<div class="row justify-content-sm-center">
  <div class="col-sm-12 mt-3 mt-md-0">
    <a href="/corporatetalks/" target="_blank">
      {% include figure.liquid path="assets/img/corporate_talks.png" title="Corporate Talks dashboard" class="img-fluid rounded z-depth-1" %}
    </a>
  </div>
</div>
<div class="caption">Corporate Talks interactive dashboard (click to open).</div>

### Open dashboard

- Live dashboard: [Corporate Talks](/corporatetalks/)
- Working paper: <a href="https://www.ecb.europa.eu/pub/pdf/scpwps/ecb.wp3093~458d28b4bc.en.pdf" target="_blank">ECB WP 3093</a>

> Replace `assets/img/corporate_talks.png` with a screenshot (recommended width ~1200px).
---
layout: page
title: GenAI Talks Dashboard
description: Interactive dashboard tracking Generative AI discussion and sentiment in S&P 500 earnings calls.
img: assets/img/genai_talks.png
importance: 2
category: data
related_publications: false
---

The **GenAI Talks** dashboard provides quarterly Generative AI exposure and sentiment indicators extracted from 22,000+ S&P 500 earnings call transcripts (2014Q1–present).

- Exposure: Share (%) of transcript paragraphs classified as Generative AI.
- Sentiment: Distribution across Risk, Adoption, Opportunity.
- Filtering: Sector, industry, firm; top-10 highlighting.

**Method:** Zero‑shot topic detection (BART-large-MNLI) plus LLM sentiment classification of detected GenAI segments; exposure values length‑normalised.

<div class="row justify-content-sm-center">
  <div class="col-sm-12 mt-3 mt-md-0">
    <a href="/genaitalks/" target="_blank">
      {% include figure.liquid path="assets/img/genai_talks.png" title="GenAI Talks dashboard" class="img-fluid rounded z-depth-1" %}
    </a>
  </div>
</div>
<div class="caption">GenAI Talks interactive dashboard (click to open).</div>

### Open dashboard

- Live dashboard: [GenAI Talks](/genaitalks/)
- Working paper: <a href="https://www.ecb.europa.eu/pub/pdf/scpwps/ecb.wp3093~458d28b4bc.en.pdf" target="_blank">ECB WP 3093</a>


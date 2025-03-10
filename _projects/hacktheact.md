---
layout: page
title: Hack the Act! 
description: An AI chatbot designed to demystify the EU AI Act
img: assets/img/hacktheact_zoom.png
importance: 1
category: fun
related_publications: false
---


Hack the Act! is a Retrieval-Augmented Generation (RAG) chatbot designed to demystify the European Union AI Act through technical precision and user-friendly interaction.

### Technical implementation

This system leverages advanced AI components to provide accurate regulatory information:
- **Large Language Model (LLM)**: [Colosseum 355B](https://build.nvidia.com/igenius/colosseum_355b_instruct_16k) by [iGenius](https://www.igenius.ai/), specifically designed for regulated industries
- **Embeddings**: [NeMo Retriever Llama3.2](https://build.nvidia.com/nvidia/llama-3_2-nv-embedqa-1b-v2) embeddings for creating vector representations of document chunks

### Data sources
The knowledge base consists of official European Commission publications:
- [EU AI Act Regulation](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng) (13 June 2024)
- [Guidelines on Prohibited AI Practices](https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-prohibited-artificial-intelligence-ai-practices-defined-ai-act) (4 February 2025)

### Technical stack
- **[Langchain](https://www.langchain.com/)**: for RAG implementation and document processing pipeline
- **[Streamlit](https://streamlit.io/)**: web interface with session management

<div class="row justify-content-sm-center">
    <div class="col-sm-12 mt-3 mt-md-0">
        <a href="https://hacktheact.streamlit.app/" target="_blank">
            {% include figure.liquid path="assets/img/hacktheact.png" title="HacktheAct! 🤖 Streamlit interface" class="img-fluid rounded z-depth-1" %}
        </a>
    </div>
</div>
<div class="caption">
    HacktheAct! 🤖 Streamlit interface 
</div>

### Try it out!

- [Live Demo](https://hacktheact.streamlit.app/)
- [GitHub repository](https://github.com/gianluigilopardo/hacktheact)

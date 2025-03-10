// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about 🤌",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "publications",
          description: "publications by year in reversed chronological order.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "A growing collection of your cool projects (building). Meanwhile, explore more on my GitHub.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "cv",
          description: "This is a summary of my CV beyond projects and publications.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "news-my-phd-journey-begins",
          title: 'My PhD journey begins!',
          description: "",
          section: "News",},{id: "news-new-preprint-available-we-propose-a-new-method-for-the-explainability-of-composite-ai-systems",
          title: 'New preprint available: we propose a new method for the explainability of composite...',
          description: "",
          section: "News",},{id: "news-new-preprint-available-we-propose-a-new-method-for-the-explainability-of-composite-ai-systems",
          title: 'New preprint available: we propose a new method for the explainability of composite...',
          description: "",
          section: "News",},{id: "news-talk-at-the-sophia-summit",
          title: 'Talk at the SophIA Summit',
          description: "",
          section: "News",},{id: "news-i-attended-the-ai-amp-amp-companies-week",
          title: 'I attended the AI &amp;amp;amp; Companies Week',
          description: "",
          section: "News",},{id: "news-i-attended-the-ai-amp-amp-companies-week",
          title: 'I attended the AI &amp;amp;amp; Companies Week',
          description: "",
          section: "News",},{id: "news-i-attended-the-statlearn-spring-school",
          title: 'I attended the Statlearn spring-school',
          description: "",
          section: "News",},{id: "news-smace-got-accepted-ecml-my-first-conference-paper",
          title: 'SMACE got accepted @ECML, my first conference paper!',
          description: "",
          section: "News",},{id: "news-talk-at-the-2-nd-workshop-on-explainable-and-ethical-ai-icpr-2022-in-montreal",
          title: 'Talk at the 2-nd Workshop on Explainable and Ethical AI @ICPR 2022 in...',
          description: "",
          section: "News",},{id: "news-presenting-smace",
          title: 'Presenting SMACE',
          description: "",
          section: "News",},{id: "news-talk-at-the-1st-nice-workshop-on-interpretability",
          title: 'Talk at the 1st Nice Workshop on Interpretability',
          description: "",
          section: "News",},{id: "news-our-analysis-of-anchors-for-text-data-got-accepted-to-aistats-2023",
          title: 'Our analysis of Anchors for text data got accepted to AISTATS 2023',
          description: "",
          section: "News",},{id: "news-i-presented-smace-to-the-ai4media-network-in-florence",
          title: 'I presented SMACE to the AI4media network in Florence',
          description: "",
          section: "News",},{id: "news-i-have-been-in-valencia-for-aistats-2023-april-25-27",
          title: 'I have been in Valencia for AISTATS 2023 (April 25-27)',
          description: "",
          section: "News",},{id: "news-i-served-as-pc-member-to-the-kgml-workshop-ecml-2023",
          title: 'I served as PC member to the KGML workshop @ECML 2023',
          description: "",
          section: "News",},{id: "news-i-presented-my-work-at-journées-de-statistique-in-bruxelles-july-2-7",
          title: 'I presented my work at Journées de Statistique in Bruxelles (July 2-7)',
          description: "",
          section: "News",},{id: "news-new-preprint",
          title: 'New preprint',
          description: "",
          section: "News",},{id: "news-talk-to-the-maasai-seminar",
          title: 'Talk to the Maasai seminar',
          description: "",
          section: "News",},{id: "news-i-ve-been-at-the-2nd-nice-workshop-on-interpretability-november-30-december-1",
          title: 'I’ve been at the 2nd Nice Workshop on Interpretability (November 30-December 1)',
          description: "",
          section: "News",},{id: "news-new-preprint-we-investigate-the-relation-between-attention-based-and-post-hoc-explanations",
          title: 'New preprint! We investigate the relation between attention-based and post-hoc explanations',
          description: "",
          section: "News",},{id: "news-our-paper-attention-meets-post-hoc-interpretability-a-mathematical-perspective-got-accepted-at-icml-2024",
          title: 'Our paper Attention Meets Post-hoc Interpretability: A Mathematical Perspective got accepted at ICML...',
          description: "",
          section: "News",},{id: "news-visiting-the-julius-maximilians-universität-würzburg-june-2-15",
          title: 'Visiting the Julius-Maximilians-Universität Würzburg (June 2-15)',
          description: "",
          section: "News",},{id: "news-in-vienna-for-icml-2024-june-21-27",
          title: 'In Vienna for ICML 2024 (June 21-27)',
          description: "",
          section: "News",},{id: "news-i-started-working-for-the-international-policy-analysis-division-of-the-european-central-bank",
          title: 'I started working for the International Policy Analysis Division of the European Central...',
          description: "",
          section: "News",},{id: "news-i-successfully-defended-my-phd-thesis-on-the-foundations-of-machine-learning-interpretability",
          title: 'I successfully defended my PhD thesis on the Foundations of Machine Learning interpretability!...',
          description: "",
          section: "News",},{id: "news-talk-for-cognizant-s-ai-research-lab",
          title: 'Talk for Cognizant’s AI Research Lab',
          description: "",
          section: "News",},{id: "news-talk-at-the-ecb-machine-learning-community",
          title: 'Talk at the ECB Machine Learning community',
          description: "",
          section: "News",},{id: "news-talk-at-the-ecb-ai-in-economics-workshop",
          title: 'Talk at the ECB AI in Economics workshop',
          description: "",
          section: "News",},{id: "news-my-phd-thesis-on-the-foundations-of-machine-learning-interpretability-is-publicly-available",
          title: 'My PhD thesis on the Foundations of Machine Learning interpretability is publicly available!...',
          description: "",
          section: "News",},{id: "news-check-out-hack-the-act-a-rag-based-chatbot-designed-to-demystify-the-eu-ai-act",
          title: 'Check out Hack the Act!: a RAG-based chatbot designed to demystify the EU...',
          description: "",
          section: "News",},{id: "projects-hack-the-act",
          title: 'Hack the Act!',
          description: "An AI chatbot designed to demystify the EU AI Act",
          section: "Projects",handler: () => {
              window.location.href = "/projects/hacktheact/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%67%69%61%6E%6C%75%69%67%69%6C%6F%70%61%72%64%6F@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/gianluigilopardo", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/gianluigilopardo", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=Ddns-QsAAAAJ", "_blank");
        },
      },{
        id: 'social-telegram',
        title: 'telegram',
        section: 'Socials',
        handler: () => {
          window.open("https://telegram.me/gigilopardo", "_blank");
        },
      },{
        id: 'social-x',
        title: 'X',
        section: 'Socials',
        handler: () => {
          window.open("https://twitter.com/gigilopardo", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];

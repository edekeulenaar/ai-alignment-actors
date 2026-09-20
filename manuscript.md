# The actors in AI alignment

## Abstract

Value alignment gives AI companies considerable discretion over the norms their models reproduce. Yet companies also depend on external actors to formulate values, anticipate risks and evaluate model behaviour. This article examines how these actors are enrolled across an alignment stack, from specification to training and benchmarking. We combine a detailed reading of 184 documents with an expanded archive of 752 documents and a directory of alignment organisations. External actors appear in selective capacities, with substantially more identifiable external contributions to benchmarking than to training. In the harmonised actor mapping, 84.9% of actors appear in only one component. Alignment research organisations sometimes connect risk definition to evaluation by making prospective harms testable. We describe this capacity as ideation power. The findings qualify accounts of participation centred on consultation: inclusion in one exercise does not establish continuing involvement in the decisions through which a value becomes part of a model's conduct.

**Keywords:** AI alignment; platform governance; participation; model documentation; anticipatory governance; actor-network theory

## Introduction

One of the major controversies AI has brought to societal debate concerns its renewed role in public access to information [@branfordGenerativeAIDemocratic2025]. One once spoke of algorithms as a catch-all denominator for the underlying infrastructures and politics of information management [@bowkerSortingThingsOut2000], be these ranking systems [@riederRankingAlgorithmsRanking2018], recommenders or content moderation systems [@gorwaAlgorithmicContentModeration2020]. Large language models (LLMs) now enter this configuration as interfaces that generate information as well as organise access to it. Seamless as this shift may feel, the political implications remain profound. Both algorithmic and AI-based information systems condition the levers through which access to and the circulation of information are aligned with societal norms.

A central political question is who gets to decide and operationalise those norms. AI companies retain considerable discretion over what they create. A key aspect of “platform power” is indeed the “endogenous” capacity to engender the environment and conditions in which surrounding markets and societal sectors must function [@nieborgIntroductionSpecialIssue2024]. Companies nevertheless depend on actors from whom they seek expertise, legitimation and governance frameworks. Such dependencies concern epistemic norms, including definitions of misinformation; social norms concerning representation and political disagreement; and estimations of personal or societal harm. Many of these remain “essentially contested” [@collierEssentiallyContestedConcepts2006], even when a technical system requires a decision about how to apply them.

Part of alignment, then, is a question of inclusive design. Who is consulted about a norm, and what becomes of their contribution when it is translated into training data or a benchmark? Another part concerns negotiation between actors with different interests and capacities to act. Platform governance scholarship has long examined how responsibility might be distributed between companies, public institutions and civil society [@helbergerGoverningOnlinePlatforms2018]. AI companies, for their part, describe partnerships with academic and governmental experts, red-teaming networks [@gillespieAIRedTeamingSociotechnical2026] and occasional consultations with publics. Anthropic's Collective Constitutional AI and Google's STELA programme are examples of attempts to incorporate public judgements into alignment principles [@huang2024CollectiveConstitutionalAI; @bergmanSTELACommunitycentredApproach2024].

Still, it is difficult to tell what participation means beyond these exercises. In AI design research, the term often implies some distribution of agency over the purpose, design or consequences of a system [@delgadoParticipatoryTurnAI2023; @kallinaStakeholderParticipationResponsible2025]. A citation, survey or invitation to red team a model does not in itself establish such agency. What documentation does allow us to examine is *which* actors are named, in what capacities, and whether they reappear as a value is specified, trained and evaluated.

This requires looking beyond any one site of participation. Work on AI governance has examined ethical codes, industry governance, contracts, standards and international agreements as different “modalities” through which AI is governed [@veale2023AIGlobalGovernance]. Our concern is how those arrangements enter alignment itself. We approach alignment as a *stack* of interdependent interventions, from the definition of desired conduct to data curation, training and evaluation. A principle may be open to public consultation while the decisions about its implementation remain within the company. Conversely, the author of a benchmark may help define acceptable conduct without ever having been invited to deliberate about it.

Concretely, we examine a detailed extraction from 184 documents alongside an expanded archive of 752 documents associated with developers in the United States, Europe and China. We trace named actors across alignment components and compare this documentary network with a wider directory of alignment organisations. We find that external involvement is concentrated in particular tasks, especially benchmarking. A small number of alignment research organisations connect the definition of prospective risks to their evaluation. We refer to this capacity as *ideation power*: the capacity to formulate a possible AI behaviour as a problem that others can train against or test. This is an interpretation of documented relations; it does not establish how much influence any actor exercised over a company's eventual decision.

## The actors of alignment governance

### Alignment as a stack

Alignment describes efforts to make a model's behaviour conform to particular intentions, preferences or values. These are not interchangeable targets. Gabriel distinguishes instructions, expressed intentions, revealed and informed preferences, interests and values, each of which implies a different account of what an AI ought to do [@gabrielArtificialIntelligenceValues2020]. The choice also concerns whose judgement counts when these targets conflict. A model that follows a user's instruction may violate another person's interests; a model trained to avoid harm may refuse a request that its user considers legitimate.

In this regard, alignment extends questions familiar to values in design. The practical difference lies partly in the interventions through which a norm becomes generative behaviour. We use the term *stack* to hold these interventions together without assuming that they follow a simple sequence. Legislation, conventions and standards inform company principles and specifications; these inform training and evaluation; observations of model behaviour may in turn occasion revisions to the specification. A norm can change in the process. What is described as “harmlessness” in a principle must acquire more specific meanings when annotators compare answers or evaluators design a test.

**Figure 1.** *The alignment stack. Norms, specifications, training, evaluation and deployment are interdependent sites of intervention; the diagram does not imply that every company follows the same sequence.*

To begin, *specification* concerns the definition of desired conduct and of the circumstances in which it should apply. It makes an otherwise broad value actionable within a computational system [@agreComputationHumanExperience1997]. This may involve deciding what counts as a factual answer, which requests should be refused or how helpfulness should be weighed against the possibility of harm. The difficulty is that agreement about a principle does not settle its application. Choosing an example, a threshold or an exception already amounts to interpreting the value.

*Training and mitigation* concern the techniques through which those interpretations are incorporated into model behaviour. Supervised fine-tuning uses examples of desired responses; preference learning uses comparisons or rankings; constitutional methods use written principles to guide critique and revision. Other interventions filter data or outputs, impose instructions, or monitor behaviour during use. Here, the relevant actors may include data workers, researchers, red teamers and domain experts, with different degrees of access to the decisions their contributions inform.

*Anticipation and evaluation* concern what a model may do, and how one might know whether it behaves acceptably. Content moderation already involves pre-emptive judgements, but generative systems add the problem of assessing outputs and capabilities that have not yet been observed in use. Frontier safety frameworks make this problem explicit through capability thresholds and proposed safeguards. Evaluators must devise situations in which a prospective failure can become observable. Benchmarks are one means of doing so, though a score cannot settle every disagreement about the norm being measured.

Finally, *deployment and documentation* concern where models are used and how their conduct is made available for scrutiny. Domain partnerships may supply knowledge about the conditions in which a model operates. Model cards, framework reports and other disclosures make some of the preceding decisions public. These components bring different actors into view, but their presence does not imply equal authority over the model or over what is disclosed about it.

### Participation and decision-making

Thus far, much of the empirical work on participation in AI has examined consultation. Delgado et al. find that participatory design is largely consultative and rarely gives participants agency over design decisions [@delgadoParticipatoryTurnAI2023]. Kallina et al. likewise identify a distance between responsible-AI guidance, where participation is often justified as a redistribution of agency, and industry practice, where developers, executives and legal teams determine its scope [@kallinaStakeholderParticipationResponsible2025]. These findings invite a more specific question: at what point does an actor's involvement end?

Google's STELA programme illustrates this problem. Participants discussed chatbot interactions, after which researchers coded their statements, formulated rules and submitted the ruleset to expert review [@bergmanSTELACommunitycentredApproach2024]. This elicited situated judgements about impartiality, factuality and culturally specific harms. Participants nevertheless did not select the dialogue samples or directly formulate the final rules. In Collective Constitutional AI, public input similarly informed a constitution that researchers curated and used in training [@huang2024CollectiveConstitutionalAI]. Such exercises can alter the material available for alignment while leaving the passage from discussion to implementation under researchers' control.

Data work and red teaming pose related questions. An annotator's judgement can become a training signal without giving the annotator authority over the categories, instructions or objectives of the exercise. Miceli and Posada locate these asymmetries in the organisation of data production, where workers interpret material within conditions established by clients and managers [@miceli2022DataProduction]. External red teaming likewise depends on choices about whom to invite, what access to provide and which findings to act upon [@ahmadOpenAIsApproachExternal2025]. Organisational priorities and release schedules may constrain what follows from an identified failure [@renOrganizationMattersQualitative2025].

Third-party evaluation introduces another possibility. Raji et al. argue that an audit ecosystem requires institutional arrangements that enable outsiders to scrutinise systems [@raji2022OutsiderOversight]. This brings into view organisations whose principal activity is evaluating AI, including specialised alignment research organisations. Their position may differ from that of publics invited to a consultation: they can supply both a definition of a prospective risk and an instrument for testing it. Yet access to a model and authority over its release remain separate capacities. Corporate control of resources also shapes the research questions external actors can pursue [@whittaker2021SteepCost].

In what follows, we examine these differences across the alignment stack. Actor-network theory supplies the term *enrolment* for the relations through which actors and their contributions become part of an undertaking [@buegerActorNetworkTheoryObjects2017]. Here, it directs attention to whether a judgement is carried into a principle, dataset, training intervention or evaluation, and to whom the documents credit at each point. We use this as a way of tracing involvement, rather than as a scale on which more mentions necessarily mean more power.

## Method

### Reading alignment documents

Our point of departure is what companies document about alignment. Studies of model cards have examined the unevenness of disclosure [@liang2024SystematicAnalysis], while the Foundation Model Transparency Index evaluates what developers disclose about their models and the conditions of their production [@bommasani2023FMTI]. We approach these materials through the relations they record: whose work is cited, which organisations are invited to contribute, and what those contributions are said to concern.

Though these documents are of course not representative of everything that occurs in alignment processes, or of everyone involved, they do themselves *participate* in AI companies' governance. They perform public duties towards the responsible democratisation of machine learning [@mitchellModelCardsModel2019b], respond to the sensitivities of regulators and public debates about prospective model uses, and position companies among competing alignment norms and technical benchmarks. These documents, and those they cite, may be sites of deliberation in their own right: they refer to conceptual influences from public debate, nonprofits involved in benchmarking or red teaming, consultation processes, and AI safety organisations with whom, or in response to whom, companies have formulated a norm.

Of course, the corpus records what companies and affiliated authors choose to disclose, in genres with different audiences and incentives; it cannot make private meetings, rejected recommendations or uncredited labour visible. We are also cautious about deducing a company's motivation for involving an actor, and more so about estimating that actor's impact. We restrict ourselves to analysing how actors are cited and thereby publicly “enrolled” in alignment processes.

### Sampling and collection

The collection centres on developers with publicly accessible documentation: OpenAI, Anthropic, Google and Google DeepMind, Meta, xAI and Microsoft in the United States; Mistral, Aleph Alpha, Almawave, Black Forest Labs and Unbabel in Europe; and Alibaba/Qwen and DeepSeek in China. It is a purposive comparison, conditioned by what these companies publish. It cannot represent all developers or support a balanced comparison between regions.

The initial collection, assembled between 28 January and 9 May 2026, comprised 181 Zotero records from company websites, repositories and archived attachments, alongside the latest available snapshots of 53 product policies from the Open Terms Archive. One Zotero record contained four separate files, producing 184 documents. A second collection followed links from company newsrooms, research listings, transparency hubs and safety sections. The September 2026 archive contains 515 additional company documents, bringing the total to 752 files. Published PDFs were retained; webpages were preserved as paginated files with text extractions. Page references therefore identify a captured version, not necessarily the current webpage.

The analyses use different portions of this archive. The detailed mapping of values, training and benchmarks derives from 184 extracted documents: 163 of the Zotero documents and 21 policy snapshots. The genre, phrase and citation analyses concern the 515 additional company documents. Retrieval indexes the full archive; a subsequent retrieval-grounded extraction covers 150 of the additional documents. These readings inform qualitative inspection but are not pooled into the detailed extraction's numerical findings. Keeping these scopes separate matters because an indexed document has not necessarily been read through every part of the analytical schema.

### The document taxonomy

We distinguish documents by what they ask, describe or undertake. Principles set out a company's normative orientation; model specifications describe desired behaviour; frontier governance frameworks state conditions under which safeguards should apply. Model and system cards report on particular models, while implementation reports apply a named framework to a model or release. Policy positions, commitments, partnerships and funding announcements disclose other relations through which alignment is organised. Table 1 summarises these distinctions; the complete taxonomy accompanies the online article.

| Documentary function | Genres | What the distinction makes observable |
|---|---|---|
| Stating norms and conditions | Principles; model specifications; frontier frameworks; usage policies | Who or what is addressed by a norm, and how compliance is described |
| Reporting and assessment | Model documentation; implementation, misuse and transparency reports; third-party assessments | What is disclosed about models, tests, incidents and company practice |
| Organising involvement | Partnerships; governance bodies; programmes and funding | Who is invited, supported or given a continuing role |
| Public positioning | Policy positions; commitments; statements; essays | What companies request, promise or envisage |
| Producing knowledge and instruments | Research; evaluations, benchmarks and tools | Which concepts and tests can enter another actor's alignment work |

**Table 1.** *Alignment documents grouped by their principal function. Index pages and product-deployment announcements are retained as contextual categories, separately from substantive alignment documents.*

For the expanded collection, categories were assigned using the selected-document labels, title and URL rules, and individual overrides. We compare their characteristic phrases and links to other documents, discounting recurrent company navigation. These comparisons indicate differences between genres; they do not show that every document of a given type performs the same function.

**Figure 2.** *Characteristic phrases by document type in the expanded collection. Phrases are compared through log-odds with an informative prior and must occur across more than one company.*

**Figure 3a.** *Links between documents in the expanded collection, detected through titles and URLs. Recurrent navigation links are discounted.*

Actor names are also located through a vocabulary scan. Rules applied to surrounding sentences suggest relations such as evaluation, partnership or funding. These are exploratory classifications: a word near an actor's name does not by itself establish the actor's role. Figures 3b and 4 aggregate document–actor–relation occurrences, so a document can contribute more than once.

**Figure 3b.** *Document–actor–relation occurrences by actor type and document genre. Counts are not numbers of distinct documents or measures of influence.*

**Figure 4.** *Frequently named actors within each genre and the relations suggested by their surrounding text. These classifications guide inspection of the source passages.*

### Extracting and checking relations

The detailed extraction records ideal conducts, risks, training or mitigation methods, benchmarks and associated actors. We distinguish an actor credited with defining a conduct or risk from the author of the document. We likewise distinguish developing a benchmark from being commissioned to evaluate a company's model. A citation to prior work is insufficient to establish either relation unless the passage specifies what the actor contributed.

This approach combines distant reading [@morettiDistantReading2013] with returns to individual passages. The detailed dataset contains an initial model reading and a subsequent GPT-5.4 reading, with harmonised names and categories. The later retrieval procedure divides documents into overlapping, page-bounded passages and combines lexical with semantic search. For each document, it retrieves passages about values, risks, training, benchmarks, evaluators and other actors; GPT-5.4 extracts candidate relations from those passages with page references. An exhaustive scan of known names complements retrieval, though it cannot discover actors absent from its vocabulary.

In this configuration, computational reading extends the material available to the analyst while also introducing selection and classification errors. We retain source wording and page references so that interpretations can be checked against the documents. The analyst sets the schema and category distinctions and returns to passages when assessing the resulting claims. This is a form of co-reading at different distances, rather than a delegation of interpretation to an extraction model.

Retrieval was evaluated on a held-out set of 480 queries derived from baseline page references. The tested hybrid configuration returned the reference page among its first five results for 84.2% of queries and among its first ten for 89.6%. These scores concern retrieval, not the accuracy of extracted relations. The reference set also favours identifiable names and native PDFs; its performance cannot be assumed for all genres in the expanded archive. We consequently use the retrieval-grounded reading to support source inspection, without treating its coverage as exhaustive.

Numerical summaries of training and benchmarking count distinct stored identifiers in the detailed extraction. An item is counted as internal where at least one named actor has the harmonised category “Internal”, and as externally attributed where at least one actor has an identifiable external category. Unspecified “Other”, “Multiple” and unknown categories are not treated as evidence of an external contribution. Internal and external counts can overlap. The interactive figures group items by company and harmonised label; their displayed totals can therefore differ from identifier counts. Figure 9 uses the actor names retained in this harmonised view to trace involvement across four components: conduct definition, risk definition, training and benchmarking.

### Comparing the wider field

To place these relations in a wider context, we use a directory assembled through searches for alignment, AI safety, red teaming, fairness, explainability, AI ethics and responsible AI organisations. English-, German- and Danish-language queries were run for the United States, United Kingdom, Germany and Denmark, collecting up to 50 results per search-and-location combination. Of 7,377 search results, 512 entries were retained as relevant organisations. These include research centres, advocacy organisations, public agencies, foundations, consultancies and coalitions; developers, individuals, publishers and one-off events were excluded.

Names and acronyms were matched against the detailed extraction, using normalised names, long-string matches and recorded aliases. The unit is a directory entry: some organisations occur more than once, so the result is not an estimate of the proportion of all organisations involved in alignment. A match may also identify a parent organisation or a named representative rather than a direct organisational contribution. We use the comparison to examine where documentary connections appear, and return to the names when interpreting them.

The main limitations follow from these choices. Companies disclose unevenly, and the expanded collection is especially concentrated on Anthropic, OpenAI and Google. Extraction and name matching can miss relations or assign them incorrectly. The directory depends on search rankings, languages and locations, and underrepresents regions outside Europe and North America. Above all, absence from these documents cannot distinguish non-participation from non-disclosure. We therefore speak of documentary absence rather than demonstrated exclusion from a company's work.

**Figure 5.** *Collection and analysis. The archive, detailed extraction, expanded genre analysis and retrieval-grounded reading have separate scopes.*

## Actors and values

The actors named in alignment documents are more heterogeneous than a distinction between companies and “stakeholders” might suggest. Alongside model teams and company researchers, there are government agencies, universities, cybersecurity firms, domain experts, data workers and consultation participants. Civil society includes advocacy organisations, foundations and think tanks, as well as organisations whose principal trade is alignment research. Apollo Research and METR, for example, appear in relation to the formulation and evaluation of prospective model behaviour.

**Figure 6a and 6b.** *Ideal conducts, risks and the actors credited with defining them in the detailed extraction. The figures allow each attribution to be read alongside its source.*

The values to which these actors are attached differ in how they become actionable. Safety, helpfulness, honesty and compliance recur among ideal conducts, alongside political neutrality, factuality, personality and diversity. Risks include cybersecurity, harmful content, chemical, biological, radiological and nuclear (CBRN) threats, privacy, deception and bias. The distinction is not that some values are political and others are settled. Cybersecurity and biosecurity also involve judgements about acceptable uses and distributions of harm. Rather, some risks are more readily formulated as tasks with observable outcomes, while other norms depend more visibly on the circumstances and standpoint from which an answer is judged.

This has consequences for whose expertise is cited. Governmental instruments supply obligations and risk vocabularies; academics supply concepts and tests; security specialists devise threat scenarios. The documents also refer to White House commitments and the Bletchley Declaration as sources of frontier-risk concerns. These references record the instruments invoked at the time of publication, not necessarily their current legal status. A company's use of such a vocabulary still leaves open how it becomes a refusal rule, training example or evaluation threshold.

Apollo Research illustrates a more specific kind of definitional work. In OpenAI's o1 system card, scheming is described as covertly pursuing goals that diverge from those of developers or users, and Apollo provides scenarios through which such behaviour can be tested [@openaiOpenAIO1System2024]. Its evaluations also appear in the GPT-4o system card [@openaiGPT4oSystemCard2024]. Here, the organisation contributes to the description of the problem as well as to its evaluation. A prospective risk acquires a name, a set of circumstances and an observable response.

We call this a form of *ideation*: the formulation of possible model conduct in terms that others can incorporate into alignment. The power involved is relational. It depends on whether a company adopts a proposed scenario, definition or test, and on what it does with the result. The documents show that some alignment research organisations occupy more than one of these positions. They do not show that those organisations can compel the company to act, or that their definitions displace every competing account of risk.

Public-consultation organisations contribute another kind of expertise. They convene participants and translate discussion into material that researchers can use. Ovadya describes the provision of deliberative expertise to institutions as “democracy-as-a-service” [@ovadyaReimaginingDemocracyAI2023]. In alignment, the promise is to widen the judgements available for defining model behaviour. Yet the STELA and Collective Constitutional AI examples also show that participant selection, prompts and the curation of principles condition what can enter training. To understand the resulting participation, one must follow what happens to these contributions after the consultation ends.

## Training and evaluating

Training is where a norm acquires a particular weight in model behaviour. An example can be included or discarded, a preference can count more or less in optimisation, and a safeguard can be adjusted to tolerate or prevent certain responses. These decisions require access to model development and its infrastructure. The documentary record is correspondingly concentrated on company actors: 740 of 787 training and mitigation items, or 94.0%, name at least one actor categorised as internal. An identifiable external actor is credited in 80 items, or 10.2%. These categories overlap, as external contributions may be incorporated alongside company work.

**Figure 7.** *Training and mitigation methods and their attributed actors, grouped by company. The source passages distinguish contributing data or expertise from carrying out an intervention.*

One reason for this concentration is the control companies retain over data mixtures, training objectives and production systems. External expertise may contribute to a training example without extending to the decisions about how it is weighted or what follows from a failure. This interpretation is consistent with work on corporate control of AI research resources [@whittaker2021SteepCost] and on the organisational conditions of red teaming [@renOrganizationMattersQualitative2025]. The count itself establishes attributed involvement, however; it cannot reveal who prevailed in an internal disagreement.

Benchmarking presents a different distribution. An identifiable external category is associated with 337 of 880 benchmark items, or 38.3%. Academic or research centres are credited in 174 items, alignment research organisations in 101, and red-teaming or cybersecurity companies in 29. Actor categories can co-occur within an item. The difference from training suggests a wider opening for external contributions to evaluation, although the corpus cannot establish how much of that difference reflects more complete attribution of benchmark authors.

| Component | Distinct items | With an internal actor | With an identifiable external actor |
|---|---:|---:|---:|
| Training and mitigation | 787 | 740 (94.0%) | 80 (10.2%) |
| Benchmarking | 880 | 509 (57.8%) | 337 (38.3%) |

**Table 2.** *Attributions in the detailed extraction, counted by stored item identifier. Columns overlap; unspecified categories do not establish external involvement. Items are neither unique techniques across the industry nor counts of individual decisions.*

**Figure 8.** *Benchmarks and their attributed authors, grouped by company. Authoring a benchmark is distinguished from being commissioned to evaluate a model.*

A benchmark offers a relatively portable means of intervention. An external actor can devise a test of factuality, bias or a security capability without controlling the company's training process. If adopted, the test establishes one way of recognising whether a norm has been honoured. The company can nevertheless choose whether to use it, how to interpret the result and whether a failure warrants a change. This helps explain why a larger set of credited evaluators need not imply a comparable redistribution of decision-making. The institutional conditions of oversight remain consequential [@raji2022OutsiderOversight].

## Who appears across the stack

The harmonised mapping in Figure 9 contains 537 actor names: 37 appear in conduct definition, 167 in risk definition, 160 in training and 278 in benchmarking. Of the 537, 456, or 84.9%, appear in only one component; 61 appear in two, 16 in three and four in all four. These counts concern names associated with a specific alignment role in the harmonised mapping; they do not include every name mentioned in the archive. It nevertheless shows how much the account of participation changes when continuing involvement becomes the object of enquiry.

**Figure 9.** *Actor names across conduct definition, risk definition, training and benchmarking in the harmonised mapping. Presence records an attributed role, not decision-making authority.*

Some external actors connect several components through specialised work. Apollo Research, METR and SecureBio appear in relation to risk definition, training-related contributions and benchmarking. The Collective Intelligence Project connects conducts, risks and training through a different route, involving the elicitation of public input. Such cases indicate that a contribution can extend beyond an isolated evaluation or consultation. They also caution against treating “external participation” as one institutional arrangement: the relevant relations depend on what an actor is invited or equipped to do.

The directory comparison introduces another boundary. Twenty-four of its 512 entries, or 4.7%, match names in the detailed extraction. Twenty matching entries are based in the United States, three in the United Kingdom and one in Switzerland. These are entry counts, including repeated organisations and recorded aliases. They show a geographically concentrated set of documentary connections, rather than a population estimate of inclusion in alignment.

**Figure 10.** *Connections between the wider directory and the detailed extraction. Each ribbon represents one directory entry, linking country, organisational type and a name match. Twenty-four entries match; duplicate entries and aliases prevent interpreting this as a count of distinct participating organisations.*

The matching names include US research centres and alignment organisations, among them METR, FAR.AI, Redwood Research, the Alignment Research Center and the Center for AI Safety. The UK AI Safety Institute and the International Organization for Standardization exemplify other routes into the documents, through evaluation and standardisation. Conversely, none of the directory's 117 German or 54 Danish entries matches the detailed extraction. This does not show that organisations in those countries have never worked with a developer. It identifies a limit to the geographical range made visible by this collection and matching procedure.

The distinction matters particularly for civil society. No entry categorised as a general advocacy organisation or foundation matches, but the directory does contain a match for the Electronic Frontier Foundation under legal advocacy. The categories therefore support a more qualified account than the absence of civil society altogether. Different forms of advocacy, consultation and technical evaluation obtain different kinds of documentary recognition. A larger or differently sampled corpus could reveal other relations; within this one, the visible routes remain selective.

## Conclusion

This article examined which actors are publicly enrolled in value alignment and how their attributed roles differ across its components. Looking across the stack qualifies what participation in any one exercise can tell us. A public may contribute to a principle without appearing in its subsequent implementation. A researcher may author a benchmark without deciding how a company responds to the result. In the detailed extraction, identifiable external contributions are considerably more common in benchmarking than in training; in the harmonised actor mapping, most actors appear in one component only.

These findings speak to the organisation of governance within technologies that increasingly mediate public access to information. Norms enter model behaviour through decisions about definitions, examples, optimisation and testing. The actors recognised at one of these points need not retain a role at the next. In this sense, an account of inclusive design must also examine how the conditions of participation are distributed across the processes by which information systems are built.

Alignment research organisations sometimes connect positions otherwise occupied separately. We describe their capacity to formulate prospective conduct as a testable alignment problem as ideation power. This interpretation helps explain why the ability to anticipate and model a risk may secure a place in company documentation without formal regulatory authority. It also leaves open the question that the documents cannot resolve: how those contributions fare when they conflict with a company's priorities or with other understandings of harm.

A further institutional question concerns who should convene deliberation about generally deployed models. Company consultations can elicit judgements that developers would otherwise miss. Yet the choice of participants, questions and uses of their contributions remains consequential. Public institutions could commission deliberation and evaluation under conditions that make the remit, evidence and company response answerable to a broader constituency. The point would be to connect participation to the decisions it is meant to inform, including decisions about contested values that cannot be settled by a benchmark. What this study offers is a way of locating where those connections are publicly made, and where they cease to be visible.

# References

Agre P (1997) *Computation and Human Experience*. Cambridge: Cambridge University Press.

Ahmad L, Agarwal S, Lampe M, et al. (2025) OpenAI’s approach to external red teaming for AI models and systems. *arXiv*. DOI: [10.48550/arXiv.2503.16431](https://doi.org/10.48550/arXiv.2503.16431).

Bergman S, Marchal N, Mellor J, et al. (2024) STELA: A community-centred approach to norm elicitation for AI alignment. *Scientific Reports* 14: 6616. DOI: [10.1038/s41598-024-56648-4](https://doi.org/10.1038/s41598-024-56648-4).

Bommasani R, Klyman K, Longpre S, et al. (2023) The foundation model transparency index. *arXiv*. DOI: [10.48550/arXiv.2310.12941](https://doi.org/10.48550/arXiv.2310.12941).

Bowker GC and Star SL (2000) *Sorting Things Out: Classification and Its Consequences*. Cambridge, MA: MIT Press.

Branford J, Soulier E and Fichtner L (2025) Generative AI and democratic culture. *Philosophy & Technology* 38: 123. DOI: [10.1007/s13347-025-00953-x](https://doi.org/10.1007/s13347-025-00953-x).

Bueger C and Stockbruegger J (2017) Actor-network theory: Objects and actants, networks and narratives. In: McCarthy DR (ed.) *Technology and World Politics: An Introduction*. Abingdon: Routledge, pp.42–59. DOI: [10.4324/9781317353836-3](https://doi.org/10.4324/9781317353836-3).

Collier D, Hidalgo FD and Maciuceanu AO (2006) Essentially contested concepts: Debates and applications. *Journal of Political Ideologies* 11(3): 211–246. DOI: [10.1080/13569310600923782](https://doi.org/10.1080/13569310600923782).

Delgado F, Yang S, Madaio M, et al. (2023) The participatory turn in AI design: Theoretical foundations and the current state of practice. In: *Proceedings of the 3rd ACM Conference on Equity and Access in Algorithms, Mechanisms, and Optimization*, pp.1–23. DOI: [10.1145/3617694.3623261](https://doi.org/10.1145/3617694.3623261).

Gabriel I (2020) Artificial intelligence, values, and alignment. *Minds and Machines* 30(3): 411–437. DOI: [10.1007/s11023-020-09539-2](https://doi.org/10.1007/s11023-020-09539-2).

Gillespie T, Shaw R, Gray ML, et al. (2026) AI red-teaming is a sociotechnical problem. *Communications of the ACM* 69(2): 88–95. DOI: [10.1145/3731657](https://doi.org/10.1145/3731657).

Gorwa R, Binns R and Katzenbach C (2020) Algorithmic content moderation: Technical and political challenges in the automation of platform governance. *Big Data & Society* 7(1). DOI: [10.1177/2053951719897945](https://doi.org/10.1177/2053951719897945).

Helberger N, Pierson J and Poell T (2018) Governing online platforms: From contested to cooperative responsibility. *The Information Society* 34(1): 1–14. DOI: [10.1080/01972243.2017.1391913](https://doi.org/10.1080/01972243.2017.1391913).

Huang S, Siddarth D, Lovitt L, et al. (2024) Collective constitutional AI: Aligning a language model with public input. In: *Proceedings of the 2024 ACM Conference on Fairness, Accountability, and Transparency*, pp.1395–1417. DOI: [10.1145/3630106.3658979](https://doi.org/10.1145/3630106.3658979).

Kallina E, Bohné T and Singh J (2025) Stakeholder participation for responsible AI development: Disconnects between guidance and current practice. In: *Proceedings of the 2025 ACM Conference on Fairness, Accountability, and Transparency*, pp.1060–1079. DOI: [10.1145/3715275.3732069](https://doi.org/10.1145/3715275.3732069).

Liang W, Rajani N, Yang X, et al. (2024) Systematic analysis of 32,111 AI model cards characterizes documentation practice in AI. *Nature Machine Intelligence* 6: 744–753. DOI: [10.1038/s42256-024-00857-z](https://doi.org/10.1038/s42256-024-00857-z).

Miceli M and Posada J (2022) The data-production dispositif. *Proceedings of the ACM on Human-Computer Interaction* 6(CSCW2): Article 460, 1–37. DOI: [10.1145/3555561](https://doi.org/10.1145/3555561).

Mitchell M, Wu S, Zaldivar A, et al. (2019) Model cards for model reporting. In: *Proceedings of the Conference on Fairness, Accountability, and Transparency*, pp.220–229. DOI: [10.1145/3287560.3287596](https://doi.org/10.1145/3287560.3287596).

Moretti F (2013) *Distant Reading*. London: Verso.

Nieborg D, Poell T, Caplan R, et al. (2024) Introduction to the special issue on locating and theorising platform power. *Internet Policy Review* 13(2). DOI: [10.14763/2024.2.1781](https://doi.org/10.14763/2024.2.1781).

OpenAI, Hurst A, Lerer A, et al. (2024a) GPT-4o system card. *arXiv*. DOI: [10.48550/arXiv.2410.21276](https://doi.org/10.48550/arXiv.2410.21276).

OpenAI, Jaech A, Kalai A, et al. (2024b) OpenAI o1 system card. *arXiv*. DOI: [10.48550/arXiv.2412.16720](https://doi.org/10.48550/arXiv.2412.16720).

Ovadya A (2023) Reimagining democracy for AI. *Journal of Democracy* 34(4): 162–170. DOI: [10.1353/jod.2023.a907697](https://doi.org/10.1353/jod.2023.a907697).

Raji ID, Xu P, Honigsberg C, et al. (2022) Outsider oversight: Designing a third party audit ecosystem for AI governance. In: *Proceedings of the 2022 AAAI/ACM Conference on AI, Ethics, and Society*, pp.557–571. DOI: [10.1145/3514094.3534181](https://doi.org/10.1145/3514094.3534181).

Ren B, Cheon E and Li J (2025) Organization matters: A qualitative study of organizational dynamics in red teaming practices for generative AI. *Proceedings of the ACM on Human-Computer Interaction* 9(7): Article CSCW460, 1–26. DOI: [10.1145/3757641](https://doi.org/10.1145/3757641).

Rieder B, Matamoros-Fernández A and Coromina Ò (2018) From ranking algorithms to “ranking cultures”: Investigating the modulation of visibility in YouTube search results. *Convergence* 24(1): 50–68. DOI: [10.1177/1354856517736982](https://doi.org/10.1177/1354856517736982).

Veale M, Matus K and Gorwa R (2023) AI and global governance: Modalities, rationales, tensions. *Annual Review of Law and Social Science* 19: 255–275. DOI: [10.1146/annurev-lawsocsci-020223-040749](https://doi.org/10.1146/annurev-lawsocsci-020223-040749).

Whittaker M (2021) The steep cost of capture. *Interactions* 28(6): 50–55. DOI: [10.1145/3488666](https://doi.org/10.1145/3488666).

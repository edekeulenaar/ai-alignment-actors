# The actors in AI alignment

**Total word count including references, tables, captions and figure text: 7,784.**

## Abstract

Value alignment gives AI companies considerable discretion over the norms their models reproduce. Yet companies also depend on external actors to formulate values, anticipate risks and evaluate model behaviour. This article examines how these actors are enrolled across an alignment stack, from specification to training and benchmarking. We combine a detailed reading of 184 documents with an expanded archive of 752 documents and a directory of alignment organisations. External actors appear in selective capacities, with substantially more identifiable external contributions to benchmarking than to training. In the harmonised actor mapping, 84.9% of actors appear in only one component. Alignment research organisations sometimes connect risk definition to evaluation by making prospective harms testable. We describe this capacity as ideation power. The findings qualify accounts of participation centred on consultation: inclusion in one exercise does not establish continuing involvement in the decisions through which a value becomes part of a model's conduct.

**Keywords:** AI alignment; platform governance; participation; model documentation; anticipatory governance; actor-network theory

## Introduction

One of the major controversies AI has brought to societal debate concerns its renewed role in public access to information [@branfordGenerativeAIDemocratic2025]. One once spoke of “algorithms” as a catch-all denominator for the underlying infrastructures and politics of information management [@bowkerSortingThingsOut2000], be these ranking systems [@riederRankingAlgorithmsRanking2018], recommenders or content moderation systems [@gorwaAlgorithmicContentModeration2020]. Large language models (LLMs) enter this configuration as interfaces that generate information as well as organise access to it. Seamless as this shift may feel, the political implications remain profound: both algorithmic and AI-based information systems condition the levers through which access to and the circulation of information are aligned with societal norms.

A central political question is who gets to decide and operationalise those norms. AI companies retain considerable discretion over what they create; a key aspect of “platform power” is indeed the “endogenous” capacity to engender the environment and conditions in which surrounding markets and societal sectors must function [@nieborgIntroductionSpecialIssue2024]. But they also retain dependencies with actors from whom they seek expertise, legitimation and governance frameworks. These concern epistemic norms, including definitions of misinformation; social norms around representation and political disagreement; and estimations of personal or societal harm. Many remain “essentially contested” [@collierEssentiallyContestedConcepts2006], even when a technical system requires a decision about how to apply them.

Part of alignment is, in this sense, a question of inclusive design: who is consulted about a norm, and what becomes of their contribution when it is translated into training data or a benchmark? Another part concerns negotiation between actors with different interests and capacities to act. Platform governance scholarship has long examined how responsibility might be distributed between companies, public institutions and civil society [@helbergerGoverningOnlinePlatforms2018]. AI companies, for their part, describe partnerships with academic and governmental experts, red-teaming networks [@gillespieAIRedTeamingSociotechnical2026] and occasional consultations with publics, as in Anthropic's Collective Constitutional AI and Google's STELA programme [@huang2024CollectiveConstitutionalAI; @bergmanSTELACommunitycentredApproach2024].

Still, it is difficult to tell what participation means beyond these exercises, let alone whether it entails the distribution of agency over a system's purpose, design or consequences that scholars associate with participatory AI [@delgadoParticipatoryTurnAI2023; @kallinaStakeholderParticipationResponsible2025]. A public may be invited to deliberate about a principle while the decisions about its implementation remain within the company; conversely, the author of a benchmark may help define acceptable conduct without having been invited to deliberate about it. Looking beyond any one site of participation therefore requires following actors across the processes through which a norm becomes part of a model's behaviour.

Concretely, we read a detailed extraction from 184 documents alongside an expanded archive of 752 documents associated with developers in the United States, Europe and China. We trace actors across an *alignment stack*, from specification to training and benchmarking, and compare these relations with a wider directory of alignment organisations. External involvement is concentrated in particular tasks, especially benchmarking; a small number of alignment research organisations nevertheless connect the definition of prospective risks to their evaluation. We describe this capacity as *ideation power*: the capacity to formulate a possible AI behaviour as a problem that others can train against or test. Our concern is with the relations documented along this passage, and with what they allow us to say about participation in alignment as a whole.

## The actors of alignment governance

### Alignment as a stack

Before examining where actors intervene, it is useful to locate alignment itself. Gabriel distinguishes instructions, expressed intentions, revealed and informed preferences, interests and values as different targets of alignment [@gabrielArtificialIntelligenceValues2020]. The distinction matters because these targets do not necessarily agree: following a user's instruction may violate another person's interests, while preventing a possible harm may require refusing something the user considers legitimate. Alignment thus involves specifying whose judgement counts, under which circumstances, and how conflicts between otherwise desirable behaviours ought to be resolved.

In this regard, alignment extends questions familiar to values in design, but introduces particular means of translating norms into generative behaviour. Veale et al. locate ethics councils, contracts, standards and international agreements among the different modalities of AI governance [@veale2023AIGlobalGovernance]; within companies, these arrangements enter an interdependent set of interventions which we call the alignment *stack*. Legislation, conventions and standards inform company principles and specifications, which inform training and evaluation; observations of model behaviour may, in turn, occasion revisions to the specification. Following this movement allows us to ask whether those consulted about a value retain a role when its meaning becomes more specific.

**Figure 1**. *The alignment stack*.

*Specification* consists in formalising values within computational boundaries [@agreComputationHumanExperience1997]: deciding what counts as a factual answer, which requests should be refused, or how helpfulness should be weighed against the possibility of harm. Agreement about a broad principle does not settle these questions, since choosing an example or an exception already involves interpreting the value. *Training and mitigation* carry those interpretations into model behaviour through examples, preference comparisons, principle-based critique, filters and other safeguards. The same concern with harmlessness can consequently become several different interventions, each involving different people and different opportunities to contest what is being taught.

*Anticipation and evaluation* introduce a further difficulty. Content moderation already entails pre-emptive judgements, but generative systems add the problem of assessing outputs and capabilities that have not yet been observed in use. Evaluators must devise circumstances in which a prospective failure becomes observable; frontier safety frameworks then connect such observations to capability thresholds and proposed safeguards. This is where the ability to imagine a risk becomes consequential for governing it, although an evaluation score cannot resolve every disagreement about the norm being measured. Deployment and documentation subsequently make some of these decisions available for scrutiny, including which organisations were involved and what their contributions were said to accomplish.

### Participation and decision-making

Thus far, much empirical work on participation in AI has examined consultation. Delgado et al. find that participatory design rarely grants participants agency over design decisions [@delgadoParticipatoryTurnAI2023], while Kallina et al. identify a distance between responsible-AI guidance and industry practice, where developers, executives and legal teams determine the scope of involvement [@kallinaStakeholderParticipationResponsible2025]. Google's STELA programme illustrates this division of labour: participants discussed chatbot interactions, after which researchers coded their statements, formulated rules and submitted them to expert review [@bergmanSTELACommunitycentredApproach2024]. Situated judgements could enter alignment without participants selecting the dialogue samples or directly formulating the final rules; in Collective Constitutional AI, public input similarly informed a constitution that researchers curated and used in training [@huang2024CollectiveConstitutionalAI].

The question reappears in data work and red teaming, where a judgement may become a training signal without giving its author authority over the exercise. Miceli and Posada locate these asymmetries in the organisation of data production, in which workers interpret material within conditions established by clients and managers [@miceli2022DataProduction]. External red teaming likewise depends on whom a company invites, what access it provides and which findings it acts upon [@ahmadOpenAIsApproachExternal2025]; organisational priorities and release schedules may constrain what follows from an identified failure [@renOrganizationMattersQualitative2025].

Third-party evaluation raises a related institutional problem: as Raji et al. argue, an audit ecosystem requires arrangements that enable outsiders to scrutinise systems [@raji2022OutsiderOversight], while corporate control of resources also shapes the questions external researchers can pursue [@whittaker2021SteepCost]. Specialised alignment research organisations occupy an interesting position here because they may supply both a definition of a prospective risk and an instrument for testing it. To follow these contributions, we draw on the notion of *enrolment* in actor-network theory [@buegerActorNetworkTheoryObjects2017]: whose judgement is carried into a principle, dataset, training intervention or evaluation, and who is credited at each point? The purpose is to trace the organisation of involvement, without assuming that more mentions necessarily mean more power.

## Method

### Reading alignment documents

Our point of departure is what companies document about alignment. Studies of model cards have examined the unevenness of disclosure [@liang2024SystematicAnalysis], while the Foundation Model Transparency Index evaluates what developers disclose about their models and the conditions of their production [@bommasani2023FMTI]. Here, we approach the same materials through the relations they record: whose work is cited, which organisations are invited to contribute, and what those contributions concern.

Though these documents are of course not representative of everything that occurs in alignment processes, or of everyone involved, they do themselves *participate* in AI companies' governance by performing public duties towards the responsible democratisation of machine learning [@mitchellModelCardsModel2019b], responding to the sensitivities of regulators and public debates about prospective model uses, and positioning companies among competing alignment norms and technical benchmarks. These documents, and those they cite, may be sites of deliberation in their own right: they refer to conceptual influences from public debate, nonprofits involved in benchmarking or red teaming, consultation processes, and AI safety organisations with whom, or in response to whom, companies have formulated a norm.

Of course, the corpus records what companies and affiliated authors choose to disclose, in genres with different audiences and incentives; it cannot make private meetings, rejected recommendations or uncredited labour visible. We are also cautious about deducing a company's motivation for involving an actor, even more so about estimating that actor's impact. We restrict ourselves to analysing how actors are cited and thereby publicly “enrolled” in alignment processes.

### Collection and classification

The collection centres on developers with publicly accessible documentation: OpenAI, Anthropic, Google and Google DeepMind, Meta, xAI and Microsoft; Mistral, Aleph Alpha, Almawave, Black Forest Labs and Unbabel; and Alibaba/Qwen and DeepSeek. It is a purposive comparison, conditioned by disclosure, rather than a representative or regionally balanced sample. The initial collection, assembled between 28 January and 9 May 2026, comprised 181 Zotero records, yielding 184 files, alongside 53 policy snapshots from the Open Terms Archive. Following links from company newsrooms, research listings and safety sections added 515 documents by September 2026, bringing the archive to 752 files.

The analyses use different portions of this archive. The detailed mapping derives from 184 extracted documents: 163 Zotero-derived files and 21 policies. Genre, phrase and citation analyses concern the 515 additional documents; retrieval indexes the full archive, but the subsequent retrieval-grounded extraction covers 150 additional documents and informs qualitative inspection rather than the earlier numerical findings. Published PDFs and paginated webpage captures retain the passages to which these readings refer.

<div class="fig2-host" id="table-1"><table class="taxonomy">
<colgroup><col style="width:11%"><col style="width:15%"><col style="width:19%"><col style="width:35%"><col style="width:20%"></colgroup>
<thead><tr><th>Group</th><th>Category</th><th>Also known as</th><th>Definition and decision rule</th><th>Data points to code</th></tr></thead><tbody>
<tr><th class="taxonomy-group" rowspan="4" scope="rowgroup">A. Self-governance (normative)</th><td>Organizational principles, standards, codes</td><td>AI principles, charters, codes of conduct, responsible AI standards, human rights statements</td><td>Binds the organization. States values or requirements for how the company develops and deploys AI in general, not for one model or risk domain.</td><td>Version; date; scope (whole firm / division); enforcement mechanism named?</td></tr>
<tr><td>Model behavior specifications</td><td>Constitutions, model specs, character documents</td><td>Written target for model behavior, used in training or evaluation. Addressed to the model and to users.</td><td>Version; date; priority ordering of values; stated training use</td></tr>
<tr><td>Frontier governance frameworks</td><td>Responsible Scaling Policy, Frontier Safety Framework, Preparedness Framework, Frontier Governance Framework, Frontier AI Framework, SB 53 compliance framework</td><td>Defines capability or risk thresholds, the evaluations used to detect them, and the safeguards or deployment decisions that follow. Decision rule: the document commits the company to if-then actions tied to thresholds.</td><td>Version; date; risk domains; threshold definitions; named evaluators; legal basis (voluntary / SB 53 / EU GPAI Code)</td></tr>
<tr><td>Usage policies and terms</td><td>Acceptable use policy, usage policy, consumer terms, use guidelines</td><td>Rules for users and deployers. Decision rule: the addressee is the user or customer.</td><td>Version; date; prohibited-use list; enforcement stated</td></tr>
<tr><th class="taxonomy-group" rowspan="6" scope="rowgroup">B. Disclosure</th><td>Model documentation</td><td>System cards, model cards, addenda, technical reports, training-data summaries, application cards</td><td>Documents one model, model family, or product: training, capabilities, evaluations, limitations.</td><td>Model; release date; sections present; third-party evaluators named; legal template used (e.g., EU AI Act training-content summary)</td></tr>
<tr><td>Framework implementation reports</td><td>Frontier Safety Framework reports, risk reports, alignment risk updates, ASL activations, framework update logs</td><td>Applies a named frontier framework to a model or moment. Decision rule: it cites a framework threshold and reports a determination.</td><td>Framework and version cited; thresholds reached (Y/N); safeguards triggered</td></tr>
<tr><td>Misuse and threat intelligence reports</td><td>Threat reports, disruption reports</td><td>Reports observed misuse of the company's systems by identified or unidentified actors and the enforcement taken.</td><td>Period covered; actor types; countries; harm domains; enforcement actions</td></tr>
<tr><td>Transparency and compliance reports</td><td>Responsible AI transparency reports, voluntary commitments trackers, regulatory compliance disclosures</td><td>Periodic or standing account of the company's governance practice as a whole, often keyed to commitments or regulation.</td><td>Reporting period; commitments or laws referenced; metrics disclosed</td></tr>
<tr><td>Certifications and third-party assessments</td><td>Audits, certifications, external testing, cross-lab evaluations</td><td>Assessment performed or certified by a party other than the company. Decision rule: an external party issues or conducts it.</td><td>Assessor; standard (ISO/IEC 42001, SOC 2); scope; date</td></tr>
<tr><td>Statements and incident disclosures</td><td>Public statements, postmortems, incident reports</td><td>Responds to a specific event: a government action, a dispute, an incident. Decision rule: dated to and triggered by an event.</td><td>Triggering event; counterparty; date; actions announced</td></tr>
<tr><th class="taxonomy-group" rowspan="4" scope="rowgroup">C. External governance</th><td>Public policy positions</td><td>Policy submissions, regulatory comments, legislative endorsements, blueprints</td><td>Addressed to governments or policy communities; states what law or public policy should require. This is what most of anthropic.com/policy contains, but see Data issues sheet.</td><td>Addressee (institution, jurisdiction); bill or docket; position; date</td></tr>
<tr><td>Commitments (unilateral and multilateral)</td><td>Voluntary commitments, pledges, codes of practice signatures, industry principles</td><td>Company undertakes a future obligation, alone or with others. Decision rule: explicit 'we commit / we sign'.</td><td>Unilateral or multilateral; co-signatories; convenor; binding status</td></tr>
<tr><td>Partnerships and MOUs</td><td>Partnerships, memoranda of understanding, government collaborations</td><td>Bilateral or multilateral agreement with a named external party around a project or issue.</td><td>Counterparty type (state, NGO, firm, AISI); country; sector; instrument (MOU, contract)</td></tr>
<tr><td>Governance bodies and structures</td><td>Trusts, advisory councils, expert councils, institutes, industry bodies</td><td>Creates or describes a standing body that shapes company decisions or sector coordination.</td><td>Body type; members; formal powers; internal or inter-firm</td></tr>
<tr><th class="taxonomy-group" rowspan="5" scope="rowgroup">D. Programmes and knowledge</th><td>Programmes and funding</td><td>Initiatives, grants, fellowships, bug bounties, access programmes</td><td>Company-run programme that funds, invites, or grants access to external actors.</td><td>Amount; recipients; eligibility; duration</td></tr>
<tr><td>Safeguards and product-safety explainers</td><td>Safety approach posts, safeguards announcements</td><td>Describes a mitigation, safeguard, or product-safety measure the company has built or applied.</td><td>Harm domain; user group (e.g., teens); mechanism type (classifier, policy, UX)</td></tr>
<tr><td>Research</td><td>Papers, preprints, research blog posts</td><td>Advances knowledge on an AI issue; typically has authors and methods.</td><td>Authors; venue; method; alignment topic</td></tr>
<tr><td>Evaluations, benchmarks and tools</td><td>Benchmarks, eval suites, open-source auditing tools</td><td>Releases a reusable instrument for measuring or auditing models.</td><td>What is measured; open or closed; licence; adoption by others</td></tr>
<tr><td>Essays and vision statements</td><td>Leadership essays, vision posts</td><td>Leadership articulates views on AI's future, ethics, or societal role, without committing to specific actions.</td><td>Author; date; themes</td></tr>
</tbody></table></div>

**Table 1**. *The alignment document taxonomy*.

The taxonomy distinguishes documents by what they ask, describe or undertake. Principles state a normative orientation; specifications describe desired behaviour; frontier frameworks connect thresholds to safeguards; model cards report on particular models. Partnerships and funding announcements disclose further relations through which alignment is organised. Categories were assigned using selected-document labels, title and URL rules, and individual overrides. Comparing characteristic phrases and links between documents helps locate these differences, with recurrent company navigation discounted from the citation network.

**Figure 2.** *The discursive character of each document type. The phrases that a larger share of one type's documents use than the rest of the corpus (log-odds ratio with an informative prior; a phrase counts only if more than one company uses it).*

**Figure 3a**. *The document network. One document points at another when it names it by title or links to it; links that a company's navigation places on every page are discounted.*

Actor names are located through a vocabulary scan, while rules applied to surrounding sentences suggest relations such as evaluation, partnership or funding. These classifications guide source inspection: a nearby word does not by itself establish an actor's role. The matrices aggregate document–actor–relation occurrences, so their counts can exceed the number of distinct documents.

**Figure 3b**. *How often each type of actor is named in each type of document. Rows are actor types, columns document types; a cell counts the documents of that type naming an actor of that type.*

**Figure 4**. Actors named in each type of document, and what those documents say they do.

### Extracting and comparing relations

Combining distant reading [@morettiDistantReading2013] with returns to individual passages, we record conducts, risks, training or mitigation methods, benchmarks and associated actors. The detailed dataset contains an initial model reading and a subsequent GPT-5.4 reading, with harmonised names and categories. The later retrieval procedure combines lexical and semantic search over page-bounded passages; GPT-5.4 extracts candidate relations with page references, complemented by a scan of known names. The analyst sets the distinctions and returns to source wording when assessing claims, including the difference between authoring a benchmark and being commissioned to evaluate a model.

A held-out evaluation of 480 queries returned the reference page among the first five results for 84.2% of queries and the first ten for 89.6%. These scores concern retrieval, not extraction accuracy; the reference set favours identifiable names and native PDFs, so its performance cannot be assumed for every genre. Numerical summaries count stored item identifiers, combining actor categories across their records. An item may have both internal and external attributions; unspecified Other, Multiple and unknown categories do not establish an identifiable external contribution. Some visualisations instead group by company and harmonised label, which explains differences between their totals and identifier counts.

For comparison with a wider field, searches for alignment, AI safety, red teaming, fairness, explainability, AI ethics and responsible AI organisations yielded 7,377 results, of which 512 directory entries were retained. English-, German- and Danish-language queries targeted the United States, United Kingdom, Germany and Denmark. Normalised names, acronyms and recorded aliases were matched against the detailed extraction; repeated entries and representative names prevent treating matches as a count of distinct participating organisations. Both this directory and the company corpus are geographically uneven, while extraction and matching can miss or misassign relations. Absence from these documents therefore remains a question of documentary visibility, which cannot distinguish non-participation from non-disclosure.

**Figure 5**. *Method diagram*.

## Actors and values

The actors named in alignment documents are more heterogeneous than a distinction between companies and “stakeholders” might suggest. Alongside model teams and researchers, one finds government agencies, universities, cybersecurity firms, domain experts, data workers and consultation participants. Civil society, too, encompasses several forms of involvement: advocacy organisations and foundations appear alongside organisations whose principal trade is alignment research, including Apollo Research and METR. What distinguishes these actors is partly the kind of normative problem they are equipped to formulate and the means by which they make it available to others.

**Figure 6a and 6b**. *Conducts, risks and the actors that participate in defining them.*

| Ideal conduct | Number | Risk | Number |
|---|---:|---|---:|
| Safety | 34 | Cybersecurity | 96 |
| Helpfulness | 18 | Harmful content | 93 |
| Honesty | 17 | CBRN | 70 |
| Compliance | 13 | Privacy | 64 |
| Political neutrality | 10 | General harms | 58 |
| Appropriate harmlessness | 9 | Jailbreaking | 47 |
| Factuality | 7 | Deception | 45 |
| Personality | 6 | Bias | 42 |
| Diversity | 6 | Misalignment | 41 |

**Table 2.** Most frequent categories among the harmonised ideal conducts and risks.

Safety, helpfulness, honesty and compliance recur among ideal conducts, alongside political neutrality, factuality, personality and diversity; risks include cybersecurity, harmful content, chemical, biological, radiological and nuclear (CBRN) threats, privacy, deception and bias. The distinction is not between political values and settled technical matters, since cybersecurity and biosecurity also involve judgements about acceptable uses and distributions of harm. Rather, some risks more readily lend themselves to tasks with observable outcomes, while other norms depend more visibly on the circumstances and standpoint from which an answer is judged. These differences matter for whose expertise can be incorporated into alignment: governmental instruments supply obligations and risk vocabularies, academics supply concepts and tests, and security specialists devise threat scenarios.

Apollo Research illustrates how these capacities can come together. In OpenAI's o1 system card, scheming is described as covertly pursuing goals that diverge from those of developers or users; Apollo supplies scenarios through which such behaviour can be tested [@openaiOpenAIO1System2024], and its evaluations also appear in the GPT-4o system card [@openaiGPT4oSystemCard2024]. Here, the organisation contributes to the description of the problem as well as its evaluation: a prospective risk acquires a name and circumstances in which it might become observable. This is what we mean by *ideation*, whose power depends on whether a company adopts a proposed definition or test and on what it subsequently does with the result.

Public-consultation organisations offer another route into this process, convening participants and translating discussion into material researchers can use. Ovadya calls the provision of deliberative expertise to institutions “democracy-as-a-service” [@ovadyaReimaginingDemocracyAI2023]. Its promise in alignment is to widen the judgements available for defining model behaviour; yet STELA and Collective Constitutional AI also show how participant selection, prompts and the curation of principles condition what can enter training. To understand the resulting participation, one must follow these contributions beyond the consultation itself.

## Training and evaluating

Once a value is specified, training determines how it bears upon model behaviour: examples can be included or discarded, preferences can count more or less in optimisation, and safeguards can tolerate or prevent particular responses. The documentary record is correspondingly concentrated on company actors, with 740 of 787 training and mitigation items (94.0%) naming at least one internal actor, against 80 (10.2%) with an identifiable external category. These attributions overlap, as external contributions can be incorporated alongside company work.

**Figure 7**. *The training of good conducts and risk mitigation strategies and the actors involved in it, per company.*

One reason for this concentration is the control companies retain over data mixtures, training objectives and production systems: external expertise can inform an example without extending to decisions about its weight or the consequences of failure. This interpretation is consistent with work on corporate control of AI research resources [@whittaker2021SteepCost] and the organisational conditions of red teaming [@renOrganizationMattersQualitative2025]. Benchmarking offers a wider opening, with identifiable external categories associated with 337 of 880 items (38.3%); academic or research centres are credited in 174 items, alignment research organisations in 101, and red-teaming or cybersecurity companies in 29.

**Figure 8**. *The benchmarking of good conducts and risk mitigation strategies and the actors proposing it, per company.*

A benchmark can travel between models and documents because its author need not control the company's training process to propose a test of factuality, bias or a security capability. If adopted, it establishes one way of recognising whether a norm has been honoured; the company nevertheless retains choices about its use, interpretation and consequences. The larger set of credited evaluators thus need not imply a comparable redistribution of decision-making, while differences in disclosure may also make benchmark authors more visible than contributors to training. As the audit literature suggests, the institutional conditions under which evaluation becomes consequential remain part of the problem [@raji2022OutsiderOversight].

## Who appears across the stack

The harmonised mapping contains 537 actor names: 37 appear in conduct definition, 167 in risk definition, 160 in training and 278 in benchmarking. Of these, 456 (84.9%) appear in only one component; 61 appear in two, 16 in three and four in all four. These are names associated with particular alignment roles, rather than every name mentioned in the archive, but their distribution suggests how much an account of participation changes when continuing involvement becomes the object of enquiry.

**Figure 9.** *Mentions of each type of actor across alignment stages.*

Some external actors connect several components through specialised work. Apollo Research, METR and SecureBio appear in risk definition, training-related contributions and benchmarking; the Collective Intelligence Project connects conducts, risks and training through the elicitation of public input. Such cases caution against treating external participation as one institutional arrangement, since the relevant relations depend on what an actor is invited or equipped to do.

The directory comparison introduces a geographical boundary. The matching data yield 24 entries out of 512 (4.7%): twenty from the United States, three from the United Kingdom and one from Switzerland. The original figure annotation states 26, but its plotted matching total is 24; the latter is the count used here. Repeated organisations and aliases also mean that these are entry counts, rather than a population estimate of inclusion in alignment.

**Figure 10.** *Who makes it into the documents? Which actors from the wider alignment ecosystem are named in companies' AI training documents. Each ribbon is one of the 512 actors catalogued in the alignment-actor directory, flowing Country → Type → Mentioned in AI training documents. “Mentioned” means the actor is cited by name in our document corpus. Ribbons are coloured by country. Only 26 reach the training corpus.*

The matches include METR, FAR.AI, Redwood Research, the Alignment Research Center and the Center for AI Safety; the UK AI Safety Institute and the International Organization for Standardization exemplify routes through public evaluation and standardisation. None of the 117 German or 54 Danish entries matches the detailed extraction, which marks a limit to the geographical range this collection makes visible. Nor should the absence of general advocacy entries be mistaken for the absence of civil society: the Electronic Frontier Foundation matches under legal advocacy. These distinctions leave room for relations that a larger or differently sampled corpus might disclose, while indicating how selective the visible routes into alignment remain.

## Conclusion

This article examined which actors are publicly enrolled in value alignment and how their attributed roles differ across its components. Looking across the stack qualifies what participation in any one exercise can tell us: a public may contribute to a principle without appearing in its implementation, while a researcher may author a benchmark without deciding what follows from its result. Identifiable external contributions are considerably more common in benchmarking than in training; most actors in the harmonised mapping appear in one component only.

The implication for inclusive design concerns the passage between these sites. As norms become definitions, examples and tests, the people recognised at one point need not retain a role at the next; the organisation of participation is therefore part of how technologies that mediate public information acquire their normative dispositions. Alignment research organisations sometimes connect positions otherwise occupied separately, offering a capacity to formulate prospective conduct as a testable problem. We describe this as ideation power, while leaving open what the documents cannot resolve: how those contributions fare when they conflict with company priorities or other understandings of harm.

A further question concerns who should convene deliberation about generally deployed models. Company consultations can elicit judgements that developers would otherwise miss, but their remit, participants and consequences remain subject to company choices. Public institutions could commission deliberation and evaluation under conditions that make the evidence and company response answerable to a broader constituency, including on contested values that cannot be settled by a benchmark. The purpose would be to connect participation to the decisions it is meant to inform; this study offers a way of locating where such connections are publicly made, and where they cease to be visible.

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

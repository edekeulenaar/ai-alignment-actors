"""The state each live slide shows: its page and the steps (driver.js) that reproduce it."""

NET = "index.html"
SPEC = {
    12: {"page": "more-figures.html", "steps": [["wordtreeRoot", "AI will"], ["wordtreeYear", "2024"]]},
    22: {"page": NET, "steps": [["keyness", "Organizational principles, standards, codes"]]},
    23: {"page": NET, "steps": [["keyness", "Frontier governance frameworks"]]},
    24: {"page": NET, "steps": [["keyness", "Model documentation"]]},
    25: {"page": NET, "steps": [["networkCompany", "Google"]]},
    26: {"page": NET, "steps": [["networkCompany", "Google"], ["networkCategory", "Organizational principles, standards, codes"],
                                ["networkHover", "AI Principles"]]},
    27: {"page": NET, "steps": [["networkCompany", "Google"], ["networkCategory", "Model documentation"],
                                ["networkHover", "Gemini 3.6 Flash Model card"]]},
    28: {"page": NET, "steps": [["networkCompany", "Google"], ["networkCategory", "Partnerships and MOUs"],
                                ["networkHover", "partnership with the UK government"]]},
    29: {"page": NET, "steps": [["networkCompany", "Google"], ["networkCategory", "Evaluations, benchmarks and tools"],
                                ["networkHover", "FACTS Grounding"]]},
    30: {"page": NET, "steps": []},
    31: {"page": NET, "steps": [["matrixHover", {"row": "Red teaming or cybersecurity company", "col": "Model documentation"}]]},
    32: {"page": NET, "steps": [["matrixHover", {"row": "Government agency", "col": "Partnerships and MOUs"}]]},
    33: {"page": NET, "steps": [["matrixHover", {"row": "Alignment research organisation", "col": "Model documentation"}]]},
    34: {"page": NET, "steps": [["matrixHover", {"row": "Alignment research organisation", "col": "Framework implementation reports"}]]},
    37: {"page": NET, "steps": [["named", True]]},
    38: {"page": NET, "steps": [["named", True], ["pin", {"block": "risks", "text": "Scheming"}], ["undim", True]]},
    39: {"page": NET, "steps": [["showAllCats", "conducts"]]},
    40: {"page": NET, "steps": [["named", True], ["showAllCats", "conducts"], ["gridYear", {"block": "conducts", "year": "2020"}]]},
    41: {"page": NET, "steps": [["named", True], ["showAllCats", "conducts"], ["gridYear", {"block": "conducts", "year": "2022"}]]},
    42: {"page": NET, "steps": [["named", True], ["showAllCats", "conducts"], ["gridYear", {"block": "conducts", "year": "2022"}],
                                ["pin", {"block": "conducts", "text": "Good process"}], ["undim", True]]},
    43: {"page": NET, "steps": [["named", True], ["showAllCats", "conducts"]]},
    44: {"page": NET, "steps": [["named", True], ["showAllCats", "conducts"],
                                ["pin", {"block": "conducts", "text": "Acknowledging opposing perspectives"}], ["undim", True]]},
    45: {"page": NET, "steps": [["named", True], ["showAllCats", "conducts"], ["pin", {"block": "conducts", "text": "Civic values"}], ["undim", True]]},
    47: {"page": NET, "steps": [["named", True], ["showAllCats", "risks"], ["gridYear", {"block": "risks", "year": "2018"}]]},
    48: {"page": NET, "steps": [["named", True], ["showAllCats", "risks"], ["gridYear", {"block": "risks", "year": "2021"}]]},
    49: {"page": NET, "steps": [["named", True], ["showAllCats", "risks"], ["gridYear", {"block": "risks", "year": "2021"}],
                                ["pin", {"block": "risks", "text": "Existential catastrophe"}], ["undim", True]]},
    50: {"page": NET, "steps": [["showAllCats", "risks"], ["gridYear", {"block": "risks", "year": "2025"}]]},
    51: {"page": NET, "steps": [["showAllCats", "risks"]]},
    52: {"page": "interface.html", "steps": []},
    53: {"page": "interface.html", "steps": []},
    54: {"page": NET, "steps": []},
    55: {"page": NET, "steps": [["alluvialHover", "No"]]},
    56: {"page": NET, "steps": [["alluvialHover", "Yes"]]},
}

NEAR = {31: "#fig-actor-types", 34: "#fig-actor-types", 30: "#fig-actor-types", 32: "#fig-actor-types", 33: "#fig-actor-types",
        37: "#block-conducts", 39: "#block-conducts", 40: "#block-conducts", 41: "#block-conducts", 42: "#block-conducts",
        43: "#block-conducts", 44: "#block-conducts", 45: "#block-conducts",
        38: "#block-risks", 47: "#block-risks", 48: "#block-risks", 49: "#block-risks", 50: "#block-risks", 51: "#block-risks",
        52: "#block-training", 53: "#block-benchmark", 54: "#block-alluvial", 55: "#block-alluvial", 56: "#block-alluvial",
        25: "#fig-network", 26: "#fig-network", 27: "#fig-network", 28: "#fig-network", 29: "#fig-network",
        22: "#fig-keyness", 23: "#fig-keyness", 24: "#fig-keyness", 12: "#fig-wordtree"}
for n, sel in NEAR.items():
    SPEC[n]["near"] = sel

# Slides placed by hand, relative to an element the screenshot shows at its top left
# (the data changed too much since the screenshot for image matching to find them).
# dx, dy: offset of the crop's top-left corner from the element's, in CSS pixels.
MANUAL = {
    31: {"anchor": "#fig-actor-types table tr:first-child th:nth-child(2)", "dx": -243, "dy": -20},
    34: {"anchor": "#fig-actor-types table tr:first-child th:nth-child(2)", "dx": -243, "dy": -20},
    37: {"anchor": "#grid-conducts", "dx": -12, "dy": -10},
    51: {"anchor": "#grid-risks .cat-row-label", "text": "Impersonation and synthetic media", "dx": -14, "dy": -8},
    52: {"anchor": "#block-training .block-head h3", "dx": -4, "dy": -12},
    53: {"anchor": "#block-benchmark .block-head h3", "dx": -4, "dy": -14},
    54: {"anchor": "#block-alluvial .block-head h3", "dx": -4, "dy": -14},
    55: {"anchor": "#block-alluvial .block-head h3", "dx": -8, "dy": -13},
    56: {"anchor": "#block-alluvial .block-head h3", "dx": -8, "dy": -14},
}

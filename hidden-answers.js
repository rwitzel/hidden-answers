// ==UserScript==
// @name         Hidden Answers
// @namespace    http://rwitzel.github.io/hidden-answers/
// @version      1.0
// @description  This script hides answers. By default it hides texts after "A." following "Q.". Questions and answers must be surrounded by "Test yourself" and "End.".
// @author       Rodrigo Witzel
// @include      *
// ==/UserScript==

'use strict';

var default_configuration = {
    "markers" : {
        "start" : "Test yourself",
        "end" : "End.",
        "question" : "Q.",
        "answer" : "A."
    },
    "wrap_image_nodes" : function (img_node, answer_num) {
        img_node.classList.add("answer_hidden");
        img_node.classList.add("answer");
        img_node.classList.add("answer" + answer_num);
    },
    "wrap_answer_nodes" : function (text, answer) {
        var container = document.createElement("DIV");
        var css_classes = "answer answer_hidden answer" + answer.answer_num + (answer.start_of_answer ? " answer_start" : "");
        var arrow = answer.start_of_answer ? "<span class='answer_collexp answer_collexp" + answer.answer_num + "'>#" + answer.answer_num + " </span>" : "";
        container.innerHTML = arrow + "<span class='" + css_classes + "'>" + document.createTextNode(answer.text).nodeValue + "</span>";
        var nodes = [];
        for (var index = 0; index < container.childNodes.length; index++) {
            nodes.push(container.childNodes[index]);
        }
        if (answer.start_of_answer) {
            nodes[0].addEventListener("click", function() {
                var answer_texts = document.querySelectorAll(".answer" + answer.answer_num);
                for (var index = 0; index < answer_texts.length; index++) {
                    answer_texts[index].classList.toggle('answer_hidden');
                }
            });
        }
        return nodes;
    },
    "unwrap_answer_nodes" : function() {
        var answer_collexp_nodes = document.querySelectorAll(".answer_collexp");
        for (var index = 0; index < answer_collexp_nodes.length; index++) {
            answer_collexp_nodes[index].parentNode.removeChild(answer_collexp_nodes[index]);
        }
        var answer_nodes = document.querySelectorAll("span.answer");
        for (var index = 0; index < answer_nodes.length; index++) {
            var answer_node = answer_nodes[index];
            for (var child_index = 0; child_index < answer_node.childNodes.length; child_index++) {
                answer_node.parentNode.insertBefore(answer_node.childNodes[child_index], answer_node);
            }
            answer_node.parentNode.removeChild(answer_node);
        }
        answer_nodes = document.querySelectorAll("img.answer");
        for (var index = 0; index < answer_nodes.length; index++) {
            answer_nodes[index].classList.remove("answer");
            answer_nodes[index].classList.remove("answer_hidden");
        }
        var style_element = document.querySelector(".answer_styles");
        style_element.parentNode.removeChild(style_element);
    },
    "init": function() {
        var xpath_matches = document.evaluate('//*[text()="' + this.markers.start + '"]',
                            document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        var xpath_match = xpath_matches.iterateNext ();
        if (xpath_match == null) {
            return; // this page does not contain a test -> nothing to do
        }

        var state_answer_markup = { enriched : false };
        var that = this;
        function toggle_answer_markup() {
            if (state_answer_markup.enriched ) {
                this.unwrap_answer_nodes();
            }
            else {
                var root_element = document.getElementsByTagName("BODY")[0];
                enrich_qna_with_arrows(root_element, that);

                var container = document.createElement("div");
                var html = "";
                html += "\n <style class='answer_styles'>";
                html += "\n .answer { }";
                html += "\n .answer_collexp { font-weight: bold; }";
                html += "\n .answer_hidden { visibility: hidden; }";
                html += "\n </style>";
                container.innerHTML = html;
                root_element.appendChild(container.children[0]);
            }
            state_answer_markup.enriched = !state_answer_markup.enriched;
        }

        while (xpath_match) {
            xpath_match.addEventListener("click", toggle_answer_markup);
            xpath_match = xpath_matches.iterateNext();
        }

    },
    "logger" : function() {}
}

/**
 * Wraps all answers so that they are hidden somehow. The details depend on the given configuration.
 * <p>
 * Example: "Q." and "A." mark the start of questions and answers, "Test yourself" and "End." mark the start and
 * the end of a collections of questions and answers. Each text is wrapped in a SPAN element so that it is hidden.
 * The answer can be made visible be clicking on the answer number that is shown instead of the answers.
 *
 * @param current_element the current DOM element under inspection
 * @param configuration the configuration for the function, see default_configuration
 * @param look_for the current state of the enrichment, i.e. the last marker found and the number of the most recently found answer
 */
function enrich_qna_with_arrows(current_element, configuration, look_for) {

    if (current_element == null) {
        current_element = document.getElementsByTagName("BODY")[0];
    }

    if (configuration == null) {
        configuration = default_configuration;
    }
    var markers = configuration.markers;
    var wrap_answer_nodes = configuration.wrap_answer_nodes;
    var wrap_image_nodes = configuration.wrap_image_nodes;
    var logger = configuration.logger;

    if (look_for == null) {
        look_for = { "marker" : "end", "last_answer_num" : 0 };
    }

    var index = 0;
    while ( index < current_element.childNodes.length ) {

        var child_node = current_element.childNodes[index];

        if (child_node.nodeType == Node.TEXT_NODE) {

            var text = child_node.textContent;

            logger("on text node: " + norm(text));

            var answers = [];

            var answer_found = false;
            var last_answer_start = 0;
            var previous_position = 0;
            var position = 0;
            while (position < text.length) {

                var previous_position = position;
                var previous_num_answers = answers.length;

                if (look_for.marker == "end" && text.indexOf(markers.start, position) != -1) {

                    logger("found 'start' after '" + look_for.marker + "'");

                    look_for.marker = "start";
                    position = text.indexOf(markers.start, position) + markers.start.length;
                }
                else if ((look_for.marker == "start" || look_for.marker == "answer")
                         && (text.indexOf(markers.question, position) == 0
                          || text.indexOf(" " + markers.question, position) >= 0)) {

                    logger("found 'question' after '" + look_for.marker + "'");

                    var start_pos = last_answer_start;
                    var end_pos = text.indexOf(markers.question, position);
                    var answer_text = text.substring(start_pos, end_pos);

                    // create the answer if the previous marker was "answer"
                    if (look_for.marker == "answer" && answer_text.length > 0) {
                        look_for.last_answer_num++;
                        answers.push({
                            "start_pos" : start_pos,
                            "end_pos" : end_pos,
                            "text" : answer_text,
                            "norm_text" : norm(answer_text),
                            "start_of_answer" : true,
                            "answer_num" : look_for.last_answer_num
                        });
                    }

                    look_for.marker = "question";
                    position = text.indexOf(markers.question, position) + markers.question.length;
                }
                else if (look_for.marker == "question" && (text.indexOf(markers.answer, position) == 0
                                                      || text.indexOf(" " + markers.answer, position) >= 0)) {

                    logger("found 'answer' after '" + look_for.marker + "'");

                    look_for.marker = "answer";
                    last_answer_start = text.indexOf(markers.answer, position);
                    answer_found = true;
                    position = text.indexOf(markers.answer, position) + markers.answer.length;
                }
                else if ((look_for.marker == "start" || look_for.marker == "answer")
                           && (text.indexOf(markers.end, position) == 0
                            || text.indexOf(" " + markers.end, position) >= 0)) {

                    logger("found 'end' after '" + look_for.marker + "'");

                    var start_pos = last_answer_start;
                    var end_pos = text.indexOf(markers.end, position);
                    var answer_text = text.substring(start_pos, end_pos);

                    // create the answer if the previous marker was "answer"
                    if (look_for.marker == "answer" && answer_text.length > 0) {
                        look_for.last_answer_num++;
                        answers.push({
                            "start_pos" : start_pos,
                            "end_pos" : end_pos,
                            "text" : answer_text,
                            "norm_text" : norm(answer_text),
                            "start_of_answer" : true,
                            "answer_num" : look_for.last_answer_num
                        });
                    }

                    look_for.marker = "end";
                    position = text.indexOf(markers.end, position) + markers.end.length;
                }
                else {
                    position = text.length;
                }

                logger("  processed text: " + norm(text.substring(previous_position, position)) + " new state: " + look_for.marker);
                if (previous_num_answers != answers.length) {
                    logger(" added answer: " + JSON.stringify(answers[answers.length-1]));
                }
            }

            if (answer_found && look_for.marker == "answer") {
                look_for.last_answer_num++;
                answers.push({
                    "start_pos" : last_answer_start,
                    "end_pos" : text.length,
                    "text" : text.substring(last_answer_start, text.length),
                    "norm_text" : norm(text.substring(last_answer_start, text.length)),
                    "start_of_answer" : true,
                    "answer_num" : look_for.last_answer_num
                });
                logger("  added ending answer: " + JSON.stringify(answers[answers.length-1]));
            }
            else if (answers.length == 0 && look_for.marker == "answer") {
                answers.push({
                    "start_pos" : 0,
                    "end_pos" : text.length,
                    "text" : text.substring(0, text.length),
                    "norm_text" : norm(text.substring(0, text.length)),
                    "start_of_answer" : false,
                    "answer_num" : look_for.last_answer_num
                });
                logger("  added entire answer: " + JSON.stringify(answers[answers.length-1]));
            }

            if (answers.length > 0) {

                var last_answer_end = 0;
                var replacing_nodes = [];
                answers.forEach(function(answer) {

                    // insert text before answer
                    var text_before_answer = text.substring(last_answer_end, answer.start_pos);
                    if (text_before_answer.length > 0) {
                        replacing_nodes.push(document.createTextNode(text_before_answer));
                    }

                    // insert answer nodes
                    replacing_nodes = replacing_nodes.concat(wrap_answer_nodes(text, answer));

                    last_answer_end = answer.end_pos;
                });

                if (answers[answers.length -1].end_pos < text.length) {
                    var text_after_answers = text.substring(answers[answers.length -1].end_pos);
                    replacing_nodes.push(document.createTextNode(text_after_answers));
                }

                replacing_nodes.forEach(function(replacing_node) {
                    child_node.parentNode.insertBefore(replacing_node, child_node);
                });
                child_node.parentNode.removeChild(child_node);
                index += replacing_nodes.length - 1 ;

            }

        }
        else if (child_node.nodeType == Node.ELEMENT_NODE && child_node.nodeName != "STYLE" && child_node.nodeName != "SCRIPT") {

            logger("on element " + child_node.nodeName);

            enrich_qna_with_arrows(child_node, configuration, look_for);

            if (child_node.nodeName == "IMG" && look_for.marker == "answer") {
                wrap_image_nodes(child_node, look_for.last_answer_num);
            }
        }

        index++;
    }

}

function norm(text) {
    return text.replace(/\s/g, "_");
}

default_configuration.init();
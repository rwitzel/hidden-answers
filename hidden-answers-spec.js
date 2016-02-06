var test_configuration = {
    "markers" : {
        "start" : "S",
        "end" : "E",
        "question" : "Q",
        "answer" : "A"
    },
    "wrap_answer_nodes" : function (text, answer) {
        var container = document.createElement("DIV");
        var arrow = answer.start_of_answer ? ("#" + answer.answer_num) : "";
        container.innerHTML = arrow + "<b>" + document.createTextNode(answer.text).nodeValue + "</b>";
        var nodes = [];
        for (var index = 0; index < container.childNodes.length; index++) {
            nodes.push(container.childNodes[index]);
        }
        return nodes;
    },
    "logger" : function() {}
}

var test_logger = function(arg1, arg2, arg3, arg4, arg5) {
    switch(arguments.length) {
        case 1:
            console.log(arg1); break;
        case 2:
            console.log(arg1, arg2); break;
        case 3:
            console.log(arg1, arg2, arg3); break;
        case 4:
            console.log(arg1, arg2, arg3, arg4); break;
        default:
            throw "" + arguments.length + " arguments not supported by the logger yet";
    }
}

function test_enrich_qna_with_arrows(inner_html, logger) {

    var configuration = test_configuration
    if (logger != null) {
        configuration = {
            "markers" : test_configuration.markers,
            "wrap_answer_nodes" : test_configuration.wrap_answer_nodes,
            "logger" : logger
        };
    }
    else {
        configuration = test_configuration;
    }


    var container = document.createElement("DIV");
    container.innerHTML = inner_html;

    configuration.logger("the input     : " + inner_html);
    configuration.logger("the inner html: " + container.innerHTML);

    enrich_qna_with_arrows(container, configuration);
    return container.innerHTML;
}

function assert_equals(found, expected) {
    if (found != expected) {
        throw "strings are not equals. expected: <" + expected + "> but found: <" + found + ">";
    }
}


function test_simple() {

    // no markup at all
    assert_equals(test_enrich_qna_with_arrows("S Q A E"), "S Q #1<b>A </b>E");
    assert_equals(test_enrich_qna_with_arrows("S Q A Q A E"), "S Q #1<b>A </b>Q #2<b>A </b>E");

    // the Q and A in the same paragraph
    assert_equals(test_enrich_qna_with_arrows("S <p>Q A </p>E"), "S <p>Q #1<b>A </b></p>E");
    assert_equals(test_enrich_qna_with_arrows("S <p>Q A </p><p>Q A </p>E"), "S <p>Q #1<b>A </b></p><p>Q #2<b>A </b></p>E");
    assert_equals(test_enrich_qna_with_arrows("S <p>Q A </p><p>Q A </p>E"), "S <p>Q #1<b>A </b></p><p>Q #2<b>A </b></p>E");

    // the Q and A in separate paragraphs
    assert_equals(test_enrich_qna_with_arrows("S <p>Q </p> <p>A </p>E"), "S <p>Q </p> <p>#1<b>A </b></p>E");

    // the A in a span, followed by more answer text
    assert_equals(test_enrich_qna_with_arrows("S <p>Q </p> <p><i>A </i>a</p>E" /*, test_logger */ ), "S <p>Q </p> <p><i>#1<b>A </b></i><b>a</b></p>E");
}

test_simple();




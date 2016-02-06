This [Tampermonkey](https://tampermonkey.net/) script hides answers in Q&A sections of web pages.

The questions and answers on the web page must start with `Q.` resp. `A.`. The Q&A sections must be surrounded by `Test yourself` and `End.`.

### Example

#### Test yourself

Q. How are you?

A. Fine.

Q. How are you doing?

A. 42.

End.

Install the [script](http://rwitzel.github.io/hidden-answers/hidden-answers.user.js), then click on the headline to hide the answers. Then click on an answer number to make a specific answer visible.

### Known Limitations

The script does not work with
* [Greasemonkey](http://www.greasespot.net/),
* Google Docs,
* files loaded from the file system.

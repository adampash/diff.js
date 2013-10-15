diff.js
=======

A small JavaScript tool to do word-by-word diffs two strings of text.

Usage
======

### In the browser
Include diff.js in your page, then run:

```javascript
differ.parse(string1, string2);
```

### In Node
```javascript
var differ = require('./js/diff.js').differ;
differ.parse(string1, string2);
```

Currently this parses the text for differences and marks deletions and insertions with $del$ and $ins$ variables. I may implement custom markers for deletion and insertion, but for now, this works for what I'm using it for.

E.g.

```javascript
differ.parse('one two three', 'two three four');
// Returns '$del$one $/del$ two  three $ins$four$/ins$'
```

---
This code is primarily a restructuring of John Resig's 2005 post, [JavaScript Diff Algorithm](http://ejohn.org/projects/javascript-diff-algorithm/), which is based on Paul Heckel's 1978 paper [A technique for isolating differences between files](http://www.scribd.com/doc/1461552/A-technique-for-isolating-differences-between-files). I rewrote the code to make it a bit more modular and commented the shit out of it.

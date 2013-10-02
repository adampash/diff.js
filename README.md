diff.js
=======

A small JavaScript library to diff two strings of text.

Usage
======
```javascript
Diff.parse(string1, string2);
```

Currently this parses the text for differences and marks deletions and insertions with $del$ and $ins$ variables. I may implement custom markers for deletion and insertion, but for now, this works for what I'm using it for.
